import { NextResponse } from 'next/server';
import { MOCK_APPLICATIONS } from '../../../../lib/mock-data';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const app = MOCK_APPLICATIONS[id];
  if (!app) {
    return NextResponse.json({ detail: 'Application not found' }, { status: 404 });
  }
  return NextResponse.json(app);
}
