import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col items-start px-4 py-20 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight">That page isn&apos;t here</h1>
      <p className="mt-3 text-[15px] leading-7 text-text-2">
        The capsule may have been removed, or the link is wrong.
      </p>
      <Link
        href="/capsules"
        className="mt-6 inline-flex min-h-11 items-center rounded-full bg-brand px-5 text-[15px] font-medium text-white"
      >
        Back to the marketplace
      </Link>
    </div>
  );
}
