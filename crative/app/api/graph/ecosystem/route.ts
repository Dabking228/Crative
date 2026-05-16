import { NextResponse } from 'next/server';
import { MOCK_GRAPH } from '../../../../lib/mock-data';

export async function GET() {
  return NextResponse.json(MOCK_GRAPH);
}
