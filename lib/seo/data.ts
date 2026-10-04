/*
 * Server-side reads for metadata, the catalogue's first page and the sitemap.
 * Every read fails soft: a missing or unreachable database returns null or an
 * empty list so pages and the sitemap still render. Only import this from
 * server components and route handlers.
 */

import { Types } from "mongoose";

import { encodeCursor } from "@/lib/cursor";
import { connectDb } from "@/lib/db";
import { toSummary } from "@/lib/dto";
import { DEFAULT_LIMIT, pageOf } from "@/lib/list-query";
import type { CapsuleSummaryDto } from "@/lib/types";
import { Capsule } from "@/models/Capsule";

import type { CapsuleSitemapRow } from "./build";

export interface InitialCapsulePage {
  items: CapsuleSummaryDto[];
  nextCursor: string | null;
}

/** The same default view as GET /api/capsules with no filters. */
export async function getInitialCapsulePage(): Promise<InitialCapsulePage | null> {
  try {
    await connectDb();
    const docs = await Capsule.find({ status: "visible" })
      .sort({ _id: -1 })
      .limit(DEFAULT_LIMIT + 1)
      .lean();
    const page = pageOf(docs, DEFAULT_LIMIT);
    return {
      items: page.items.map(toSummary),
      nextCursor: page.nextCursorId !== null ? encodeCursor(page.nextCursorId) : null,
    };
  } catch {
    return null;
  }
}

export interface CapsuleMetadataRow {
  id: string;
  name: string;
  description: string;
}

export async function getCapsuleForMetadata(id: string): Promise<CapsuleMetadataRow | null> {
  if (!/^[0-9a-f]{24}$/i.test(id) || !Types.ObjectId.isValid(id)) {
    return null;
  }
  try {
    await connectDb();
    const doc = await Capsule.findOne({ _id: id, status: "visible" })
      .select("name description")
      .lean();
    if (doc === null) {
      return null;
    }
    return { id, name: doc.name ?? "", description: doc.description ?? "" };
  } catch {
    return null;
  }
}

/** Described, visible capsules for the sitemap. Null when the read fails. */
export async function getDescribedCapsules(): Promise<CapsuleSitemapRow[] | null> {
  try {
    await connectDb();
    const docs = await Capsule.find({ status: "visible", description: { $ne: "" } })
      .select("_id updatedAt")
      .sort({ _id: -1 })
      .limit(5000)
      .lean();
    return docs.map((doc) => ({
      id: String(doc._id),
      ...(doc.updatedAt !== undefined ? { updatedAt: doc.updatedAt } : {}),
    }));
  } catch {
    return null;
  }
}
