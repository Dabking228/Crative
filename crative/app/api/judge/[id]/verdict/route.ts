import { NextResponse } from 'next/server';
import { buildVerdictResponse } from '../../../../../lib/mock-data';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const verdict: string = body.verdict ?? 'APPROVE';
  const overrideReason: string | null = body.override_reason ?? null;

  return NextResponse.json(buildVerdictResponse(id, verdict, overrideReason));
}
