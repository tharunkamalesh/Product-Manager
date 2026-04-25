import { cn } from "@/lib/utils";
import type { Impact } from "@/types/copilot";

const colorMap: Record<Impact, string> = {
  High: "bg-destructive/15 text-destructive border-destructive/30",
  Medium: "bg-warning/15 text-warning border-warning/30",
  Low: "bg-info/15 text-info border-info/30",
};

const effortColorMap: Record<Impact, string> = {
  High: "bg-muted text-muted-foreground border-border",
  Medium: "bg-muted text-muted-foreground border-border",
  Low: "bg-success/15 text-success border-success/30",
};

interface MetaPillProps {
  label: string;
  value: Impact;
  variant?: "impact" | "urgency" | "effort";
}

export const MetaPill = ({ label, value, variant = "impact" }: MetaPillProps) => {
  const colors = variant === "effort" ? effortColorMap[value] : colorMap[value];
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[10.5px] font-medium uppercase tracking-wide",
        colors
      )}
    >
      <span className="opacity-60">{label}</span>
      <span>{value}</span>
    </div>
  );
};
