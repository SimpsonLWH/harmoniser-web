import { register } from '@/lib/devices/routes';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** A device announces itself: {"hw","kind","fw"} -> 201 {"id","token","code","pair_url"}. */
export const POST = register;
