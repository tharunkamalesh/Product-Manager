import { Sparkles, Loader2, Slack, Mail, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

interface InputBarProps {
  value: string;
  onChange: (v: string) => void;
  onAnalyze: () => void;
  loading: boolean;
}

export const InputBar = ({ value, onChange, onAnalyze, loading }: InputBarProps) => {
  return (
    <section className="rounded-xl border border-border bg-card shadow-card p-5">
      <h2 className="text-sm font-semibold mb-3">Capture your daily problems, tasks, bugs, messages...</h2>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Paste anything here... (bug reports, customer messages, slack conversations, notes, tasks…)"
        className="w-full min-h-[110px] resize-none rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm placeholder:text-muted-foreground/70 focus:bg-card focus:border-primary/40 outline-none transition-smooth"
      />
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <SourceChip icon={<Slack className="h-3.5 w-3.5" />} label="Slack" color="text-[#611f69]" />
          <SourceChip icon={<Mail className="h-3.5 w-3.5" />} label="Email" color="text-info" />
          <SourceChip icon={<JiraIcon />} label="Jira" color="text-info" />
          <SourceChip icon={<Upload className="h-3.5 w-3.5" />} label="Upload" color="text-muted-foreground" />
        </div>
        <Button
          onClick={onAnalyze}
          disabled={loading || !value.trim()}
          variant="primary"
          className="gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Thinking...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Analyze Now
            </>
          )}
        </Button>
      </div>
    </section>
  );
};

const SourceChip = ({ icon, label, color }: { icon: React.ReactNode; label: string; color: string }) => (
  <button
    type="button"
    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-border bg-card hover:bg-muted text-xs font-medium transition-smooth"
  >
    <span className={color}>{icon}</span>
    {label}
  </button>
);

const JiraIcon = () => (
  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor">
    <path d="M11.571 11.513H0a5.218 5.218 0 0 0 5.232 5.215h2.13v2.057A5.215 5.215 0 0 0 12.575 24V12.518a1.005 1.005 0 0 0-1.005-1.005zm5.723-5.756H5.736a5.215 5.215 0 0 0 5.215 5.214h2.129v2.058a5.218 5.218 0 0 0 5.215 5.214V6.762a1.005 1.005 0 0 0-1.001-1.005zM23.013 0H11.455a5.215 5.215 0 0 0 5.215 5.215h2.129v2.057A5.215 5.215 0 0 0 24 12.483V1.005A1.005 1.005 0 0 0 23.013 0z"/>
  </svg>
);
