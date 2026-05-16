import { NextResponse } from 'next/server';
import { MOCK_MILESTONE } from '../../../../../lib/mock-data';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: _id } = await params;
  return NextResponse.json(MOCK_MILESTONE);
}
