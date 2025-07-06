import { google } from 'googleapis';
import { GoogleAuth } from 'google-auth-library';
import type { AnalysisSession } from '../shared/schema.js';

interface GoogleSheetsConfig {
  spreadsheetId: string;
  worksheetName: string;
  serviceAccountEmail: string;
  privateKey: string;
}

class GoogleSheetsService {
  private sheets: any;
  private auth: GoogleAuth;

  constructor(config: GoogleSheetsConfig) {
    this.auth = new GoogleAuth({
      credentials: {
        client_email: config.serviceAccountEmail,
        private_key: config.privateKey.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    this.sheets = google.sheets({ version: 'v4', auth: this.auth });
  }

  async appendToDatasheet(spreadsheetId: string, sessions: AnalysisSession[]): Promise<void> {
    try {
      // Get existing headers to determine column structure
      const headerResponse = await this.sheets.spreadsheets.values.get({
        spreadsheetId,
        range: 'Sheet1!1:1',
      });

      const existingHeaders = headerResponse.data.values?.[0] || [];
      
      // Define comprehensive headers for all measurement types
      const standardHeaders = [
        'Date',
        'Time',
        'Site Name',
        'Tool Type',
        'GPS Latitude',
        'GPS Longitude',
        'GPS Accuracy',
        // Canopy analysis fields
        'Canopy Cover %',
        'Light Transmission %',
        'Leaf Area Index',
        'Pixels Analyzed',
        'Analysis Method',
        // Horizontal vegetation fields
        'Avg Obstruction Height (cm)',
        'Vegetation Density Index',
        'Vegetation Profile',
        'Uniformity Index',
        'North Reading (cm)',
        'East Reading (cm)',
        'South Reading (cm)',
        'West Reading (cm)',
        // Daubenmire fields
        'Total Coverage %',
        'Species Diversity',
        'Dominant Species',
        'Bare Ground %',
        'Litter %',
        'Rock %',
        'Shannon Index',
        'Evenness Index',
        'Processing Time (s)',
        'Notes'
      ];

      // Add headers if sheet is empty
      if (existingHeaders.length === 0) {
        await this.sheets.spreadsheets.values.update({
          spreadsheetId,
          range: 'Sheet1!A1',
          valueInputOption: 'RAW',
          resource: {
            values: [standardHeaders],
          },
        });
      }

      // Convert sessions to rows
      const rows = sessions.map(session => this.sessionToRow(session, standardHeaders));

      if (rows.length > 0) {
        // Append new data
        await this.sheets.spreadsheets.values.append({
          spreadsheetId,
          range: 'Sheet1!A:A',
          valueInputOption: 'RAW',
          insertDataOption: 'INSERT_ROWS',
          resource: {
            values: rows,
          },
        });
      }
    } catch (error) {
      console.error('Error appending to Google Sheets:', error);
      throw new Error(`Failed to append data to Google Sheets: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async createDatasheet(title: string): Promise<string> {
    try {
      const response = await this.sheets.spreadsheets.create({
        resource: {
          properties: {
            title: title,
          },
          sheets: [{
            properties: {
              title: 'Ecological Measurements',
            },
          }],
        },
      });

      const spreadsheetId = response.data.spreadsheetId;
      
      // Initialize with headers
      await this.appendToDatasheet(spreadsheetId, []);
      
      return spreadsheetId;
    } catch (error) {
      console.error('Error creating Google Sheets:', error);
      throw new Error(`Failed to create Google Sheets: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async exportSessionsToSheet(spreadsheetId: string, sessions: AnalysisSession[]): Promise<void> {
    try {
      await this.appendToDatasheet(spreadsheetId, sessions);
    } catch (error) {
      console.error('Error exporting to Google Sheets:', error);
      throw new Error(`Failed to export to Google Sheets: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private sessionToRow(session: AnalysisSession, headers: string[]): string[] {
    const row: string[] = new Array(headers.length).fill('');
    
    // Basic session info
    const date = new Date(session.createdAt);
    row[headers.indexOf('Date')] = date.toLocaleDateString();
    row[headers.indexOf('Time')] = date.toLocaleTimeString();
    row[headers.indexOf('Site Name')] = session.siteName || '';
    row[headers.indexOf('Tool Type')] = session.toolType || '';
    
    // GPS data
    if (session.gpsCoordinates) {
      row[headers.indexOf('GPS Latitude')] = session.gpsCoordinates.latitude?.toString() || '';
      row[headers.indexOf('GPS Longitude')] = session.gpsCoordinates.longitude?.toString() || '';
      row[headers.indexOf('GPS Accuracy')] = session.gpsCoordinates.accuracy?.toString() || '';
    }

    // Tool-specific results
    if (session.results) {
      const results = session.results as any;
      
      // Canopy analysis results
      if (session.toolType === 'canopy') {
        row[headers.indexOf('Canopy Cover %')] = results.canopyCover?.toString() || '';
        row[headers.indexOf('Light Transmission %')] = results.lightTransmission?.toString() || '';
        row[headers.indexOf('Leaf Area Index')] = results.leafAreaIndex?.toString() || '';
        row[headers.indexOf('Pixels Analyzed')] = results.pixelsAnalyzed?.toString() || '';
        row[headers.indexOf('Analysis Method')] = results.method || '';
      }
      
      // Horizontal vegetation results
      if (session.toolType === 'horizontal_vegetation') {
        row[headers.indexOf('Avg Obstruction Height (cm)')] = results.averageObstructionHeight?.toString() || '';
        row[headers.indexOf('Vegetation Density Index')] = results.vegetationDensityIndex?.toString() || '';
        row[headers.indexOf('Vegetation Profile')] = results.vegetationProfile || '';
        row[headers.indexOf('Uniformity Index')] = results.uniformityIndex?.toString() || '';
        
        // Individual direction measurements
        if (results.measurements) {
          const measurements = results.measurements;
          const north = measurements.find((m: any) => m.direction === 'North');
          const east = measurements.find((m: any) => m.direction === 'East');
          const south = measurements.find((m: any) => m.direction === 'South');
          const west = measurements.find((m: any) => m.direction === 'West');
          
          row[headers.indexOf('North Reading (cm)')] = north?.obstructionHeight?.toString() || '';
          row[headers.indexOf('East Reading (cm)')] = east?.obstructionHeight?.toString() || '';
          row[headers.indexOf('South Reading (cm)')] = south?.obstructionHeight?.toString() || '';
          row[headers.indexOf('West Reading (cm)')] = west?.obstructionHeight?.toString() || '';
        }
      }
      
      // Daubenmire results
      if (session.toolType === 'daubenmire') {
        row[headers.indexOf('Total Coverage %')] = results.totalCoverage?.toString() || '';
        row[headers.indexOf('Species Diversity')] = results.speciesDiversity?.toString() || '';
        row[headers.indexOf('Dominant Species')] = Array.isArray(results.dominantSpecies) ? results.dominantSpecies.join(', ') : results.dominantSpecies || '';
        row[headers.indexOf('Bare Ground %')] = results.bareGroundPercentage?.toString() || '';
        row[headers.indexOf('Litter %')] = results.litterPercentage?.toString() || '';
        row[headers.indexOf('Rock %')] = results.rockPercentage?.toString() || '';
        row[headers.indexOf('Shannon Index')] = results.shannonIndex?.toString() || '';
        row[headers.indexOf('Evenness Index')] = results.evennessIndex?.toString() || '';
      }
      
      // Common fields
      row[headers.indexOf('Processing Time (s)')] = results.processingTime?.toString() || '';
    }
    
    row[headers.indexOf('Notes')] = session.notes || '';
    
    return row;
  }

  async shareSheet(spreadsheetId: string, email: string, role: 'reader' | 'writer' | 'owner' = 'writer'): Promise<void> {
    try {
      const drive = google.drive({ version: 'v3', auth: this.auth });
      
      await drive.permissions.create({
        fileId: spreadsheetId,
        resource: {
          role: role,
          type: 'user',
          emailAddress: email,
        },
      });
    } catch (error) {
      console.error('Error sharing Google Sheet:', error);
      throw new Error(`Failed to share Google Sheet: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getSheetUrl(spreadsheetId: string): Promise<string> {
    return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
  }
}

export { GoogleSheetsService, type GoogleSheetsConfig };