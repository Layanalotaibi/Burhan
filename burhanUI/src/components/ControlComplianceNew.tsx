import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion";
import {
  Upload,
  FileText,
  Eye,
  Play,
  ChevronDown,
  ChevronRight,
  X,
  CheckCircle2,
  AlertCircle,
  Shield,
  Lock,
  RefreshCw,
  Cloud,
} from "lucide-react";
import { toast } from "sonner@2.0.3";
import { Checkbox } from "./ui/checkbox";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";

// Types matching ECC_data.json structure
interface Deliverable {
  deliverable_id: string;
  name: string;
  control_id?: string;
  sub_control_id?: string;
}

interface SubControl {
  sub_control_id: string;
  name: string;
  implementation_guidelines?: string[];
  expected_deliverables: Deliverable[];
}

interface Control {
  control_id: string;
  name: string;
  sub_domain_id: string;
  description?: string;
  implementation_guidelines?: string[];
  expected_deliverables: Deliverable[];
  sub_controls: SubControl[];
}

interface SubDomain {
  sub_domain_id: string;
  name: string;
  domain_id: string;
  objective?: string;
  controls: Control[];
}

interface Domain {
  domain_id: string;
  name: string;
  sub_domains: SubDomain[];
}

interface ECCData {
  domains: Domain[];
}

export function ControlComplianceNew({
  selectedControlId,
  onClearSelection,
  userName = "",
}: {
  selectedControlId?: string | null;
  onClearSelection?: () => void;
  userName?: string;
}) {
  const [eccData, setEccData] = useState<ECCData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedControl, setSelectedControl] = useState<Control | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [detailsData, setDetailsData] = useState<any>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [validationNotes, setValidationNotes] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [evaluating, setEvaluating] = useState(false);
  const [evaluatingControlId, setEvaluatingControlId] = useState<string | null>(null);
  const [evaluationResults, setEvaluationResults] = useState<Record<string, any>>({});
  const [controlsWithEvidence, setControlsWithEvidence] = useState<string[]>([]);

  // Load ECC data from API
  useEffect(() => {
    import("../services/api").then(({ getECCData, getDashboardStats }) => {
      Promise.all([getECCData(), getDashboardStats()]).then(([eccRes, statsRes]) => {
        if (eccRes.status === "success" && eccRes.data) {
          setEccData(eccRes.data);
        }
        if (statsRes.status === "success") {
          if (statsRes.stats?.evaluation_results) setEvaluationResults(statsRes.stats.evaluation_results);
          if (statsRes.stats?.controls_with_evidence) setControlsWithEvidence(statsRes.stats.controls_with_evidence);
        }
        setLoading(false);
      }).catch(() => setLoading(false));
    });
  }, []);

  // Handle navigation to specific control
  useEffect(() => {
    if (selectedControlId) {
      const el = document.getElementById(`control-${selectedControlId}`);
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          el.classList.add("ring-2", "ring-amber-400", "ring-offset-2");
          setTimeout(() => {
            el.classList.remove("ring-2", "ring-amber-400", "ring-offset-2");
            onClearSelection?.();
          }, 2000);
        }, 300);
      }
    }
  }, [selectedControlId, onClearSelection]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      setSelectedFiles(Array.from(e.dataTransfer.files));
    }
  };

  const openDetails = async (control: Control) => {
    setSelectedControl(control);
    setDetailsLoading(true);
    setDetailsDialogOpen(true);
    setValidationNotes("");

    try {
      const { getControlDetails } = await import("../services/api");
      const res = await getControlDetails(control.control_id);
      if (res.status === "success") {
        setDetailsData(res);
        setValidationNotes(res.validation?.notes || "");
      }
    } catch {
      toast.error("Could not load control details");
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleValidation = async (checked: boolean) => {
    if (!selectedControl) return;
    try {
      const { saveValidation } = await import("../services/api");
      const res = await saveValidation(
        selectedControl.control_id,
        checked,
        userName,
        validationNotes
      );
      if (res.status === "success") {
        setDetailsData((prev: any) => ({ ...prev, validation: res.validation }));
        toast.success(checked ? "Control validated" : "Validation removed");
      }
    } catch {
      toast.error("Could not save validation");
    }
  };

  const handleUploadAndEvaluate = async () => {
    if (!selectedControl || selectedFiles.length === 0) {
      toast.error("Please select files to upload");
      return;
    }

    setEvaluating(true);
    setUploadDialogOpen(false);
    setEvaluatingControlId(selectedControl.control_id);

    try {
      const { evaluateSubControl } = await import("../services/api");
      const deliverableIds = selectedControl.expected_deliverables.map(d => d.deliverable_id);
      const res = await evaluateSubControl(selectedControl.control_id, selectedFiles, deliverableIds);

      if (res.status === "success") {
        const score = res.result.score;
        const status = score === 1 ? "Compliant" : score === 0 ? "Non-Compliant" : "Partial";
        toast.success(`${selectedControl.control_id} evaluated: ${status} (${(score * 100).toFixed(0)}%)`);
        setEvaluationResults(prev => ({
          ...prev,
          [selectedControl.control_id]: res.result
        }));
        setControlsWithEvidence(prev =>
          prev.includes(selectedControl.control_id) ? prev : [...prev, selectedControl.control_id]
        );
      } else {
        toast.error(res.message || "Evaluation failed");
      }
    } catch {
      toast.error("Could not connect to server");
    } finally {
      setEvaluating(false);
      setEvaluatingControlId(null);
      setSelectedFiles([]);
      setSelectedControl(null);
    }
  };

  const handleEvaluateControl = async (control: Control) => {
    setSelectedControl(control);
    setUploadDialogOpen(true);
  };

  const hasEvidence = (controlId: string) => controlsWithEvidence.includes(controlId);

  const getControlStatus = (controlId: string) => {
    const result = evaluationResults[controlId];
    if (!result) return null;
    if (result.score === 1) return "compliant";
    if (result.score === 0) return "non_compliant";
    return "partial";
  };

  const getStatusBadge = (controlId: string) => {
    const status = getControlStatus(controlId);
    if (!status) return null;
    if (status === "compliant") return <Badge className="bg-green-600 text-white text-xs">Compliant</Badge>;
    if (status === "partial") return <Badge className="bg-amber-500 text-white text-xs">Partial</Badge>;
    return <Badge className="bg-red-600 text-white text-xs">Non-Compliant</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading controls...</p>
      </div>
    );
  }

  if (!eccData || !eccData.domains || eccData.domains.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">No ECC Data Loaded</h3>
          <p className="text-sm text-muted-foreground">Upload ECC_data.json to get started.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2>Evidence Compliance Management</h2>
        <p className="text-muted-foreground">
          Upload evidence and evaluate compliance for NCA-ECC controls
        </p>
      </div>

      {/* Domains */}
      {eccData.domains.map((domain) => {
        const domainIcons: Record<string, any> = {
          "D1": <Shield className="w-5 h-5" />,
          "D2": <Lock className="w-5 h-5" />,
          "D3": <RefreshCw className="w-5 h-5" />,
          "D4": <Cloud className="w-5 h-5" />,
        };

        return (
        <Card key={domain.domain_id} className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#001F3F] flex items-center justify-center text-white">
                {domainIcons[domain.domain_id] || <Shield className="w-5 h-5" />}
              </div>
              <div>
                <span className="text-[#001F3F]">{domain.name}</span>
                <p className="text-xs text-muted-foreground font-normal mt-0.5">
                  {domain.sub_domains.length} sub-domains · {domain.sub_domains.reduce((sum, sd) => sum + sd.controls.length, 0)} controls
                </p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="multiple" className="w-full">
              {domain.sub_domains.map((sd) => (
                <AccordionItem key={sd.sub_domain_id} value={sd.sub_domain_id} className="border-b-0">
                  <AccordionTrigger className="hover:no-underline hover:bg-gray-50 rounded-lg px-3 py-2">
                    <div className="flex items-center justify-between w-full pr-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{sd.sub_domain_id.replace("SD", "")}</span>
                        <span className="text-sm">{sd.name}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {sd.controls.length} controls
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    {sd.objective && (
                      <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                        <p className="text-xs text-blue-700">
                          <span className="font-medium">Objective:</span> {sd.objective}
                        </p>
                      </div>
                    )}

                    {/* Controls Table */}
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-gray-50 border-b">
                            <th className="text-left px-4 py-2 text-xs font-medium text-gray-600">Control Code</th>
                            <th className="text-left px-4 py-2 text-xs font-medium text-gray-600">Control Name</th>
                            <th className="text-left px-4 py-2 text-xs font-medium text-gray-600">Status</th>
                            <th className="text-right px-4 py-2 text-xs font-medium text-gray-600">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sd.controls.map((ctrl) => (
                            <>
                              {/* Main Control Row */}
                              <tr
                                key={ctrl.control_id}
                                id={`control-${ctrl.control_id}`}
                                className="border-b hover:bg-gray-50 transition-colors"
                              >
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-1.5">
                                    {hasEvidence(ctrl.control_id) && (
                                      <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                                    )}
                                    <Badge variant="outline" className="font-mono text-xs">
                                      {ctrl.control_id}
                                    </Badge>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-sm font-medium">{ctrl.name}</td>
                                <td className="px-4 py-3">
                                  {getStatusBadge(ctrl.control_id) || (
                                    <span className="text-xs text-gray-400">—</span>
                                  )}
                                </td>
                                <td className="px-4 py-3">
                                  {ctrl.expected_deliverables.length > 0 && (
                                    <div className="flex items-center justify-end gap-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-xs gap-1"
                                        onClick={() => handleEvaluateControl(ctrl)}
                                      >
                                        <Upload className="w-3 h-3" />
                                        Upload
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => openDetails(ctrl)}
                                      >
                                        <Eye className="w-4 h-4" />
                                      </Button>
                                      <Button
                                        variant="default"
                                        size="sm"
                                        className="text-xs gap-1 bg-[#001F3F] hover:bg-[#001F3F]/90"
                                        disabled={evaluatingControlId === ctrl.control_id}
                                        onClick={() => handleEvaluateControl(ctrl)}
                                      >
                                        <Play className="w-3 h-3" />
                                        {evaluatingControlId === ctrl.control_id ? "Evaluating..." : "Evaluate"}
                                      </Button>
                                    </div>
                                  )}
                                </td>
                              </tr>

                              {/* Sub-Control Rows */}
                              {ctrl.sub_controls && ctrl.sub_controls.length > 0 && ctrl.sub_controls.map((sc) => (
                                <tr
                                  key={sc.sub_control_id}
                                  id={`control-${sc.sub_control_id}`}
                                  className="border-b last:border-b-0 hover:bg-blue-50/30 transition-colors bg-gray-50/50"
                                >
                                  <td className="px-4 py-2.5 pl-10">
                                    <div className="flex items-center gap-1.5">
                                      {hasEvidence(sc.sub_control_id) && (
                                        <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                                      )}
                                      <Badge variant="outline" className="font-mono text-xs bg-blue-50 border-blue-200 text-blue-700">
                                        {sc.sub_control_id}
                                      </Badge>
                                    </div>
                                  </td>
                                  <td className="px-4 py-2.5 text-sm text-gray-600">
                                    <span className="text-xs text-gray-400 mr-1">└</span>
                                    {sc.name}
                                  </td>
                                  <td className="px-4 py-2.5">
                                    {getStatusBadge(sc.sub_control_id) || (
                                      <span className="text-xs text-gray-400">—</span>
                                    )}
                                  </td>
                                  <td className="px-4 py-2.5">
                                    <div className="flex items-center justify-end gap-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-xs gap-1"
                                        onClick={() => handleEvaluateControl({
                                          ...ctrl,
                                          control_id: sc.sub_control_id,
                                          name: sc.name,
                                          implementation_guidelines: sc.implementation_guidelines,
                                          expected_deliverables: sc.expected_deliverables,
                                          sub_controls: [],
                                        })}
                                      >
                                        <Upload className="w-3 h-3" />
                                        Upload
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setSelectedControl({
                                          ...ctrl,
                                          control_id: sc.sub_control_id,
                                          name: sc.name,
                                          implementation_guidelines: sc.implementation_guidelines,
                                          expected_deliverables: sc.expected_deliverables,
                                          sub_controls: [],
                                        })}
                                      >
                                        <Eye className="w-4 h-4" />
                                      </Button>
                                      <Button
                                        variant="default"
                                        size="sm"
                                        className="text-xs gap-1 bg-[#001F3F] hover:bg-[#001F3F]/90"
                                        disabled={evaluatingControlId === sc.sub_control_id}
                                        onClick={() => handleEvaluateControl({
                                          ...ctrl,
                                          control_id: sc.sub_control_id,
                                          name: sc.name,
                                          implementation_guidelines: sc.implementation_guidelines,
                                          expected_deliverables: sc.expected_deliverables,
                                          sub_controls: [],
                                        })}
                                      >
                                        <Play className="w-3 h-3" />
                                        {evaluatingControlId === sc.sub_control_id ? "Evaluating..." : "Evaluate"}
                                      </Button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
        );
      })}

      {/* Upload & Evaluate Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Control {selectedControl?.control_id}</DialogTitle>
            <p className="text-sm text-muted-foreground">{selectedControl?.name}</p>
          </DialogHeader>

          {/* Description */}
          {selectedControl?.description && (
            <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-700">
              {selectedControl.description}
            </div>
          )}

          {/* Implementation Guidelines */}
          {selectedControl?.implementation_guidelines && selectedControl.implementation_guidelines.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Implementation Guidelines</h4>
              <ul className="space-y-1.5">
                {selectedControl.implementation_guidelines.map((g, i) => (
                  <li key={i} className="text-xs text-gray-600 flex gap-2">
                    <span className="text-gray-400 flex-shrink-0">{i + 1}.</span>
                    <span>{g}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Expected Deliverables */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Expected Deliverables</h4>
            {selectedControl?.expected_deliverables.map((d, i) => (
              <div key={d.deliverable_id} className="flex items-start gap-3 p-3 border rounded-lg">
                <FileText className="w-4 h-4 text-[#001F3F] mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm">{d.name}</p>
                </div>
                <Badge variant="outline" className="text-xs flex-shrink-0">
                  {i + 1} of {selectedControl.expected_deliverables.length}
                </Badge>
              </div>
            ))}
          </div>

          {/* Single File Upload Area */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Upload Evidence</h4>
            <div
              className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-[#001F3F]/50 hover:bg-gray-50 transition-colors"
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => document.getElementById("file-upload")?.click()}
            >
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
              <p className="text-xs text-gray-400 mt-1">PDF, DOCX, XLSX, PNG, JPG</p>
              <input
                id="file-upload"
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.xlsx,.png,.jpg,.jpeg,.txt"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            {/* Selected Files */}
            {selectedFiles.length > 0 && (
              <div className="space-y-1.5">
                {selectedFiles.map((file, i) => (
                  <div key={i} className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <span className="truncate max-w-[300px]">{file.name}</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFiles(prev => prev.filter((_, idx) => idx !== i));
                      }}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upload Button */}
          <Button
            className="w-full bg-[#001F3F] hover:bg-[#001F3F]/90"
            disabled={selectedFiles.length === 0 || evaluating}
            onClick={handleUploadAndEvaluate}
          >
            {evaluating ? "Evaluating..." : "Upload Evidence"}
          </Button>
        </DialogContent>
      </Dialog>

      {/* Control Details Dialog (Eye icon) */}
      <Dialog open={detailsDialogOpen} onOpenChange={(open) => { if (!open) { setDetailsDialogOpen(false); setDetailsData(null); setSelectedControl(null); } }}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          {selectedControl && (
            <>
              <DialogHeader>
                <DialogTitle>Control {selectedControl.control_id}</DialogTitle>
                <p className="text-sm text-muted-foreground">{selectedControl.name}</p>
              </DialogHeader>

              {detailsLoading ? (
                <p className="text-sm text-muted-foreground text-center py-8">Loading details...</p>
              ) : (
                <>
                  {/* Uploaded Files */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Uploaded Evidence Files</h4>
                    {detailsData?.evidence && detailsData.evidence.length > 0 ? (
                      <div className="space-y-1.5">
                        {detailsData.evidence.map((e: any, i: number) => (
                          <div key={i} className="flex items-center gap-2 p-2 bg-gray-50 border rounded text-sm">
                            <FileText className="w-4 h-4 text-[#001F3F]" />
                            <span className="flex-1 truncate">{e.file_name}</span>
                            <span className="text-xs text-gray-400">{e.upload_date?.split("T")[0]}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 p-3 border rounded-lg text-center">No evidence uploaded yet</p>
                    )}
                  </div>

                  {/* AI Evaluation Results */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">AI Evaluation Results</h4>
                    {detailsData?.evaluation ? (
                      <div className="border rounded-lg overflow-hidden">
                        <div className={`p-3 text-sm font-medium ${
                          detailsData.evaluation.score === 1 ? "bg-green-50 text-green-700" :
                          detailsData.evaluation.score === 0 ? "bg-red-50 text-red-700" :
                          "bg-amber-50 text-amber-700"
                        }`}>
                          Score: {(detailsData.evaluation.score * 100).toFixed(0)}% — {
                            detailsData.evaluation.score === 1 ? "Compliant" :
                            detailsData.evaluation.score === 0 ? "Non-Compliant" : "Partial"
                          }
                        </div>
                        <div className="p-3 space-y-2">
                          {detailsData.evaluation.deliverables?.map((d: any) => (
                            <div key={d.deliverable_id} className="flex items-start gap-2 py-1.5 border-b last:border-b-0">
                              {d.score === 1 ? (
                                <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                              ) : (
                                <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                              )}
                              <div>
                                <p className="text-xs font-medium">{d.name}</p>
                                <p className="text-xs text-gray-500 mt-0.5">{d.explanation}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 p-3 border rounded-lg text-center">Not evaluated yet</p>
                    )}
                  </div>

                  {/* Human Validation */}
                  <div className="space-y-3 border-t pt-4">
                    <h4 className="text-sm font-medium">Human Validation</h4>

                    {detailsData?.validation?.validated ? (
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg space-y-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-medium text-green-700">Validated</span>
                        </div>
                        <p className="text-xs text-gray-600">By: {detailsData.validation.validator_name}</p>
                        <p className="text-xs text-gray-600">Date: {detailsData.validation.validated_at?.split("T")[0]}</p>
                        {detailsData.validation.notes && (
                          <p className="text-xs text-gray-600">Notes: {detailsData.validation.notes}</p>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs mt-2"
                          onClick={() => handleValidation(false)}
                        >
                          Remove Validation
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label htmlFor="validation-notes" className="text-xs">Notes (optional)</Label>
                          <Textarea
                            id="validation-notes"
                            placeholder="Add validation notes..."
                            value={validationNotes}
                            onChange={(e) => setValidationNotes(e.target.value)}
                            className="text-sm h-20"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id="validate-control"
                            onCheckedChange={(checked) => handleValidation(!!checked)}
                          />
                          <Label htmlFor="validate-control" className="text-sm cursor-pointer">
                            Mark as validated
                          </Label>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
