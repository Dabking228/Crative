import { NextResponse } from 'next/server';
import { MOCK_MILESTONE } from '../../../../../lib/mock-data';

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: _id } = await params;
  // Simulate a short processing delay
  await new Promise((r) => setTimeout(r, 800));
  return NextResponse.json(MOCK_MILESTONE);
}
