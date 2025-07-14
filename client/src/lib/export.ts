import { AnalysisSession } from "@shared/schema";

// Lazy-loaded SheetJS instance (typed as any to avoid needing @types/xlsx)
type XLSXType = any;

export async function exportToCSV(sessions: AnalysisSession[]): Promise<void> {
  const csvContent = generateCSVContent(sessions);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const filename = `canopy_analysis_${new Date().toISOString().split('T')[0]}.csv`;
  
  await shareOrDownload(blob, filename);
}

export async function exportSessionToCSV(session: AnalysisSession): Promise<void> {
  const csvContent = generateCSVContent([session]);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const filename = `canopy_analysis_${session.plotName}_${new Date().toISOString().split('T')[0]}.csv`;
  
  await shareOrDownload(blob, filename);
}

export async function exportToPDF(sessions: AnalysisSession[]): Promise<void> {
  // For a full implementation, you'd use a library like jsPDF
  // For now, we'll create a basic HTML report and print it
  const reportContent = generateHTMLReport(sessions);
  const printWindow = window.open('', '_blank');
  
  if (printWindow) {
    printWindow.document.write(reportContent);
    printWindow.document.close();
    printWindow.print();
  }
}

// NEW: Export to Excel workbook with each tool type on its own worksheet
export async function exportToExcel(sessions: AnalysisSession[]): Promise<void> {
  // @ts-ignore – dynamic import returns the full XLSX namespace
  const XLSX: XLSXType = await import(/* webpackChunkName: "xlsx" */ "xlsx");

  // Group sessions by toolType (e.g., canopy, daubenmire, horizontal_vegetation)
  const groups: Record<string, AnalysisSession[]> = {};
  sessions.forEach((s) => {
    const key = s.toolType || 'unknown';
    if (!groups[key]) groups[key] = [];
    groups[key].push(s);
  });

  const wb = XLSX.utils.book_new();

  Object.entries(groups).forEach(([toolType, list]) => {
    const headers = [
      'Measurement_ID',
      'Plot Name',
      'Site Name',
      'Latitude',
      'Longitude',
      'Timestamp',
      'Analysis Method',
      'Zenith Angle (°)',
      'Canopy Cover (%)',
      'Light Transmission (%)',
      'Leaf Area Index',
      'Total Coverage (%)',
      'Species Diversity',
      'Bare Ground (%)',
      'Litter (%)',
      'Rock (%)',
      'Shannon Index',
      'Evenness Index',
      'Dominant Species',
      'Notes',
    ];

    const rows = list.map((session) => {
      const dominantSpeciesStr = Array.isArray(session.dominantSpecies)
        ? session.dominantSpecies.join('; ')
        : session.dominantSpecies || '';

      return [
        session.id,
        session.plotName,
        session.siteName || '',
        session.latitude || '',
        session.longitude || '',
        (session.timestamp instanceof Date ? session.timestamp : new Date(session.timestamp)).toISOString(),
        session.analysisMethod,
        session.zenithAngle || 90,
        session.canopyCover?.toFixed(2) || '',
        session.lightTransmission?.toFixed(2) || '',
        session.leafAreaIndex?.toFixed(2) || '',
        session.totalCoverage?.toFixed(2) || '',
        session.speciesDiversity || '',
        session.bareGroundPercentage?.toFixed(2) || '',
        session.litterPercentage?.toFixed(2) || '',
        session.rockPercentage?.toFixed(2) || '',
        session.shannonIndex?.toFixed(3) || '',
        session.evennessIndex?.toFixed(3) || '',
        dominantSpeciesStr,
        session.notes || '',
      ];
    });

    const sheetData = [headers, ...rows];
    const ws = XLSX.utils.aoa_to_sheet(sheetData);
    XLSX.utils.book_append_sheet(wb, ws, toolType);
  });

  const wbBlob = workbookToBlob(XLSX, wb);
  const filename = `eco_measurements_${new Date().toISOString().slice(0, 10)}.xlsx`;
  await shareOrDownload(wbBlob, filename);
}

// @ts-ignore – use any for WorkBook type
function workbookToBlob(XLSX: XLSXType, wb: any): Blob {
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

function generateCSVContent(sessions: AnalysisSession[]): string {
  const headers = [
    'Measurement_ID',
    'Plot Name',
    'Site Name',
    'Tool Type',
    'Latitude',
    'Longitude',
    'Timestamp',
    'Analysis Method',
    'Zenith Angle (°)',
    'Canopy Cover (%)',
    'Light Transmission (%)',
    'Leaf Area Index',
    'Total Coverage (%)',
    'Species Diversity',
    'Bare Ground (%)',
    'Litter (%)',
    'Rock (%)',
    'Shannon Index',
    'Evenness Index',
    'Dominant Species',
    'Notes'
  ];
  
  const rows = sessions.map(session => {
    const dominantSpeciesStr = Array.isArray(session.dominantSpecies) ? 
      session.dominantSpecies.join('; ') : (session.dominantSpecies || '');
    
    return [
      session.id,
      `"${session.plotName}"`,
      `"${session.siteName || ''}"`,
      `"${session.toolType || 'canopy'}"`,
      session.latitude || '',
      session.longitude || '',
      (session.timestamp instanceof Date ? session.timestamp : new Date(session.timestamp)).toISOString(),
      `"${session.analysisMethod}"`,
      session.zenithAngle || 90,
      session.canopyCover?.toFixed(2) || '',
      session.lightTransmission?.toFixed(2) || '',
      session.leafAreaIndex?.toFixed(2) || '',
      session.totalCoverage?.toFixed(2) || '',
      session.speciesDiversity || '',
      session.bareGroundPercentage?.toFixed(2) || '',
      session.litterPercentage?.toFixed(2) || '',
      session.rockPercentage?.toFixed(2) || '',
      session.shannonIndex?.toFixed(3) || '',
      session.evennessIndex?.toFixed(3) || '',
      `"${dominantSpeciesStr}"`,
      `"${session.notes || ''}"`
    ];
  });
  
  return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
}

function generateHTMLReport(sessions: AnalysisSession[]): string {
  const reportDate = new Date().toLocaleDateString();
  const totalSessions = sessions.length;
  const avgCanopyCover = sessions.reduce((sum, s) => sum + (s.canopyCover || 0), 0) / totalSessions;
  const avgLightTransmission = sessions.reduce((sum, s) => sum + (s.lightTransmission || 0), 0) / totalSessions;
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Canopy Analysis Report</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .summary { background: #f5f5f5; padding: 20px; margin-bottom: 30px; }
            .data-table { width: 100%; border-collapse: collapse; }
            .data-table th, .data-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            .data-table th { background-color: #f2f2f2; }
            .stats { display: flex; justify-content: space-around; margin: 20px 0; }
            .stat-box { text-align: center; padding: 10px; background: #e8f5e8; border-radius: 5px; }
            @media print { body { margin: 0; } }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>EcoCanopy Analysis Report</h1>
            <p>Generated on ${reportDate}</p>
        </div>
        
        <div class="summary">
            <h2>Summary Statistics</h2>
            <div class="stats">
                <div class="stat-box">
                    <h3>${totalSessions}</h3>
                    <p>Total Sessions</p>
                </div>
                <div class="stat-box">
                    <h3>${avgCanopyCover.toFixed(1)}%</h3>
                    <p>Average Canopy Cover</p>
                </div>
                <div class="stat-box">
                    <h3>${avgLightTransmission.toFixed(1)}%</h3>
                    <p>Average Light Transmission</p>
                </div>
            </div>
        </div>
        
        <h2>Detailed Results</h2>
        <table class="data-table">
            <thead>
                <tr>
                    <th>Plot Name</th>
                    <th>Date/Time</th>
                    <th>Location</th>
                    <th>Method</th>
                    <th>Canopy Cover (%)</th>
                    <th>Light Transmission (%)</th>
                    <th>LAI</th>
                </tr>
            </thead>
            <tbody>
                ${sessions.map(session => `
                    <tr>
                        <td>${session.plotName}</td>
                        <td>${new Date(session.timestamp).toLocaleString()}</td>
                        <td>${session.latitude && session.longitude ? 
                            `${session.latitude.toFixed(6)}, ${session.longitude.toFixed(6)}` : 
                            'N/A'}</td>
                        <td>${session.analysisMethod}</td>
                        <td>${session.canopyCover?.toFixed(2) || 'N/A'}</td>
                        <td>${session.lightTransmission?.toFixed(2) || 'N/A'}</td>
                        <td>${session.leafAreaIndex?.toFixed(2) || 'N/A'}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        
        <div style="margin-top: 30px; font-size: 12px; color: #666;">
            <p><strong>Note:</strong> This report was generated by EcoCanopy - Gap Light Analysis Mobile Application.</p>
            <p>Analysis methods: Standard (Proprietary canopy analysis), Advanced (Proprietary vegetation analysis), Custom (User-defined threshold).</p>
        </div>
    </body>
    </html>
  `;
}

function downloadFile(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob);
  const isIOS = /iP(ad|hone|od)/.test(navigator.userAgent);

  if (isIOS) {
    // iOS Safari blocks programmatic downloads; trigger a new tab instead
    const reader = new FileReader();
    reader.onloadend = () => {
      const a = document.createElement('a');
      a.href = reader.result as string;
      a.target = '_blank';
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    };
    reader.readAsDataURL(blob);
  } else {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
    link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
  }
}

export async function shareResults(session: AnalysisSession): Promise<void> {
  const shareData = {
    title: `Analysis - ${session.plotName}`,
    text: `Canopy Cover: ${session.canopyCover?.toFixed(1) || 'N/A'}%, Light Transmission: ${session.lightTransmission?.toFixed(1) || 'N/A'}%`,
    url: window.location.href,
  };
  
  if (navigator.share) {
    try {
      await navigator.share(shareData);
    } catch (error) {
      // Fallback to clipboard
      await copyToClipboard(shareData.text);
    }
  } else {
    await copyToClipboard(shareData.text);
  }
}

async function copyToClipboard(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
    alert('Results copied to clipboard!');
  } catch (error) {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    alert('Results copied to clipboard!');
  }
}

async function shareOrDownload(blob: Blob, filename: string): Promise<void> {
  // Mobile-friendly: use Web Share API if supported with files
  // Safari iOS 15+ / Chrome Android support sharing files
  // Fallback to anchor download
  const file = new File([blob], filename, { type: blob.type });
  // @ts-ignore
  if ((navigator as any).canShare && (navigator as any).canShare({ files: [file] })) {
    try {
      // @ts-ignore
      await navigator.share({ files: [file], title: filename, text: 'Analysis results CSV' });
      return;
    } catch (e) {
      // If user cancels share, fall back
    }
  }
  downloadFile(blob, filename);
}
