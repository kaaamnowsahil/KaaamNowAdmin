/** Case-insensitive match of `query` against any of the given fields. */
export const matchesQuery = (
  query: string,
  ...fields: (string | undefined)[]
) => {
  const needle = query.trim().toLowerCase();
  if (!needle) {
    return true;
  }
  return fields.some(field => field?.toLowerCase().includes(needle));
};

export const countBy = <T, K extends string>(
  items: T[],
  keyOf: (item: T) => K,
): Record<K, number> =>
  items.reduce(
    (counts, item) => {
      const key = keyOf(item);
      counts[key] = (counts[key] ?? 0) + 1;
      return counts;
    },
    {} as Record<K, number>,
  );

export const sumBy = <T>(items: T[], valueOf: (item: T) => number) =>
  items.reduce((total, item) => total + valueOf(item), 0);
