import { AnalysisSession } from "@shared/schema";

export async function exportToCSV(sessions: AnalysisSession[]): Promise<void> {
  const csvContent = generateCSVContent(sessions);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const filename = `canopy_analysis_${new Date().toISOString().split('T')[0]}.csv`;
  
  downloadFile(blob, filename);
}

export async function exportSessionToCSV(session: AnalysisSession): Promise<void> {
  const csvContent = generateCSVContent([session]);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const filename = `canopy_analysis_${session.plotName}_${new Date().toISOString().split('T')[0]}.csv`;
  
  downloadFile(blob, filename);
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

function generateCSVContent(sessions: AnalysisSession[]): string {
  const headers = [
    'ID',
    'Plot Name',
    'Latitude',
    'Longitude',
    'Timestamp',
    'Analysis Method',
    'Zenith Angle (°)',
    'Canopy Cover (%)',
    'Light Transmission (%)',
    'Leaf Area Index',
    'Pixels Analyzed',
    'Processing Time (ms)',
    'Notes'
  ];
  
  const rows = sessions.map(session => [
    session.id,
    `"${session.plotName}"`,
    session.latitude || '',
    session.longitude || '',
    session.timestamp.toISOString(),
    `"${session.analysisMethod}"`,
    session.zenithAngle,
    session.canopyCover.toFixed(2),
    session.lightTransmission.toFixed(2),
    session.leafAreaIndex?.toFixed(2) || '',
    session.pixelsAnalyzed,
    session.processingTime?.toFixed(0) || '',
    `"${session.notes || ''}"`
  ]);
  
  return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
}

function generateHTMLReport(sessions: AnalysisSession[]): string {
  const reportDate = new Date().toLocaleDateString();
  const totalSessions = sessions.length;
  const avgCanopyCover = sessions.reduce((sum, s) => sum + s.canopyCover, 0) / totalSessions;
  const avgLightTransmission = sessions.reduce((sum, s) => sum + s.lightTransmission, 0) / totalSessions;
  
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
                        <td>${session.timestamp.toLocaleString()}</td>
                        <td>${session.latitude && session.longitude ? 
                            `${session.latitude.toFixed(6)}, ${session.longitude.toFixed(6)}` : 
                            'N/A'}</td>
                        <td>${session.analysisMethod}</td>
                        <td>${session.canopyCover.toFixed(2)}</td>
                        <td>${session.lightTransmission.toFixed(2)}</td>
                        <td>${session.leafAreaIndex?.toFixed(2) || 'N/A'}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        
        <div style="margin-top: 30px; font-size: 12px; color: #666;">
            <p><strong>Note:</strong> This report was generated by EcoCanopy - Gap Light Analysis Mobile Application.</p>
            <p>Analysis methods: GLAMA (Gap Light Analysis Mobile Application), Canopeo (Green canopy cover analysis), Custom (User-defined threshold).</p>
        </div>
    </body>
    </html>
  `;
}

function downloadFile(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

export async function shareResults(session: AnalysisSession): Promise<void> {
  const shareData = {
    title: `Canopy Analysis - ${session.plotName}`,
    text: `Canopy Cover: ${session.canopyCover.toFixed(1)}%, Light Transmission: ${session.lightTransmission.toFixed(1)}%`,
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
