import { useState } from "react";
import type { Prospect } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { ExternalLink, Trash2, Pencil, Flame, ThumbsUp, Minus, CalendarClock } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EditProspectForm } from "./edit-prospect-form";

function InterestIndicator({ level }: { level: string }) {
  switch (level) {
    case "High":
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-red-500 dark:text-red-400" data-testid="interest-high">
          <Flame className="w-3 h-3" />
          High
        </span>
      );
    case "Medium":
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-500 dark:text-amber-400" data-testid="interest-medium">
          <ThumbsUp className="w-3 h-3" />
          Medium
        </span>
      );
    case "Low":
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground" data-testid="interest-low">
          <Minus className="w-3 h-3" />
          Low
        </span>
      );
    default:
      return null;
  }
}

type DeadlineUrgency = "overdue" | "urgent" | "soon" | "fine";

function classifyDeadline(deadlineDateStr: string): DeadlineUrgency {
  const [year, month, day] = deadlineDateStr.split("-").map(Number);
  const deadlineMidnight = new Date(year, month - 1, day);
  const now = new Date();
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffMs = deadlineMidnight.getTime() - todayMidnight.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return "overdue";
  if (diffDays <= 3) return "urgent";
  if (diffDays <= 7) return "soon";
  return "fine";
}

function formatDeadlineDate(deadlineDateStr: string): string {
  const [year, month, day] = deadlineDateStr.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(year, month - 1, day));
}

const urgencyStyles: Record<DeadlineUrgency, string> = {
  overdue: "text-red-800 dark:text-red-400",
  urgent: "text-red-500 dark:text-red-400",
  soon: "text-amber-500 dark:text-amber-400",
  fine: "text-emerald-600 dark:text-emerald-400",
};

function DeadlineBadge({ dateStr, prospectId }: { dateStr: string; prospectId: number }) {
  const urgency = classifyDeadline(dateStr);
  const className = `inline-flex items-center gap-1 text-[11px] font-medium ${urgencyStyles[urgency]}`;

  return (
    <span className={className} data-testid={`text-deadline-${prospectId}`}>
      <CalendarClock className="w-3 h-3 shrink-0" />
      {urgency === "overdue" ? "Overdue" : `Due: ${formatDeadlineDate(dateStr)}`}
    </span>
  );
}

export function ProspectCard({ prospect }: { prospect: Prospect }) {
  const { toast } = useToast();
  const [editOpen, setEditOpen] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/prospects/${prospect.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/prospects"] });
      toast({ title: "Prospect deleted" });
    },
    onError: () => {
      toast({ title: "Failed to delete prospect", variant: "destructive" });
    },
  });

  return (
    <>
      <div
        className="group bg-card border border-card-border rounded-md p-3 space-y-2 hover-elevate cursor-pointer transition-all duration-150"
        onClick={() => setEditOpen(true)}
        data-testid={`card-prospect-${prospect.id}`}
      >
        <div className="flex items-start justify-between gap-1">
          <div className="min-w-0 flex-1">
            <h4 className="font-semibold text-sm leading-tight truncate" data-testid={`text-company-${prospect.id}`}>
              {prospect.companyName}
            </h4>
            <p className="text-xs text-muted-foreground truncate mt-0.5" data-testid={`text-role-${prospect.id}`}>
              {prospect.roleTitle}
            </p>
          </div>
          <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              onClick={(e) => {
                e.stopPropagation();
                setEditOpen(true);
              }}
              data-testid={`button-edit-${prospect.id}`}
            >
              <Pencil className="w-3 h-3 text-muted-foreground" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              onClick={(e) => {
                e.stopPropagation();
                deleteMutation.mutate();
              }}
              disabled={deleteMutation.isPending}
              data-testid={`button-delete-${prospect.id}`}
            >
              <Trash2 className="w-3 h-3 text-muted-foreground" />
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-1.5 flex-wrap">
          <InterestIndicator level={prospect.interestLevel} />
          {prospect.targetSalary != null && prospect.targetSalary > 0 && (
            <span
              className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 tabular-nums"
              data-testid={`text-salary-${prospect.id}`}
            >
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
                maximumFractionDigits: 0,
              }).format(prospect.targetSalary)}{" "}
              / yr
            </span>
          )}
        </div>

        {prospect.applicationDeadline && (
          <DeadlineBadge dateStr={prospect.applicationDeadline} prospectId={prospect.id} />
        )}

        {prospect.jobUrl && (
          <a
            href={prospect.jobUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            onClick={(e) => e.stopPropagation()}
            data-testid={`link-job-url-${prospect.id}`}
          >
            <ExternalLink className="w-3 h-3" />
            Posting
          </a>
        )}

        {prospect.notes && (
          <p className="text-xs text-muted-foreground line-clamp-2" data-testid={`text-notes-${prospect.id}`}>
            {prospect.notes}
          </p>
        )}
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Prospect</DialogTitle>
          </DialogHeader>
          <EditProspectForm prospect={prospect} onSuccess={() => setEditOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}
