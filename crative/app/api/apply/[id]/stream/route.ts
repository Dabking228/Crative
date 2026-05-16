import { MOCK_APPLICATIONS } from '../../../../../lib/mock-data';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const app = MOCK_APPLICATIONS[id];

  const result = app
    ? {
        result: app.eligibility_result ?? 'MANUAL_REVIEW',
        programme_recommended: app.programme_applied,
        flags: app.eligibility_flags,
        reasoning: app.eligibility_reasoning,
        confidence: app.eligibility_confidence ?? 0.8,
      }
    : { result: 'MANUAL_REVIEW', programme_recommended: null, flags: [], reasoning: 'No record found.', confidence: 0.5 };

  const tokens = [
    'Verifying SSM registration details…',
    'Checking Malaysian ownership percentage…',
    'Validating director residency requirements…',
    'Assessing company age against programme limits…',
    `Eligibility result: ${result.result}`,
  ];

  const enc = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      for (const token of tokens) {
        controller.enqueue(
          enc.encode(`data: ${JSON.stringify({ token, done: false })}\n\n`),
        );
        await new Promise((r) => setTimeout(r, 120));
      }
      controller.enqueue(
        enc.encode(`data: ${JSON.stringify({ token: '', done: true, result })}\n\n`),
      );
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'X-Accel-Buffering': 'no',
    },
  });
}
