import React from "react";
import { Text, TextVariant } from "@/components/ui/Text";
import { cn } from "@/lib/utils";

type SectionHeaderProps = {
 title: string;
 description?: string;
 actions?: React.ReactNode;
 variant?: TextVariant;
 className?: string;
};

export function SectionHeader({ 
 title, 
 description, 
 actions, 
 variant = "heading",
 className 
}: SectionHeaderProps) {
 return (
 <div className={cn("flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between", className)}>
 <div>
 <Text variant={variant}>{title}</Text>
 {description && (
 <Text variant="bodySmall" muted className="mt-1">
 {description}
 </Text>

 )}
 </div>
 {actions && <div className="shrink-0">{actions}</div>}
 </div>
 );
}
