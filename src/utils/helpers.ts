export function generateId(prefix: string = 'item'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
}

export function generateInvoiceNumber(sequence: number): string {
  const currentYear = new Date().getFullYear();
  return `INV-${currentYear}-${String(sequence).padStart(4, '0')}`;
}

export function generatePurchaseNumber(sequence: number): string {
  const currentYear = new Date().getFullYear();
  return `PUR-${currentYear}-${String(sequence).padStart(4, '0')}`;
}

/**
 * Filter items by multi-word query across model, brand, imei, color
 */
export function matchesSearch(query: string, ...fields: (string | undefined | null)[]): boolean {
  if (!query || !query.trim()) return true;
  const q = query.toLowerCase().trim();
  return fields.some(field => field && field.toLowerCase().includes(q));
}
