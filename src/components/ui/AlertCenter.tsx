import Link from "next/link";
import React from "react";
import { type DashboardTone } from "@/lib/design-system";
import { StatusBadge } from "./StatusBadge";
import { Text, SectionTitle } from "./Text";

export type AlertPriority = "critical" | "important" | "low";

export type DashboardAlert = {
 id: string;
 priority: AlertPriority;
 title: string;
 description: string;
 actionLabel: string;
 href: string;
};

const priorityMeta: Record<
 AlertPriority,
 { label: string; tone: DashboardTone; border: string }
> = {
 critical: { label: "Critical", tone: "critical", border: "border-l-rose-500", },
 important: { label: "Important", tone: "important", border: "border-l-amber-500", },
 low: { label: "Low", tone: "neutral", border: "border-l-zinc-300 dark:border-l-zinc-700", },
};

type AlertCenterProps = {
 alerts: DashboardAlert[];
 maxVisible?: number;
};

export function AlertCenter({ alerts, maxVisible = 3 }: AlertCenterProps) {
 const visibleAlerts = alerts.slice(0, maxVisible);
 const hiddenCount = Math.max(alerts.length - visibleAlerts.length, 0);

 if (alerts.length === 0) {
 return (
 <div className="rounded-xl border border-data-positive bg-data-positive p-5">
 <StatusBadge tone="success">Stable</StatusBadge>
 <SectionTitle className="mt-3 text-inherit"> All priority systems are clear </SectionTitle>
 <Text variant="bodySmall" className="mt-1 text-inherit"> No critical or important items need action right now. </Text>
 </div>
 );
 }

 return (
 <div className="flex flex-col gap-3">
 {visibleAlerts.map((alert) => {
 const meta = priorityMeta[alert.priority];
 return (
 <div key={alert.id} className={`rounded-xl border-y border-r border-l-4 border-border bg-card p-4 shadow-sm ${meta.border}`} >
 <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
 <div className="min-w-0">
 <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>
 <Text variant="heading" className="mt-3 text-zinc-950 dark:text-zinc-50"> {alert.title} </Text>
 <Text variant="bodySmall" muted className="mt-1">{alert.description}</Text>

 </div>
 <Link href={alert.href} className="inline-flex shrink-0 items-center justify-center rounded-lg bg-zinc-950 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-muted dark:bg-card dark:hover:bg-zinc-200" >
 {alert.actionLabel}
 </Link>
 </div>
 </div>
 );
 })}
 {hiddenCount > 0 && (
 <Text variant="bodySmall" muted className="px-1">

 {hiddenCount} lower-priority item{hiddenCount === 1 ? "" : "s"} grouped to keep today focused.
 </Text>
 )}
 </div>
 );
}
