import { CreateSiteDto } from '../../sites/dto/create-site.dto';

export type SiteData = CreateSiteDto & {
  id: string;
  /** Signed URL (1 hr TTL) — computed from avatarStoragePath at fetch time. */
  avatarUrl?: string;
};

/** Generates `has${Capitalize<K>}: boolean` for every optional key K in T. */
type HasFlags<T> = {
  [K in keyof T as K extends string
    ? undefined extends T[K]
      ? `has${Capitalize<K>}`
      : never
    : never]: boolean;
};

export interface TemplateContext extends SiteData, HasFlags<SiteData> {
  firstName: string;
  inlineMode: boolean;
  inlineCss?: string;
  inlineJs?: string;
}
