import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Eye, CheckCircle2, AlertCircle, Clock } from "lucide-react";

interface Evidence {
  id: string;
  deliverableName: string;
  controlCode: string;
  uploadDate: string;
  domain: string;
  status: "compliant" | "partial" | "pending";
}

const mockEvidence: Evidence[] = [
  {
    id: "1",
    deliverableName: "Strategy implementation roadmap",
    controlCode: "GV-1.1",
    uploadDate: "2025-10-15",
    domain: "Cybersecurity Governance",
    status: "compliant",
  },
  {
    id: "2",
    deliverableName: "Business alignment documentation",
    controlCode: "GV-1.2",
    uploadDate: "2025-10-12",
    domain: "Cybersecurity Governance",
    status: "compliant",
  },
  {
    id: "3",
    deliverableName: "Risk assessment methodology",
    controlCode: "GV-2.1",
    uploadDate: "2025-10-10",
    domain: "Cybersecurity Governance",
    status: "partial",
  },
  {
    id: "4",
    deliverableName: "User access management procedures",
    controlCode: "DF-1.1",
    uploadDate: "2025-10-08",
    domain: "Cybersecurity Defense",
    status: "compliant",
  },
  {
    id: "5",
    deliverableName: "Multi-factor authentication implementation",
    controlCode: "DF-1.2",
    uploadDate: "2025-10-05",
    domain: "Cybersecurity Defense",
    status: "compliant",
  },
  {
    id: "6",
    deliverableName: "Incident response procedures",
    controlCode: "RS-1.1",
    uploadDate: "2025-10-03",
    domain: "Cybersecurity Resilience",
    status: "pending",
  },
  {
    id: "7",
    deliverableName: "Business continuity plan",
    controlCode: "RS-2.1",
    uploadDate: "2025-10-01",
    domain: "Cybersecurity Resilience",
    status: "compliant",
  },
  {
    id: "8",
    deliverableName: "Vendor security assessment criteria",
    controlCode: "TP-1.1",
    uploadDate: "2025-09-28",
    domain: "Third-Party and Cloud Computing",
    status: "partial",
  },
  {
    id: "9",
    deliverableName: "Cloud security architecture",
    controlCode: "TP-2.1",
    uploadDate: "2025-09-25",
    domain: "Third-Party and Cloud Computing",
    status: "compliant",
  },
  {
    id: "10",
    deliverableName: "ICS network segmentation diagram",
    controlCode: "IC-1.1",
    uploadDate: "2025-09-22",
    domain: "ICS Cybersecurity",
    status: "pending",
  },
  {
    id: "11",
    deliverableName: "Security policy documentation",
    controlCode: "GV-3.1",
    uploadDate: "2025-09-20",
    domain: "Cybersecurity Governance",
    status: "compliant",
  },
  {
    id: "12",
    deliverableName: "Asset inventory register",
    controlCode: "DF-2.1",
    uploadDate: "2025-09-18",
    domain: "Cybersecurity Defense",
    status: "compliant",
  },
  {
    id: "13",
    deliverableName: "Backup and recovery procedures",
    controlCode: "RS-2.2",
    uploadDate: "2025-09-15",
    domain: "Cybersecurity Resilience",
    status: "partial",
  },
  {
    id: "14",
    deliverableName: "Third-party contract agreements",
    controlCode: "TP-1.2",
    uploadDate: "2025-09-12",
    domain: "Third-Party and Cloud Computing",
    status: "compliant",
  },
  {
    id: "15",
    deliverableName: "Physical security controls documentation",
    controlCode: "IC-2.1",
    uploadDate: "2025-09-10",
    domain: "ICS Cybersecurity",
    status: "compliant",
  },
];

export function EvidenceManagementNew() {
  const [evidence] = useState<Evidence[]>(mockEvidence);

  const getStatusBadge = (status: "compliant" | "partial" | "pending") => {
    switch (status) {
      case "compliant":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Compliant
          </Badge>
        );
      case "partial":
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
            <Clock className="w-3 h-3 mr-1" />
            Partial
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
            <AlertCircle className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2>Evidence Management</h2>
        <p className="text-muted-foreground">
          View and manage all evidence submitted for compliance controls
        </p>
      </div>

      {/* Evidence Table */}
      <Card>
        <CardHeader>
          <CardTitle>Uploaded Evidence</CardTitle>
          <CardDescription>
            All evidence files uploaded for NCA-ECC compliance controls
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Deliverable Name</TableHead>
                <TableHead>Control Code</TableHead>
                <TableHead>Domain</TableHead>
                <TableHead>Upload Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {evidence.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.deliverableName}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{item.controlCode}</Badge>
                  </TableCell>
                  <TableCell className="text-sm">{item.domain}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {item.uploadDate}
                  </TableCell>
                  <TableCell>{getStatusBadge(item.status)}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
