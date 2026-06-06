"use client";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { AspecLogo } from "@/components/aspec-logo";

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted/60", className)}
      {...props}
    />
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <Card className={cn("overflow-hidden border-border bg-card shadow-[var(--shadow-card)]", className)}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-3 w-full">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="h-10 w-10 shrink-0 rounded-xl" />
        </div>
      </CardContent>
    </Card>
  );
}

export function SkeletonTable({ rows = 5, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div className="w-full">
      {/* Table Header Skeleton */}
      <div className="flex items-center justify-between border-b border-border py-4 px-4 bg-muted/10">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-24" />
        ))}
      </div>
      {/* Table Body Skeleton */}
      <div className="divide-y divide-border">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex items-center justify-between py-4 px-4 hover:bg-transparent">
            {Array.from({ length: columns }).map((_, c) => (
              <Skeleton key={c} className={`h-4 ${c === 0 ? "w-32" : c === columns - 1 ? "w-16" : "w-24"}`} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function PageLoadingScreen({ message = "Memuat telemetry data..." }: { message?: string }) {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center text-muted-foreground text-sm space-y-4">
      <div className="relative">
        <div className="absolute inset-0 flex items-center justify-center animate-ping opacity-20">
          <AspecLogo size={64} />
        </div>
        <div className="relative animate-pulse">
          <AspecLogo size={48} />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin text-cyan" />
        <span className="animate-pulse">{message}</span>
      </div>
    </div>
  );
}

// Need to import Card and CardContent here because we use it in SkeletonCard
import { Card, CardContent } from "@/components/ui/card";
