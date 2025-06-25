import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { supabase } from '@/lib/supabase';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

export async function POST(request: Request) {
    try {
        const { messages, userName, userEmail, courseName } = await request.json();

        if (!messages || !userName || !userEmail || !courseName) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const prompt = `
        Analyze the following technical interview conversation and provide a structured feedback summary.
        Focus on:
        1. Overall sentiment (positive, neutral, or negative)
        2. Rating (1-5)
        3. Key points (main topics discussed and understanding shown)
        4. Areas for improvement
        5. Topics the participant showed most interest in
        6. A brief testimonial summarizing their experience
        7. Likelihood to recommend (1-5)

        Format the response as a JSON object with these exact keys:
        {
            "sentiment": string,
            "rating": number,
            "keyPoints": string[],
            "improvements": string[],
            "topicsOfInterest": string[],
            "testimonial": string,
            "recommendationLikelihood": number
        }

        Conversation:
        ${JSON.stringify(messages, null, 2)}
        `;

        const completion = await openai.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "You are an expert at analyzing technical interviews and providing structured feedback."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            model: "gpt-4-turbo-preview",
            response_format: { type: "json_object" }
        });

        const analysis = JSON.parse(completion.choices[0].message.content);

        // Store in Supabase
        const { data, error } = await supabase
            .from('cohort_feedback')
            .insert([
                {
                    user_name: userName,
                    user_email: userEmail,
                    course_name: courseName,
                    sentiment: analysis.sentiment,
                    rating: analysis.rating,
                    recommendation_likelihood: analysis.recommendationLikelihood,
                    key_points: analysis.keyPoints,
                    improvements: analysis.improvements,
                    topics_of_interest: analysis.topicsOfInterest,
                    testimonial: analysis.testimonial,
                    raw_messages: messages
                }
            ])
            .select()
            .single();

        if (error) {
            console.error('Error storing feedback:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(analysis);
    } catch (error) {
        console.error('Error processing request:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
} 