/**
 * Safe error handling utility for Supabase operations
 * Never exposes raw database constraints or internals to users.
 */
export function formatDatabaseError(err: any, customAction = 'complete this request'): string {
  if (!navigator.onLine) {
    return `Couldn't save this entry. Please check your internet connection and try again.`;
  }

  const message = String(err?.message || err || '').toLowerCase();

  if (
    message.includes('failed to fetch') ||
    message.includes('network') ||
    message.includes('timeout') ||
    message.includes('connection refused')
  ) {
    return `Couldn't save this entry. Please check your internet connection and try again.`;
  }

  if (message.includes('jwt') || message.includes('unauthorized') || message.includes('not authenticated')) {
    return `Session expired or unauthorized. Please sign in again.`;
  }

  if (message.includes('unique') || message.includes('duplicate')) {
    if (message.includes('imei')) {
      return `This IMEI number already exists in active inventory stock.`;
    }
    return `A record with this information already exists.`;
  }

  return `Unable to ${customAction}. Please check your connection and try again.`;
}
