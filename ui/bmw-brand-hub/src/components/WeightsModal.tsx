import { useState, useEffect } from "react";
import { X, Settings2, ArrowRight } from "lucide-react";

interface WeightsModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (remember: boolean) => void;
}

const WeightsModal = ({ open, onClose, onConfirm }: WeightsModalProps) => {
  const [remember, setRemember] = useState(false);

  useEffect(() => {
    if (open) {
      const savedRemember = localStorage.getItem("remember_weights");
      setRemember(savedRemember === "true");
    }
  }, [open]);

  if (!open) return null;

  const handleConfirm = () => {
    if (remember) {
      localStorage.setItem("remember_weights", "true");
    } else {
      localStorage.removeItem("remember_weights");
    }
    onConfirm(remember);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold text-card-foreground">Before You Run</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-muted text-muted-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-6 space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            You can customize the <span className="text-card-foreground font-medium">evaluation weights and settings</span> in the{" "}
            <span className="text-primary font-semibold">Evaluations</span> tab before running the analysis. This controls how candidates are scored across scenarios.
          </p>

          <div className="rounded-lg bg-muted/50 border border-border p-4 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Configurable areas</p>
            <ul className="text-sm text-card-foreground space-y-1.5">
              <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-primary" /> Scenario Weights</li>
              <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-primary" /> Candidate Scoring Criteria</li>
              <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-primary" /> Ranking Settings</li>
            </ul>
          </div>

          <label className="flex items-center gap-3 pt-1 cursor-pointer">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="w-4 h-4 rounded border-border accent-primary"
            />
            <span className="text-sm text-card-foreground">Don't show this again</span>
          </label>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-md border border-border text-sm font-medium text-card-foreground hover:bg-muted transition-colors"
          >
            Go to Evaluations
          </button>
          <button
            onClick={handleConfirm}
            className="px-5 py-2 rounded-md bg-primary text-primary-foreground text-sm font-bold uppercase tracking-wider hover:bg-primary/90 transition-colors flex items-center gap-2"
          >
            Continue
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default WeightsModal;
