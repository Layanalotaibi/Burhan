import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Upload, File, CheckCircle2, AlertCircle, Clock, Trash2, Eye, Loader2, CheckCircle, FolderCheck } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { toast } from "sonner@2.0.3";

interface Evidence {
  id: string;
  fileName: string;
  uploadDate: string;
  domain: string;
  controls: string[];
  status: "compliant" | "partial" | "non-compliant";
  fileSize: string;
}

const mockEvidence: Evidence[] = [
  {
    id: "1",
    fileName: "access-control-policy.pdf",
    uploadDate: "2025-10-15",
    domain: "Cybersecurity Defense",
    controls: ["DF-01", "DF-02"],
    status: "compliant",
    fileSize: "2.3 MB",
  },
  {
    id: "2",
    fileName: "encryption-certificates.zip",
    uploadDate: "2025-10-12",
    domain: "Cybersecurity Defense",
    controls: ["DF-03"],
    status: "partial",
    fileSize: "5.1 MB",
  },
  {
    id: "3",
    fileName: "incident-response-plan.docx",
    uploadDate: "2025-10-10",
    domain: "Cybersecurity Resilience",
    controls: ["RS-02", "RS-03"],
    status: "non-compliant",
    fileSize: "1.8 MB",
  },
  {
    id: "4",
    fileName: "network-topology.png",
    uploadDate: "2025-10-08",
    domain: "Cybersecurity Defense",
    controls: ["DF-02", "DF-05"],
    status: "compliant",
    fileSize: "3.2 MB",
  },
  {
    id: "5",
    fileName: "risk-assessment-2025.xlsx",
    uploadDate: "2025-10-05",
    domain: "Cybersecurity Governance",
    controls: ["GV-02"],
    status: "compliant",
    fileSize: "892 KB",
  },
  {
    id: "6",
    fileName: "security-awareness-training.pdf",
    uploadDate: "2025-10-03",
    domain: "Cybersecurity Governance",
    controls: ["GV-03"],
    status: "compliant",
    fileSize: "4.5 MB",
  },
  {
    id: "7",
    fileName: "backup-procedures.docx",
    uploadDate: "2025-10-01",
    domain: "Cybersecurity Resilience",
    controls: ["RS-01"],
    status: "compliant",
    fileSize: "1.2 MB",
  },
  {
    id: "8",
    fileName: "vendor-security-assessment.pdf",
    uploadDate: "2025-09-28",
    domain: "Third-Party & Cloud Computing",
    controls: ["TP-01", "TP-03"],
    status: "partial",
    fileSize: "2.8 MB",
  },
  {
    id: "9",
    fileName: "firewall-configuration.txt",
    uploadDate: "2025-09-25",
    domain: "Cybersecurity Defense",
    controls: ["DF-02"],
    status: "compliant",
    fileSize: "156 KB",
  },
  {
    id: "10",
    fileName: "business-continuity-plan.pdf",
    uploadDate: "2025-09-22",
    domain: "Cybersecurity Resilience",
    controls: ["RS-03", "RS-04"],
    status: "compliant",
    fileSize: "3.7 MB",
  },
  {
    id: "11",
    fileName: "ics-security-procedures.docx",
    uploadDate: "2025-09-20",
    domain: "Industrial Control Systems (ICS)",
    controls: ["IC-01", "IC-02"],
    status: "compliant",
    fileSize: "2.1 MB",
  },
  {
    id: "12",
    fileName: "cloud-compliance-report.xlsx",
    uploadDate: "2025-09-18",
    domain: "Third-Party & Cloud Computing",
    controls: ["TP-02"],
    status: "partial",
    fileSize: "1.5 MB",
  },
  {
    id: "13",
    fileName: "endpoint-protection-logs.zip",
    uploadDate: "2025-09-15",
    domain: "Cybersecurity Defense",
    controls: ["DF-04", "DF-05"],
    status: "compliant",
    fileSize: "8.4 MB",
  },
  {
    id: "14",
    fileName: "roles-responsibilities-matrix.xlsx",
    uploadDate: "2025-09-12",
    domain: "Cybersecurity Governance",
    controls: ["GV-04"],
    status: "compliant",
    fileSize: "643 KB",
  },
  {
    id: "15",
    fileName: "system-hardening-checklist.pdf",
    uploadDate: "2025-09-10",
    domain: "Industrial Control Systems (ICS)",
    controls: ["IC-02"],
    status: "non-compliant",
    fileSize: "987 KB",
  },
];

// Define control codes by domain
const controlsByDomain: Record<string, { code: string; label: string }[]> = {
  "Cybersecurity Governance": [
    { code: "GV-01", label: "Policy Management" },
    { code: "GV-02", label: "Risk Assessment" },
    { code: "GV-03", label: "Awareness and Training" },
    { code: "GV-04", label: "Roles and Responsibilities" },
  ],
  "Cybersecurity Defense": [
    { code: "DF-01", label: "Access Control" },
    { code: "DF-02", label: "Network Security" },
    { code: "DF-03", label: "Data Encryption" },
    { code: "DF-04", label: "Endpoint Protection" },
    { code: "DF-05", label: "Logging and Monitoring" },
  ],
  "Cybersecurity Resilience": [
    { code: "RS-01", label: "Backup Management" },
    { code: "RS-02", label: "Incident Response" },
    { code: "RS-03", label: "Business Continuity" },
    { code: "RS-04", label: "Recovery Testing" },
  ],
  "Third-Party & Cloud Computing": [
    { code: "TP-01", label: "Vendor Security Assessment" },
    { code: "TP-02", label: "Cloud Service Compliance" },
    { code: "TP-03", label: "Contractual Controls" },
  ],
  "Industrial Control Systems (ICS)": [
    { code: "IC-01", label: "Physical Security" },
    { code: "IC-02", label: "System Hardening" },
    { code: "IC-03", label: "Continuous Monitoring" },
  ],
};

const domains = [
  "Cybersecurity Governance",
  "Cybersecurity Defense",
  "Cybersecurity Resilience",
  "Third-Party & Cloud Computing",
  "Industrial Control Systems (ICS)",
];

export function EvidenceManagement() {
  const [evidence, setEvidence] = useState<Evidence[]>(mockEvidence);
  const [selectedDomain, setSelectedDomain] = useState<string>("all");
  const [showAnalysisResults, setShowAnalysisResults] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const filteredEvidence = selectedDomain === "all"
    ? evidence
    : evidence.filter(e => e.domain === selectedDomain);

  const handleFileUpload = () => {
    // Show analyzing modal
    setIsAnalyzing(true);
    
    // Simulate analysis process (2 seconds)
    setTimeout(() => {
      setIsAnalyzing(false);
      setShowAnalysisResults(true);
      // Show success toast
      toast.success("Evidence analyzed. Mapped to 2 domains and 4 controls.");
    }, 2000);
  };

  const getStatusIcon = (status: Evidence["status"]) => {
    switch (status) {
      case "compliant":
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case "partial":
        return <Clock className="w-4 h-4 text-amber-600" />;
      case "non-compliant":
        return <AlertCircle className="w-4 h-4 text-red-600" />;
    }
  };

  const getStatusBadge = (status: Evidence["status"]) => {
    switch (status) {
      case "compliant":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Compliant</Badge>;
      case "partial":
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Partial</Badge>;
      case "non-compliant":
        return <Badge variant="destructive">Non-Compliant</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2>Evidence Management</h2>
          <p className="text-muted-foreground">
            Upload and manage compliance evidence files
          </p>
        </div>
      </div>

      {/* Analysis Results - Enhanced Design */}
      {showAnalysisResults && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Detected Domains Card */}
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 shadow-lg shadow-blue-100/50 transition-all hover:shadow-xl hover:shadow-blue-200/50">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-md">
                  <FolderCheck className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-blue-900">Detected Domains</CardTitle>
                  <CardDescription className="text-blue-700/70 mt-1">
                    Auto-detected from your evidence
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-white/80 backdrop-blur-sm rounded-lg border border-blue-100 shadow-sm">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-blue-900">Governance</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-white/80 backdrop-blur-sm rounded-lg border border-blue-100 shadow-sm">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-blue-900">Defense</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Mapped Controls Card */}
          <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200 shadow-lg shadow-emerald-100/50 transition-all hover:shadow-xl hover:shadow-emerald-200/50">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center shadow-md">
                  <CheckCircle2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-emerald-900">Mapped Controls</CardTitle>
                  <CardDescription className="text-emerald-700/70 mt-1">
                    4 ECC controls identified
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-2.5">
                <div className="flex items-start gap-3 p-3 bg-white/80 backdrop-blur-sm rounded-lg border border-emerald-100 shadow-sm">
                  <div className="w-6 h-6 bg-emerald-600 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-emerald-900">GV-01 — Policy Management</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-white/80 backdrop-blur-sm rounded-lg border border-emerald-100 shadow-sm">
                  <div className="w-6 h-6 bg-emerald-600 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-emerald-900">GV-03 — Awareness and Training</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-white/80 backdrop-blur-sm rounded-lg border border-emerald-100 shadow-sm">
                  <div className="w-6 h-6 bg-emerald-600 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-emerald-900">DF-01 — Access Control</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-white/80 backdrop-blur-sm rounded-lg border border-emerald-100 shadow-sm">
                  <div className="w-6 h-6 bg-emerald-600 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-emerald-900">DF-03 — Data Encryption</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Evidence List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Uploaded Evidence</CardTitle>
              <CardDescription>
                {filteredEvidence.length} files uploaded
              </CardDescription>
            </div>
            <Select value={selectedDomain} onValueChange={setSelectedDomain}>
              <SelectTrigger className="w-[280px]">
                <SelectValue placeholder="Filter by domain" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Domains</SelectItem>
                {domains.map((domain) => (
                  <SelectItem key={domain} value={domain}>
                    {domain}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>File Name</TableHead>
                <TableHead>Domain</TableHead>
                <TableHead>Mapped Controls</TableHead>
                <TableHead>Upload Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEvidence.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <File className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p>{item.fileName}</p>
                        <p className="text-xs text-muted-foreground">{item.fileSize}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{item.domain}</TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {item.controls.map((control) => (
                        <Badge key={control} variant="outline" className="text-xs">
                          {control}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>{item.uploadDate}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(item.status)}
                      {getStatusBadge(item.status)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>{item.fileName}</DialogTitle>
                            <DialogDescription>
                              Evidence details and control mapping
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label>Domain</Label>
                              <p>{item.domain}</p>
                            </div>
                            <div>
                              <Label>Mapped Controls</Label>
                              <div className="flex gap-2 mt-1">
                                {item.controls.map((control) => (
                                  <Badge key={control}>{control}</Badge>
                                ))}
                              </div>
                            </div>
                            <div>
                              <Label>Status</Label>
                              <div className="mt-1">{getStatusBadge(item.status)}</div>
                            </div>
                            <div>
                              <Label>Upload Date</Label>
                              <p>{item.uploadDate}</p>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Analyzing Overlay Modal */}
      {isAnalyzing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Dimmed backdrop - 30% opacity */}
          <div className="absolute inset-0 bg-black/30" />
          
          {/* Modal content */}
          <div className="relative bg-white rounded-lg p-8 shadow-lg">
            <div className="flex flex-col items-center justify-center">
              <Loader2 className="w-12 h-12 animate-spin mb-4 text-primary" />
              <p className="text-lg">Analyzing evidence…</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}