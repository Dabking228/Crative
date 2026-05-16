import { NextResponse } from 'next/server';
import { MOCK_QUEUE } from '../../../../lib/mock-data';

export async function GET() {
  const sorted = [...MOCK_QUEUE].sort(
    (a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime(),
  );
  return NextResponse.json({ applications: sorted });
}
