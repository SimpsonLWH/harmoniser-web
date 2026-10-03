/** Wire types shared by the API routes and the catalogue UI. */

export interface CapsuleSummaryDto {
  id: string;
  name: string;
  description: string;
  tags: string[];
  schemaVersion: 0 | 1;
  installs: number;
  /** Computed with the app's own CapsuleRouter rules; the marketplace never promises otherwise. */
  widget: boolean;
  widgetReason: string;
  createdAt: string;
  updatedAt: string;
}

export interface CapsuleDetailDto extends CapsuleSummaryDto {
  capsule: unknown;
}

/** Only returned when the caller asks for include=capsule; otherwise the summary shape is used. */
export interface CapsuleSummaryWithCapsuleDto extends CapsuleSummaryDto {
  capsule: unknown;
}

export interface CapsuleListDto {
  capsules: CapsuleSummaryDto[];
  nextCursor: string | null;
}

export interface CapsuleListWithCapsulesDto {
  capsules: CapsuleSummaryWithCapsuleDto[];
  nextCursor: string | null;
}

export interface PublishResponseDto {
  id: string;
  contentHash: string;
}
