export const typography = {
  display: "text-[32px] font-semibold tracking-tight leading-[42px]",
  metric: "text-2xl font-semibold leading-[30px]",
  title: "text-xl font-semibold leading-[26px]",
  heading: "text-base font-semibold leading-[22px]",
  body: "text-sm font-normal leading-[20px]",
  bodySmall: "text-[13px] font-normal leading-[18px]",
  description: "text-[13px] font-normal leading-[18px]",
  label: "text-xs font-medium tracking-wide leading-[16px]",
  mono: "text-xs font-mono leading-[16px]",
} as const;

export const typographySpacing = {
  display: "mb-1",
  title: "mb-4",
  heading: "mb-4",
  body: "mb-2",
  section: "mb-8",
} as const;



export const dashboardTokens = {
  radius: {
    sm: "rounded-md",
    md: "rounded-lg",
    lg: "rounded-xl",
  },
  surface: {
    page: "bg-background text-foreground",
    card: "border border-border bg-card shadow-sm",
    muted: "bg-muted/5",
  },
  state: {
    critical: "bg-error/10 text-error",
    important: "bg-warning/10 text-warning",
    success: "bg-success/10 text-success",
    info: "bg-info/10 text-info",
    neutral: "bg-muted/10 text-muted",
  },
} as const;

export type DashboardTone = keyof typeof dashboardTokens.state;
