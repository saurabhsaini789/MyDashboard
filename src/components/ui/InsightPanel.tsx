import React from "react";
import { dashboardTokens } from "@/lib/design-system";
import { Text, SectionTitle } from "./Text";


export type DashboardInsight = {
 id: string;
 title: string;
 summary: string;
 nextStep: string;
};

type InsightPanelProps = {
 insights: DashboardInsight[];
};

export function InsightPanel({ insights }: InsightPanelProps) {
 if (insights.length === 0) {
 return (
 <div className="rounded-xl border border-border bg-card p-5">
 <SectionTitle>Insight</SectionTitle>
 <Text variant="bodySmall" muted className="mt-2">
 No patterns need attention. Keep the day simple.
 </Text>

 </div>
 );
 }

 return (
 <div className="rounded-xl border border-border bg-card p-5">
 <div className="mb-4">
 <SectionTitle>Insight</SectionTitle>
 <Text variant="bodySmall" muted>Clear next steps from today&apos;s signals.</Text>

 </div>
 <div className="flex flex-col divide-y divide-zinc-200 dark:divide-zinc-800">
 {insights.map((insight) => (
 <div key={insight.id} className="py-4 first:pt-0 last:pb-0">
 <h3 className="text-sm font-semibold text-zinc-950">{insight.title}</h3>
 <Text variant="bodySmall" muted className="mt-1">{insight.summary}</Text>

 <p className="mt-2 text-sm font-medium text-foreground">
 Next: {insight.nextStep}
 </p>
 </div>
 ))}
 </div>
 </div>
 );
}
