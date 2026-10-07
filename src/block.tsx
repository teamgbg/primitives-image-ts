/**
 * @system image
 * @status handwritten
 */

"use client";

import { useAppPortal } from "@teamscala/ui-foundation/contexts/AppPortalContext";
import { useLiveDataSource } from "@teamscala/ui-foundation/contexts/LiveDataContext";
import { resolveLiveTextValue } from "@teamscala/ui-foundation/text/resolve-live-text-value";
import { resolveModeBoundLogo } from "@teamscala/ui-foundation/theme/resolve-mode-bound-logo";
import { useOptionalTheme } from "@teamscala/ui-foundation/theme/theme-context";
import { useState } from "react";
import { buildStyle, type StyleKnobs } from "@teamscala/ui-foundation/styling-vocabulary/build-style";
import type { ImageProps } from "./schema.ts";

export type { ImageProps };

export interface ImageBlockProps extends ImageProps {
	puck?: { isEditing?: boolean };
	/** Emphasis knob (clause #4): opacity on the image. */
	emphasis?: StyleKnobs["emphasis"];
}

// Transparent 1×1 placeholder swapped in when the real src fails to load
// (e.g. a stale user avatar_url whose file was never uploaded) so the block
// never renders a broken-image icon. The <img> node persists (no SSR/client
// node divergence) and the placeholder decodes (naturalWidth>0).
const BROKEN_SRC_PLACEHOLDER =
	"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1' height='1'%3E%3C/svg%3E";

export function Image({
	src,
	alt = "",
	fit = "cover",
	radius,
	width,
	maxHeight,
	logoVariant,
	logoSrcLight,
	logoSrcDark,
	href,
	puck,
	emphasis,
	dataSource = "none",
	fieldPath,
}: ImageBlockProps) {
	// Page-data binding for `src` — the unified vocabulary
	// (`block-data-binding-is-unified`), identical to Text's. Lets a
	// server-resolved image (a per-request QR data-uri, a generated chart) render
	// through this ONE primitive; the authored `src` stays the fallback and the
	// editor preview. The hook is called unconditionally with "none" when unbound
	// (rules-of-hooks); "none" yields no snapshot, so an ordinary Image pays
	// nothing.
	const boundSnapshot = useLiveDataSource(dataSource);
	const boundSrc =
		dataSource && dataSource !== "none" && fieldPath
			? resolveLiveTextValue(boundSnapshot, fieldPath)
			: undefined;
	// Brand logos carry both variants (injectLogos) so the portal's live theme
	// toggle switches the logo client-side. Pick by the active theme; fall back
	// to the SSR `src` on provider-less public surfaces (useOptionalTheme → null)
	// and for `brand`-region logos (one variant for any theme).
	const themeCtx = useOptionalTheme();
	const [errored, setErrored] = useState(false);
	// A resolved binding wins over the authored src; brand injection (`source`)
	// is stamped onto `src` at SSR and is handled by the logo branch below.
	let effectiveSrc = boundSrc ? String(boundSrc) : src;
	let effectiveVariant = logoVariant;
	if ((logoSrcLight || logoSrcDark) && themeCtx && logoVariant !== "brand") {
		// Re-resolve the variant for the LIVE theme via the single shared decider
		// (resolveModeBoundLogo) — the same decider injectLogos uses to stamp the
		// SSR pair — so the live switch can never diverge from the SSR decision.
		const resolved = resolveModeBoundLogo(
			{ logo: logoSrcLight ?? undefined, logoDark: logoSrcDark ?? undefined },
			themeCtx.theme,
		);
		if (resolved.src) {
			effectiveSrc = resolved.src;
			effectiveVariant = resolved.variant;
		}
	}
	// No src outside the editor → render nothing. A brand-sourced Image with no
	// resolved logo (e.g. a `source:"partner"` slot with no connected partner)
	// collapses to nothing instead of a broken-image icon.
	if (!effectiveSrc && !puck?.isEditing) return null;
	const img = (
		<span style={buildStyle({ emphasis })}>
			<img
			key={effectiveSrc}
			src={errored ? BROKEN_SRC_PLACEHOLDER : effectiveSrc || ""}
			alt={alt}
			className="gui-image"
			data-logo-variant={effectiveVariant || undefined}
			loading="lazy"
			onError={() => setErrored(true)}
			style={{
				objectFit: fit,
				width: width || undefined,
				maxHeight: maxHeight ? `${maxHeight}px` : undefined,
				...buildStyle({ radius }),
			}}
		/>
		</span>
	);

	// Link wrap only outside the editor (so the image stays selectable while editing).
	// href supports the platform path-template vocabulary ({{orgId}}, {{websiteId}})
	// AND the square-bracket org-scoped shape LinkButton interpolates ("/[orgId]/…")
	// — both resolved from the ONE portal context (useAppPortal), so an org-scoped
	// link resolves identically wherever the image lives. A placeholder that
	// cannot resolve drops the link entirely: a literal {{...}} or /[[orgId]]
	// shipped users to a blank page (measured 2026-08-25 on the projects
	// /utility-header logo, which authored the square-bracket shape and shipped
	// the literal href to a dead /[orgId] route) — no destination beats a wrong one.
	const portal = useAppPortal();
	let resolvedHref = href;
	if (href && !puck?.isEditing) {
		const values: Record<string, string | undefined> = {
			orgId: portal?.orgId,
			websiteId: portal?.websiteId,
		};
		let unresolved = false;
		const resolve = (_match: string, key: string): string => {
			const value = values[key];
			if (value == null) {
				unresolved = true;
				return "";
			}
			return value;
		};
		resolvedHref = href
			.replace(/\{\{(\w+)\}\}/g, resolve)
			.replace(/\[(\w+)\]/g, resolve);
		if (unresolved) resolvedHref = undefined;
	}
	if (resolvedHref && !puck?.isEditing) {
		return (
			<a href={resolvedHref} className="gui-image-link">
				{img}
			</a>
		);
	}
	return img;
}
