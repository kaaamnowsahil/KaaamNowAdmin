const escapeCell = (value: unknown) => {
  const text = value === undefined || value === null ? '' : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

/** Downloads rows as a CSV file named `${fileName}.csv`. */
export const downloadCsv = (
  fileName: string,
  headers: string[],
  rows: unknown[][],
) => {
  const csv = [headers, ...rows]
    .map(row => row.map(escapeCell).join(','))
    .join('\n');
  const url = URL.createObjectURL(
    new Blob([csv], { type: 'text/csv;charset=utf-8' }),
  );
  const link = document.createElement('a');
  link.href = url;
  link.download = `${fileName}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};
