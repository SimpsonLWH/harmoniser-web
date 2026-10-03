import { claim, preflight } from '@/lib/devices/routes';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const OPTIONS = preflight;

/** A user pairs the device that shows this code: {"code"} -> 200 {"id","kind"}. */
export const POST = claim;
