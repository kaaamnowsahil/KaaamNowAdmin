export function formatText(
  value: string,
  values?: Record<string, string | number>,
): string {
  if (!values) return value;
  return value.replace(/\{\{(\w+)\}\}/g, (placeholder, key: string) =>
    String(values[key] ?? placeholder),
  );
}
