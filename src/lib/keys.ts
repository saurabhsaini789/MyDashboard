/**
 * Returns the environment-specific dashboard prefix (e.g. "my_dashboard" in
 * production, "my_dashboard_dev" locally). Throws instead of silently
 * degrading if NEXT_PUBLIC_DASHBOARD_ID isn't set, so we never read or write
 * an unprefixed dashboard_data row by accident.
 */
export const getDashboardPrefix = (): string => {
 const prefix = process.env.NEXT_PUBLIC_DASHBOARD_ID;
 if (!prefix) {
   throw new Error(
     'NEXT_PUBLIC_DASHBOARD_ID is not set. Set it in .env.local for local dev, ' +
     'or in the deploy environment for production — the app refuses to read or ' +
     'write dashboard_data without an explicit environment prefix.'
   );
 }
 return prefix;
};

export const getPrefixedKey = (key: string) => `${getDashboardPrefix()}:${key}`;
