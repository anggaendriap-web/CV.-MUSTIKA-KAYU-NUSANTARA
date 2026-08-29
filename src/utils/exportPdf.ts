import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';

/**
 * Display a modern, non-blocking toast notification on screen
 */
export function showPdfToast(message: string, durationMs: number = 3500) {
  try {
    const existing = document.getElementById('pdf-toast-notification');
    if (existing) {
      existing.remove();
    }

    const toast = document.createElement('div');
    toast.id = 'pdf-toast-notification';
    toast.style.cssText = `
      position: fixed;
      top: 24px;
      right: 24px;
      z-index: 999999;
      background: #18181b;
      color: #ffffff;
      padding: 12px 20px;
      border-radius: 12px;
      font-size: 13px;
      font-weight: 600;
      box-shadow: 0 10px 30px rgba(0,0,0,0.35);
      border: 1px solid rgba(255,255,255,0.2);
      display: flex;
      align-items: center;
      gap: 10px;
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      transform: translateY(0);
      opacity: 1;
    `;
    toast.innerHTML = `
      <div style="width: 8px; height: 8px; border-radius: 50%; background: #22c55e; flex-shrink: 0; box-shadow: 0 0 8px #22c55e;"></div>
      <span style="color: #f4f4f5; line-height: 1.4;">${message}</span>
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-10px)';
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, durationMs);
  } catch (err) {
    console.log('Toast notification log:', message);
  }
}

/**
 * Downloads a DOM element as a high-resolution, vector-crisp A4 PDF file.
 * Handles single or multi-page documents automatically with fallbacks.
 */
export async function downloadElementAsPdf(elementId: string, fileName: string): Promise<boolean> {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id "${elementId}" not found for PDF export.`);
    showPdfToast('Gagal: Elemen dokumen tidak ditemukan.');
    return false;
  }

  showPdfToast('Sedang memproses & mengunduh PDF...');

  try {
    const prevCursor = document.body.style.cursor;
    document.body.style.cursor = 'wait';

    // Capture the element using html2canvas-pro with high resolution and correct dimensions
    const canvas = await html2canvas(element, {
      scale: 2, // 2x resolution for crystal sharp text and lines
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#ffffff',
      scrollX: 0,
      scrollY: 0,
      windowWidth: element.scrollWidth > 800 ? element.scrollWidth : 1000,
    });

    document.body.style.cursor = prevCursor;

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    
    // A4 dimensions in mm: 210 x 297
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    });

    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 8; // 8mm clean margin
    const contentWidth = pageWidth - (margin * 2); // 194mm
    
    const imgWidth = contentWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = margin;

    // First page
    pdf.addImage(imgData, 'JPEG', margin, position, imgWidth, imgHeight);
    heightLeft -= (pageHeight - (margin * 2));

    // Subsequent pages if document height exceeds single A4 page
    while (heightLeft > 0) {
      position = heightLeft - imgHeight + margin;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', margin, position, imgWidth, imgHeight);
      heightLeft -= (pageHeight - (margin * 2));
    }

    const cleanFileName = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
    
    // 1. Try standard jsPDF save
    try {
      pdf.save(cleanFileName);
    } catch (saveErr) {
      // 2. Direct Blob link fallback if iframe restricts direct file download
      const blob = pdf.output('blob');
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = cleanFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
    }

    showPdfToast(`Berhasil mengunduh: ${cleanFileName}`);
    return true;
  } catch (error) {
    console.error('Error generating PDF:', error);
    showPdfToast('Gagal memproses PDF via canvas. Mencoba alternatif cetak...');
    
    // Fallback: try opening print window
    try {
      window.print();
    } catch (e) {
      console.error('Fallback print also failed:', e);
    }
    return false;
  }
}

/**
 * Universal print handler:
 * 1. Opens a standalone print window with pristine A4 styles (bypassing iframe restrictions).
 * 2. If popup is blocked by browser/iframe, automatically falls back to direct PDF download.
 */
export async function triggerPrintOrPdf(elementId: string, fallbackFileName: string) {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element #${elementId} not found.`);
    showPdfToast('Gagal: Elemen lembar cetak tidak ditemukan.');
    return;
  }

  // Attempt to open a dedicated standalone print window
  try {
    const printWindow = window.open('', '_blank', 'width=950,height=850,menubar=no,toolbar=no,location=no,status=no');
    if (printWindow) {
      const headHtml = document.head.innerHTML;
      const cleanTitle = fallbackFileName.replace(/_/g, ' ');
      
      const printHtml = `
        <!DOCTYPE html>
        <html lang="id">
          <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>${cleanTitle}</title>
            ${headHtml}
            <style>
              @media print {
                @page { size: A4 portrait; margin: 10mm; }
                body { margin: 0; background: #ffffff !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                .print-toolbar { display: none !important; }
                .printable-sheet { padding: 0 !important; border: none !important; width: 100% !important; max-width: none !important; box-shadow: none !important; }
              }
              body {
                background: #f4f4f5;
                font-family: ui-sans-serif, system-ui, sans-serif;
                margin: 0;
                padding: 0;
                display: flex;
                flex-direction: column;
                align-items: center;
              }
              .print-toolbar {
                position: sticky;
                top: 0;
                z-index: 999;
                width: 100%;
                background: #18181b;
                color: #ffffff;
                padding: 12px 24px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                box-shadow: 0 4px 15px rgba(0,0,0,0.15);
                box-sizing: border-box;
              }
              .print-btn {
                background: #dc2626;
                color: white;
                border: none;
                padding: 9px 18px;
                border-radius: 8px;
                font-weight: 700;
                font-size: 13px;
                cursor: pointer;
                transition: background 0.2s;
              }
              .print-btn:hover { background: #b91c1c; }
              .close-btn {
                background: #3f3f46;
                color: white;
                border: none;
                padding: 9px 14px;
                border-radius: 8px;
                font-weight: 600;
                font-size: 13px;
                cursor: pointer;
                margin-left: 8px;
              }
              .close-btn:hover { background: #52525b; }
              .sheet-wrapper {
                max-width: 210mm;
                width: 100%;
                background: white;
                margin: 20px auto;
                box-shadow: 0 4px 20px rgba(0,0,0,0.08);
                border-radius: 4px;
                box-sizing: border-box;
              }
            </style>
          </head>
          <body>
            <div class="print-toolbar">
              <span style="font-weight: 800; font-size: 14px;">🖨️ Pratinjau Dokumen: ${cleanTitle}</span>
              <div>
                <button class="print-btn" onclick="window.print()">🖨️ Cetak / Print Sekarang</button>
                <button class="close-btn" onclick="window.close()">Tutup Window</button>
              </div>
            </div>
            <div class="sheet-wrapper">
              ${element.outerHTML}
            </div>
            <script>
              window.addEventListener('load', () => {
                setTimeout(() => {
                  try {
                    window.print();
                  } catch(e) {}
                }, 400);
              });
            </script>
          </body>
        </html>
      `;
      printWindow.document.open();
      printWindow.document.write(printHtml);
      printWindow.document.close();
      showPdfToast('Membuka jendela cetak...');
      return;
    }
  } catch (err) {
    console.warn('Popup blocked or error:', err);
  }

  // If opening popup window was blocked, seamlessly download the PDF!
  showPdfToast('Mengunduh dokumen PDF...');
  await downloadElementAsPdf(elementId, fallbackFileName);
}

