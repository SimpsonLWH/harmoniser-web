import { list, preflight } from '@/lib/devices/routes';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const OPTIONS = preflight;

/** The devices the caller has paired: 200 {"devices":[...]}. */
export const GET = list;
