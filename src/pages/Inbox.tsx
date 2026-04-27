import { useMemo, useState } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { TopBar } from "@/components/dashboard/TopBar";
import { useCopilot } from "@/hooks/useCopilot";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Trash2,
  Play,
  Plus,
  Pencil,
  Check,
  X,
  RotateCcw,
  Search,
  CheckSquare2,
  Square,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { InboxItem, InboxStatus } from "@/types/copilot";

type FilterTab = "all" | "pending" | "processed";

const formatDate = (iso: string) => {
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  const sameYear = d.getFullYear() === now.getFullYear();
  return d.toLocaleDateString([], {
    month: "short",
    day: "numeric",
    ...(sameYear ? {} : { year: "numeric" }),
  });
};

const issueKey = (id: string) => `INB-${id.slice(-6).toUpperCase()}`;

const Inbox = () => {
  const {
    inbox,
    addToInbox,
    removeFromInbox,
    editInboxItem,
    setInboxStatus,
    loading,
    hydrated,
  } = useCopilot();
  const navigate = useNavigate();

  const [newInput, setNewInput] = useState("");
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<FilterTab>("pending");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set());

  const counts = useMemo(() => {
    const pending = inbox.filter((i) => i.status === "pending").length;
    const processed = inbox.filter((i) => i.status === "processed").length;
    return { all: inbox.length, pending, processed };
  }, [inbox]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return inbox.filter((item) => {
      if (tab !== "all" && item.status !== tab) return false;
      if (q && !item.text.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [inbox, tab, search]);

  const withBusy = async (id: string, fn: () => Promise<void>) => {
    setBusyIds((prev) => new Set(prev).add(id));
    try {
      await fn();
    } catch (e: any) {
      toast.error(e?.message || "Action failed");
    } finally {
      setBusyIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleAdd = async () => {
    const text = newInput.trim();
    if (!text) return;
    try {
      await addToInbox(text);
      setNewInput("");
      toast.success("Item created");
    } catch (e: any) {
      toast.error(e?.message || "Could not add item");
    }
  };

  const startEdit = (item: InboxItem) => {
    setEditingId(item.id);
    setEditText(item.text);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText("");
  };

  const saveEdit = async (id: string) => {
    const text = editText.trim();
    if (!text) {
      toast.error("Text can't be empty");
      return;
    }
    await withBusy(id, async () => {
      await editInboxItem(id, text);
      setEditingId(null);
      setEditText("");
    });
  };

  const handleAnalyzeSingle = (item: InboxItem) => {
    navigate("/", { state: { analyze: item.text, inboxIds: [item.id] } });
  };

  const handleStatus = (id: string, status: InboxStatus) =>
    withBusy(id, () => setInboxStatus(id, status));

  const handleDelete = (id: string) =>
    withBusy(id, async () => {
      await removeFromInbox(id);
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    });

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const allFilteredSelected =
    filtered.length > 0 && filtered.every((i) => selected.has(i.id));

  const toggleSelectAll = () => {
    setSelected((prev) => {
      if (allFilteredSelected) {
        const next = new Set(prev);
        filtered.forEach((i) => next.delete(i.id));
        return next;
      }
      const next = new Set(prev);
      filtered.forEach((i) => next.add(i.id));
      return next;
    });
  };

  const selectedItems = useMemo(
    () => inbox.filter((i) => selected.has(i.id)),
    [inbox, selected]
  );

  const handleBulkAnalyze = () => {
    if (selectedItems.length === 0) return;
    const combined = selectedItems.map((i) => i.text).join("\n\n---\n\n");
    navigate("/", {
      state: { analyze: combined, inboxIds: selectedItems.map((i) => i.id) },
    });
  };

  const handleBulkDelete = async () => {
    if (selectedItems.length === 0) return;
    if (!confirm(`Delete ${selectedItems.length} item(s)?`)) return;
    await Promise.all(
      selectedItems.map((i) => removeFromInbox(i.id).catch(() => {}))
    );
    setSelected(new Set());
    toast.success("Deleted selected");
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <div className="flex-1 min-w-0">
        <TopBar />
        <main className="px-8 py-6 max-w-[1100px] mx-auto">
          {/* Page header */}
          <div className="flex items-end justify-between mb-6">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
                Projects / Founder's Compass
              </p>
              <h1 className="text-[22px] font-semibold tracking-tight mt-1">
                Inbox
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <Input
                value={newInput}
                onChange={(e) => setNewInput(e.target.value)}
                placeholder="Create a new item..."
                className="h-9 w-72 text-[13px]"
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              />
              <Button
                onClick={handleAdd}
                disabled={!newInput.trim()}
                size="sm"
                className="h-9"
              >
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Create
              </Button>
            </div>
          </div>

          {/* Toolbar */}
          <div className="flex items-center justify-between gap-4 mb-3">
            <div className="flex items-center gap-1">
              <FilterChip
                active={tab === "pending"}
                onClick={() => setTab("pending")}
                label="To do"
                count={counts.pending}
              />
              <FilterChip
                active={tab === "processed"}
                onClick={() => setTab("processed")}
                label="Done"
                count={counts.processed}
              />
              <FilterChip
                active={tab === "all"}
                onClick={() => setTab("all")}
                label="All"
                count={counts.all}
              />
            </div>
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search"
                className="pl-8 h-8 text-[13px]"
              />
            </div>
          </div>

          {/* Bulk action bar (replaces table header when active) */}
          {selectedItems.length > 0 && (
            <div className="flex items-center justify-between border border-border bg-muted/30 rounded-t-md px-3 py-2 text-[13px]">
              <span className="text-muted-foreground">
                {selectedItems.length} selected
              </span>
              <div className="flex items-center gap-1">
                <Button size="sm" variant="ghost" className="h-7 text-[12px]" onClick={handleBulkAnalyze}>
                  <Play className="h-3.5 w-3.5 mr-1.5" />
                  Analyze
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-[12px] text-destructive hover:text-destructive"
                  onClick={handleBulkDelete}
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                  Delete
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-[12px]"
                  onClick={() => setSelected(new Set())}
                >
                  Clear
                </Button>
              </div>
            </div>
          )}

          {/* Table */}
          <div
            className={cn(
              "border border-border bg-card overflow-hidden",
              selectedItems.length > 0 ? "rounded-b-md border-t-0" : "rounded-md"
            )}
          >
            {/* Header row */}
            <div className="grid grid-cols-[36px_120px_1fr_110px_90px_120px] items-center border-b border-border bg-muted/30 px-3 py-2 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
              <button
                type="button"
                onClick={toggleSelectAll}
                className="flex items-center justify-center text-muted-foreground hover:text-foreground"
                aria-label="Select all"
              >
                {allFilteredSelected ? (
                  <CheckSquare2 className="h-4 w-4" />
                ) : (
                  <Square className="h-4 w-4" />
                )}
              </button>
              <span>Key</span>
              <span>Summary</span>
              <span>Status</span>
              <span>Created</span>
              <span className="text-right pr-1">Actions</span>
            </div>

            {/* Rows */}
            {!hydrated || loading ? (
              <div className="px-3 py-16 text-center text-[13px] text-muted-foreground">
                Loading…
              </div>
            ) : filtered.length === 0 ? (
              <div className="px-3 py-20 text-center">
                <p className="text-[13px] text-muted-foreground">
                  {search.trim()
                    ? "No items match your search."
                    : tab === "pending"
                    ? "No open items. Create one above."
                    : tab === "processed"
                    ? "No completed items yet."
                    : "Your inbox is empty."}
                </p>
              </div>
            ) : (
              filtered.map((item) => {
                const isEditing = editingId === item.id;
                const isProcessed = item.status === "processed";
                const isBusy = busyIds.has(item.id);
                const isSelected = selected.has(item.id);
                return (
                  <div
                    key={item.id}
                    className={cn(
                      "group grid grid-cols-[36px_120px_1fr_110px_90px_120px] items-center border-b border-border last:border-b-0 px-3 py-2.5 text-[13px] transition-colors",
                      isSelected ? "bg-primary/[0.04]" : "hover:bg-muted/40"
                    )}
                  >
                    {/* Checkbox */}
                    <div className="flex items-center justify-center">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleSelect(item.id)}
                        aria-label="Select item"
                      />
                    </div>

                    {/* Issue key */}
                    <span className="text-[12px] font-mono text-muted-foreground truncate">
                      {issueKey(item.id)}
                    </span>

                    {/* Summary */}
                    <div className="min-w-0 pr-3">
                      {isEditing ? (
                        <textarea
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          rows={Math.min(6, Math.max(1, editText.split("\n").length))}
                          className="w-full text-[13px] rounded border border-border bg-card px-2 py-1.5 outline-none focus:border-primary/50"
                          autoFocus
                        />
                      ) : (
                        <p
                          className={cn(
                            "truncate",
                            isProcessed && "text-muted-foreground line-through"
                          )}
                          title={item.text}
                        >
                          {item.text.replace(/\n+/g, " · ")}
                        </p>
                      )}
                    </div>

                    {/* Status pill */}
                    <div>
                      <StatusPill status={item.status} />
                    </div>

                    {/* Date */}
                    <span className="text-[12px] text-muted-foreground">
                      {formatDate(item.timestamp)}
                    </span>

                    {/* Actions (visible on hover) */}
                    <div
                      className={cn(
                        "flex items-center justify-end gap-0.5 pr-1",
                        !isEditing && "opacity-0 group-hover:opacity-100 transition-opacity",
                        (isEditing || isSelected) && "opacity-100"
                      )}
                    >
                      {isEditing ? (
                        <>
                          <IconAction
                            label="Save"
                            onClick={() => saveEdit(item.id)}
                            disabled={isBusy}
                          >
                            <Check className="h-3.5 w-3.5" />
                          </IconAction>
                          <IconAction label="Cancel" onClick={cancelEdit}>
                            <X className="h-3.5 w-3.5" />
                          </IconAction>
                        </>
                      ) : (
                        <>
                          {!isProcessed && (
                            <IconAction
                              label="Analyze"
                              onClick={() => handleAnalyzeSingle(item)}
                              disabled={isBusy}
                            >
                              <Play className="h-3.5 w-3.5" />
                            </IconAction>
                          )}
                          {isProcessed ? (
                            <IconAction
                              label="Reopen"
                              onClick={() => handleStatus(item.id, "pending")}
                              disabled={isBusy}
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                            </IconAction>
                          ) : (
                            <IconAction
                              label="Mark done"
                              onClick={() => handleStatus(item.id, "processed")}
                              disabled={isBusy}
                            >
                              <Check className="h-3.5 w-3.5" />
                            </IconAction>
                          )}
                          <IconAction
                            label="Edit"
                            onClick={() => startEdit(item)}
                            disabled={isBusy}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </IconAction>
                          <IconAction
                            label="Delete"
                            destructive
                            onClick={() => handleDelete(item.id)}
                            disabled={isBusy}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </IconAction>
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer count */}
          {filtered.length > 0 && (
            <p className="mt-3 text-[11px] text-muted-foreground">
              {filtered.length} of {inbox.length} item{inbox.length === 1 ? "" : "s"}
            </p>
          )}
        </main>
      </div>
    </div>
  );
};

const FilterChip = ({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      "h-8 px-3 rounded-md text-[12px] font-medium transition-colors flex items-center gap-1.5",
      active
        ? "bg-primary/10 text-primary"
        : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
    )}
  >
    <span>{label}</span>
    <span
      className={cn(
        "text-[11px] tabular-nums",
        active ? "text-primary/70" : "text-muted-foreground/70"
      )}
    >
      {count}
    </span>
  </button>
);

const StatusPill = ({ status }: { status: InboxStatus }) => {
  if (status === "processed") {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[10px] font-semibold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
        Done
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[10px] font-semibold uppercase tracking-wider bg-blue-500/10 text-blue-600 dark:text-blue-400">
      To do
    </span>
  );
};

const IconAction = ({
  label,
  onClick,
  disabled,
  destructive,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  destructive?: boolean;
  children: React.ReactNode;
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={label}
    aria-label={label}
    className={cn(
      "h-7 w-7 inline-flex items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50 disabled:pointer-events-none transition-colors",
      destructive && "hover:text-destructive"
    )}
  >
    {children}
  </button>
);

export default Inbox;
