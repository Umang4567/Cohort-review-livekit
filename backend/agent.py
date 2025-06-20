import logging
import json
import os
import aiohttp
from datetime import datetime
from typing import Dict, List, Optional
from enum import Enum

from dotenv import load_dotenv
from livekit.plugins.turn_detector.multilingual import MultilingualModel
from livekit.agents import (
    Agent,
    AgentSession,
    AutoSubscribe,
    JobContext,
    JobProcess,
    WorkerOptions,
    cli,
    metrics,
    RoomInputOptions,
)
from livekit.plugins import (
    openai,
    noise_cancellation,
    silero,
    groq,
    deepgram
)

# Import our interview configuration
try:
    from interview_config import (
        ROLE_TEMPLATES, 
        SCORING_RUBRIC, 
        SkillLevel,
        get_questions_for_role_and_level,
        get_evaluation_criteria
    )
except ImportError:
    # Fallback if config file doesn't exist
    ROLE_TEMPLATES = {}
    SCORING_RUBRIC = {}
    SkillLevel = None

load_dotenv(dotenv_path=".env.local")
logger = logging.getLogger("interview-agent")


class InterviewStage(Enum):
    INTRODUCTION = "introduction"
    PROJECTS_DISCUSSION = "projects_discussion"
    TECHNICAL_QUESTIONS = "technical_questions"
    WRAP_UP = "wrap_up"
    COMPLETED = "completed"


class InterviewAgent(Agent):
    def __init__(self, 
                 role: str = "Software Engineer", 
                 candidate_name: str = "Candidate",
                 skill_level: str = "mid") -> None:
        super().__init__(
            instructions=get_interview_instructions(role, candidate_name, skill_level),
            stt=deepgram.STT(model="nova-2-meeting"),
            llm=openai.LLM(model="gpt-4o-mini"),
            tts=openai.TTS(voice="alloy"),
            turn_detection=MultilingualModel(),
        )
        self.role = role
        self.candidate_name = candidate_name
        self.skill_level = SkillLevel(skill_level) if SkillLevel else skill_level
        self.current_stage = InterviewStage.INTRODUCTION
        self.current_competency_index = 0
        self.interview_data = {
            "start_time": datetime.now().isoformat(),
            "role": role,
            "candidate_name": candidate_name,
            "skill_level": skill_level,
            "competencies_covered": [],
            "scores": {},
            "notes": {},
            "stage": self.current_stage.value,
            "duration_minutes": 0,
            "questions_asked": [],
            "evaluation_summary": {}
        }

    async def on_enter(self):
        # Start the interview with introduction
        await self.session.say(
            self.get_introduction_script(),
            allow_interruptions=True
        )

    def get_introduction_script(self) -> str:
        """Get conversational role-specific introduction script"""
        return f"Hello {self.candidate_name}! I'm your interviewer for this {self.role} position. Thank you for taking the time to interview with us today. To start, could you please introduce yourself and tell me a bit about your background?"

    def get_competencies(self) -> List:
        """Get competencies for the current role"""
        if self.role in ROLE_TEMPLATES:
            return ROLE_TEMPLATES[self.role].competencies
        return []

    def log_interview_data(self, stage: str, data: Dict):
        """Log interview progress and data for quality assurance"""
        self.interview_data["stage"] = stage
        self.interview_data[stage] = data
        self.interview_data["duration_minutes"] = (
            datetime.now() - datetime.fromisoformat(self.interview_data["start_time"])
        ).total_seconds() / 60
        logger.info(f"Interview stage: {stage}, Data: {json.dumps(data, indent=2)}")

    def update_competency_score(self, competency_name: str, score: int, evidence: str):
        """Update score for a specific competency"""
        self.interview_data["scores"][competency_name] = {
            "score": score,
            "evidence": evidence,
            "timestamp": datetime.now().isoformat()
        }

    def get_interview_summary(self) -> Dict:
        """Generate final interview summary"""
        competencies = self.get_competencies()
        total_weighted_score = 0
        total_weight = 0
        
        summary = {
            "candidate": self.candidate_name,
            "role": self.role,
            "duration_minutes": self.interview_data["duration_minutes"],
            "competency_scores": {},
            "overall_recommendation": "",
            "strengths": [],
            "areas_for_improvement": [],
            "detailed_feedback": {}
        }
        
        for competency in competencies:
            if competency.name in self.interview_data["scores"]:
                score_data = self.interview_data["scores"][competency.name]
                weighted_score = score_data["score"] * competency.weight
                total_weighted_score += weighted_score
                total_weight += competency.weight
                
                summary["competency_scores"][competency.name] = {
                    "score": score_data["score"],
                    "weight": competency.weight,
                    "weighted_score": weighted_score,
                    "evidence": score_data["evidence"]
                }
        
        # Calculate overall score
        overall_score = total_weighted_score / total_weight if total_weight > 0 else 0
        summary["overall_score"] = round(overall_score, 2)
        
        # Generate recommendation
        if overall_score >= 4.0:
            summary["overall_recommendation"] = "Strong Hire"
        elif overall_score >= 3.5:
            summary["overall_recommendation"] = "Hire"
        elif overall_score >= 2.5:
            summary["overall_recommendation"] = "Borderline - Additional Assessment Needed"
        else:
            summary["overall_recommendation"] = "No Hire"
        
        return summary


def prewarm(proc: JobProcess):
    proc.userdata["vad"] = silero.VAD.load()


async def fetch_user_info_from_api(participant_id: str, room_name: str) -> Optional[Dict]:
    """Fetch user information from Next.js API endpoint"""
    api_url = os.getenv('NEXTJS_API_URL', 'http://localhost:3000')
    endpoint = f"{api_url}/api/interview-info"
    
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(
                endpoint,
                params={'participantId': participant_id, 'roomName': room_name},
                timeout=aiohttp.ClientTimeout(total=5)
            ) as response:
                if response.status == 200:
                    return await response.json()
                else:
                    logger.warning(f"API request failed with status: {response.status}")
                    return None
    except Exception as e:
        logger.error(f"Failed to fetch user info from API: {e}")
        return None


async def entrypoint(ctx: JobContext):
    logger.info(f"connecting to room {ctx.room.name}")
    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)

    # Wait for the first participant to connect
    participant = await ctx.wait_for_participant()
    logger.info(f"starting technical interview for participant {participant.identity}")

    # Extract user information from room name and participant metadata
    role = "Software Engineer"  # default
    skill_level = "mid"  # default
    candidate_name = participant.identity or "Candidate"
    course_name = "Gen AI Launch Pad"  # default course name
    
    # Option 1: Parse from room name (format: interview-name-skill-timestamp)
    room_parts = ctx.room.name.split('-')
    if len(room_parts) >= 3 and room_parts[0] == 'interview':
        candidate_name = room_parts[1].replace('_', ' ')
        skill_level = room_parts[2]
    
    # Option 2: Parse from participant metadata (preferred)
    if participant.metadata:
        try:
            metadata = json.loads(participant.metadata)
            course_name = metadata.get('courseName', None) or "Gen AI Launch Pad"
            skill_level = metadata.get('skill', skill_level)
            logger.info(f"Using metadata - Course Name: {course_name}, Skill: {skill_level}")
        except json.JSONDecodeError:
            logger.warning("Failed to parse participant metadata")
    else:
        course_name = "Gen AI Launch Pad"

    # Option 3: Fetch from Next.js API endpoint
    api_user_info = await fetch_user_info_from_api(participant.identity, ctx.room.name)
    if api_user_info:
        candidate_name = api_user_info.get('candidateName', candidate_name)
        skill_level = api_user_info.get('skillLevel', skill_level)
        course_name = api_user_info.get('courseName', course_name)
        logger.info(f"Using API data - Name: {candidate_name}, Course Name: {course_name}, Skill: {skill_level}")

    # Option 4: Parse from environment variables (fallback)
    course_name = os.getenv('COURSE_NAME', course_name)
    skill_level = os.getenv('INTERVIEW_SKILL_LEVEL', skill_level)

    usage_collector = metrics.UsageCollector()

    # Log metrics and collect usage data
    def on_metrics_collected(agent_metrics: metrics.AgentMetrics):
        metrics.log_metrics(agent_metrics)
        usage_collector.collect(agent_metrics)

    session = AgentSession(
        vad=ctx.proc.userdata["vad"],
        # Adjusted for interview context - longer delays for thinking time
        min_endpointing_delay=1.0,
        max_endpointing_delay=8.0,
    )

    # Trigger the on_metrics_collected function when metrics are collected
    session.on("metrics_collected", on_metrics_collected)

    # Use FeedbackAgent instead of InterviewAgent for feedback collection
    await session.start(
        room=ctx.room,
        agent=FeedbackAgent(
            course_name=course_name,
            participant_name=candidate_name
        ),
        room_input_options=RoomInputOptions(
            noise_cancellation=noise_cancellation.BVC(),
        ),
    )


def get_interview_instructions(role: str, candidate_name: str, skill_level: str) -> str:
    """Generate interview instructions for responsive, conversational behavior"""
    
    return f"""
You are an INTERVIEWER conducting a technical interview for a {role} position. {candidate_name} is the CANDIDATE you are evaluating.

INTERVIEW FLOW (3 STAGES):
1. INTRODUCTION STAGE: Ask candidate to introduce themselves and their background
2. PROJECTS STAGE: Ask about their projects, experience, and work they've done
3. TECHNICAL STAGE: Ask skill-based questions related to their projects or general technical knowledge

CRITICAL BEHAVIOR RULES:
- You are the interviewer, NOT the candidate
- ALWAYS respond to what the candidate just said before asking the next question
- Be conversational and natural - acknowledge their answers
- NEVER speak ratings or scores out loud (e.g., never say "Rating: 1")
- Keep all evaluation completely silent and internal

CONVERSATIONAL FLOW:
1. LISTEN to {candidate_name}'s answer
2. ACKNOWLEDGE their response (brief comment on their answer)
3. ASK a follow-up question or move to next topic/stage

STAGE-SPECIFIC GUIDANCE:
INTRODUCTION: "Tell me about yourself and your background"
PROJECTS: "Can you walk me through some projects you've worked on?" "What technologies did you use?" "What challenges did you face?"
TECHNICAL: Ask questions based on technologies/concepts mentioned in their projects, or general {role} skills

RESPONSE PATTERNS:
- If they give a good answer: "That's interesting! Now let me ask you about..."
- If they give a partial answer: "I see, that covers part of it. Can you also explain..."
- If they don't know: "No problem, let's try a different topic. What about..."
- If they ask to repeat: "Of course! I asked about..." then repeat the question
- If they give unclear answer: "Could you clarify what you mean by..."

YOUR INTERVIEWING STYLE:
- Be responsive and adaptive to their answers
- Ask follow-up questions based on their responses
- Show you're listening by referencing what they said
- Keep questions concise but be conversational
- Help them if they're struggling, then move to next topic
- Connect technical questions to their mentioned projects when possible

EVALUATION (SILENT - NEVER SPEAK RATINGS):
- Rate competencies 1-5 based on {candidate_name}'s answers
- NEVER say ratings out loud to the candidate
- Keep all scoring completely silent and internal
- Never mention scores verbally

REMEMBER: Follow the 3-stage flow: Introduction → Projects → Technical Questions. Always acknowledge their answer first, then ask your next question. Be a human interviewer, not a question robot.
"""


FEEDBACK_PROMPT = '''
You are a friendly and conversational voice assistant collecting feedback from participants of the Gen AI Launch Pad. The user has already attended the event . Your name is Build Fast Bot


Your job is to naturally and politely collect the following information through a conversation:

1. Their thoughts on the relevance of the course content.
2. How likely they are to recommend the course to others on the scale of 1 to 5.
3. Whether the course was worth their investment of time/effort on the scale of 1 to 5.
4. Whether they’re interested in referring a friend to the program.
5. What advanced topics in Gen AI they’re interested in.
6. A short testimonial about their experience for the website.
7. Any suggestions for improvements or additional thoughts.

Ask one question at a time and allow the user to respond freely. If an answer is unclear or missing, politely ask again or rephrase your question.

Be concise, cheerful, and professional. The goal is to make the user feel heard and appreciated while capturing all the above data points accurately.

Do not give any answer options or multiple-choice scales. Let the user describe everything in their own words.
Always say course after taking the course name, e.g. "Gen AI Launch Pad" or "Gen AI Launch Pad course".
End the conversation by thanking them sincerely for their time and valuable feedback.
'''


class FeedbackAgent(Agent):
    def __init__(self, course_name: str = "Gen AI Launch Pad", participant_name: str = "Participant"):
        super().__init__(
            instructions=FEEDBACK_PROMPT,
            stt=deepgram.STT(model="nova-2-meeting"),
            llm=openai.LLM(model="gpt-4o-mini"),
            tts=openai.TTS(voice="alloy"),
            turn_detection=MultilingualModel(),
        )
        self.course_name = course_name
        self.participant_name = participant_name
        self.chat_log = []
        self.feedback_complete = False

    async def on_enter(self):
        await self.session.say(
            f"Hello {self.participant_name}! I'm your Cohort-Review Bot for the {self.course_name}. I'd love to collect your feedback. Let's get started!",
            allow_interruptions=True
        )
        # Start the feedback conversation
        await self.ask_next_question()

    async def ask_next_question(self):
        questions = [
            "First, what are your thoughts on the relevance of the course content?",
            "How likely are you to recommend this course to others?",
            "Did you feel the course was worth your investment of time and effort?",
            "Would you be interested in referring a friend to the program?",
            "Are there any advanced topics in Gen AI you’d like to learn more about?",
            "Could you share a short testimonial about your experience for our website?",
            "Do you have any suggestions for improvements or any additional thoughts?"
        ]
        for idx, q in enumerate(questions):
            await self.session.say(q, allow_interruptions=True)
            user_response = await self.session.listen()
            self.chat_log.append({"question": q, "response": user_response})
        self.feedback_complete = True
        await self.session.say("Thank you so much for your time and valuable feedback! We truly appreciate it.")
        print("Collected Feedback Chat Log:")
        print(json.dumps(self.chat_log, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    cli.run_app(
        WorkerOptions(
            entrypoint_fnc=entrypoint,
            prewarm_fnc=prewarm,
        ),
    )
