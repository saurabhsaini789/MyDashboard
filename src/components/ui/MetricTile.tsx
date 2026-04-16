import React from "react";
import { dashboardTokens, type DashboardTone } from "@/lib/design-system";
import { Text } from "@/components/ui/Text";

type MetricTileProps = {
 label: string;
 value: string | number;
 helper?: string;
 tone?: DashboardTone;
};

export function MetricTile({ label, value, helper, tone = "neutral" }: MetricTileProps) {
 const toneBg = dashboardTokens.state[tone].split(" ")[0];

 return (
 <div className="rounded-xl border border-border bg-card p-4 transition-all hover:shadow-sm">
 <Text variant="label">{label}</Text>
 <div className="mt-2 flex items-baseline gap-2">
 <Text variant="metric">{value}</Text>
 <span className={`h-2 w-2 rounded-full ${toneBg}`} />
 </div>
 {helper && (
 <Text variant="bodySmall" muted className="mt-2">

 {helper}
 </Text>
 )}
 </div>
 );
}
