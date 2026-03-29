import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { User, Loader2 } from "lucide-react";
import BmwLogoBackground from "./BmwLogoBackground";
import ThemeToggle from "./ThemeToggle";
import { usePipelineContext } from "@/contexts/PipelineContext";

const navItems = [
  { label: "Scenarios", path: "/" },
  { label: "Evaluations", path: "/evaluations" },
  { label: "Recommendation", path: "/recommendation" },
  { label: "Archive", path: "/archive" },
];

const AppLayout = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const pipeline = usePipelineContext();
  const showIndicator = pipeline.isRunning && location.pathname !== "/evaluations";

  return (
    <div className="min-h-screen bg-background text-foreground relative">
      <BmwLogoBackground />

      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        {/* Pipeline background progress bar */}
        {showIndicator && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-muted">
            <div
              className="h-full bg-primary transition-all duration-300 ease-linear"
              style={{ width: `${pipeline.progress}%` }}
            />
          </div>
        )}
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-14">
          <div className="flex items-center gap-8">
            <Link to="/" className="text-lg font-bold tracking-tight text-primary">
              Decision Intelligence
            </Link>
            <div className="flex items-center gap-1">
              {navItems.map((item) => {
                const active = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`relative px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                      active
                        ? "text-foreground border-b-2 border-primary"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {item.label}
                    {item.path === "/evaluations" && pipeline.isRunning && !active && (
                      <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary" />
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {showIndicator && (
              <Link
                to="/evaluations"
                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors"
              >
                <Loader2 className="w-3 h-3 animate-spin" />
                Evaluating {Math.round(pipeline.progress)}%
              </Link>
            )}
            <ThemeToggle />
            <button className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
              <User className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  );
};

export default AppLayout;
