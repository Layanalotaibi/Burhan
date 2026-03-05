import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { CheckCircle2, AlertCircle, Clock, Search, File, Link2 } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion";

interface Control {
  id: string;
  code: string;
  title: string;
  domain: string;
  status: "compliant" | "partial" | "non-compliant" | "not-assessed";
  evidence: string[];
  lastAssessed?: string;
}

const mockControls: Control[] = [
  {
    id: "1",
    code: "AC-01",
    title: "Access Control Policy and Procedures",
    domain: "Access Control",
    status: "compliant",
    evidence: ["access-control-policy.pdf"],
    lastAssessed: "2025-10-15",
  },
  {
    id: "2",
    code: "AC-02",
    title: "Account Management",
    domain: "Access Control",
    status: "compliant",
    evidence: ["access-control-policy.pdf", "user-management-logs.xlsx"],
    lastAssessed: "2025-10-15",
  },
  {
    id: "3",
    code: "DP-12",
    title: "Cryptographic Key Management",
    domain: "Data Protection",
    status: "partial",
    evidence: ["encryption-certificates.zip"],
    lastAssessed: "2025-10-12",
  },
  {
    id: "4",
    code: "DP-13",
    title: "Data Encryption in Transit",
    domain: "Data Protection",
    status: "partial",
    evidence: ["encryption-certificates.zip"],
    lastAssessed: "2025-10-12",
  },
  {
    id: "5",
    code: "IR-01",
    title: "Incident Response Policy",
    domain: "Incident Response",
    status: "non-compliant",
    evidence: ["incident-response-plan.docx"],
    lastAssessed: "2025-10-10",
  },
  {
    id: "6",
    code: "IR-02",
    title: "Incident Response Training",
    domain: "Incident Response",
    status: "non-compliant",
    evidence: [],
    lastAssessed: "2025-10-10",
  },
  {
    id: "7",
    code: "NS-05",
    title: "Network Segmentation",
    domain: "Network Security",
    status: "compliant",
    evidence: ["network-topology.png"],
    lastAssessed: "2025-10-08",
  },
  {
    id: "8",
    code: "RM-01",
    title: "Risk Assessment Process",
    domain: "Risk Management",
    status: "compliant",
    evidence: ["risk-assessment-2025.xlsx"],
    lastAssessed: "2025-10-05",
  },
];

export function ControlMapping() {
  const [controls] = useState<Control[]>(mockControls);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDomain, setSelectedDomain] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  const filteredControls = controls.filter(control => {
    const matchesSearch = control.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         control.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDomain = selectedDomain === "all" || control.domain === selectedDomain;
    const matchesStatus = selectedStatus === "all" || control.status === selectedStatus;
    return matchesSearch && matchesDomain && matchesStatus;
  });

  const groupedControls = filteredControls.reduce((acc, control) => {
    if (!acc[control.domain]) {
      acc[control.domain] = [];
    }
    acc[control.domain].push(control);
    return acc;
  }, {} as Record<string, Control[]>);

  const getStatusIcon = (status: Control["status"]) => {
    switch (status) {
      case "compliant":
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case "partial":
        return <Clock className="w-4 h-4 text-amber-600" />;
      case "non-compliant":
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case "not-assessed":
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: Control["status"]) => {
    switch (status) {
      case "compliant":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Compliant</Badge>;
      case "partial":
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Partial</Badge>;
      case "non-compliant":
        return <Badge variant="destructive">Non-Compliant</Badge>;
      case "not-assessed":
        return <Badge variant="outline">Not Assessed</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2>Control Mapping View</h2>
        <p className="text-muted-foreground">
          Automated linkage between evidence and NCA-ECC controls
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Controls</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by code or title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedDomain} onValueChange={setSelectedDomain}>
              <SelectTrigger>
                <SelectValue placeholder="All Domains" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Domains</SelectItem>
                <SelectItem value="Access Control">Access Control</SelectItem>
                <SelectItem value="Data Protection">Data Protection</SelectItem>
                <SelectItem value="Network Security">Network Security</SelectItem>
                <SelectItem value="Incident Response">Incident Response</SelectItem>
                <SelectItem value="Risk Management">Risk Management</SelectItem>
                <SelectItem value="Physical Security">Physical Security</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="compliant">Compliant</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
                <SelectItem value="non-compliant">Non-Compliant</SelectItem>
                <SelectItem value="not-assessed">Not Assessed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Control Mapping */}
      <Card>
        <CardHeader>
          <CardTitle>Control Mapping</CardTitle>
          <CardDescription>
            {filteredControls.length} controls mapped to evidence
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" className="w-full">
            {Object.entries(groupedControls).map(([domain, domainControls]) => (
              <AccordionItem key={domain} value={domain}>
                <AccordionTrigger>
                  <div className="flex items-center justify-between w-full pr-4">
                    <span>{domain}</span>
                    <Badge variant="outline">{domainControls.length} controls</Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Control Code</TableHead>
                        <TableHead>Control Title</TableHead>
                        <TableHead>Mapped Evidence</TableHead>
                        <TableHead>Last Assessed</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {domainControls.map((control) => (
                        <TableRow key={control.id}>
                          <TableCell>
                            <Badge variant="outline">{control.code}</Badge>
                          </TableCell>
                          <TableCell>{control.title}</TableCell>
                          <TableCell>
                            {control.evidence.length > 0 ? (
                              <div className="space-y-1">
                                {control.evidence.map((evidence, idx) => (
                                  <div key={idx} className="flex items-center gap-2 text-sm">
                                    <Link2 className="w-3 h-3 text-muted-foreground" />
                                    <File className="w-3 h-3 text-muted-foreground" />
                                    <span className="text-muted-foreground">{evidence}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground">No evidence mapped</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {control.lastAssessed || "—"}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getStatusIcon(control.status)}
                              {getStatusBadge(control.status)}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
