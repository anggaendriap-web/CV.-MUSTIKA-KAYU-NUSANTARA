/**
 * Reusable utility to export arrays of objects to Excel-compatible CSV files.
 * Includes UTF-8 BOM so Excel opens indonesian characters and numbers correctly.
 */
export function exportToExcel<T>(
  data: T[],
  headers: string[],
  mapRow: (item: T) => (string | number)[],
  fileName: string
) {
  // Create CSV content with semicolon separator for Indonesian locale compatibility
  const headerLine = headers.join(';');
  const rowLines = data.map(item => {
    const values = mapRow(item);
    return values.map(val => {
      if (val === undefined || val === null) return '';
      // Escape semicolons and newlines inside cells
      const str = String(val).replace(/"/g, '""');
      if (str.includes(';') || str.includes('\n') || str.includes('\r') || str.includes('"')) {
        return `"${str}"`;
      }
      return str;
    }).join(';');
  });

  const csvContent = "\uFEFF" + [headerLine, ...rowLines].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${fileName}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
