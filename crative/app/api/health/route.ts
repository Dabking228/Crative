import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    vertex_ai: true,
    neo4j: true,
    auradb_instance: 'mock',
    timestamp: new Date().toISOString(),
  });
}
