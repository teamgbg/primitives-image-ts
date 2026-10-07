/**
 * @system core-blocks
 * @status handwritten
 */

	/**
	 * Page-data binding for `src`, the SAME vocabulary Text/BrandBar/Chart use
	 * (`block-data-binding-is-unified`): set `dataSource:"page-data"` and a dotted
	 * `fieldPath`, and the resolved loaderData value becomes the image source.
	 *
	 * This is what lets a server-resolved image — a QR code minted per request,
	 * a generated chart, any data-uri — render through the ONE Image primitive
	 * instead of a bespoke block. Without it, an image whose src is only known at
	 * resolve time had no way onto a Puck page, which is how hand-rolled HTML
	 * pages ended up carrying their own `<img>` tags.
	 *
	 * Precedence: a resolved binding wins over the authored `src`, which stays the
	 * fallback (and the editor preview). Brand injection (`source`) is unrelated
	 * and still wins over both, since it is stamped at SSR.
	 */

import * as v from "valibot";

export const imagePropsSchema = v.object({
	/** Image URL or platform asset path (e.g. /api/assets/...) */
	src: v.optional(v.string()),
	/** Accessibility alt text */
	alt: v.optional(v.string()),
	/** object-fit behaviour when a width/height is constrained */
	fit: v.optional(
		v.picklist(["cover", "contain", "fill", "none", "scale-down"]),
	),
	/** Corner radius intent slug (clause #4) — none/sm/md/lg/full */
	radius: v.optional(v.picklist(["none", "sm", "md", "lg", "full"])),
	/** CSS width (e.g. "100%", "320px") — defaults to the image's natural width */
	width: v.optional(v.string()),
	/** CSS max-height in px — constrains tall images (e.g. logos) to a height while preserving aspect ratio */
	maxHeight: v.optional(v.pipe(v.number(), v.minValue(1), v.maxValue(1000))),
	/**
	 * SSR-stamped (not editor-authored): which logo variant injectLogos picked for
	 * the page/region theme — emitted as `data-logo-variant` so the theme suite
	 * asserts the rendered logo matches the page mode.
	 */
	logoVariant: v.optional(v.picklist(["light", "dark", "brand"])),
	/**
	 * SSR-stamped (not editor-authored): both brand-logo variants, so the portal's
	 * live theme toggle can switch the logo client-side. Provider-less public
	 * surfaces ignore these and render the SSR `src`. Null = no logo for that mode.
	 */
	logoSrcLight: v.optional(v.nullable(v.string())),
	logoSrcDark: v.optional(v.nullable(v.string())),
	/** Optional link target wrapping the image */
	href: v.optional(v.string()),
	/**
	 * Brand-source opt-in. When set, the SSR brand pass (injectLogos) fills
	 * `src` from the page's resolved org ("org") or connected partner
	 * ("partner") logo for the current theme mode — so a header/footer Image
	 * renders the correct tenant brand with no per-page configuration, and a
	 * partner slot with no partner collapses to nothing. An Image without
	 * `source` is a plain picture and is never brand-injected.
	 */
	source: v.optional(v.picklist(["org", "partner"])),
	dataSource: v.optional(v.string()),
	fieldPath: v.optional(v.string()),
});

export type ImageProps = v.InferOutput<typeof imagePropsSchema>;

export const schemas = {
	props: imagePropsSchema,
};
