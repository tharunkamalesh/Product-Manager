import { useRef } from "react";
import { Sparkles, Loader2, Slack, Mail, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface InputBarProps {
  value: string;
  onChange: (v: string) => void;
  onAnalyze: () => void;
  loading: boolean;
}

const SLACK_SAMPLE = `[#product-bugs] @sarah: payment crashes on Android 14 after pressing "Pay Now" — looks like the new SDK update. 12 reports already this morning.
[#cs-escalations] @jin: enterprise customer (Acme) blocked, can't onboard new users. Needs response by EOD.
[#general] @mike: anyone else seeing dashboard load times >5s? Started after this morning's deploy.`;

const EMAIL_SAMPLE = `From: priya@bigcustomer.com
Subject: Critical — checkout broken
Our team can't complete purchases since this morning. We're losing ~$2k/hour. Please advise.

From: alex@partner.io
Subject: Re: Q2 roadmap sync
Can we move tomorrow's call to Thursday? Also, can you share the proposal deck?`;

const JIRA_SAMPLE = `BUG-1421 (P1) — Payment SDK crash on Android 14 after Pay Now tap
BUG-1418 (P2) — Dashboard slow load (>5s) after morning deploy
TASK-902 — Q2 roadmap deck for partner review
SUPP-330 — Acme onboarding blocked, multiple admins can't invite users`;

export const InputBar = ({ value, onChange, onAnalyze, loading }: InputBarProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const appendToInput = (text: string) => {
    const next = value.trim() ? `${value.trim()}\n\n${text}` : text;
    onChange(next);
  };

  const handleSlack = () => {
    appendToInput(SLACK_SAMPLE);
    toast.success("Imported sample Slack messages");
  };

  const handleEmail = () => {
    appendToInput(EMAIL_SAMPLE);
    toast.success("Imported sample emails");
  };

  const handleJira = () => {
    appendToInput(JIRA_SAMPLE);
    toast.success("Imported sample Jira issues");
  };

  const handleUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1_000_000) {
      toast.error("File too large", { description: "Please upload a file under 1 MB." });
      e.target.value = "";
      return;
    }
    try {
      const text = await file.text();
      appendToInput(text);
      toast.success(`Loaded ${file.name}`);
    } catch {
      toast.error("Could not read file");
    } finally {
      e.target.value = "";
    }
  };

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
          <SourceChip onClick={handleSlack} icon={<Slack className="h-3.5 w-3.5" />} label="Slack" color="text-[#611f69]" />
          <SourceChip onClick={handleEmail} icon={<Mail className="h-3.5 w-3.5" />} label="Email" color="text-info" />
          <SourceChip onClick={handleJira} icon={<JiraIcon />} label="Jira" color="text-info" />
          <SourceChip onClick={handleUpload} icon={<Upload className="h-3.5 w-3.5" />} label="Upload" color="text-muted-foreground" />
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.md,.csv,.json,.log"
            onChange={handleFile}
            className="hidden"
          />
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

const SourceChip = ({ icon, label, color, onClick }: { icon: React.ReactNode; label: string; color: string; onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
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
