// @system codegen
// @status generated
// @edit change the suite in the owned-suites band, then re-run codegen. Hand-edits are overwritten.
//
// This suite's assertions are OWNED by the codegen band: the band module
// carries them verbatim, this file is the emission, and hand edits here are
// overwritten on the next run. The rationale each assertion carries moved
// with it into the band.

import { afterEach, mock, test, expect } from "bun:test";
import { GlobalRegistrator } from "@happy-dom/global-registrator";
// Guarded: several suite files register happy-dom, and a second registration
// throws — an unguarded register() breaks whole-suite runs for every peer.
if (!globalThis.document) GlobalRegistrator.register();

let snapshot: unknown = {};

mock.module("@teamscala/ui-foundation/contexts/LiveDataContext", () => ({
	useLiveDataSource: (source: string) => (source === "page-data" ? snapshot : undefined),
}));
let portalValue: { orgId?: string; websiteId?: string } | null = null;
mock.module("@teamscala/ui-foundation/contexts/AppPortalContext", () => ({
	useAppPortal: () => portalValue,
}));
mock.module("@teamscala/ui-foundation/theme/theme-context", () => ({
	useOptionalTheme: () => null,
}));
mock.module("@teamscala/ui-foundation/theme/resolve-mode-bound-logo", () => ({
	resolveModeBoundLogo: () => ({ src: "", variant: undefined }),
}));

const { render, cleanup } = await import("@testing-library/react");
const { Image } = await import("./block.tsx");

afterEach(() => {
	cleanup();
	snapshot = {};
	portalValue = null;
});

const img = (c: HTMLElement) => c.querySelector("img");
const imgSrc = (c: HTMLElement) => img(c)?.getAttribute("src") ?? null;

// --- original behaviour (preserved) ---

test("bare Image renders an <img> with the gui-image class", () => {
	const { container } = render(<Image src="data:image/png;base64,X" alt="x" />);
	expect(img(container)?.getAttribute("class")).toBe("gui-image");
	expect(imgSrc(container)).toBe("data:image/png;base64,X");
	expect(img(container)?.getAttribute("alt")).toBe("x");
});

test("Image with href wraps in a link", () => {
	const { container } = render(<Image src="data:image/png;base64,X" href="/go" />);
	expect(container.querySelector("a")?.getAttribute("class")).toBe("gui-image-link");
});

// --- href path templating (the /[orgId] placeholder defect) ---

test("href {{orgId}} template resolves from the portal context", () => {
	portalValue = { orgId: "5b742740-0f37-494c-a059-d8399ae4b350" };
	const { container } = render(<Image src="data:image/png;base64,X" href="/{{orgId}}" />);
	const link = container.querySelector("a");
	expect(link?.getAttribute("class")).toBe("gui-image-link");
	expect(link?.getAttribute("href")).toBe("/5b742740-0f37-494c-a059-d8399ae4b350");
});

test("href template with no resolvable value drops the link (never ships a literal placeholder)", () => {
	portalValue = null;
	const { container } = render(<Image src="data:image/png;base64,X" href="/{{orgId}}" />);
	expect(container.querySelector("a")).toBeNull();
	expect(img(container)).not.toBeNull();
});

test("href template with a partial resolution also drops the link", () => {
	portalValue = { orgId: "org-1" };
	const { container } = render(
		<Image src="data:image/png;base64,X" href="/{{websiteId}}/{{orgId}}/dashboard" />,
	);
	expect(container.querySelector("a")).toBeNull();
});

// --- square-bracket org-scoped shape (LinkButton's vocabulary) ---

test("href /[orgId] resolves from the portal context (LinkButton's shape)", () => {
	portalValue = { orgId: "c503629a-85d9-4d25-9431-f6fa59504868" };
	const { container } = render(<Image src="data:image/png;base64,X" href="/[orgId]" />);
	const link = container.querySelector("a");
	expect(link?.getAttribute("href")).toBe("/c503629a-85d9-4d25-9431-f6fa59504868");
});

test("href /[orgId] with no portal context drops the link (never ships the literal)", () => {
	portalValue = null;
	const { container } = render(<Image src="data:image/png;base64,X" href="/[orgId]" />);
	expect(container.querySelector("a")).toBeNull();
	expect(img(container)).not.toBeNull();
});

test("Image with href but editing does NOT wrap (stays selectable)", () => {
	const { container } = render(<Image src="data:image/png;base64,X" href="/go" puck={{ isEditing: true }} />);
	expect(container.querySelector("a")).toBeNull();
	expect(img(container)).not.toBeNull();
});

test("fit + radius map to inline style", () => {
	const { container } = render(<Image src="data:image/png;base64,X" fit="contain" radius="sm" />);
	const style = img(container)?.getAttribute("style") ?? "";
	expect(style).toContain("contain");
	expect(style).toContain("var(--radius-sm)");
});

// --- page-data binding (the capability that replaces hand-rolled <img>) ---

test("bound src renders the resolved page-data value", () => {
	snapshot = { whatsapp: { qrDataUri: "data:image/png;base64,QR" } };
	const { container } = render(
		<Image dataSource="page-data" fieldPath="whatsapp.qrDataUri" alt="QR" />,
	);
	expect(imgSrc(container)).toBe("data:image/png;base64,QR");
});

test("a resolved binding wins over the authored src", () => {
	snapshot = { whatsapp: { qrDataUri: "data:image/png;base64,QR" } };
	const { container } = render(
		<Image
			src="data:image/png;base64,PLACEHOLDER"
			dataSource="page-data"
			fieldPath="whatsapp.qrDataUri"
			alt="QR"
		/>,
	);
	expect(imgSrc(container)).toBe("data:image/png;base64,QR");
});

test("an unresolved binding falls back to the authored src", () => {
	snapshot = { whatsapp: {} };
	const { container } = render(
		<Image
			src="data:image/png;base64,PLACEHOLDER"
			dataSource="page-data"
			fieldPath="whatsapp.qrDataUri"
			alt="QR"
		/>,
	);
	expect(imgSrc(container)).toBe("data:image/png;base64,PLACEHOLDER");
});

test("an ordinary unbound Image is unaffected", () => {
	const { container } = render(<Image src="data:image/png;base64,LOGO" alt="Logo" />);
	expect(imgSrc(container)).toBe("data:image/png;base64,LOGO");
});

test("a data-uri src is NOT rewritten by the asset-path rewriter", () => {
	// toAssetPath would corrupt a data:/blob: src, and the QR IS a data-uri — so
	// this is the property that makes the binding usable for generated images.
	snapshot = { q: { uri: "data:image/png;base64,AAA" } };
	const { container } = render(<Image dataSource="page-data" fieldPath="q.uri" alt="q" />);
	expect(imgSrc(container)).toBe("data:image/png;base64,AAA");
});

test("no src and no resolved binding renders nothing outside the editor", () => {
	const { container } = render(<Image dataSource="page-data" fieldPath="q.missing" alt="" />);
	expect(img(container)).toBeNull();
});
