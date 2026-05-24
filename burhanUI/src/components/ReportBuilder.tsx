import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { ArrowLeft, FileText, Loader2, Shield, Lock, RefreshCw, Cloud } from "lucide-react";

interface SubDomain {
  sub_domain_id: string;
  name: string;
  controls: any[];
}

interface Domain {
  domain_id: string;
  name: string;
  sub_domains: SubDomain[];
}

interface ReportBuilderProps {
  onBack: () => void;
  onGenerate: (subDomainIds: string[], companyName: string) => void;
  isGenerating: boolean;
}

const DOMAIN_ICONS: Record<string, any> = {
  D1: <Shield className="w-4 h-4" />,
  D2: <Lock className="w-4 h-4" />,
  D3: <RefreshCw className="w-4 h-4" />,
  D4: <Cloud className="w-4 h-4" />,
};

export function ReportBuilder({ onBack, onGenerate, isGenerating }: ReportBuilderProps) {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [companyName, setCompanyName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    import("../services/api").then(({ getECCData }) => {
      getECCData().then((res) => {
        if (res.status === "success" && res.data?.domains) {
          setDomains(res.data.domains);
        }
        setLoading(false);
      }).catch(() => setLoading(false));
    });
  }, []);

  const allSubDomainIds = domains.flatMap((d) => d.sub_domains.map((sd) => sd.sub_domain_id));

  const toggleSubDomain = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleDomain = (domain: Domain) => {
    const ids = domain.sub_domains.map((sd) => sd.sub_domain_id);
    const allSelected = ids.every((id) => selected.has(id));
    setSelected((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => (allSelected ? next.delete(id) : next.add(id)));
      return next;
    });
  };

  const selectAll = () => setSelected(new Set(allSubDomainIds));
  const clearAll = () => setSelected(new Set());

  const totalControls = domains
    .flatMap((d) => d.sub_domains)
    .filter((sd) => selected.has(sd.sub_domain_id))
    .reduce((sum, sd) => sum + sd.controls.length, 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#FAF9F7" }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#1B6CA8" }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FAF9F7" }}>
      {/* Top Bar */}
      <div className="bg-white border-b px-8 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Button variant="outline" onClick={onBack} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              {selected.size} sub-domain{selected.size !== 1 ? "s" : ""} · {totalControls} controls selected
            </span>
            <Button
              onClick={() => onGenerate(Array.from(selected), companyName)}
              disabled={selected.size === 0 || isGenerating}
              className="gap-2"
              style={{ backgroundColor: "#1B6CA8" }}
            >
              {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
              {isGenerating ? "Generating..." : "Generate Report"}
            </Button>
          </div>
        </div>
      </div>

      <div className="py-8 px-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <div>
            <h1 className="text-2xl font-semibold" style={{ color: "#1B6CA8" }}>Report Builder</h1>
            <p className="text-sm text-muted-foreground mt-1">Select the sub-domains to include in this report</p>
          </div>

          {/* Company Name */}
          <Card>
            <CardContent className="pt-4 pb-4">
              <Label className="text-sm font-medium mb-2 block">Organization Name (optional)</Label>
              <Input
                placeholder="e.g. Acme Corporation"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="max-w-sm"
              />
            </CardContent>
          </Card>

          {/* Select All / Clear */}
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={selectAll}>Select All</Button>
            <Button variant="outline" size="sm" onClick={clearAll}>Clear All</Button>
          </div>

          {/* Domain cards */}
          {domains.map((domain) => {
            const domainIds = domain.sub_domains.map((sd) => sd.sub_domain_id);
            const selectedCount = domainIds.filter((id) => selected.has(id)).length;
            const allDomainSelected = selectedCount === domainIds.length;

            return (
              <Card key={domain.domain_id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-3">
                    <div
                      className="w-7 h-7 rounded flex items-center justify-center text-white flex-shrink-0"
                      style={{ backgroundColor: "#001F3F" }}
                    >
                      {DOMAIN_ICONS[domain.domain_id] || <Shield className="w-4 h-4" />}
                    </div>
                    <div className="flex items-center gap-2 flex-1">
                      <span style={{ color: "#001F3F" }}>{domain.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {selectedCount}/{domainIds.length}
                      </Badge>
                    </div>
                    <Checkbox
                      checked={allDomainSelected}
                      onCheckedChange={() => toggleDomain(domain)}
                    />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {domain.sub_domains.map((sd) => (
                      <div
                        key={sd.sub_domain_id}
                        className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                          selected.has(sd.sub_domain_id)
                            ? "border-blue-300 bg-blue-50"
                            : "border-gray-200 hover:bg-gray-50"
                        }`}
                        onClick={() => toggleSubDomain(sd.sub_domain_id)}
                      >
                        <Checkbox
                          checked={selected.has(sd.sub_domain_id)}
                          onCheckedChange={() => toggleSubDomain(sd.sub_domain_id)}
                          onClick={(e) => e.stopPropagation()}
                          className="mt-0.5 flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-mono text-gray-500">{sd.sub_domain_id}</span>
                          </div>
                          <p className="text-sm font-medium leading-tight mt-0.5">{sd.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{sd.controls.length} controls</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
