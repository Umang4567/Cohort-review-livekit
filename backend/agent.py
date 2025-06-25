import logging
import json
import os
import aiohttp
from datetime import datetime
from typing import Dict, Optional

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
    deepgram
)

load_dotenv(dotenv_path=".env.local")
logger = logging.getLogger("feedback-agent")

FEEDBACK_PROMPT = '''
You are a friendly and conversational voice assistant collecting feedback from course participants. The user has already attended the event. Your name is Build Fast Bot.

Your job is to naturally and politely collect the following information through a conversation:

1. Their thoughts on the relevance of the course content.
2. How likely they are to recommend the course to others on the scale of 1 to 5.
3. Whether the course was worth their investment of time/effort on the scale of 1 to 5.
4. Whether they're interested in referring a friend to the program.
5. What advanced topics they're interested in learning more about.
6. A short testimonial about their experience for the website.
7. Any suggestions for improvements or additional thoughts.

Ask one question at a time and allow the user to respond freely. If an answer is unclear or missing, politely ask again or rephrase your question.

Be concise, cheerful, and professional. The goal is to make the user feel heard and appreciated while capturing all the above data points accurately.

Do not give any answer options or multiple-choice scales. Let the user describe everything in their own words.
Always mention the specific course name when referring to the course.
End the conversation by thanking them sincerely for their time and valuable feedback.
'''

class FeedbackAgent(Agent):
    def __init__(self, course_name: str = "", participant_name: str = "Participant"):
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
            f"Hello {self.participant_name}! I'm your Cohort-Review Bot for the {self.course_name} course. I'd love to collect your feedback. Let's get started!",
            allow_interruptions=True
        )
        # Start the feedback conversation
        await self.ask_next_question()

    async def ask_next_question(self):
        questions = [
            "First, what are your thoughts on the relevance of the content in this course?",
            "How likely are you to recommend this course to others?",
            "Did you feel this course was worth your investment of time and effort?",
            "Would you be interested in referring a friend to the program?",
            "What advanced topics would you like to learn more about?",
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

def prewarm(proc: JobProcess):
    proc.userdata["vad"] = silero.VAD.load()

async def entrypoint(ctx: JobContext):
    logger.info(f"connecting to room {ctx.room.name}")
    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)

    # Wait for the first participant to connect
    participant = await ctx.wait_for_participant()
    logger.info(f"starting feedback session for participant {participant.identity}")

    # Initialize default values
    participant_name = participant.identity or "Participant"
    course_name = ""
    
    # Try to get course name from participant metadata
    if participant.metadata:
        try:
            metadata = json.loads(participant.metadata)
            course_name = metadata.get('courseName', '')
            logger.info(f"Using metadata - Course Name: {course_name}")
        except json.JSONDecodeError:
            logger.warning("Failed to parse participant metadata")

    # Fallback to API if needed
    if not course_name:
        api_user_info = await fetch_user_info_from_api(participant.identity, ctx.room.name)
        if api_user_info:
            course_name = api_user_info.get('courseName', '')
            participant_name = api_user_info.get('participantName', participant_name)
            logger.info(f"Using API data - Name: {participant_name}, Course Name: {course_name}")

    # Final fallback to environment variables
    course_name = os.getenv('COURSE_NAME', course_name)

    usage_collector = metrics.UsageCollector()

    def on_metrics_collected(agent_metrics: metrics.AgentMetrics):
        metrics.log_metrics(agent_metrics)
        usage_collector.collect(agent_metrics)

    session = AgentSession(
        vad=ctx.proc.userdata["vad"],
        min_endpointing_delay=1.0,
        max_endpointing_delay=4.0,  # Shorter than interview as feedback responses are typically briefer
    )

    session.on("metrics_collected", on_metrics_collected)

    await session.start(
        room=ctx.room,
        agent=FeedbackAgent(
            course_name=course_name,
            participant_name=participant_name
        ),
        room_input_options=RoomInputOptions(
            noise_cancellation=noise_cancellation.BVC(),
        ),
    )

if __name__ == "__main__":
    cli.run_app(
        WorkerOptions(
            entrypoint_fnc=entrypoint,
            prewarm_fnc=prewarm,
        ),
    ) 