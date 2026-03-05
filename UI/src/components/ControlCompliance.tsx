import { useState } from "react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "./ui/breadcrumb";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "./ui/sheet";
import { Shield, Network, LifeBuoy, Cloud, Settings, Upload, X, ChevronRight, FileText } from "lucide-react";

interface Control {
  id: string;
  name: string;
  code: string;
  deliverables: string[];
  description?: string;
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

const domains: Domain[] = [
  {
    id: "governance",
    name: "Cybersecurity Governance",
    icon: <Shield className="w-5 h-5" />,
    description: "This domain establishes the strategic and organizational foundation for managing cybersecurity within the organization. It ensures leadership oversight, clear accountability, effective risk management, and alignment between cybersecurity objectives and business goals.",
    subDomains: [
      {
        id: "gov-1",
        name: "Governance.1 - Cybersecurity Strategy",
        description: "This sub-domain focuses on defining and maintaining a clear cybersecurity strategy that aligns with organizational objectives and risk tolerance. It ensures that cybersecurity efforts are planned, prioritized, and continuously improved.",
        controls: [
          {
            id: "gov-1-1",
            name: "Control 1 - Cybersecurity Strategy Definition",
            code: "GV-1.1",
            description: "Ensures that a documented cybersecurity strategy is developed, approved, and communicated to guide cybersecurity activities across the organization.",
            deliverables: [
              "Strategy implementation roadmap",
              "List of cybersecurity projects and initiatives and their status"
            ]
          },
          {
            id: "gov-1-2",
            name: "Control 2 - Strategic Alignment",
            code: "GV-1.2",
            description: "Ensures that the cybersecurity strategy is aligned with business objectives, regulatory requirements, and the organization's risk appetite.",
            deliverables: [
              "Business alignment documentation",
              "Stakeholder approval records"
            ]
          },
          {
            id: "gov-1-3",
            name: "Control 3 - Strategy Review and Update",
            code: "GV-1.3",
            description: "Ensures that the cybersecurity strategy is reviewed periodically and updated based on changes in risks, technologies, and business needs.",
            deliverables: [
              "Budget allocation documents",
              "Resource planning reports"
            ]
          }
        ]
      },
      {
        id: "gov-2",
        name: "Governance.2 - Risk Management",
        description: "This sub-domain ensures that cybersecurity risks are identified, assessed, and managed systematically to support informed decision-making and effective risk treatment.",
        controls: [
          {
            id: "gov-2-1",
            name: "Control 1 - Risk Identification",
            code: "GV-2.1",
            description: "Ensures that cybersecurity risks to information assets and systems are identified and documented.",
            deliverables: [
              "Risk assessment methodology",
              "Risk register and treatment plans"
            ]
          },
          {
            id: "gov-2-2",
            name: "Control 2 - Risk Assessment",
            code: "GV-2.2",
            description: "Ensures that identified risks are analyzed and evaluated based on likelihood and impact.",
            deliverables: [
              "Risk monitoring reports",
              "Incident and risk correlation analysis"
            ]
          }
        ]
      },
      {
        id: "gov-3",
        name: "Governance.3 - Policies and Procedures",
        description: "This sub-domain ensures that cybersecurity policies, standards, and procedures are formally established to define acceptable behavior and security requirements.",
        controls: [
          {
            id: "gov-3-1",
            name: "Control 1 - Policy Development",
            code: "GV-3.1",
            description: "Ensures that cybersecurity policies and procedures are documented and approved by management.",
            deliverables: [
              "Cybersecurity policies and procedures",
              "Policy review and approval records"
            ]
          }
        ]
      }
    ]
  },
  {
    id: "defense",
    name: "Cybersecurity Defense",
    icon: <Network className="w-5 h-5" />,
    description: "This domain focuses on implementing preventive and detective controls to protect systems, networks, and data from cybersecurity threats. It aims to reduce vulnerabilities and limit the impact of cyberattacks.",
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
            ]
          },
          {
            id: "def-1-2",
            name: "Control 2 - Authentication Mechanisms",
            code: "DF-1.2",
            description: "Ensures that strong authentication methods are implemented to verify user identities.",
            deliverables: [
              "Multi-factor authentication implementation",
              "Authentication logs and monitoring"
            ]
          }
        ]
      },
      {
        id: "def-2",
        name: "Defense.2 - Asset Management",
        description: "This sub-domain focuses on identifying, classifying, and managing information assets to ensure appropriate protection.",
        controls: [
          {
            id: "def-2-1",
            name: "Control 1 - Asset Inventory",
            code: "DF-2.1",
            description: "Ensures that an accurate inventory of information assets is maintained.",
            deliverables: [
              "Firewall configuration documentation",
              "Network segmentation diagrams"
            ]
          },
          {
            id: "def-2-2",
            name: "Control 2 - Asset Classification",
            code: "DF-2.2",
            description: "Ensures that assets are classified according to sensitivity and criticality.",
            deliverables: [
              "IDS/IPS configuration and rules",
              "Security event monitoring logs"
            ]
          }
        ]
      },
      {
        id: "def-3",
        name: "Defense.3 - System and Network Protection",
        description: "This sub-domain ensures that technical security controls are implemented to protect systems and networks from unauthorized access and attacks.",
        controls: [
          {
            id: "def-3-1",
            name: "Control 1 - Network Security Controls",
            code: "DF-3.1",
            description: "Ensures that network traffic is monitored and protected using appropriate security mechanisms.",
            deliverables: [
              "Encryption policy and standards",
              "Key management procedures"
            ]
          }
        ]
      }
    ]
  },
  {
    id: "resilience",
    name: "Cybersecurity Resilience",
    icon: <LifeBuoy className="w-5 h-5" />,
    description: "This domain ensures the organization's ability to respond to, recover from, and continue operations during cybersecurity incidents. It focuses on preparedness, incident handling, and service continuity.",
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
            ]
          },
          {
            id: "res-1-2",
            name: "Control 2 - Incident Response",
            code: "RS-1.2",
            description: "Ensures that incidents are responded to according to defined procedures.",
            deliverables: [
              "Security monitoring and alerting system",
              "Incident detection logs"
            ]
          }
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
            ]
          },
          {
            id: "res-2-2",
            name: "Control 2 - Testing and Review",
            code: "RS-2.2",
            description: "Ensures that continuity plans are tested and updated regularly.",
            deliverables: [
              "Backup and recovery procedures",
              "Backup testing and verification logs"
            ]
          }
        ]
      }
    ]
  },
  {
    id: "thirdparty",
    name: "Third-Party and Cloud Computing Cybersecurity",
    icon: <Cloud className="w-5 h-5" />,
    description: "This domain addresses cybersecurity risks associated with third parties and cloud service providers to ensure external dependencies do not weaken the organization's security posture.",
    subDomains: [
      {
        id: "tp-1",
        name: "ThirdParty.1 - Third-Party Risk Management",
        description: "This sub-domain ensures that cybersecurity risks related to third parties are assessed, managed, and monitored throughout the relationship lifecycle.",
        controls: [
          {
            id: "tp-1-1",
            name: "Control 1 - Third-Party Assessment",
            code: "TP-1.1",
            description: "Ensures cybersecurity risks of third parties are assessed before engagement.",
            deliverables: [
              "Vendor security assessment criteria",
              "Third-party risk assessment reports"
            ]
          },
          {
            id: "tp-1-2",
            name: "Control 2 - Contractual Security Requirements",
            code: "TP-1.2",
            description: "Ensures cybersecurity requirements are included in contracts and agreements.",
            deliverables: [
              "Security requirements in contracts",
              "SLA and security compliance monitoring"
            ]
          }
        ]
      },
      {
        id: "tp-2",
        name: "ThirdParty.2 - Cloud Security",
        description: "This sub-domain focuses on securing cloud-based services and ensuring proper configuration and governance of cloud resources.",
        controls: [
          {
            id: "tp-2-1",
            name: "Control 1 - Cloud Configuration",
            code: "TP-2.1",
            description: "Ensures that cloud services are configured securely and in accordance with best practices.",
            deliverables: [
              "Cloud security architecture",
              "Cloud service configuration documentation"
            ]
          }
        ]
      }
    ]
  },
  {
    id: "ics",
    name: "ICS Cybersecurity",
    icon: <Settings className="w-5 h-5" />,
    description: "This domain focuses on protecting Industrial Control Systems (ICS) and operational technology environments from cybersecurity threats that could impact safety and critical operations.",
    subDomains: [
      {
        id: "ics-1",
        name: "ICS.1 - ICS Protection",
        description: "This sub-domain ensures that cybersecurity controls are tailored to protect industrial systems while maintaining operational reliability.",
        controls: [
          {
            id: "ics-1-1",
            name: "Control 1 - ICS Access Control",
            code: "IC-1.1",
            description: "Ensures access to industrial systems is restricted and monitored.",
            deliverables: [
              "Network segmentation architecture",
              "Zone and conduit diagrams"
            ]
          },
          {
            id: "ics-1-2",
            name: "Control 2 - ICS Monitoring",
            code: "IC-1.2",
            description: "Ensures continuous monitoring of ICS environments for cybersecurity threats.",
            deliverables: [
              "ICS access control policies",
              "Authentication and authorization logs"
            ]
          }
        ]
      },
      {
        id: "ics-2",
        name: "ICS.2 - Physical Security",
        description: "This sub-domain ensures physical protection measures are implemented to safeguard industrial control systems and operational technology infrastructure.",
        controls: [
          {
            id: "ics-2-1",
            name: "Control 1 - Facility Protection",
            code: "IC-2.1",
            description: "Ensures that physical access to critical ICS facilities is controlled and monitored.",
            deliverables: [
              "Physical security measures documentation",
              "Access control and monitoring systems"
            ]
          }
        ]
      }
    ]
  }
];

export function ControlCompliance() {
  const [selectedControl, setSelectedControl] = useState<Control | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);

  const handleControlClick = (control: Control, domain: string, subdomain: string) => {
    setSelectedControl(control);
    setBreadcrumbs([domain, subdomain, control.name]);
    setUploadProgress(0);
    setIsUploading(false);
  };

  const handleFileUpload = () => {
    setIsUploading(true);
    setUploadProgress(0);
    
    // Simulate file upload progress
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          setUploadedFiles((files) => [...files, "document-" + Date.now() + ".pdf"]);
          return 100;
        }
        return prev + 10;
      });
    }, 300);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2>Control Compliance</h2>
        <p className="text-muted-foreground">
          AI-powered cybersecurity compliance management platform
        </p>
      </div>

      {/* Breadcrumb Navigation */}
      {breadcrumbs.length > 0 && (
        <Card className="bg-white border-gray-200">
          <CardContent className="pt-6">
            <Breadcrumb>
              <BreadcrumbList>
                {breadcrumbs.map((crumb, index) => (
                  <div key={index} className="flex items-center">
                    {index > 0 && (
                      <BreadcrumbSeparator>
                        <ChevronRight className="w-4 h-4" />
                      </BreadcrumbSeparator>
                    )}
                    <BreadcrumbItem>
                      {index === breadcrumbs.length - 1 ? (
                        <BreadcrumbPage className="text-[#2F80ED]">{crumb}</BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink
                          onClick={() => {
                            setBreadcrumbs(breadcrumbs.slice(0, index + 1));
                            if (index === 0) setSelectedControl(null);
                          }}
                          className="cursor-pointer hover:text-[#2F80ED]"
                        >
                          {crumb}
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                  </div>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          </CardContent>
        </Card>
      )}

      {/* Domain Cards */}
      <Card className="bg-white border-gray-200">
        <CardContent className="pt-6">
          <Accordion type="multiple" className="w-full space-y-4">
            {domains.map((domain) => (
              <AccordionItem
                key={domain.id}
                value={domain.id}
                className="border border-gray-200 rounded-lg px-6 bg-white shadow-sm hover:shadow-md transition-shadow"
              >
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#2F80ED] text-white rounded-lg flex items-center justify-center">
                      {domain.icon}
                    </div>
                    <span className="text-gray-900">{domain.name}</span>
                    <Badge variant="outline" className="ml-2 bg-gray-50 text-gray-600">
                      {domain.subDomains.reduce((acc, sd) => acc + sd.controls.length, 0)} controls
                    </Badge>
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
                            <Badge variant="outline" className="bg-white text-gray-600 text-xs">
                              {subdomain.controls.length}
                            </Badge>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pt-2 pb-4">
                          {subdomain.description && (
                            <p className="text-xs text-gray-600 mb-3 pl-4 leading-relaxed">
                              {subdomain.description}
                            </p>
                          )}
                          <div className="space-y-2 pl-4">
                            {subdomain.controls.map((control) => (
                              <button
                                key={control.id}
                                onClick={() => handleControlClick(control, domain.name, subdomain.name)}
                                className="w-full text-left p-3 rounded-md bg-white border border-gray-200 hover:border-[#2F80ED] hover:bg-blue-50 transition-all group"
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <div className="flex items-center gap-3">
                                    <Badge className="bg-[#2F80ED] text-white text-xs">
                                      {control.code}
                                    </Badge>
                                    <span className="text-sm text-gray-700 group-hover:text-[#2F80ED]">
                                      {control.name}
                                    </span>
                                  </div>
                                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-[#2F80ED]" />
                                </div>
                                {control.description && (
                                  <p className="text-xs text-gray-500 pl-16 mt-1">
                                    {control.description}
                                  </p>
                                )}
                              </button>
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

      {/* Evidence Upload Side Panel */}
      <Sheet open={selectedControl !== null} onOpenChange={(open) => !open && setSelectedControl(null)}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-xl text-gray-900">Upload Evidence</SheetTitle>
            <SheetDescription className="text-gray-600">
              {selectedControl && (
                <div className="flex items-center gap-2 mt-2">
                  <Badge className="bg-[#2F80ED] text-white">
                    {selectedControl.code}
                  </Badge>
                  <span>{selectedControl.name}</span>
                </div>
              )}
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            {/* Upload Box */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 bg-gray-50 hover:bg-gray-100 transition-colors">
              <div className="flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                  <Upload className="w-8 h-8 text-gray-500" />
                </div>
                <p className="text-gray-700 mb-2">Drag & Drop or Browse Files</p>
                <p className="text-sm text-gray-500 mb-4">
                  Supported: PDF, DOCX, XLSX, PNG, JPG (Max 10MB)
                </p>
                <Button
                  onClick={handleFileUpload}
                  className="bg-[#2F80ED] hover:bg-[#2667C9] text-white"
                  disabled={isUploading}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {isUploading ? "Uploading..." : "Select Files"}
                </Button>
              </div>

              {/* Expected Deliverables */}
              {selectedControl && (
                <div className="mt-6 pt-6 border-t border-gray-300">
                  <p className="text-sm text-gray-600 mb-3">Expected deliverables:</p>
                  <ul className="space-y-2">
                    {selectedControl.deliverables.map((deliverable, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                        <span className="text-[#2F80ED] mt-1">•</span>
                        <span>{deliverable}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Upload Status Progress Bar */}
            {(isUploading || uploadProgress > 0) && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">Upload Status</span>
                  <span className="text-[#2F80ED]">{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}

            {/* Uploaded Files List */}
            {uploadedFiles.length > 0 && (
              <div className="space-y-3">
                <p className="text-sm text-gray-700">Uploaded Files ({uploadedFiles.length})</p>
                <div className="space-y-2">
                  {uploadedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-green-600" />
                        <span className="text-sm text-gray-700">{file}</span>
                      </div>
                      <button
                        onClick={() => setUploadedFiles(uploadedFiles.filter((_, i) => i !== index))}
                        className="text-gray-400 hover:text-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                className="flex-1 bg-[#2F80ED] hover:bg-[#2667C9] text-white"
                disabled={uploadedFiles.length === 0}
              >
                Submit Evidence
              </Button>
              <Button
                variant="outline"
                className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
                onClick={() => setSelectedControl(null)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}