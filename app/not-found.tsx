import Link from "next/link";

import { CompassIcon } from "@/components/Icons";
import { StatusBlock } from "@/components/StatusBlock";

export default function NotFound() {
  return (
    <div className="page py-10 sm:py-16">
      <StatusBlock
        icon={<CompassIcon size={26} />}
        titleAs="h1"
        title={"That page isn't here"}
        caption="The capsule may have been removed, or the link is wrong."
      >
        <Link href="/capsules" className="btn btn-primary">
          Back to the marketplace
        </Link>
      </StatusBlock>
    </div>
  );
}
