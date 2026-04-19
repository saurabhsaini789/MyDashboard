import { createClient } from './server';
import { SYNC_KEYS } from '../sync-keys';
import { getPrefixedKey } from '../keys';

/**
 * Fetch specific keys from the dashboard_data table.
 * Enforces user-scoped and column-specific fetching.
 */
export async function getDashboardData(keys: string[]) {
  const supabase = await createClient();
  
  // Get current user session
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    console.error('Error fetching user for dashboard data:', userError);
    return {};
  }

  const prefixedKeys = keys.map(k => getPrefixedKey(k));

  const { data, error } = await supabase
    .from('dashboard_data')
    .select('key, value')
    .eq('user_id', user.id)
    .in('key', prefixedKeys);

  if (error) {
    console.error('Error fetching dashboard data:', error);
    return {};
  }

  // Map back to unprefixed keys for the components
  const result: Record<string, any> = {};
  data?.forEach(row => {
    const baseKey = keys.find(k => getPrefixedKey(k) === row.key);
    if (baseKey) {
      result[baseKey] = row.value;
    }
  });

  return result;
}
