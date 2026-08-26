import { NextResponse } from 'next/server';
import { GameStoreError } from './kv';

export function toErrorResponse(err: unknown, fallback = 'Internal server error') {
  console.error(err);
  if (err instanceof GameStoreError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  const message = err instanceof Error ? err.message : fallback;
  return NextResponse.json({ error: message }, { status: 500 });
}
