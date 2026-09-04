const fs = require('fs');

const resetData = JSON.parse(fs.readFileSync('pakmobile_reset.json', 'utf8'));

// Replacement for Entities block
const replacementEntities = `  // Entities (Initialized with initial capital & handwritten entries)
  partners: ${JSON.stringify(resetData.partners, null, 4)},
  mobiles: [],
  phones: [],
  purchases: [],
  sales: ${JSON.stringify(resetData.sales, null, 4)},
  expenses: ${JSON.stringify(resetData.expenses, null, 4)},
  transactions: ${JSON.stringify(resetData.transactions, null, 4)},
  budgets: [],
  budget: DEFAULT_BUDGET,
  settings: DEFAULT_SETTINGS,
  drawings: [],`;

const storePath = 'src/store/useAppStore.ts';
let storeContent = fs.readFileSync(storePath, 'utf8');

const startMarker = "  // Entities (Initialized with initial capital & handwritten entries)";
const endMarker = "  drawings: [],";

const startIndex = storeContent.indexOf(startMarker);
const endIndex = storeContent.indexOf(endMarker) + endMarker.length;

if (startIndex === -1 || endIndex === -1) {
  console.log("Could not find markers!");
  process.exit(1);
}

const before = storeContent.substring(0, startIndex);
const after = storeContent.substring(endIndex);

let newContent = before + replacementEntities + after;

// Now let's enhance fetchInitialData to check if Supabase is configured
const oldFetchMarker = `  // --- Initial Data Fetch from Supabase ---
  fetchInitialData: async () => {
    set({ isLoadingData: true, dbError: null });

    try {`;

const newFetchMarker = `  // --- Initial Data Fetch from Supabase ---
  fetchInitialData: async () => {
    // If Supabase is not configured, load from localStorage if available or retain store defaults
    if (!isSupabaseConfigured()) {
      try {
        if (typeof window !== 'undefined') {
          const localRaw = localStorage.getItem('pakmobile_local_db');
          if (localRaw) {
            const parsed = JSON.parse(localRaw);
            if (parsed && typeof parsed === 'object') {
              const loadedMobiles = parsed.mobiles || parsed.phones || [];
              set({
                partners: parsed.partners && parsed.partners.length > 0 ? parsed.partners : get().partners,
                mobiles: loadedMobiles,
                phones: loadedMobiles,
                purchases: parsed.purchases || get().purchases,
                sales: parsed.sales && parsed.sales.length > 0 ? parsed.sales : get().sales,
                expenses: parsed.expenses && parsed.expenses.length > 0 ? parsed.expenses : get().expenses,
                transactions: parsed.transactions && parsed.transactions.length > 0 ? parsed.transactions : get().transactions,
                budgets: parsed.budgets || get().budgets,
                settings: parsed.settings || get().settings,
                isLoadingData: false,
                isSupabaseConnected: false,
                dbError: null,
              });
              return;
            }
          }
        }
      } catch (err) {
        console.error('[useAppStore] local storage load error:', err);
      }

      // Initialize localStorage with current defaults
      try {
        if (typeof window !== 'undefined') {
          const state = get();
          localStorage.setItem('pakmobile_local_db', JSON.stringify({
            partners: state.partners,
            mobiles: state.mobiles,
            purchases: state.purchases,
            sales: state.sales,
            expenses: state.expenses,
            transactions: state.transactions,
            budgets: state.budgets,
            settings: state.settings,
          }));
        }
      } catch (e) {}

      set({
        isLoadingData: false,
        isSupabaseConnected: false,
        dbError: null,
      });
      return;
    }

    set({ isLoadingData: true, dbError: null });

    try {`;

if (newContent.includes(oldFetchMarker)) {
  newContent = newContent.replace(oldFetchMarker, newFetchMarker);
  console.log("fetchInitialData updated with offline fallback!");
} else {
  console.log("Note: oldFetchMarker not matched exactly, will check manually.");
}

fs.writeFileSync(storePath, newContent);
console.log("useAppStore.ts updated successfully with all entries!");
