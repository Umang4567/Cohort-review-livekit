import { atom } from 'jotai';

// User atom: holds name, email, and courseName
export const userAtom = atom<{ name: string; email: string; courseName: string }>({
    name: '',
    email: '',
    courseName: '',
});

// Feedback atom: holds messages (transcription), course_name, and feedback_sentiment
export interface Feedback {
    messages: Array<{
        role: 'user' | 'assistant';
        text: string;
    }>;
    course_name: string;
    feedback_sentiment: 'positive' | 'neutral' | 'negative' | '';
}

export const feedbackAtom = atom<Feedback>({
    messages: [],
    course_name: '',
    feedback_sentiment: '',
});
