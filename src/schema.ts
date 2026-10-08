/**
 * @system image
 * @status handwritten
 */

export interface ImageProps {
	src?: string;
	alt?: string;
	fit?: "cover" | "contain" | "fill" | "none" | "scale-down";
	radius?: "none" | "sm" | "md" | "lg" | "full";
	width?: string;
	maxHeight?: number;
	logoVariant?: "light" | "dark" | "brand";
	logoSrcLight?: string | null;
	logoSrcDark?: string | null;
	href?: string;
	source?: "org" | "partner";
	dataSource?: string;
	fieldPath?: string;
	visibleWhenPath?: string;
}