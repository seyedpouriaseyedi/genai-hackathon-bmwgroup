import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import WeightsModal from "@/components/WeightsModal";
import ScenarioAdvisor from "@/components/ScenarioAdvisor";
import { useFileUpload } from "@/hooks/use-file-upload";
import { Upload, Zap, FileText, X, ChevronDown, ChevronUp } from "lucide-react";
import { scenarios } from "@/data/scenarios";
import { toast } from "@/hooks/use-toast";

const requiredFields = [
  "candidate_id", "name", "candidate_source", "latest_roles", "expertise",
  "years_experience", "leadership_years", "education_level", "industry_experience",
  "supply_chain_experience_years", "internal_company_knowledge", "cross_functional_scope",
];

const mockApplicants = [
  { name: "Elena Rodriguez", source: "LinkedIn Direct", years: 12, expertise: "Logistics Strategy" },
  { name: "Marcus Chen", source: "Referral (External)", years: 15, expertise: "Risk Mitigation" },
  { name: "Sarah Jenkins", source: "Indeed", years: 8, expertise: "Inventory Opt." },
  { name: "David Okoro", source: "Internal Transfer", years: 10, expertise: "Lean Operations" },
  { name: "Isabella Vont", source: "Executive Search", years: 18, expertise: "Global Sourcing" },
];

const ScenariosPage = () => {
  const [selected, setSelected] = useState<string[]>(["supply-chain"]);
  const [showWeightsModal, setShowWeightsModal] = useState(false);
  const [showFields, setShowFields] = useState(false);
  const navigate = useNavigate();

  const {
    fileName, isDragging, fileInputRef,
    handleClick, handleFileChange, handleDragOver, handleDragEnter, handleDragLeave, handleDrop, handleRemove,
  } = useFileUpload({
    onUpload: (file) => console.log("File uploaded:", file.name),
  });

  const toggleScenario = (id: string) => {
    setSelected((prev) => {
      if (prev.includes(id)) {
        if (prev.length === 1) return prev;
        return prev.filter((s) => s !== id);
      }
      return [...prev, id];
    });
  };

  const handleRunAnalysis = () => {
    const savedRemember = localStorage.getItem("remember_weights");
    if (savedRemember === "true") {
      toast({ title: "Evaluation started", description: "Head over to the Evaluations page to track progress." });
      navigate(`/evaluations?autorun=true&scenarios=${selected.join(",")}`);
    } else {
      setShowWeightsModal(true);
    }
  };

  const handleWeightsConfirm = (remember: boolean) => {
    setShowWeightsModal(false);
    toast({ title: "Evaluation started", description: "Head over to the Evaluations page to track progress." });
    navigate(`/evaluations?autorun=true&scenarios=${selected.join(",")}`);
  };

  return (
    <AppLayout>
      <div className="space-y-10">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">
            Candidate Evaluation for{" "}
            <span className="text-primary">Supply Chain Operations Lead</span>
          </h1>
          <p className="mt-3 text-muted-foreground max-w-2xl">
            Upload applicants, let the advisor recommend a scenario, and get a
            data-driven recommendation for the best candidate.
          </p>
        </div>

        {/* Scenario Advisor — always visible */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
            Choose a Scenario <span className="text-primary ml-1">({selected.length} selected)</span>
          </p>
          <div className="flex flex-col items-center gap-4">
            <ScenarioAdvisor
              selected={selected}
              onToggleScenario={toggleScenario}
              onClose={() => {}}
            />
            {/* Show selected scenarios as pills */}
            {selected.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {selected.map((id) => {
                  const s = scenarios.find((sc) => sc.id === id);
                  return s ? (
                    <span key={id} className="px-3 py-1 text-xs font-medium rounded-full border border-primary/40 text-primary bg-accent flex items-center gap-1.5">
                      {s.title}
                      <button onClick={() => toggleScenario(id)} className="hover:text-destructive"><X className="w-3 h-3" /></button>
                    </span>
                  ) : null;
                })}
              </div>
            )}
          </div>
        </div>

        {/* Upload Section */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
            Upload Applicant Data
          </p>
          <button
            onClick={() => setShowFields(!showFields)}
            className="flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-card-foreground transition-colors mb-4"
          >
            {showFields ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            {showFields ? "Hide" : "Show"} Required Fields ({requiredFields.length})
          </button>
          {showFields && (
            <div className="flex flex-wrap gap-2 mb-4 animate-fade-in">
              {requiredFields.map((f) => (
                <span key={f} className="px-3 py-1 text-xs font-mono rounded-full bg-secondary text-secondary-foreground">{f}</span>
              ))}
            </div>
          )}

          <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileChange} className="hidden" />

          {!fileName ? (
            <div onClick={handleClick} onDragOver={handleDragOver} onDragEnter={handleDragEnter} onDragLeave={handleDragLeave} onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-12 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${isDragging ? "border-primary bg-primary/5 scale-[1.01]" : "border-border bg-card/50 hover:border-muted-foreground/40"}`}>
              <Upload className={`w-10 h-10 mb-3 transition-colors ${isDragging ? "text-primary" : "text-muted-foreground"}`} />
              <p className="font-medium text-card-foreground">{isDragging ? "Drop your file here" : "Drag & drop or click to upload"}</p>
              <p className="text-xs text-muted-foreground mt-1">Only CSV files accepted</p>
            </div>
          ) : (
            <div className="bg-card rounded-lg border border-border p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center"><FileText className="w-5 h-5 text-primary" /></div>
                  <div>
                    <p className="text-sm font-medium text-card-foreground">{fileName}</p>
                    <p className="text-xs text-muted-foreground">File uploaded successfully</p>
                  </div>
                </div>
                <button onClick={handleRemove} className="p-2 rounded-md hover:bg-destructive/10 text-destructive transition-colors"><X className="w-4 h-4" /></button>
              </div>
            </div>
          )}
        </div>

        {/* Preview Table */}
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-border">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-card-foreground">Applicant Preview</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">{mockApplicants.length} applicants</span>
            </div>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-5 py-3 text-xs uppercase tracking-widest text-muted-foreground font-medium">Name</th>
                <th className="text-left px-5 py-3 text-xs uppercase tracking-widest text-muted-foreground font-medium">Source</th>
                <th className="text-left px-5 py-3 text-xs uppercase tracking-widest text-muted-foreground font-medium">Exp. Years</th>
                <th className="text-left px-5 py-3 text-xs uppercase tracking-widest text-muted-foreground font-medium">Expertise</th>
              </tr>
            </thead>
            <tbody>
              {mockApplicants.map((a) => (
                <tr key={a.name} className="border-b border-border last:border-0">
                  <td className="px-5 py-3 font-medium text-card-foreground">{a.name}</td>
                  <td className="px-5 py-3 text-muted-foreground">{a.source}</td>
                  <td className="px-5 py-3 text-muted-foreground text-center">{a.years}</td>
                  <td className="px-5 py-3">
                    <span className="text-xs font-semibold uppercase px-2 py-1 rounded bg-accent text-accent-foreground">{a.expertise}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Run Button */}
        <button onClick={handleRunAnalysis} disabled={selected.length === 0}
          className="w-full max-w-3xl mx-auto block py-4 rounded-lg bg-primary text-primary-foreground font-bold text-sm uppercase tracking-widest hover:bg-primary/90 transition-colors disabled:opacity-50">
          <span className="flex items-center justify-center gap-2">
            <Zap className="w-4 h-4" />
            Run Candidate Evaluation
          </span>
        </button>

        <p className="text-center text-xs text-muted-foreground">BMW DECISION INTELLIGENCE PLATFORM</p>
      </div>

      <WeightsModal open={showWeightsModal} onClose={() => setShowWeightsModal(false)} onConfirm={handleWeightsConfirm} />
    </AppLayout>
  );
};

export default ScenariosPage;
