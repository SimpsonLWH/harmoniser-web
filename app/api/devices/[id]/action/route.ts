import type { NextResponse } from 'next/server';

import { postAction, preflight } from '@/lib/devices/routes';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface Ctx {
  params: Promise<{ id: string }>;
}

export const OPTIONS = preflight;

/** The user presses a button on the device from afar: {"action"} -> 200 {"action_seq"}. */
export async function POST(request: Request, ctx: Ctx): Promise<NextResponse> {
  return postAction(request, (await ctx.params).id);
}
