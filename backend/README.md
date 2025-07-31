# Course Feedback Agent

This is a voice-based feedback collection agent for course participants. It uses LiveKit for real-time audio communication and natural language processing to collect structured feedback from course participants.

## Features

- Real-time voice interaction with participants
- Natural conversation flow for feedback collection
- Collects feedback on:
  - Course content relevance
  - Likelihood to recommend
  - Time/effort value
  - Friend referral interest
  - Desired advanced topics
  - Testimonials
  - Improvement suggestions

## Setup

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Create a `.env.local` file with your configuration:
```env
NEXTJS_API_URL=http://localhost:3000
OPENAI_API_KEY=your_key_here
LIVEKIT_API_KEY=your_key_here
LIVEKIT_API_SECRET=your_secret_here
```

## Running the Agent

Start the feedback agent:
```bash
# python feedback_agent.py
```

## Environment Variables

- `NEXTJS_API_URL`: URL of your Next.js frontend (default: http://localhost:3000)
- `OPENAI_API_KEY`: Your OpenAI API key for language processing
- `LIVEKIT_API_KEY`: Your LiveKit API key for real-time communication
- `LIVEKIT_API_SECRET`: Your LiveKit API secret
- `COURSE_NAME`: (Optional) Default course name if not provided through API or metadata
