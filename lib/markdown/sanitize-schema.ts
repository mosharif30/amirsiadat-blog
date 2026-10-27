import { defaultSchema, type Options } from "rehype-sanitize";

/** Allowed HTML in post Markdown (GitHub's schema plus lazy-loading images). */
export const sanitizeSchema: Options = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    img: [...(defaultSchema.attributes?.img ?? []), "loading"],
  },
};
