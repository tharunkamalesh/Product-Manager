import type { ActionStep } from "@/types/copilot";

/**
 * Parses a time estimate string (e.g., "2 hours", "Today, 1h", "Tomorrow morning")
 * to extract a date offset (0 for today, 1 for tomorrow) and duration in minutes.
 */
function parseTimeEstimate(estimate: string): { dayOffset: number; durationMinutes: number } {
  const e = estimate.toLowerCase();
  let dayOffset = 0;
  let durationMinutes = 60; // Default to 1 hour

  if (e.includes("tomorrow")) {
    dayOffset = 1;
  }

  // Look for "X hours" or "X h"
  const hourMatch = e.match(/(\d+(\.\d+)?)\s*(hour|h)\b/);
  if (hourMatch) {
    durationMinutes = Math.round(parseFloat(hourMatch[1]) * 60);
  } else {
    // Look for "X min"
    const minMatch = e.match(/(\d+)\s*min/);
    if (minMatch) {
      durationMinutes = parseInt(minMatch[1], 10);
    }
  }

  return { dayOffset, durationMinutes };
}

/**
 * Formats a Date object to the ICS format: YYYYMMDDTHHMMSSZ
 */
function formatICSDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

/**
 * Generates an .ics file content from the action plan.
 */
export function generateActionPlanICS(actionPlan: ActionStep[]): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//PM Daily Copilot//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];

  const now = new Date();
  
  // Start the first task today at 10:00 AM local time, converted to UTC
  // Or just use the next available hour.
  const currentStartTime = new Date();
  currentStartTime.setHours(10, 0, 0, 0);

  actionPlan.forEach((step, index) => {
    const { dayOffset, durationMinutes } = parseTimeEstimate(step.timeEstimate);
    
    // Calculate start time for this specific task
    const eventStart = new Date(currentStartTime);
    eventStart.setDate(eventStart.getDate() + dayOffset);
    
    // If it's the second or third task, stack them if they are on the same day?
    // Actually, simple logic: just put them at 10 AM, 11 AM, etc.
    eventStart.setHours(10 + index, 0, 0, 0);

    const eventEnd = new Date(eventStart);
    eventEnd.setMinutes(eventEnd.getMinutes() + durationMinutes);

    const uid = `${Date.now()}-${index}@pm-daily-copilot`;
    const stamp = formatICSDate(now);
    const start = formatICSDate(eventStart);
    const end = formatICSDate(eventEnd);

    // Escape special characters for ICS
    const summary = step.task.replace(/[,;]/g, "\\$1");
    const description = step.nextStep.replace(/[,;]/g, "\\$1");

    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${uid}`);
    lines.push(`DTSTAMP:${stamp}`);
    lines.push(`DTSTART:${start}`);
    lines.push(`DTEND:${end}`);
    lines.push(`SUMMARY:${summary}`);
    lines.push(`DESCRIPTION:${description}`);
    lines.push("END:VEVENT");
  });

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

/**
 * Downloads the action plan as an .ics file.
 */
export function downloadActionPlanICS(actionPlan: ActionStep[]) {
  if (!actionPlan || actionPlan.length === 0) return;

  const icsContent = generateActionPlanICS(actionPlan);
  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.href = url;
  const dateStr = new Date().toISOString().slice(0, 10);
  link.download = `action-plan-${dateStr}.ics`;
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
