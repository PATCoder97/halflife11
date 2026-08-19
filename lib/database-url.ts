export function normalizePrismaDatabaseUrl(value: string | undefined) {
  if (!value) return value;

  try {
    const url = new URL(value);
    if (!url.searchParams.has("schema")) return value;

    url.searchParams.delete("schema");
    return url.toString();
  } catch {
    return value;
  }
}
