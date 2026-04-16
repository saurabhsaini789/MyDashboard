import React from "react";
import { dashboardTokens, type DashboardTone } from "@/lib/design-system";
import { Text } from "./Text";

type StatusBadgeProps = {
 tone?: DashboardTone;
 children: React.ReactNode;
 className?: string;
};

export function StatusBadge({ tone = "neutral", children, className = "" }: StatusBadgeProps) {
 return (
 <Text 
 variant="label" 
 as="span" 
 className={`inline-flex items-center rounded-md px-2 py-1 font-medium ${dashboardTokens.state[tone]} ${className}`}
 >
 {children}
 </Text>
 );
}
