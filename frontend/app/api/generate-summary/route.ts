import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
    try {
        const { messages, courseName } = await req.json();

        const prompt = `
    Analyze the following feedback conversation about a course named "${courseName}". 
    The conversation is between a feedback bot and a course participant.
    
    Extract and summarize the following information:
    1. Overall Sentiment (positive, negative, or neutral)
    2. Course Rating (extract a rating out of 5 based on their comments)
    3. Key Points of Feedback (bullet points of main feedback)
    4. Areas for Improvement (if any mentioned)
    5. Testimonial (extract or create a concise testimonial from their positive comments)
    6. Topics of Interest (any specific topics or areas they showed interest in)
    7. Likelihood to Recommend (extract or infer from their comments, rate out of 5)
    
    Format the response as a JSON object with these keys:
    {
      "sentiment": string,
      "rating": number,
      "keyPoints": string[],
      "improvements": string[],
      "testimonial": string,
      "topicsOfInterest": string[],
      "recommendationLikelihood": number
    }
    
    Conversation:
    ${JSON.stringify(messages, null, 2)}
    `;

        const completion = await openai.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "gpt-4o-mini",
            response_format: { type: "json_object" },
        });

        const summary = JSON.parse(completion.choices[0].message.content);

        return NextResponse.json(summary);
    } catch (error) {
        console.error('Error generating summary:', error);
        return NextResponse.json(
            { error: 'Failed to generate summary' },
            { status: 500 }
        );
    }
} 