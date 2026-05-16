import { NextResponse } from 'next/server';

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return NextResponse.json({
    application_id: id,
    status: 'interview_submitted',
    message: 'Judging panel analysis started. Results will be available shortly.',
  });
}
