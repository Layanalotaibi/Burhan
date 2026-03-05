import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion";
import { Shield, Network, LifeBuoy, Cloud, Settings, Upload, FileText, Eye, CheckCircle2, AlertCircle, Clock, Play } from "lucide-react";
import { toast } from "sonner@2.0.3";

interface Evidence {
  id: string;
  deliverableName: string;
  controlCode: string;
  uploadDate: string;
  domain: string;
  status: "compliant" | "partial" | "pending";
}

interface Control {
  id: string;
  name: string;
  code: string;
  deliverables: string[];
  description?: string;
  status?: "compliant" | "partial" | "pending";
}

interface SubDomain {
  id: string;
  name: string;
  controls: Control[];
  description?: string;
}

interface Domain {
  id: string;
  name: string;
  icon: React.ReactNode;
  subDomains: SubDomain[];
  description?: string;
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
];

const domains: Domain[] = [
  {
    id: "governance",
    name: "Cybersecurity Governance",
    icon: <Shield className="w-5 h-5" />,
    description: "This domain establishes the strategic and organizational foundation for managing cybersecurity within the organization.",
    subDomains: [
      {
        id: "gov-1",
        name: "Governance.1 - Cybersecurity Strategy",
        description: "This sub-domain focuses on defining and maintaining a clear cybersecurity strategy that aligns with organizational objectives and risk tolerance.",
        controls: [
          {
            id: "gov-1-1",
            name: "Control 1 - Cybersecurity Strategy Definition",
            code: "GV-1.1",
            description: "Ensures that a documented cybersecurity strategy is developed, approved, and communicated to guide cybersecurity activities across the organization.",
            deliverables: [
              "Strategy implementation roadmap",
              "List of cybersecurity projects and initiatives and their status"
            ],
            status: "compliant"
          },
          {
            id: "gov-1-2",
            name: "Control 2 - Strategic Alignment",
            code: "GV-1.2",
            description: "Ensures that the cybersecurity strategy is aligned with business objectives, regulatory requirements, and the organization's risk appetite.",
            deliverables: [
              "Business alignment documentation",
              "Stakeholder approval records"
            ],
            status: "compliant"
          },
        ]
      },
      {
        id: "gov-2",
        name: "Governance.2 - Risk Management",
        description: "This sub-domain ensures that cybersecurity risks are identified, assessed, and managed systematically to support informed decision-making.",
        controls: [
          {
            id: "gov-2-1",
            name: "Control 1 - Risk Identification",
            code: "GV-2.1",
            description: "Ensures that cybersecurity risks to information assets and systems are identified and documented.",
            deliverables: [
              "Risk assessment methodology",
              "Risk register and treatment plans"
            ],
            status: "partial"
          },
        ]
      },
    ]
  },
  {
    id: "defense",
    name: "Cybersecurity Defense",
    icon: <Network className="w-5 h-5" />,
    description: "This domain focuses on implementing preventive and detective controls to protect systems, networks, and data from cybersecurity threats.",
    subDomains: [
      {
        id: "def-1",
        name: "Defense.1 - Identity and Access Management",
        description: "This sub-domain ensures that access to systems and information is restricted to authorized users based on defined roles and responsibilities.",
        controls: [
          {
            id: "def-1-1",
            name: "Control 1 - User Access Management",
            code: "DF-1.1",
            description: "Ensures that user access rights are granted, modified, and revoked based on authorization.",
            deliverables: [
              "User access management procedures",
              "Access control lists and permissions matrix"
            ],
            status: "compliant"
          },
          {
            id: "def-1-2",
            name: "Control 2 - Authentication Mechanisms",
            code: "DF-1.2",
            description: "Ensures that strong authentication methods are implemented to verify user identities.",
            deliverables: [
              "Multi-factor authentication implementation",
              "Authentication logs and monitoring"
            ],
            status: "pending"
          },
        ]
      },
    ]
  },
  {
    id: "resilience",
    name: "Cybersecurity Resilience",
    icon: <LifeBuoy className="w-5 h-5" />,
    description: "This domain ensures the organization's ability to respond to, recover from, and continue operations during cybersecurity incidents.",
    subDomains: [
      {
        id: "res-1",
        name: "Resilience.1 - Incident Management",
        description: "This sub-domain ensures that cybersecurity incidents are detected, reported, and handled in a timely and structured manner.",
        controls: [
          {
            id: "res-1-1",
            name: "Control 1 - Incident Detection",
            code: "RS-1.1",
            description: "Ensures mechanisms are in place to detect cybersecurity incidents.",
            deliverables: [
              "Incident response procedures",
              "Incident handling and escalation matrix"
            ],
            status: "pending"
          },
        ]
      },
      {
        id: "res-2",
        name: "Resilience.2 - Business Continuity",
        description: "This sub-domain ensures the continuity of critical services and recovery of systems following disruptions.",
        controls: [
          {
            id: "res-2-1",
            name: "Control 1 - Continuity Planning",
            code: "RS-2.1",
            description: "Ensures that business continuity and disaster recovery plans are established.",
            deliverables: [
              "Business continuity plan",
              "Recovery time objectives (RTO) documentation"
            ],
            status: "compliant"
          },
        ]
      },
    ]
  },
  {
    id: "thirdparty",
    name: "Third-Party and Cloud Computing",
    icon: <Cloud className="w-5 h-5" />,
    description: "This domain addresses cybersecurity risks associated with third parties and cloud service providers.",
    subDomains: [
      {
        id: "tp-1",
        name: "ThirdParty.1 - Third-Party Risk Management",
        description: "This sub-domain ensures that cybersecurity risks related to third parties are assessed, managed, and monitored.",
        controls: [
          {
            id: "tp-1-1",
            name: "Control 1 - Third-Party Assessment",
            code: "TP-1.1",
            description: "Ensures cybersecurity risks of third parties are assessed before engagement.",
            deliverables: [
              "Vendor security assessment criteria",
              "Third-party risk assessment reports"
            ],
            status: "partial"
          },
        ]
      },
    ]
  },
  {
    id: "ics",
    name: "ICS Cybersecurity",
    icon: <Settings className="w-5 h-5" />,
    description: "This domain focuses on protecting Industrial Control Systems (ICS) and operational technology environments.",
    subDomains: [
      {
        id: "ics-1",
        name: "ICS.1 - ICS Protection",
        description: "This sub-domain ensures that cybersecurity controls are tailored to protect industrial systems.",
        controls: [
          {
            id: "ics-1-1",
            name: "Control 1 - ICS Access Control",
            code: "IC-1.1",
            description: "Ensures access to industrial systems is restricted and monitored.",
            deliverables: [
              "Network segmentation architecture",
              "Zone and conduit diagrams"
            ],
            status: "pending"
          },
        ]
      },
    ]
  }
];

export function ControlComplianceNew() {
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedDeliverable, setSelectedDeliverable] = useState<{ controlCode: string; deliverableName: string } | null>(null);
  const [evaluating, setEvaluating] = useState(false);
  const [evaluatingControl, setEvaluatingControl] = useState<string | null>(null);

  const handleUploadEvidence = (controlCode: string, deliverableName: string) => {
    setSelectedDeliverable({ controlCode, deliverableName });
    setUploadModalOpen(true);
  };

  const handleFileUpload = () => {
    // Simulate file upload
    toast.success("Evidence uploaded successfully");
    setUploadModalOpen(false);
  };

  const handleStartEvaluation = () => {
    setEvaluating(true);
    // Simulate evaluation process
    setTimeout(() => {
      setEvaluating(false);
      toast.success("Evaluation completed successfully");
    }, 2000);
  };

  const handleEvaluateControl = (controlCode: string) => {
    setEvaluatingControl(controlCode);
    // Simulate control evaluation process
    setTimeout(() => {
      setEvaluatingControl(null);
      toast.success(`Control ${controlCode} evaluated successfully`);
    }, 1500);
  };

  const getStatusBadge = (status?: "compliant" | "partial" | "pending") => {
    switch (status) {
      case "compliant":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200"><CheckCircle2 className="w-3 h-3 mr-1" />Compliant</Badge>;
      case "partial":
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200"><Clock className="w-3 h-3 mr-1" />Partial</Badge>;
      case "pending":
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200"><AlertCircle className="w-3 h-3 mr-1" />Pending</Badge>;
      default:
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">Not Evaluated</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2>Control Compliance</h2>
        <p className="text-muted-foreground">
          Upload evidence and track compliance status across all controls
        </p>
      </div>

      {/* Controls by Domain */}
      <Card>
        <CardHeader>
          <CardTitle>Controls and Evidence Requirements</CardTitle>
          <CardDescription>Upload evidence for each control deliverable</CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" className="w-full space-y-4">
            {domains.map((domain) => (
              <AccordionItem
                key={domain.id}
                value={domain.id}
                className="border border-gray-200 rounded-lg px-6 bg-white shadow-sm"
              >
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#2F80ED] text-white rounded-lg flex items-center justify-center">
                      {domain.icon}
                    </div>
                    <span className="text-gray-900">{domain.name}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-4 pb-6">
                  {domain.description && (
                    <p className="text-sm text-gray-600 mb-4 pl-4 leading-relaxed">
                      {domain.description}
                    </p>
                  )}
                  <Accordion type="multiple" className="w-full space-y-3 pl-4">
                    {domain.subDomains.map((subdomain) => (
                      <AccordionItem
                        key={subdomain.id}
                        value={subdomain.id}
                        className="border border-gray-100 rounded-md px-4 bg-gray-50"
                      >
                        <AccordionTrigger className="hover:no-underline py-3 text-sm">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-700">{subdomain.name}</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pt-2 pb-4">
                          {subdomain.description && (
                            <p className="text-xs text-gray-600 mb-3 pl-4 leading-relaxed">
                              {subdomain.description}
                            </p>
                          )}
                          <div className="space-y-4 pl-4">
                            {subdomain.controls.map((control) => (
                              <div
                                key={control.id}
                                className="p-4 rounded-md bg-white border border-gray-200"
                              >
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                      <Badge className="bg-[#2F80ED] text-white text-xs">
                                        {control.code}
                                      </Badge>
                                      <span className="text-sm text-gray-900">{control.name}</span>
                                      {getStatusBadge(control.status)}
                                    </div>
                                    {control.description && (
                                      <p className="text-xs text-gray-500 mb-3">
                                        {control.description}
                                      </p>
                                    )}
                                  </div>
                                  <Button
                                    size="sm"
                                    onClick={() => handleEvaluateControl(control.code)}
                                    disabled={evaluatingControl === control.code}
                                    className="bg-[#001F3F] hover:bg-[#1E488F] text-white"
                                  >
                                    {evaluatingControl === control.code ? (
                                      <>
                                        <Clock className="w-3 h-3 mr-1 animate-spin" />
                                        Evaluating...
                                      </>
                                    ) : (
                                      <>
                                        <Play className="w-3 h-3 mr-1" />
                                        Evaluate
                                      </>
                                    )}
                                  </Button>
                                </div>
                                
                                {/* Deliverables */}
                                <div className="mt-3 space-y-2">
                                  <p className="text-xs text-gray-600">Required Deliverables:</p>
                                  {control.deliverables.map((deliverable, index) => (
                                    <div
                                      key={index}
                                      className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200"
                                    >
                                      <span className="text-xs text-gray-700">{deliverable}</span>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleUploadEvidence(control.code, deliverable)}
                                      >
                                        <Upload className="w-3 h-3 mr-1" />
                                        Upload
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      {/* Start Overall Evaluation Button */}
      <div className="flex justify-center pt-4 pb-8">
        <Button
          size="lg"
          onClick={handleStartEvaluation}
          disabled={evaluating}
          className="bg-[#001F3F] hover:bg-[#1E488F] text-white px-8"
        >
          {evaluating ? (
            <>
              <Clock className="w-5 h-5 mr-2 animate-spin" />
              Evaluating...
            </>
          ) : (
            <>
              <Play className="w-5 h-5 mr-2" />
              Start Overall Evaluation
            </>
          )}
        </Button>
      </div>

      {/* Upload Evidence Modal */}
      <Dialog open={uploadModalOpen} onOpenChange={setUploadModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Upload Evidence</DialogTitle>
            <DialogDescription>
              {selectedDeliverable && (
                <div className="mt-2">
                  <Badge variant="outline" className="mr-2">{selectedDeliverable.controlCode}</Badge>
                  <span className="text-sm">{selectedDeliverable.deliverableName}</span>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Upload Area */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 bg-gray-50 hover:bg-gray-100 transition-colors text-center">
              <div className="flex flex-col items-center justify-center">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                  <Upload className="w-8 h-8 text-gray-500" />
                </div>
                <p className="text-gray-700 mb-2">Drag & Drop or Browse Files</p>
                <p className="text-sm text-gray-500 mb-4">
                  Supported: PDF, DOCX, XLSX, PNG, JPG (Max 10MB)
                </p>
                <Button variant="outline">
                  Select Files
                </Button>
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={handleFileUpload} className="flex-1 bg-[#2F80ED] hover:bg-[#2667C9]">
                Upload Evidence
              </Button>
              <Button variant="outline" onClick={() => setUploadModalOpen(false)} className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}