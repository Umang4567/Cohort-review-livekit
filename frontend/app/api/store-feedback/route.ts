import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {
            userName,
            userEmail,
            courseName,
            sentiment,
            rating,
            recommendationLikelihood,
            keyPoints,
            improvements,
            topicsOfInterest,
            testimonial,
            rawMessages
        } = body;

        const { data, error } = await supabase
            .from('cohort_feedback')
            .insert([
                {
                    user_name: userName,
                    user_email: userEmail,
                    course_name: courseName,
                    sentiment,
                    rating,
                    recommendation_likelihood: recommendationLikelihood,
                    key_points: keyPoints,
                    improvements,
                    topics_of_interest: topicsOfInterest,
                    testimonial,
                    raw_messages: rawMessages
                }
            ])
            .select()
            .single();

        if (error) {
            console.error('Error storing feedback:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Error processing request:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
} 