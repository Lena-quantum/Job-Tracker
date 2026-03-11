import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Prospect } from "@shared/schema";
import { STATUSES } from "@shared/schema";
import { ProspectCard } from "@/components/prospect-card";
import { AddProspectForm } from "@/components/add-prospect-form";
import { Briefcase, Plus, Flame, ThumbsUp, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type InterestFilter = "All" | "High" | "Medium" | "Low";

const columnColors: Record<string, string> = {
  Bookmarked: "bg-blue-500",
  Applied: "bg-indigo-500",
  "Phone Screen": "bg-violet-500",
  Interviewing: "bg-amber-500",
  Offer: "bg-emerald-500",
  Rejected: "bg-red-500",
  Withdrawn: "bg-gray-500",
};

const FILTER_OPTIONS: {
  value: InterestFilter;
  label: string;
  icon: React.ReactNode;
  activeClass: string;
}[] = [
  {
    value: "All",
    label: "All",
    icon: null,
    activeClass: "bg-foreground text-background",
  },
  {
    value: "High",
    label: "High",
    icon: <Flame className="w-2.5 h-2.5" />,
    activeClass: "bg-red-500 text-white",
  },
  {
    value: "Medium",
    label: "Med",
    icon: <ThumbsUp className="w-2.5 h-2.5" />,
    activeClass: "bg-amber-500 text-white",
  },
  {
    value: "Low",
    label: "Low",
    icon: <Minus className="w-2.5 h-2.5" />,
    activeClass: "bg-slate-400 text-white",
  },
];

function ColumnInterestFilter({
  value,
  onChange,
}: {
  value: InterestFilter;
  onChange: (v: InterestFilter) => void;
}) {
  return (
    <div className="flex items-center gap-0.5 px-3 py-1.5 border-b border-border/50 bg-muted/20">
      <span className="text-[10px] text-muted-foreground mr-1 shrink-0 font-medium uppercase tracking-wide">
        Interest
      </span>
      <div className="flex items-center gap-0.5 rounded-md overflow-hidden border border-border/60 bg-background/60">
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={cn(
              "inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium transition-all duration-100 whitespace-nowrap leading-none",
              value === opt.value
                ? opt.activeClass
                : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
            )}
            aria-pressed={value === opt.value}
            data-testid={`filter-${opt.value.toLowerCase()}`}
          >
            {opt.icon}
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function KanbanColumn({
  status,
  prospects,
  isLoading,
}: {
  status: string;
  prospects: Prospect[];
  isLoading: boolean;
}) {
  const [interestFilter, setInterestFilter] = useState<InterestFilter>("All");

  const visibleCount =
    interestFilter === "All"
      ? prospects.length
      : prospects.filter((p) => p.interestLevel === interestFilter).length;

  return (
    <div
      className="flex flex-col min-w-[260px] max-w-[320px] w-full bg-muted/40 rounded-md"
      data-testid={`column-${status.replace(/\s+/g, "-").toLowerCase()}`}
    >
      {/* Column header */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border/50">
        <div
          className={`w-2 h-2 rounded-full ${columnColors[status] || "bg-gray-400"}`}
        />
        <h3 className="text-sm font-semibold truncate">{status}</h3>
        <Badge
          variant="secondary"
          className="ml-auto text-[10px] px-1.5 py-0 h-5 min-w-[20px] flex items-center justify-center no-default-active-elevate"
          data-testid={`badge-count-${status.replace(/\s+/g, "-").toLowerCase()}`}
        >
          {isLoading ? "—" : visibleCount}
        </Badge>
      </div>

      {/* Per-column interest filter */}
      {!isLoading && (
        <ColumnInterestFilter
          value={interestFilter}
          onChange={setInterestFilter}
        />
      )}

      {/* Cards */}
      <div className="flex-1 overflow-y-auto px-2 py-2">
        <div className="space-y-2">
          {isLoading ? (
            <>
              <Skeleton className="h-28 rounded-md" />
              <Skeleton className="h-20 rounded-md" />
            </>
          ) : prospects.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-8 text-center"
              data-testid={`empty-${status.replace(/\s+/g, "-").toLowerCase()}`}
            >
              <p className="text-xs text-muted-foreground">No prospects</p>
            </div>
          ) : (
            <>
              {prospects.map((prospect) => (
                <div
                  key={prospect.id}
                  className={
                    interestFilter !== "All" &&
                    prospect.interestLevel !== interestFilter
                      ? "hidden"
                      : undefined
                  }
                >
                  <ProspectCard prospect={prospect} />
                </div>
              ))}
              {visibleCount === 0 && (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <p className="text-xs text-muted-foreground">
                    No{" "}
                    <span className="font-medium">{interestFilter}</span>{" "}
                    interest prospects
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: prospects, isLoading } = useQuery<Prospect[]>({
    queryKey: ["/api/prospects"],
  });

  const groupedByStatus = STATUSES.reduce(
    (acc, status) => {
      acc[status] = (prospects ?? []).filter((p) => p.status === status);
      return acc;
    },
    {} as Record<string, Prospect[]>,
  );

  const totalCount = prospects?.length ?? 0;

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="border-b bg-card/50 backdrop-blur-sm shrink-0 z-50">
        <div className="px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-md bg-primary text-primary-foreground">
                <Briefcase className="w-4 h-4" />
              </div>
              <div>
                <h1
                  className="text-lg font-semibold tracking-tight leading-tight"
                  data-testid="text-app-title"
                >
                  JobTrackr
                </h1>
                <p
                  className="text-xs text-muted-foreground"
                  data-testid="text-prospect-count"
                >
                  {totalCount} prospect{totalCount !== 1 ? "s" : ""} tracked
                </p>
              </div>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" data-testid="button-add-prospect">
                  <Plus className="w-4 h-4 mr-1.5" />
                  Add Prospect
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Add New Prospect</DialogTitle>
                </DialogHeader>
                <AddProspectForm onSuccess={() => setDialogOpen(false)} />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex gap-3 p-4 h-full min-w-max">
          {STATUSES.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              prospects={groupedByStatus[status] || []}
              isLoading={isLoading}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
