import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  // Generate a mock application ID so the stream and status endpoints work
  const id = `APPDEMO00${Math.floor(Math.random() * 6) + 1}`;
  return NextResponse.json({
    application_id: id,
    status: 'submitted',
    message: `Application submitted. Stream eligibility at /api/apply/${id}/stream`,
  });
}
