import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Bot, Sparkles, Zap, ShieldCheck } from "lucide-react"

export function OnboardingGuide({ children }: { children: React.ReactNode }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Welcome to PM Daily Copilot
          </DialogTitle>
          <DialogDescription>
            Your AI-powered decision engine. Here's how to get started.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="flex items-start gap-4">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Zap className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold">Capture Everything</p>
              <p className="text-xs text-muted-foreground mt-1">
                Paste task lists, Slack messages, or Jira bug reports into the capture box at the top.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="h-8 w-8 rounded-lg bg-priority-medium/10 flex items-center justify-center shrink-0">
              <Bot className="h-4 w-4 text-priority-medium" />
            </div>
            <div>
              <p className="text-sm font-semibold">AI Prioritization</p>
              <p className="text-xs text-muted-foreground mt-1">
                Our AI analyzes impact, urgency, and effort to bucket your tasks into High, Medium, and Low priorities.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="h-8 w-8 rounded-lg bg-priority-low/10 flex items-center justify-center shrink-0">
              <ShieldCheck className="h-4 w-4 text-priority-low" />
            </div>
            <div>
              <p className="text-sm font-semibold">Execute the Plan</p>
              <p className="text-xs text-muted-foreground mt-1">
                Follow the generated action plan, assign owners, and track your daily progress.
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
