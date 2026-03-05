import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Progress } from "./ui/progress";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { TrendingUp, AlertCircle, CheckCircle2, Clock, FileText, ShieldAlert, ChevronDown, ChevronRight } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, RadialBarChart, RadialBar } from "recharts";
import { useState } from "react";

interface DashboardProps {
  onGenerateReport?: () => void;
  userName?: string;
}

const domainData = [
  { 
    domain: "Cybersecurity Governance", 
    progress: 85, 
    status: "good",
    subDomains: [
      { name: "Cybersecurity Strategy", progress: 90 },
      { name: "Risk Management", progress: 82 },
      { name: "Policies and Procedures", progress: 83 }
    ]
  },
  { 
    domain: "Cybersecurity Defense", 
    progress: 72, 
    status: "warning",
    subDomains: [
      { name: "Identity and Access Management", progress: 78 },
      { name: "Asset Management", progress: 70 },
      { name: "System and Network Protection", progress: 68 }
    ]
  },
  { 
    domain: "Cybersecurity Resilience", 
    progress: 91, 
    status: "good",
    subDomains: [
      { name: "Incident Management", progress: 93 },
      { name: "Business Continuity", progress: 89 }
    ]
  },
  { 
    domain: "Third-Party and Cloud Computing", 
    progress: 58, 
    status: "critical",
    subDomains: [
      { name: "Third-Party Risk Management", progress: 60 },
      { name: "Cloud Security", progress: 56 }
    ]
  },
  { 
    domain: "ICS Cybersecurity", 
    progress: 78, 
    status: "good",
    subDomains: [
      { name: "ICS Protection", progress: 82 },
      { name: "Physical Security", progress: 74 }
    ]
  }
];

const chartData = [
  { name: "Access Control", compliant: 17, partial: 2, nonCompliant: 1 },
  { name: "Data Protection", compliant: 14, partial: 4, nonCompliant: 2 },
  { name: "Network Security", compliant: 18, partial: 1, nonCompliant: 1 },
  { name: "Incident Response", compliant: 11, partial: 5, nonCompliant: 3 },
  { name: "Risk Management", compliant: 15, partial: 3, nonCompliant: 2 },
  { name: "Physical Security", compliant: 19, partial: 1, nonCompliant: 0 },
];

const overallPieData = [
  { name: "Compliant", value: 94, color: "#74C365" },
  { name: "Partial", value: 16, color: "#DBE64C" },
  { name: "Non-Compliant", value: 9, color: "#ef4444" },
];

const suggestions = [
  {
    id: 1,
    title: "Improve Incident Response Documentation",
    description: "Upload evidence for controls IR-01 through IR-05",
    priority: "high",
  },
  {
    id: 2,
    title: "Update Data Encryption Policies",
    description: "Controls DP-12 and DP-13 require updated certificates",
    priority: "medium",
  },
  {
    id: 3,
    title: "Review Access Control Logs",
    description: "Quarterly review pending for AC-08 and AC-09",
    priority: "low",
  },
];

const riskScore = 35;

const riskGaugeData = [
  {
    name: "Risk",
    value: riskScore,
    fill: riskScore <= 40 ? "#74C365" : riskScore <= 70 ? "#DBE64C" : "#ef4444",
  },
];

const riskBreakdown = [
  { controlId: "DF-03", riskImpact: "High", likelihood: "Medium", calculatedRisk: 72 },
  { controlId: "RS-02", riskImpact: "Medium", likelihood: "High", calculatedRisk: 68 },
  { controlId: "IC-01", riskImpact: "Low", likelihood: "High", calculatedRisk: 55 },
];

const getRiskLevel = (score: number) => {
  if (score <= 40) return { label: "Low Risk", color: "text-[#00804C]", bgColor: "bg-[#74C365]/10", borderColor: "border-[#74C365]" };
  if (score <= 70) return { label: "Medium Risk", color: "text-[#DBE64C]", bgColor: "bg-[#DBE64C]/10", borderColor: "border-[#DBE64C]" };
  return { label: "High Risk", color: "text-red-700", bgColor: "bg-red-50", borderColor: "border-red-200" };
};

const getRiskBadge = (score: number) => {
  if (score <= 40) return <Badge variant="outline" className="bg-[#74C365]/10 text-[#00804C] border-[#74C365]">Low</Badge>;
  if (score <= 70) return <Badge variant="outline" className="bg-[#DBE64C]/10 text-[#001F3F] border-[#DBE64C]">Medium</Badge>;
  return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">High</Badge>;
};

export function Dashboard({ onGenerateReport, userName = "John Smith" }: DashboardProps) {
  const overallCompliance = 79;
  const [expandedDomains, setExpandedDomains] = useState<string[]>([]);

  const toggleDomain = (domain: string) => {
    setExpandedDomains((prev) =>
      prev.includes(domain)
        ? prev.filter((d) => d !== domain)
        : [...prev, domain]
    );
  };

  return (
    <div className="space-y-4 pb-4">
      {/* Welcome Message */}
      <div className="flex items-center justify-between">
        <div>
          <h2>Welcome, {userName}</h2>
          <p className="text-muted-foreground">
            Overview of your organization's compliance status
          </p>
        </div>
        {onGenerateReport && (
          <Button onClick={onGenerateReport} className="gap-2">
            <FileText className="w-4 h-4" />
            Generate Report
          </Button>
        )}
      </div>

      {/* Overall Compliance */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm">
          <CardHeader className="pb-2 pt-3">
            <CardDescription>Overall Compliance</CardDescription>
          </CardHeader>
          <CardContent className="pb-3">
            <div className="flex items-center justify-between">
              <span className="text-2xl">{overallCompliance}%</span>
              <TrendingUp className="w-4 h-4 text-green-600" />
            </div>
            <Progress value={overallCompliance} className="mt-2 h-1.5" />
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2 pt-3">
            <CardDescription>Compliant Controls</CardDescription>
          </CardHeader>
          <CardContent className="pb-3">
            <div className="flex items-center justify-between">
              <span className="text-2xl">94</span>
              <CheckCircle2 className="w-4 h-4 text-green-600" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Out of 119 total controls
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2 pt-3">
            <CardDescription>Partial Compliance</CardDescription>
          </CardHeader>
          <CardContent className="pb-3">
            <div className="flex items-center justify-between">
              <span className="text-2xl">16</span>
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Requires additional evidence
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2 pt-3">
            <CardDescription>Non-Compliant</CardDescription>
          </CardHeader>
          <CardContent className="pb-3">
            <div className="flex items-center justify-between">
              <span className="text-2xl">9</span>
              <AlertCircle className="w-4 h-4 text-red-600" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Immediate action required
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Domain Progress */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader className="pb-2 pt-3">
            <CardTitle className="text-base">Compliance by Domain</CardTitle>
            <CardDescription className="text-xs">
              Progress across NCA-ECC control domains
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pb-3">
            {domainData.slice(0, 5).map((domain) => (
              <div key={domain.domain} className="space-y-1.5">
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => toggleDomain(domain.domain)}
                >
                  <div className="flex items-center gap-2">
                    {expandedDomains.includes(domain.domain) ? (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    )}
                    <span className="text-sm">{domain.domain}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs">{domain.progress}%</span>
                    {domain.status === "good" && (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs py-0">
                        Good
                      </Badge>
                    )}
                    {domain.status === "warning" && (
                      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs py-0">
                        Review
                      </Badge>
                    )}
                    {domain.status === "critical" && (
                      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-xs py-0">
                        Critical
                      </Badge>
                    )}
                  </div>
                </div>
                <Progress value={domain.progress} className="h-1.5" />
                {/* Sub-domains */}
                {expandedDomains.includes(domain.domain) && (
                  <div className="ml-6 mt-2 space-y-2">
                    {domain.subDomains.map((subDomain) => (
                      <div key={subDomain.name} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-600">{subDomain.name}</span>
                          <span className="text-xs text-gray-500">{subDomain.progress}%</span>
                        </div>
                        <Progress value={subDomain.progress} className="h-1" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2 pt-3">
            <CardTitle className="text-base">Control Status Distribution</CardTitle>
            <CardDescription className="text-xs">Overall compliance breakdown</CardDescription>
          </CardHeader>
          <CardContent className="h-[200px] pb-3">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={overallPieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={65}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {overallPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}