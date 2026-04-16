import React from "react";
import { Text, PageTitle } from "@/components/ui/Text";

type PageHeaderProps = {
 eyebrow?: string;
 title: string;
 description?: string;
 actions?: React.ReactNode;
};

export function PageHeader({ eyebrow, title, description, actions }: PageHeaderProps) {
 return (
 <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
 <div className="max-w-2xl">
 {eyebrow && <Text variant="label">{eyebrow}</Text>}
 <PageTitle>{title}</PageTitle>
 {description && (
 <Text variant="bodySmall" muted>

 {description}
 </Text>
 )}
 </div>
 {actions && <div className="shrink-0">{actions}</div>}
 </header>
 );
}
