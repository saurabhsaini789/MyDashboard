export const getPrefixedKey = (key: string) => {
  const prefix = process.env.NEXT_PUBLIC_DASHBOARD_ID;
  if (!prefix) return key;
  return `${prefix}:${key}`;
};
