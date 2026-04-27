import { useRef } from "react";
import { Sparkles, Loader2, Mail, Upload, Slack } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface InputBarProps {
  value: string;
  onChange: (v: string) => void;
  onAnalyze: () => void;
  loading: boolean;
}

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

const SLACK_SAMPLE = `[#ops-critical] 🚨 ALERT: Error rate spikes in checkout service. 15% of sessions failing.
[#product-feedback] User 'jake_123' says the new onboarding flow is confusing. "Too many steps!"
[#general] @here reminder to update your Q3 OKRs in the sheet by Friday.`;

export const InputBar = ({
  value,
  onChange,
  onAnalyze,
  loading,
}: InputBarProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const appendToInput = (text: string) => {
    const next = value.trim() ? `${value.trim()}\n\n${text}` : text;
    onChange(next);
  };

  const handleEmail = () => {
    appendToInput(EMAIL_SAMPLE);
    toast.success("Imported sample emails");
  };

  const handleJira = () => {
    appendToInput(JIRA_SAMPLE);
    toast.success("Imported sample Jira issues");
  };

  const handleSlack = () => {
    appendToInput(SLACK_SAMPLE);
    toast.success("Imported sample Slack messages");
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
    <section className="rounded-md border border-border bg-card">
      <div className="px-4 py-3 border-b border-border">
        <h2 className="text-[13px] font-semibold">Capture inputs</h2>
        <p className="text-[11.5px] text-muted-foreground mt-0.5">
          Paste bug reports, customer messages, notes, or tasks — we'll prioritize them.
        </p>
      </div>
      <div className="p-4">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Paste anything here..."
          className="w-full min-h-[110px] resize-none rounded border border-border bg-card px-3 py-2 text-[13px] placeholder:text-muted-foreground/70 focus:border-primary/60 outline-none transition-colors"
        />
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <SourceChip onClick={handleEmail} icon={<Mail className="h-3.5 w-3.5" />} label="Email" />
            <SourceChip onClick={handleJira} icon={<JiraIcon />} label="Jira" />
            <SourceChip
              onClick={handleSlack}
              icon={<Slack className="h-3.5 w-3.5" />}
              label="Slack"
            />
            <SourceChip onClick={handleUpload} icon={<Upload className="h-3.5 w-3.5" />} label="Upload" />
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
            size="sm"
            className="gap-1.5 h-8"
          >
            {loading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Analyzing
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" />
                Analyze
              </>
            )}
          </Button>
        </div>
      </div>
    </section>
  );
};

const SourceChip = ({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      "inline-flex items-center gap-1.5 px-2 h-7 rounded border border-border bg-card hover:bg-muted text-[12px] font-medium text-muted-foreground hover:text-foreground transition-colors"
    )}
  >
    <span>{icon}</span>
    {label}
  </button>
);


const JiraIcon = () => (
  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor">
    <path d="M11.571 11.513H0a5.218 5.218 0 0 0 5.232 5.215h2.13v2.057A5.215 5.215 0 0 0 12.575 24V12.518a1.005 1.005 0 0 0-1.005-1.005zm5.723-5.756H5.736a5.215 5.215 0 0 0 5.215 5.214h2.129v2.058a5.218 5.218 0 0 0 5.215 5.214V6.762a1.005 1.005 0 0 0-1.001-1.005zM23.013 0H11.455a5.215 5.215 0 0 0 5.215 5.215h2.129v2.057A5.215 5.215 0 0 0 24 12.483V1.005A1.005 1.005 0 0 0 23.013 0z" />
  </svg>
);

