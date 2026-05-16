import { NextResponse } from 'next/server';
import { MOCK_INTERVIEW_QUESTIONS } from '../../../../../lib/mock-data';

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const questions = MOCK_INTERVIEW_QUESTIONS[id] ?? [
    'Describe your core product and target customer segment.',
    'What is your current monthly recurring revenue and growth rate?',
    'How do you differentiate from existing solutions in the market?',
    'What does your go-to-market strategy look like for the next 12 months?',
  ];
  return NextResponse.json({ application_id: id, questions, count: questions.length });
}
