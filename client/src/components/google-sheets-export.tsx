import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  FileSpreadsheet, 
  Plus, 
  Share2, 
  ExternalLink,
  Upload,
  Info
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { AnalysisSession } from "@shared/schema";

interface GoogleSheetsExportProps {
  sessions?: AnalysisSession[];
  selectedSessionIds?: number[];
}

export default function GoogleSheetsExport({ sessions = [], selectedSessionIds = [] }: GoogleSheetsExportProps) {
  const [spreadsheetId, setSpreadsheetId] = useState('');
  const [serviceAccountEmail, setServiceAccountEmail] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [sheetTitle, setSheetTitle] = useState('Ecological Field Data');
  const [shareEmail, setShareEmail] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [lastSheetUrl, setLastSheetUrl] = useState('');
  
  const { toast } = useToast();

  const validateCredentials = () => {
    if (!serviceAccountEmail || !privateKey) {
      toast({
        title: "Missing Credentials",
        description: "Please provide Google Service Account credentials.",
        variant: "destructive"
      });
      return false;
    }
    return true;
  };

  const handleExportToExisting = async () => {
    if (!validateCredentials()) return;
    
    if (!spreadsheetId.trim()) {
      toast({
        title: "Missing Spreadsheet ID",
        description: "Please provide the Google Sheets ID.",
        variant: "destructive"
      });
      return;
    }

    setIsExporting(true);
    
    try {
      const response = await apiRequest('/api/google-sheets/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spreadsheetId: spreadsheetId.trim(),
          sessionIds: selectedSessionIds.length > 0 ? selectedSessionIds : undefined,
          serviceAccountEmail: serviceAccountEmail.trim(),
          privateKey: privateKey.trim()
        })
      });

      if (response.success) {
        setLastSheetUrl(response.sheetUrl);
        toast({
          title: "Export Successful",
          description: `${response.sessionCount} sessions exported to Google Sheets`,
        });
      }
    } catch (error) {
      toast({
        title: "Export Failed",
        description: error instanceof Error ? error.message : "Failed to export to Google Sheets",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleCreateNewSheet = async () => {
    if (!validateCredentials()) return;
    
    if (!sheetTitle.trim()) {
      toast({
        title: "Missing Title",
        description: "Please provide a title for the new spreadsheet.",
        variant: "destructive"
      });
      return;
    }

    setIsCreating(true);
    
    try {
      const response = await apiRequest('/api/google-sheets/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: sheetTitle.trim(),
          serviceAccountEmail: serviceAccountEmail.trim(),
          privateKey: privateKey.trim()
        })
      });

      if (response.success) {
        setSpreadsheetId(response.spreadsheetId);
        setLastSheetUrl(response.sheetUrl);
        toast({
          title: "Spreadsheet Created",
          description: "New Google Sheets datasheet created successfully",
        });
      }
    } catch (error) {
      toast({
        title: "Creation Failed",
        description: error instanceof Error ? error.message : "Failed to create Google Sheets",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleShareSheet = async () => {
    if (!validateCredentials()) return;
    
    if (!spreadsheetId.trim()) {
      toast({
        title: "Missing Spreadsheet ID",
        description: "Please provide the Google Sheets ID.",
        variant: "destructive"
      });
      return;
    }

    if (!shareEmail.trim()) {
      toast({
        title: "Missing Email",
        description: "Please provide an email address to share with.",
        variant: "destructive"
      });
      return;
    }

    setIsSharing(true);
    
    try {
      const response = await apiRequest('/api/google-sheets/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spreadsheetId: spreadsheetId.trim(),
          email: shareEmail.trim(),
          role: 'writer',
          serviceAccountEmail: serviceAccountEmail.trim(),
          privateKey: privateKey.trim()
        })
      });

      if (response.success) {
        toast({
          title: "Sheet Shared",
          description: `Google Sheets shared with ${shareEmail}`,
        });
        setShareEmail('');
      }
    } catch (error) {
      toast({
        title: "Sharing Failed",
        description: error instanceof Error ? error.message : "Failed to share Google Sheets",
        variant: "destructive"
      });
    } finally {
      setIsSharing(false);
    }
  };

  const sessionsToExport = selectedSessionIds.length > 0 
    ? sessions.filter(s => selectedSessionIds.includes(s.id))
    : sessions;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <FileSpreadsheet className="w-5 h-5 mr-2" />
          Google Sheets Integration
        </CardTitle>
        <CardDescription>
          Export field data to Google Sheets for collaborative analysis and long-term storage
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Credentials Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-base font-medium">Google Service Account Credentials</Label>
            <Badge variant="secondary" className="text-xs">
              Required for API Access
            </Badge>
          </div>
          
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              You need a Google Service Account with Sheets API access. The credentials are used only for this export and are not stored.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="service-email">Service Account Email</Label>
              <Input
                id="service-email"
                type="email"
                value={serviceAccountEmail}
                onChange={(e) => setServiceAccountEmail(e.target.value)}
                placeholder="your-service-account@project.iam.gserviceaccount.com"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="private-key">Private Key</Label>
              <Textarea
                id="private-key"
                value={privateKey}
                onChange={(e) => setPrivateKey(e.target.value)}
                placeholder="-----BEGIN PRIVATE KEY-----&#10;...&#10;-----END PRIVATE KEY-----"
                rows={4}
                className="resize-none font-mono text-xs"
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Export Data Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-base font-medium">Export Data</Label>
            <Badge variant={sessionsToExport.length > 0 ? "default" : "secondary"}>
              {sessionsToExport.length} sessions
            </Badge>
          </div>

          {/* Create New Spreadsheet */}
          <Card className="bg-green-50 border-green-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center">
                <Plus className="w-4 h-4 mr-2" />
                Create New Datasheet
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="sheet-title">Spreadsheet Title</Label>
                <Input
                  id="sheet-title"
                  value={sheetTitle}
                  onChange={(e) => setSheetTitle(e.target.value)}
                  placeholder="My Ecological Field Data 2025"
                />
              </div>
              <Button
                onClick={handleCreateNewSheet}
                disabled={isCreating || !serviceAccountEmail || !privateKey}
                className="w-full"
              >
                {isCreating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                    Creating Spreadsheet...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Create New Spreadsheet
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Export to Existing Spreadsheet */}
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center">
                <Upload className="w-4 h-4 mr-2" />
                Export to Existing Spreadsheet
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="spreadsheet-id">Google Sheets ID</Label>
                <Input
                  id="spreadsheet-id"
                  value={spreadsheetId}
                  onChange={(e) => setSpreadsheetId(e.target.value)}
                  placeholder="1ABC...XYZ (from the spreadsheet URL)"
                />
                <p className="text-xs text-gray-600">
                  Found in the URL: docs.google.com/spreadsheets/d/<strong>SPREADSHEET_ID</strong>/edit
                </p>
              </div>
              <Button
                onClick={handleExportToExisting}
                disabled={isExporting || !serviceAccountEmail || !privateKey}
                className="w-full"
              >
                {isExporting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                    Exporting Data...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Export to Spreadsheet
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        <Separator />

        {/* Share Spreadsheet Section */}
        <div className="space-y-4">
          <Label className="text-base font-medium">Share Spreadsheet</Label>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <Input
                value={shareEmail}
                onChange={(e) => setShareEmail(e.target.value)}
                placeholder="colleague@university.edu"
                type="email"
              />
            </div>
            <Button
              onClick={handleShareSheet}
              disabled={isSharing || !spreadsheetId || !serviceAccountEmail || !privateKey}
              variant="outline"
              className="w-full"
            >
              {isSharing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent mr-2" />
                  Sharing...
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Open Spreadsheet Link */}
        {lastSheetUrl && (
          <div className="pt-4">
            <Button
              onClick={() => window.open(lastSheetUrl, '_blank')}
              variant="outline"
              className="w-full"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Open Google Sheets
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}