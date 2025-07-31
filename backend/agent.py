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
You are a conversational agent that is collecting feedback from a participant in a course.
 
#### **Bot Tone & Personality**

- Friendly, conversational, and supportive — like a mentor who listens more than talks

- Doesn't interrupt or sound robotic

- Curious, calm, and emotionally intelligent

- Warm and grateful, not transactional

- Never judges feedback — always encourages honesty

---

####  **Expected Duration**

5–6 minutes across all modules. Users can stop anytime.

---

#### **Goal of the Feedback Bot**

We want to understand how each module landed with you — what helped, what didn't, and what could be better. We're also hoping to make this course better for others, so your feedback really matters. No rush — just share what's true for you.

---

#### **Start of the Conversation**

Hey, congrats on completing {module_title}. I'm here to hear how things went for you. You'll get a few quick questions for this module — but if there's anything else you want to talk about that we didn't ask, you're always welcome to share.

---

### **MODULE FEEDBACK QUESTIONS**

{module_questions}

---

### **GENERAL COURSE FEEDBACK**

1. How likely are you to recommend this course to others?

2. Did you feel this course was worth your investment of time and effort?

3. Would you be interested in referring a friend to the program?

4. What advanced topics would you like to learn more about?

5. Could you share a short testimonial about your experience for our website?

6. Do you have any suggestions for improvements or any additional thoughts?
'''

# Module-specific questions dictionary
MODULE_QUESTIONS = {
    "1": """
### **MODULE 1 – Intro to Gen AI**

*This module set the foundation — from course structure to Gen AI basics and your first hands-on app with Streamlit.*

1. How clear and helpful was the introduction to Gen AI and the course structure overall?

2. Were the Python concepts enough to help you understand and work with AI tools?

3. Did you try building the AI app using Streamlit? How was that experience for you?

4. How was the overall platform experience — was it smooth to navigate and follow?

5. Was anything confusing or unclear that we could improve in this foundation module?
""",
    "2": """
### **MODULE 2 – Retrieval Augmented Generation (RAG)**

*This module explored the core of RAG, building and deploying a chatbot, and answering questions from PDFs.*

1. Did the video and activity flow feel manageable and well-paced?

2. Did you try anything hands-on in this module? How did it go?

3. Would you prefer more examples, use cases, or exercises in this topic to engage more?

4. Any suggestions for improvement or things that didn't work well?

5. If there's anything we didn't ask that you'd like to share, this is your space.
""",
    "3": """
### **MODULE 3 – Conversational AI**

*This module dove into chatbot logic, finetuning, multimodal APIs, and building a more advanced personal AI assistant.*

1. How was the overall flow and clarity of this module?

2. Did it feel beginner-friendly, or did any parts seem too technical?

3. Were there moments where you got stuck or wanted more guidance?

4. Which tool or topic was your favorite in this module, and why?

5. Do you now understand when and why finetuning is used?

6. What kind of project would you be excited to build using multimodal APIs?

7. Did the personal AI app project help you think differently about building with Gen AI?

8. Any final feedback or ideas we didn't ask but you'd like to add?
""",
    "4": """
### **MODULE 4 — Agents and Workflows**

1. How was your overall experience with this module?

2. Did anything feel overwhelming or confusing?

3. What's one thing you found particularly helpful in this module?

4. Was there anything that could be improved or explained better?

5. If there's something outside these questions you'd like to mention, feel free.
""",
    "5": """
### **MODULE 5 — Multimodal and Advanced Tools**

1. How did you find the overall structure and depth of this module?

2. Was there any part that felt too rushed or too complex?

3. What's one part that really clicked or helped you understand better?

4. Was anything missing or unclear from your point of view?

5. If there's anything else on your mind, we'd love to hear it.
""",
    "6": """
### **MODULE 6 — Real-World Use Cases and Capstone**

1. How was your overall experience with the final module?

2. Did it help you connect everything you've learned so far?

3. Was the capstone project clear and doable for you?

4. Is there anything in this module that you wish was explained better?

5. Would you feel confident recommending this course to a friend?

6. What would you tell someone who's thinking about joining this course?

7. If you were to refer someone, what kind of support or incentives would motivate you?

8. Is there anything else you'd like to share — something we may not have asked?
"""
}

class FeedbackAgent(Agent):
    def __init__(self, course_name: str = "", participant_name: str = "Participant", module_id: str = "1", module_title: str = "Module 1", progress: str = ""):
        # Get module-specific questions
        module_questions = MODULE_QUESTIONS.get(module_id, MODULE_QUESTIONS["1"])
        
        # Format the dynamic prompt
        dynamic_prompt = FEEDBACK_PROMPT.format(
            module_title=module_title,
            module_questions=module_questions
        )
        
        super().__init__(
            instructions=dynamic_prompt,
            stt=deepgram.STT(model="nova-2-meeting"),
            llm=openai.LLM(model="gpt-4o-mini"),
            tts=openai.TTS(voice="alloy"),
            vad=silero.VAD.load(),
            # turn_detection=MultilingualModel(),
        )
        self.course_name = course_name
        self.participant_name = participant_name
        self.module_id = module_id
        self.module_title = module_title
        self.progress = progress
        self.chat_log = []
        self.feedback_complete = False

    async def on_enter(self):
        # Create a more personalized greeting with progress information
        greeting = f"Hello {self.participant_name}! I'm your Cohort-Review Bot for the {self.course_name} module."
        
        if self.progress:
            greeting += f" I see you've completed {self.module_title} ({self.progress} of the course)."
        else:
            greeting += f" I see you've completed {self.module_title}."
            
        greeting += " I'd love to collect your feedback on this module. Let's get started!"
        
        await self.session.say(greeting, allow_interruptions=True)
        # Start the feedback conversation
        await self.ask_next_question()

    async def ask_next_question(self):
        # Get module-specific questions
        module_questions = MODULE_QUESTIONS.get(self.module_id, MODULE_QUESTIONS["1"])
        
        # Parse questions from the module content (simple approach - split by numbered questions)
        import re
        question_pattern = r'\d+\.\s+(.+?)(?=\n\d+\.|\n\n|$)'
        questions = re.findall(question_pattern, module_questions, re.DOTALL)
        
        # Add general course feedback questions
        general_questions = [
            "How likely are you to recommend this course to others?",
            "Did you feel this course was worth your investment of time and effort?",
            "Would you be interested in referring a friend to the program?",
            "What advanced topics would you like to learn more about?",
            "Could you share a short testimonial about your experience for our website?",
            "Do you have any suggestions for improvements or any additional thoughts?"
        ]
        
        all_questions = questions + general_questions

        for idx, q in enumerate(all_questions):
            await self.session.say(q, allow_interruptions=True)
            user_response = await self.session.listen()
            self.chat_log.append({
                "module_id": self.module_id,
                "module_title": self.module_title,
                "question": q, 
                "response": user_response
            })

        self.feedback_complete = True
        await self.session.say("Thank you so much for your time and valuable feedback! We truly appreciate it.")
        print("Collected Feedback Chat Log:")
        print(json.dumps(self.chat_log, indent=2, ensure_ascii=False))

async def fetch_user_info_from_api(participant_id: str, room_name: str) -> Optional[Dict]:
    """Fetch user information from Next.js API endpoint"""
    api_url = os.getenv('NEXTJS_API_URL', 'http://localhost:3000')
    endpoint = f"{api_url}/api/livekit/token"
    
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
    module_id = "1"
    module_title = "Module 1"
    progress = ""
    
    # Try to get information from participant metadata
    if participant.metadata:
        try:
            metadata = json.loads(participant.metadata)
            print(metadata, "metadata")
            course_name = metadata.get('courseName', '')
            module_id = metadata.get('moduleId', '1')
            module_title = metadata.get('moduleTitle', f'Module {module_id}')
            progress = metadata.get('progress', '')
            logger.info(f"Using metadata - Course Name: {course_name}, Module ID: {module_id}, Module Title: {module_title}, Progress: {progress}")
        except json.JSONDecodeError:
            logger.warning("Failed to parse participant metadata")

    # Fallback to API if needed
    if not course_name:
        api_user_info = await fetch_user_info_from_api(participant.identity, ctx.room.name)
        if api_user_info:
            course_name = api_user_info.get('courseName', '')
            participant_name = api_user_info.get('participantName', participant_name)
            module_id = api_user_info.get('moduleId', module_id)
            module_title = api_user_info.get('moduleTitle', module_title)
            progress = api_user_info.get('progress', progress)
            logger.info(f"Using API data - Name: {participant_name}, Course Name: {course_name}, Module: {module_title}")

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
            participant_name=participant_name,
            module_id=module_id,
            module_title=module_title,
            progress=progress
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