import { NextResponse } from 'next/server';
import { MOCK_APPLICATIONS } from '../../../../../lib/mock-data';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const app = MOCK_APPLICATIONS[id];
  if (!app) {
    return NextResponse.json({ detail: 'Application not found' }, { status: 404 });
  }
  return NextResponse.json({
    application_id: app.application_id,
    status: app.status,
    eligibility_result: app.eligibility_result,
    eligibility_reasoning: app.eligibility_reasoning,
    eligibility_flags: app.eligibility_flags,
    eligibility_confidence: app.eligibility_confidence,
    programme_recommended: app.programme_applied,
    startup_name: app.startup_name,
    sector: app.sector,
  });
}
