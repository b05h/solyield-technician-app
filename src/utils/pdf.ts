/**
 * PDF generation using expo-print.
 * Use for visit reports and analytics export.
 */

import * as Print from 'expo-print';

/**
 * Generate a PDF from HTML content and optionally share/print.
 */
export async function printToPdfAsync(html: string): Promise<string> {
  const { uri } = await Print.printToFileAsync({
    html,
  });
  return uri;
}

/**
 * Open the system print dialog with the given HTML.
 */
export async function printAsync(html: string): Promise<void> {
  await Print.printAsync({
    html,
  });
}

/**
 * Build a minimal HTML document for a visit report (placeholder).
 */
export function buildVisitReportHtml(title: string, bodyContent: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <style>
    body { font-family: system-ui, sans-serif; padding: 24px; }
    h1 { font-size: 18px; }
  </style>
</head>
<body>
  <h1>${title}</h1>
  <div>${bodyContent}</div>
</body>
</html>
  `.trim();
}
