export function resolveCardHeadings(
  brandName: string,
  label: string,
): { title: string; subtitle?: string } {
  const trimmedBrand = brandName.trim();
  const trimmedLabel = label.trim();

  if (trimmedBrand) {
    return {
      title: trimmedBrand,
      subtitle: trimmedLabel || undefined,
    };
  }

  return { title: trimmedLabel };
}
