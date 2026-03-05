import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Checkbox } from "./ui/checkbox";
import { FileText, Download, Eye, Calendar } from "lucide-react";
import { Badge } from "./ui/badge";

interface ComplianceReportProps {
  onPreviewReport?: () => void;
}

const reportTemplates = [
  { id: "executive", name: "Executive Summary", description: "High-level compliance overview" },
  { id: "detailed", name: "Detailed Audit Report", description: "Complete control-by-control analysis" },
  { id: "domain", name: "Domain-Specific Report", description: "Focus on specific control domains" },
  { id: "gap", name: "Gap Analysis Report", description: "Identifies compliance gaps" },
];

const recentReports = [
  {
    id: "1",
    name: "Q3 2025 Executive Summary",
    type: "Executive Summary",
    generatedDate: "2025-10-15",
    status: "completed",
  },
  {
    id: "2",
    name: "Access Control Audit",
    type: "Detailed Audit Report",
    generatedDate: "2025-10-10",
    status: "completed",
  },
  {
    id: "3",
    name: "Data Protection Gap Analysis",
    type: "Gap Analysis Report",
    generatedDate: "2025-10-05",
    status: "completed",
  },
];

export function ComplianceReport({ onPreviewReport }: ComplianceReportProps) {
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);

  const domains = [
    "Access Control",
    "Data Protection",
    "Network Security",
    "Incident Response",
    "Risk Management",
    "Physical Security",
  ];

  const toggleDomain = (domain: string) => {
    setSelectedDomains(prev =>
      prev.includes(domain)
        ? prev.filter(d => d !== domain)
        : [...prev, domain]
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2>Compliance Report Generator</h2>
        <p className="text-muted-foreground">
          Generate comprehensive compliance reports for audit and management
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Report Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Generate New Report</CardTitle>
            <CardDescription>
              Configure and generate compliance reports
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Report Template</Label>
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a template" />
                </SelectTrigger>
                <SelectContent>
                  {reportTemplates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedTemplate && (
                <p className="text-sm text-muted-foreground">
                  {reportTemplates.find(t => t.id === selectedTemplate)?.description}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Include Domains</Label>
              <div className="space-y-2 border rounded-lg p-4">
                {domains.map((domain) => (
                  <div key={domain} className="flex items-center space-x-2">
                    <Checkbox
                      id={domain}
                      checked={selectedDomains.includes(domain)}
                      onCheckedChange={() => toggleDomain(domain)}
                    />
                    <label
                      htmlFor={domain}
                      className="text-sm cursor-pointer flex-1"
                    >
                      {domain}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Report Format</Label>
              <Select defaultValue="pdf">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF Document</SelectItem>
                  <SelectItem value="docx">Word Document</SelectItem>
                  <SelectItem value="xlsx">Excel Spreadsheet</SelectItem>
                  <SelectItem value="html">HTML Report</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button className="flex-1" onClick={onPreviewReport}>
                <FileText className="w-4 h-4 mr-2" />
                Generate Report
              </Button>
              <Button variant="outline" onClick={onPreviewReport}>
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Report Templates */}
        <Card>
          <CardHeader>
            <CardTitle>Available Templates</CardTitle>
            <CardDescription>
              Pre-configured report templates
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {reportTemplates.map((template) => (
              <div
                key={template.id}
                className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => setSelectedTemplate(template.id)}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4>{template.name}</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      {template.description}
                    </p>
                  </div>
                  <FileText className="w-5 h-5 text-muted-foreground" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Recent Reports */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Reports</CardTitle>
          <CardDescription>
            Previously generated compliance reports
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentReports.map((report) => (
              <div
                key={report.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4>{report.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-sm text-muted-foreground">
                        {report.type}
                      </p>
                      <span className="text-muted-foreground">•</span>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        {report.generatedDate}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    {report.status}
                  </Badge>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
