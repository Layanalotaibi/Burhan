import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Download, FileDown, Loader2, ArrowLeft, RefreshCw } from "lucide-react";
import { BurhanNewLogo } from "./BurhanNewLogo";

interface ReportPreviewProps {
  onBack: () => void;
  initialReport?: any;
}

const C = {
  navy:      "#1B2F6B",
  teal:      "#1BB7B0",
  tealLight: "#E6F7F7",
  border:    "#D0D5E0",
  bgPage:    "#F0F2F7",
  bgAlt:     "#F8F9FF",
  textDark:  "#1A1A2E",
  textMid:   "#4A4A6A",
  textLight: "#9A9AB0",
  green:     "#2EA87E",
  amber:     "#F59E0B",
  red:       "#EF4444",
  gray:      "#CBD5E1",
};

const DOT: Record<string, string> = {
  "Compliant":     C.green,
  "Partial":       C.amber,
  "Non-Compliant": C.red,
};

// A4 at 96 dpi = 794 × 1123 px
const PAGE = {
  width: 794,
  minHeight: 1123,
  backgroundColor: "white",
  boxShadow: "0 4px 24px rgba(0,0,0,0.10)",
  border: `1px solid ${C.border}`,
  marginBottom: 32,
  pageBreakAfter: "always",
  breakAfter: "page",
  display: "flex",
  flexDirection: "column",
};

export function ReportPreview({ onBack, initialReport }: ReportPreviewProps) {
  const [exportFormat, setExportFormat]       = useState("pdf");
  const [showExportModal, setShowExportModal] = useState(false);
  const [isExporting, setIsExporting]         = useState(false);
  const [report, setReport]                   = useState<any>(initialReport || null);
  const [loading, setLoading]                 = useState(!initialReport);

  useEffect(() => {
    const persist = (r: any) => {
      localStorage.setItem("burhan_last_report", JSON.stringify(r));
      try {
        const key = "burhan_saved_reports";
        const list = JSON.parse(localStorage.getItem(key) || "[]").filter((x: any) => x.id !== r.generated_at);
        list.unshift({ ...r, id: r.generated_at || Date.now() });
        localStorage.setItem(key, JSON.stringify(list.slice(0, 8)));
      } catch {}
    };
    if (initialReport) { persist(initialReport); return; }
    // Use cached report if available — avoids burning LLM credits
    const cached = localStorage.getItem("burhan_last_report");
    if (cached) {
      try { setReport(JSON.parse(cached)); setLoading(false); return; } catch {}
    }
    import("../services/api").then(({ generateReport }) => {
      generateReport()
        .then((res) => {
          if (res.status === "success") { setReport(res.report); persist(res.report); }
          setLoading(false);
        })
        .catch(() => setLoading(false));
    });
  }, [initialReport]);

  const handleExport = async () => {
    const wrapper = document.getElementById("report-content");
    if (!wrapper) return;
    setIsExporting(true);

    const pageEls = Array.from(wrapper.querySelectorAll<HTMLElement>("[data-pdf-page]"));
    // Record each page's offsetTop and offsetHeight relative to wrapper
    const pageRects = pageEls.map(p => ({
      top: p.offsetTop,
      height: p.offsetHeight,
    }));

    // Remove only visual decoration — keep layout intact
    pageEls.forEach(p => { p.style.marginBottom = "0"; p.style.boxShadow = "none"; p.style.border = "none"; });
    wrapper.style.paddingTop = "0";
    wrapper.style.paddingBottom = "0";

    try {
      const html2canvas = (window as any).html2canvas;
      const { jsPDF } = (window as any).jspdf;
      const companyName = report?.company_name || "Burhan";

      const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = pdf.internal.pageSize.getHeight();
      const scale = 2;

      // Render entire wrapper once — preserves full flex/layout context
      const fullCanvas = await html2canvas(wrapper, {
        scale,
        useCORS: true,
        logging: false,
        width: wrapper.scrollWidth,
        height: wrapper.scrollHeight,
        windowWidth: wrapper.scrollWidth,
      });

      for (let i = 0; i < pageRects.length; i++) {
        const { top, height } = pageRects[i];
        const pageCanvas = document.createElement("canvas");
        pageCanvas.width  = fullCanvas.width;
        pageCanvas.height = height * scale;
        const ctx = pageCanvas.getContext("2d")!;
        ctx.drawImage(fullCanvas, 0, top * scale, fullCanvas.width, height * scale, 0, 0, fullCanvas.width, height * scale);

        const imgData = pageCanvas.toDataURL("image/jpeg", 0.98);
        const imgH = (pageCanvas.height / pageCanvas.width) * pdfW;

        if (i > 0) pdf.addPage();

        let remaining = imgH;
        let yOffset = 0;
        while (remaining > 1) {
          pdf.addImage(imgData, "JPEG", 0, yOffset, pdfW, imgH);
          remaining -= pdfH;
          if (remaining > 1) { pdf.addPage(); yOffset -= pdfH; }
        }
      }

      pdf.save(`${companyName}-ECC-Report.pdf`);
    } finally {
      pageEls.forEach(p => { p.style.marginBottom = ""; p.style.boxShadow = ""; p.style.border = ""; });
      wrapper.style.paddingTop = "";
      wrapper.style.paddingBottom = "";
      setIsExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: C.bgPage }}>
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin mx-auto" style={{ color: C.teal }} />
          <p className="text-sm" style={{ color: C.textMid }}>Generating report…</p>
        </div>
      </div>
    );
  }

  const r          = report || {};
  const score      = r.overall_score || 0;
  const scoreColor = score >= 70 ? C.green : score >= 40 ? C.amber : C.red;
  const circ       = 2 * Math.PI * 50;

  return (
    <div className="min-h-screen" style={{ backgroundColor: C.bgPage }}>

      {/* ── Action Bar ── */}
      <div className="no-print sticky top-0 z-10 bg-white border-b shadow-sm px-6 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Button variant="outline" onClick={onBack} className="gap-2 text-sm">
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="gap-2 text-sm"
              onClick={() => {
                localStorage.removeItem("burhan_last_report");
                window.location.reload();
              }}
            >
              <RefreshCw className="w-4 h-4" /> Regenerate
            </Button>
            <Select value={exportFormat} onValueChange={setExportFormat}>
              <SelectTrigger className="w-[120px] text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">PDF</SelectItem>
                <SelectItem value="docx">DOCX</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleExport} disabled={isExporting} className="gap-2 text-sm text-white" style={{ backgroundColor: C.navy }}>
              {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              {isExporting ? "Generating…" : "Download"}
            </Button>
          </div>
        </div>
      </div>

      {/* ── Pages ── */}
      <div id="report-content" className="py-10 flex flex-col items-center">

        {/* ══ PAGE 1: COVER ══ */}
        <div data-pdf-page style={PAGE}>

          {/* ── Top band ── */}
          <div className="px-12 py-8 flex items-center justify-between border-b" style={{ borderColor: C.border }}>
            <BurhanNewLogo size="lg" />
            <div className="text-right">
              <p className="text-xs uppercase tracking-widest" style={{ color: C.teal }}>Generated by</p>
              <p className="text-sm font-semibold" style={{ color: C.navy }}>Burhan</p>
            </div>
          </div>

          {/* ── Hero ── */}
          <div className="flex-1 flex flex-col justify-between px-12 py-10">

            {/* Title block */}
            <div className="space-y-6">
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: C.teal }}>
                  Compliance Evaluation Report
                </p>
                <h1 className="text-3xl font-bold leading-tight" style={{ color: C.navy }}>
                  NCA Essential Cybersecurity<br />Controls — 2: 2024
                </h1>
                <p className="text-sm" style={{ color: C.textMid }}>
                  National Cybersecurity Authority · Kingdom of Saudi Arabia
                </p>
              </div>

              {/* Org + Score row */}
              <div className="flex items-stretch gap-4 pt-2">
                {/* Org */}
                <div className="flex-1 rounded-xl p-5"
                     style={{ backgroundColor: C.bgAlt, border: `1px solid ${C.border}` }}>
                  <p className="text-xs uppercase tracking-widest mb-1" style={{ color: C.teal }}>Organization</p>
                  <p className="text-lg font-bold" style={{ color: C.navy }}>
                    {r.company_name || "—"}
                  </p>
                  <p className="text-xs mt-1" style={{ color: C.textLight }}>
                    {r.generated_at ? new Date(r.generated_at).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" }) : "—"}
                  </p>
                </div>

                {/* Score */}
                <div className="rounded-xl p-5 flex flex-col items-center justify-center text-center"
                     style={{ backgroundColor: C.bgAlt, border: `1px solid ${C.border}`, minWidth: 160 }}>
                  <p className="text-xs uppercase tracking-widest mb-1" style={{ color: C.textLight }}>Overall Score</p>
                  <p className="text-5xl font-bold leading-none" style={{ color: scoreColor }}>{score}%</p>
                  <p className="text-xs mt-2 font-medium" style={{ color: C.textMid }}>
                    {score >= 70 ? "Satisfactory" : score >= 40 ? "Needs Improvement" : "Critical"}
                  </p>
                </div>
              </div>

              {/* Meta strip */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Total Controls", value: r.total_controls  || 0 },
                  { label: "Evaluated",      value: r.total_evaluated || 0 },
                  { label: "Validated",      value: r.validated_count || 0 },
                ].map((item, i) => (
                  <div key={i} className="rounded-lg py-4 text-center"
                       style={{ backgroundColor: C.bgAlt, border: `1px solid ${C.border}` }}>
                    <p className="text-xs uppercase tracking-widest mb-1" style={{ color: C.textLight }}>{item.label}</p>
                    <p className="text-2xl font-bold" style={{ color: C.navy }}>{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Legend block */}
            <div className="space-y-4">
              <div className="h-px" style={{ backgroundColor: C.border }} />

              <div>
                <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: C.navy }}>
                  Compliance Level
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { color: C.green, label: "Compliant",     desc: "Fully implemented" },
                    { color: C.amber, label: "Partial",        desc: "Partially implemented" },
                    { color: C.red,   label: "Non-Compliant", desc: "Not implemented" },
                    { color: C.gray,  label: "Not Evaluated",  desc: "No evidence yet" },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-2 p-2.5 rounded-lg"
                         style={{ backgroundColor: C.bgAlt, border: `1px solid ${C.border}` }}>
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                      <div>
                        <p className="text-xs font-semibold" style={{ color: C.textDark }}>{item.label}</p>
                        <p className="text-xs leading-tight" style={{ color: C.textLight }}>{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: C.navy }}>
                  Validation Status
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { color: C.green, label: "Validated",     desc: "Independently verified by human" },
                    { color: C.gray,  label: "Not Validated", desc: "Pending human verification" },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-2 p-2.5 rounded-lg"
                         style={{ backgroundColor: C.bgAlt, border: `1px solid ${C.border}` }}>
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                      <div>
                        <p className="text-xs font-semibold" style={{ color: C.textDark }}>{item.label}</p>
                        <p className="text-xs leading-tight" style={{ color: C.textLight }}>{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <PageFooter page={1} />
        </div>

        {/* ══ PAGE 2: EXECUTIVE SUMMARY + DOMAIN OVERVIEW ══ */}
        <div data-pdf-page style={PAGE}>
          <div className="flex-1 px-12 py-10 space-y-10">

            {/* 1. Executive Summary */}
            <section>
              <SectionHeading number="1" title="Executive Summary" />
              <p className="text-sm mb-6" style={{ color: C.textMid, lineHeight: "1.85" }}>
                This report presents the organization's cybersecurity compliance status against the
                National Cybersecurity Authority's Essential Cybersecurity Controls (NCA-ECC – 2: 2024).
                It covers governance, defense, resilience, and third-party/cloud computing domains.
              </p>
              <div className="grid grid-cols-2 gap-6">
                {/* Donut */}
                <div className="rounded-lg border p-6 text-center" style={{ borderColor: C.border }}>
                  <p className="text-xs uppercase tracking-widest mb-4" style={{ color: C.textLight }}>Overall Compliance</p>
                  <div className="relative inline-flex items-center justify-center">
                    <svg width="148" height="148" viewBox="0 0 120 120">
                      <circle cx="60" cy="60" r="50" fill="none" stroke={C.tealLight} strokeWidth="14" />
                      <circle cx="60" cy="60" r="50" fill="none" stroke={C.teal} strokeWidth="14"
                        strokeDasharray={`${(score / 100) * circ} ${circ}`}
                        strokeLinecap="round"
                        transform="rotate(-90 60 60)" />
                    </svg>
                    <div className="absolute text-center">
                      <div className="text-3xl font-bold" style={{ color: C.navy }}>{score}%</div>
                      <div className="text-xs" style={{ color: C.textLight }}>compliance</div>
                    </div>
                  </div>
                </div>
                {/* Breakdown */}
                <div className="rounded-lg border p-6" style={{ borderColor: C.border }}>
                  <p className="text-xs uppercase tracking-widest mb-5" style={{ color: C.textLight }}>Compliance Breakdown</p>
                  <div className="space-y-4">
                    {[
                      { label: "Compliant",     value: r.total_compliant     || 0, color: C.green },
                      { label: "Partial",       value: r.total_partial       || 0, color: C.amber },
                      { label: "Non-Compliant", value: r.total_non_compliant || 0, color: C.red   },
                      { label: "Not Evaluated", value: r.not_evaluated       || 0, color: C.gray  },
                    ].map((item) => (
                      <div key={item.label}>
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                            <span style={{ color: C.textMid }}>{item.label}</span>
                          </div>
                          <span className="font-semibold" style={{ color: C.navy }}>{item.value}</span>
                        </div>
                        <div className="h-2 rounded-full" style={{ backgroundColor: "#EEF0F5" }}>
                          <div className="h-2 rounded-full" style={{
                            backgroundColor: item.color,
                            width: `${Math.min(Math.round((item.value / (r.total_controls || 1)) * 100), 100)}%`,
                          }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* 2. Domain-Level Overview */}
            <section>
              <SectionHeading number="2" title="Domain-Level Compliance Overview" />
              <div className="overflow-hidden rounded-lg border" style={{ borderColor: C.border }}>
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ backgroundColor: C.navy }}>
                      {["Domain", "Compliance Score", "Evaluated / Total", "Status"].map((h, i) => (
                        <th key={h} className={`px-4 py-3 font-semibold text-xs uppercase tracking-wider text-white ${i === 2 ? "text-center" : "text-left"}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(r.domain_results || []).length > 0
                      ? (r.domain_results || []).map((d: any, i: number) => (
                          <tr key={i} style={{ backgroundColor: i % 2 === 0 ? "#FFFFFF" : C.bgAlt, borderBottom: `1px solid ${C.border}` }}>
                            <td className="px-4 py-3 font-medium" style={{ color: C.textDark }}>{d.name}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className="h-2 w-28 rounded-full" style={{ backgroundColor: "#EEF0F5" }}>
                                  <div className="h-2 rounded-full" style={{ backgroundColor: C.teal, width: `${d.progress}%` }} />
                                </div>
                                <span className="text-xs font-bold" style={{ color: C.navy }}>{d.progress}%</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center" style={{ color: C.textMid }}>{d.evaluated} / {d.total_controls}</td>
                            <td className="px-4 py-3">
                              <div className="flex justify-center">
                                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: DOT[d.status] || C.gray }} title={d.status || "Not Evaluated"} />
                              </div>
                            </td>
                          </tr>
                        ))
                      : <tr><td colSpan={4} className="px-4 py-8 text-center text-sm" style={{ color: C.textLight }}>No data available</td></tr>
                    }
                  </tbody>
                </table>
              </div>
            </section>

          </div>
          <PageFooter page={2} />
        </div>

        {/* ══ PAGE 3: CONTROL-LEVEL FINDINGS ══ */}
        <div data-pdf-page style={PAGE}>
          <div className="flex-1 px-12 py-10">
            <section>
              <SectionHeading number="3" title="Control-Level Findings" />
              <div className="overflow-hidden rounded-lg border" style={{ borderColor: C.border }}>
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ backgroundColor: C.navy }}>
                      <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider text-white w-28">Control ID</th>
                      <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider text-white">Name</th>
                      <th className="text-center px-4 py-3 font-semibold text-xs uppercase tracking-wider text-white w-36">Compliance Level</th>
                      <th className="text-center px-4 py-3 font-semibold text-xs uppercase tracking-wider text-white w-28">Validated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const rows: any[] = [];

                      // Sort by control_id numerically
                      const sortById = (arr: any[]) => [...arr].sort((a, b) => {
                        const pa = a.control_id.split("-").map(Number);
                        const pb = b.control_id.split("-").map(Number);
                        for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
                          const diff = (pa[i] || 0) - (pb[i] || 0);
                          if (diff !== 0) return diff;
                        }
                        return 0;
                      });

                      // Derive sub-domain key from control_id (e.g. "2-1-1" → "2-1")
                      const sdKeyOf = (id: string) => id.split("-").slice(0, 2).join("-");

                      (r.domain_results || []).forEach((d: any) => {
                        const findings = sortById(d.control_findings || []);
                        if (!findings.length) return;

                        // Domain header
                        rows.push(
                          <tr key={`dh-${d.domain_id}`} style={{ backgroundColor: C.navy }}>
                            <td colSpan={4} className="px-4 py-2 text-white font-bold text-xs tracking-wide uppercase">{d.name}</td>
                          </tr>
                        );

                        // Always group by derived key from control_id for consistency
                        const bySubDomain: Record<string, { name: string; items: any[] }> = {};
                        findings.forEach((f: any) => {
                          const sdKey = sdKeyOf(f.control_id);
                          if (!bySubDomain[sdKey]) bySubDomain[sdKey] = { name: sdKey, items: [] };
                          // Use sub_domain_name when available
                          if (f.sub_domain_name) bySubDomain[sdKey].name = f.sub_domain_name;
                          bySubDomain[sdKey].items.push(f);
                        });

                        // Sort sub-domain groups by their key numerically
                        const sortedSds = Object.entries(bySubDomain).sort(([a], [b]) => {
                          const pa = a.split("-").map(Number);
                          const pb = b.split("-").map(Number);
                          for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
                            const diff = (pa[i] || 0) - (pb[i] || 0);
                            if (diff !== 0) return diff;
                          }
                          return 0;
                        });

                        sortedSds.forEach(([sdKey, sd]) => {
                          rows.push(
                            <tr key={`sdh-${sdKey}`} style={{ backgroundColor: C.tealLight }}>
                              <td colSpan={4} className="px-6 py-2 font-semibold text-xs" style={{ color: C.navy }}>
                                {sdKey} — {sd.name}
                              </td>
                            </tr>
                          );
                          sd.items.forEach((f: any, i: number) => {
                            rows.push(
                              <tr key={`${f.control_id}-${i}`} style={{ backgroundColor: i % 2 === 0 ? "#FFFFFF" : C.bgAlt, borderBottom: `1px solid ${C.border}` }}>
                                <td className="px-4 py-2.5 font-mono font-bold text-xs whitespace-nowrap" style={{ color: C.teal }}>{f.control_id}</td>
                                <td className="px-4 py-2.5 text-xs" style={{ color: C.textDark }}>{f.name}</td>
                                <td className="px-4 py-2.5">
                                  <div className="flex justify-center">
                                    <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: DOT[f.status] || C.gray }} title={f.status} />
                                  </div>
                                </td>
                                <td className="px-4 py-2.5">
                                  <div className="flex justify-center">
                                    <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: f.validated ? C.green : C.gray }} title={f.validated ? "Validated" : "Not validated"} />
                                  </div>
                                </td>
                              </tr>
                            );
                          });
                        });
                      });

                      if (!rows.length) return (
                        <tr>
                          <td colSpan={4} className="px-4 py-8 text-center text-sm" style={{ color: C.textLight }}>
                            No evaluations completed yet
                          </td>
                        </tr>
                      );
                      return rows;
                    })()}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
          <PageFooter page={3} />
        </div>

        {/* ══ PAGE 4: RECOMMENDATIONS + CONCLUSION + VERIFICATION ══ */}
        <div data-pdf-page style={PAGE}>
          <div className="flex-1 px-12 py-10 flex flex-col">

            {/* 4. Recommendations */}
            <section className="mb-10">
              <SectionHeading number="4" title="Recommendations" />
              {(r.recommendations || []).length > 0
                ? <div className="space-y-3">
                    {(r.recommendations || []).map((rec: string, i: number) => (
                      <div key={i} className="flex gap-3">
                        <span className="text-sm font-semibold flex-shrink-0" style={{ color: C.navy }}>{i + 1}.</span>
                        <p className="text-sm" style={{ color: C.textDark, lineHeight: "1.75" }}>{rec}</p>
                      </div>
                    ))}
                  </div>
                : <p className="text-sm" style={{ color: C.textMid }}>No recommendations at this time.</p>
              }
            </section>

            {/* 5. Conclusion */}
            <section className="mb-10">
              <SectionHeading number="5" title="Conclusion" />
              <p className="text-sm" style={{ color: C.textDark, lineHeight: "1.9" }}>
                {r.total_evaluated > 0
                  ? `Out of ${r.total_controls} controls, ${r.total_evaluated} have been evaluated with an overall compliance score of ${score}%.${r.validated_count > 0 ? ` ${r.validated_count} controls have been independently validated.` : ""} Continued assessment and remediation efforts are recommended to maintain and improve compliance with NCA-ECC requirements.`
                  : "No evaluations have been completed yet. Begin by uploading evidence for controls in the Evidence Compliance Management tab."
                }
              </p>
            </section>

            {/* Verification — pinned to bottom */}
            <section style={{ marginTop: "auto" }}>
              <SectionHeading number="" title="Verification and Approval" />
              <div className="grid grid-cols-3 gap-10 pt-2">
                {["Authorized Auditor Signature", "Organization Stamp", "Date"].map((label) => (
                  <div key={label}>
                    <div className="h-16 mb-3 rounded" style={{ border: `1px dashed ${C.border}` }} />
                    <p className="text-xs" style={{ color: C.textMid }}>{label}</p>
                  </div>
                ))}
              </div>
            </section>

          </div>

          {/* Full footer on last page */}
          <div>
            <div className="h-1.5" style={{ backgroundColor: C.teal }} />
            <div className="px-12 py-4 flex items-center justify-between"
                 style={{ backgroundColor: C.bgAlt, borderTop: `1px solid ${C.border}` }}>
              <div className="flex items-center gap-2">
                <BurhanNewLogo size="sm" />
                <span className="text-xs font-semibold" style={{ color: C.navy }}>Burhan</span>
                <span className="text-xs" style={{ color: C.textLight }}>— AI-Powered Compliance for NCA-ECC</span>
              </div>
              <span className="text-xs" style={{ color: C.textLight }}>Confidential · For Internal Use Only</span>
            </div>
          </div>
        </div>

      </div>

      {/* Export Modal */}
      <Dialog open={showExportModal} onOpenChange={setShowExportModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isExporting ? "Exporting Report…" : "Export Complete"}</DialogTitle>
            <DialogDescription>
              {isExporting ? `Generating your ${exportFormat.toUpperCase()} report…` : `Report exported as ${exportFormat.toUpperCase()}.`}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-8">
            {isExporting
              ? <Loader2 className="w-12 h-12 animate-spin" style={{ color: C.teal }} />
              : (
                <div className="space-y-4 text-center">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto" style={{ backgroundColor: C.tealLight }}>
                    <FileDown className="w-8 h-8" style={{ color: C.teal }} />
                  </div>
                  <p className="text-sm" style={{ color: C.textMid }}>Your report has been downloaded.</p>
                  <Button onClick={() => setShowExportModal(false)} className="text-white" style={{ backgroundColor: C.navy }}>Close</Button>
                </div>
              )
            }
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ── Helpers ── */

function SectionHeading({ number, title }: { number: string; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="w-1 h-6 rounded-full flex-shrink-0" style={{ backgroundColor: C.teal }} />
      {number && (
        <span className="text-xs font-extrabold uppercase tracking-widest" style={{ color: C.teal }}>{number}.</span>
      )}
      <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: C.navy }}>{title}</h2>
      <div className="flex-1 h-px" style={{ backgroundColor: `${C.teal}30` }} />
    </div>
  );
}

function PageFooter({ page }: { page: number }) {
  return (
    <div>
      <div className="h-0.5" style={{ backgroundColor: C.teal }} />
      <div className="px-12 py-2.5 flex items-center justify-between"
           style={{ backgroundColor: C.bgAlt, borderTop: `1px solid ${C.border}` }}>
        <div className="flex items-center gap-2">
          <BurhanNewLogo size="sm" />
          <span className="text-xs font-semibold" style={{ color: C.navy }}>Burhan</span>
        </div>
        <span className="text-xs" style={{ color: C.textLight }}>Page {page}</span>
      </div>
    </div>
  );
}
