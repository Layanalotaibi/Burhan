import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Progress } from "./ui/progress";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { CheckCircle2, Clock, FileText, ShieldCheck, AlertTriangle, CalendarClock } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { ScrollArea } from "./ui/scroll-area";

interface DashboardProps {
  onGenerateReport?: () => void;
  onBuildReport?: () => void;
  userName?: string;
  onNavigateToControl?: (controlId: string) => void;
}

export function Dashboard({ onGenerateReport, onBuildReport, userName = "", onNavigateToControl }: DashboardProps) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [validations, setValidations] = useState<Record<string, any>>({});
  const [eccDomains, setEccDomains] = useState<any[]>([]);

  useEffect(() => {
    import("../services/api").then(({ getDashboardStats, getValidations, getECCData }) => {
      Promise.all([getDashboardStats(), getValidations(), getECCData()]).then(([statsRes, valRes, eccRes]) => {
        if (statsRes.status === "success") setStats(statsRes.stats);
        if (valRes.status === "success") setValidations(valRes.validations || {});
        if (eccRes.status === "success" && eccRes.data?.domains) setEccDomains(eccRes.data.domains);
        setLoading(false);
      }).catch(() => setLoading(false));
    });
  }, []);

  const compliantCount = stats?.compliant ?? 0;
  const partialCount = stats?.partial ?? 0;
  const nonCompliantCount = stats?.non_compliant ?? 0;
  const notEvaluatedCount = stats?.not_evaluated ?? 0;
  const totalSubControls = stats?.total_sub_controls ?? 0;
  const overallCompliance = stats?.overall_score ?? 0;
  const evaluationResults = stats?.evaluation_results ?? {};

  // Build domain data from real ECC domains
  const domainData = eccDomains.map((domain: any) => {
    // Count controls in this domain and how many are evaluated/compliant
    let total = 0;
    let compliant = 0;
    for (const sd of domain.sub_domains || []) {
      for (const ctrl of sd.controls || []) {
        const scs = ctrl.sub_controls || [];
        if (scs.length > 0) {
          for (const sc of scs) {
            total++;
            const r = evaluationResults[sc.sub_control_id];
            if (r) compliant += r.score;
          }
        } else {
          total++;
          const r = evaluationResults[ctrl.control_id];
          if (r) compliant += r.score;
        }
      }
    }
    const progress = total > 0 ? Math.round((compliant / total) * 100) : 0;
    return {
      domain: domain.name,
      progress,
      status: progress >= 80 ? "good" : progress >= 60 ? "warning" : "critical",
      subControls: total
    };
  });

  // Build controls needing review from evaluation results
  const controlsNeedingReview = Object.entries(evaluationResults)
    .filter(([, data]: [string, any]) => data.score < 1)
    .map(([id, data]: [string, any]) => ({
      id,
      name: id,
      domain: "Evaluated Control",
      gradeScore: Math.round(data.score * 100),
      color: data.score === 0 ? "#ef4444" : "#DBE64C"
    }))
    .sort((a, b) => a.gradeScore - b.gradeScore);

  // Build evaluation history from evaluation results
  const evaluationHistory = Object.entries(evaluationResults)
    .map(([id, data]: [string, any]) => ({
      id,
      name: `Evaluation ${id}`,
      gradeScore: Math.round(data.score * 100),
      triggeredBy: "System",
      timestamp: data.evaluated_at?.split("T")[0] || "N/A",
      color: data.score >= 0.8 ? "#74C365" : "#DBE64C"
    }))
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp));

  // Controls with uploaded evidence
  const controlsWithEvidence: string[] = stats?.controls_with_evidence ?? [];

  // Human validated controls from validation API
  const compliantControls = Object.entries(validations)
    .filter(([, data]: [string, any]) => data.validated)
    .map(([id, data]: [string, any]) => ({
      id,
      name: id,
      domain: "Validated Control",
      validator: data.validator_name || "Unknown",
      validationDate: data.validated_at?.split("T")[0] || "N/A",
      notes: data.notes || "",
      status: "approved"
    }));

  const lastUpdated = new Date().toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-4">
      {/* Welcome Message */}
      <div className="flex items-center justify-between">
        <div>
          <h2>Welcome{userName ? `, ${userName}` : ""}</h2>
          <p className="text-muted-foreground">
            Overview of your organization's compliance status
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarClock className="w-4 h-4" />
            <span>Last Updated: {lastUpdated}</span>
          </div>
          <div className="flex items-center gap-2">
            {onBuildReport && (
              <Button variant="outline" onClick={onBuildReport} className="gap-2">
                <FileText className="w-4 h-4" />
                Custom Report
              </Button>
            )}
            {onGenerateReport && (
              <Button onClick={onGenerateReport} className="gap-2">
                <FileText className="w-4 h-4" />
                Full Report
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Dashboard Grid */}
      <div className="grid gap-3 grid-cols-2">
        {/* Control Status Distribution - DONUT CHART */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-sm">Control Compliance Status</CardTitle>
            <CardDescription className="text-xs">Overall breakdown</CardDescription>
          </CardHeader>
          <CardContent className="pb-3 px-4">
            <div className="h-[220px] flex items-center gap-4">
              {/* Chart Section - Custom SVG Donut */}
              <div className="flex-1 relative flex items-center justify-center">
                <svg width="180" height="180" viewBox="0 0 220 220">
                  {/* Background circle */}
                  <circle cx="110" cy="110" r="95" fill="none" stroke="#f0f0f0" strokeWidth="30" />

                  {totalSubControls > 0 && (
                    <>
                      {/* Compliant segment */}
                      <circle cx="110" cy="110" r="95" fill="none" stroke="#74C365" strokeWidth="30"
                        strokeDasharray={`${(compliantCount/totalSubControls) * 597} 597`}
                        strokeDashoffset="0" transform="rotate(-90 110 110)" />

                      {/* Partial segment */}
                      <circle cx="110" cy="110" r="95" fill="none" stroke="#DBE64C" strokeWidth="30"
                        strokeDasharray={`${(partialCount/totalSubControls) * 597} 597`}
                        strokeDashoffset={`-${(compliantCount/totalSubControls) * 597}`}
                        transform="rotate(-90 110 110)" />

                      {/* Non-Compliant segment */}
                      <circle cx="110" cy="110" r="95" fill="none" stroke="#ef4444" strokeWidth="30"
                        strokeDasharray={`${(nonCompliantCount/totalSubControls) * 597} 597`}
                        strokeDashoffset={`-${((compliantCount+partialCount)/totalSubControls) * 597}`}
                        transform="rotate(-90 110 110)" />

                      {/* Not Evaluated segment */}
                      <circle cx="110" cy="110" r="95" fill="none" stroke="#d1d5db" strokeWidth="30"
                        strokeDasharray={`${(notEvaluatedCount/totalSubControls) * 597} 597`}
                        strokeDashoffset={`-${((compliantCount+partialCount+nonCompliantCount)/totalSubControls) * 597}`}
                        transform="rotate(-90 110 110)" />
                    </>
                  )}
                </svg>

                {/* Center Text */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-3xl font-bold">{overallCompliance}%</p>
                    <p className="text-xs text-muted-foreground">Overall</p>
                  </div>
                </div>
              </div>

              {/* Custom Legend */}
              <div className="flex flex-col gap-3 pr-2">
                {[
                  { id: "compliant", name: "Compliant", value: compliantCount, fill: "#74C365" },
                  { id: "partial", name: "Partial", value: partialCount, fill: "#DBE64C" },
                  { id: "nonCompliant", name: "Non-Compliant", value: nonCompliantCount, fill: "#ef4444" },
                  { id: "notEvaluated", name: "Not Evaluated", value: notEvaluatedCount, fill: "#d1d5db" },
                ].map((entry) => (
                  <div key={`legend-${entry.id}`} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: entry.fill }} />
                    <div className="text-xs">
                      <p className="font-medium leading-tight">{entry.name}</p>
                      <p className="text-muted-foreground">{entry.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Compliance by Domain */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-sm">Compliance by Domain</CardTitle>
            <CardDescription className="text-xs">NCA-ECC compliance status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pb-3 px-4">
            {domainData.length > 0 ? domainData.map((domain) => (
              <div key={domain.domain} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm truncate pr-2 max-w-[200px]">{domain.domain}</span>
                  <span
                    className={`text-sm font-semibold flex-shrink-0 px-2.5 py-1 rounded ${
                      domain.status === "good"
                        ? "text-green-700 bg-green-100"
                        : domain.status === "warning"
                        ? "text-amber-700 bg-amber-100"
                        : "text-red-700 bg-red-100"
                    }`}
                  >
                    {domain.progress}%
                  </span>
                </div>
                <Progress value={domain.progress} className="h-2" />
              </div>
            )) : (
              <p className="text-sm text-muted-foreground text-center py-8">No domains loaded</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Secondary Row: Evaluation History, Controls Needing Review, Auditor Validations */}
      <div className="grid gap-3 grid-cols-3">
        {/* Evaluation History Chart */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2 pt-3 px-4">
            <div className="flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-[#001F3F]" />
              <CardTitle className="text-sm">Evaluation History</CardTitle>
            </div>
            <CardDescription className="text-xs">Compliance trend over time</CardDescription>
          </CardHeader>
          <CardContent className="pb-3 px-4">
            <div className="h-[280px]">
              {evaluationHistory.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={evaluationHistory} margin={{ top: 10, right: 10, left: -10, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={60} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-white p-2 border border-gray-200 rounded shadow-sm">
                              <p className="text-xs">Score: <span className="font-semibold">{data.gradeScore}%</span></p>
                              <p className="text-xs text-muted-foreground">{data.id}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Line type="monotone" dataKey="gradeScore" stroke="#001F3F" strokeWidth={2}
                      strokeDasharray="5 5" dot={{ fill: '#001F3F', r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-sm text-muted-foreground">No evaluations yet</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Controls Needing Review */}
        <Card className="shadow-sm border-l-4 border-l-amber-500">
          <CardHeader className="pb-2 pt-3 px-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <CardTitle className="text-sm">Controls Needing Review</CardTitle>
              </div>
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs">
                {controlsNeedingReview.length}
              </Badge>
            </div>
            <CardDescription className="text-xs">Sorted by lowest grade</CardDescription>
          </CardHeader>
          <CardContent className="pb-3 px-4">
            {controlsNeedingReview.length > 0 ? (
              <>
                <div className="space-y-2">
                  {controlsNeedingReview.slice(0, 3).map((control) => (
                    <div
                      key={control.id}
                      onClick={() => onNavigateToControl?.(control.id)}
                      className="p-2 rounded border border-gray-200 hover:border-amber-300 hover:bg-amber-50/30 transition-colors cursor-pointer"
                    >
                      <div className="flex items-start justify-between mb-1">
                        <div className="flex-1">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <Badge variant="outline" className="text-xs px-1.5 py-0">{control.id}</Badge>
                            <Badge variant="outline" className="text-xs px-1.5 py-0"
                              style={{
                                backgroundColor: `${control.color}20`,
                                color: control.color === "#DBE64C" ? "#001F3F" : control.color,
                                borderColor: control.color
                              }}
                            >
                              {control.gradeScore}%
                            </Badge>
                          </div>
                          <p className="text-xs leading-tight line-clamp-2">{control.name}</p>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground truncate">{control.domain}</div>
                    </div>
                  ))}
                </div>

                {controlsNeedingReview.length > 3 && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="w-full mt-3 text-xs">
                        Show More ({controlsNeedingReview.length - 3} more)
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[80vh]">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <AlertTriangle className="w-5 h-5 text-amber-600" />
                          All Controls Needing Review
                        </DialogTitle>
                        <DialogDescription>
                          Complete list of {controlsNeedingReview.length} controls requiring attention
                        </DialogDescription>
                      </DialogHeader>
                      <ScrollArea className="h-[500px] pr-4">
                        <div className="space-y-2">
                          {controlsNeedingReview.map((control) => (
                            <div key={control.id} onClick={() => onNavigateToControl?.(control.id)}
                              className="p-3 rounded border border-gray-200 hover:border-amber-300 hover:bg-amber-50/30 transition-colors cursor-pointer">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline" className="text-xs px-2 py-0.5">{control.id}</Badge>
                                <Badge variant="outline" className="text-xs px-2 py-0.5"
                                  style={{ backgroundColor: `${control.color}20`, color: control.color === "#DBE64C" ? "#001F3F" : control.color, borderColor: control.color }}>
                                  {control.gradeScore}%
                                </Badge>
                              </div>
                              <p className="text-sm font-medium leading-tight">{control.name}</p>
                              <p className="text-sm text-muted-foreground">Domain: {control.domain}</p>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </DialogContent>
                  </Dialog>
                )}
              </>
            ) : (
              <div className="flex items-center justify-center h-32">
                <p className="text-sm text-muted-foreground">No controls need review</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Auditor Validations */}
        <Card className="shadow-sm border-l-4 border-l-green-500">
          <CardHeader className="pb-2 pt-3 px-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-green-600" />
                <CardTitle className="text-sm">Auditor Validations</CardTitle>
              </div>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                {compliantControls.length} / {Object.keys(evaluationResults).length}
              </Badge>
            </div>
            <CardDescription className="text-xs">Validated out of evaluated controls</CardDescription>
          </CardHeader>
          <CardContent className="pb-3 px-4">
            <div className="mb-3 p-3 rounded-lg bg-green-50 border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Validated</p>
                  <p className="text-2xl font-bold text-green-700">
                    {compliantControls.length} <span className="text-base text-muted-foreground">/ {Object.keys(evaluationResults).length}</span>
                  </p>
                </div>
                <ShieldCheck className="w-8 h-8 text-green-600" />
              </div>
            </div>

            {compliantControls.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs font-medium mb-1">Recent Validations:</p>
                {compliantControls.slice(0, 3).map((control) => (
                  <div
                    key={control.id}
                    onClick={() => onNavigateToControl?.(control.id)}
                    className="p-2 rounded border border-gray-200 hover:border-green-300 hover:bg-green-50/30 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex-1">
                        <div className="flex items-center gap-1 mb-0.5">
                          <Badge variant="outline" className="text-xs px-1.5 py-0">{control.id}</Badge>
                          <Badge className="bg-green-600 hover:bg-green-700 text-white text-xs px-1.5 py-0">
                            <CheckCircle2 className="w-2.5 h-2.5" />
                          </Badge>
                        </div>
                        <p className="text-xs leading-tight line-clamp-1">{control.name}</p>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      <span className="block truncate">By: {control.validator} — {control.validationDate}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-16">
                <p className="text-xs text-muted-foreground">No validations yet</p>
              </div>
            )}

            {compliantControls.length > 3 && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full mt-3 text-xs">
                    Show More ({compliantControls.length - 3} more)
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh]">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-green-600" />
                      All Auditor Validations
                    </DialogTitle>
                    <DialogDescription>
                      Complete list of {compliantControls.length} validated controls
                    </DialogDescription>
                  </DialogHeader>
                  <ScrollArea className="h-[500px] pr-4">
                    <div className="space-y-2">
                      {compliantControls.map((control) => (
                        <div key={control.id} onClick={() => onNavigateToControl?.(control.id)}
                          className="p-3 rounded border border-gray-200 hover:border-green-300 hover:bg-green-50/30 transition-colors cursor-pointer">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs px-2 py-0.5">{control.id}</Badge>
                            <Badge className="bg-green-600 hover:bg-green-700 text-white text-xs px-2 py-0.5">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Approved
                            </Badge>
                          </div>
                          <p className="text-sm font-medium leading-tight">{control.name}</p>
                          <p className="text-sm text-muted-foreground">By: {control.validator} — {control.validationDate}</p>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </DialogContent>
              </Dialog>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
