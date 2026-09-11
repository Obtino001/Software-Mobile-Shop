const fs = require('fs');
const file = 'src/store/useAppStore.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(/import \{ supabase, isSupabaseConfigured \} from '\.\.\/lib\/supabase';/g, "import { isFirebaseConfigured } from '../lib/firebase';");
code = code.replace(/isSupabaseConfigured/g, 'isFirebaseConfigured');
code = code.replace(/isSupabaseConnected/g, 'isFirebaseConnected');
code = code.replace(/isSyncingWithSupabase/g, 'isSyncingWithFirebase');
code = code.replace(/lastSupabaseSync/g, 'lastFirebaseSync');
code = code.replace(/syncFromSupabase/g, 'syncFromFirebase');
code = code.replace(/Supabase Cloud State/g, 'Firebase Cloud State');
code = code.replace(/Source of truth: Supabase PostgreSQL/g, 'Source of truth: Firebase Firestore');
code = code.replace(/connect to Supabase database/g, 'connect to Firebase database');

// Replace setupRealtimeSubscription
const rtMatch = code.match(/setupRealtimeSubscription: \(\) => \{[\s\S]*?\},/);
if (rtMatch) {
  code = code.replace(rtMatch[0], 'setupRealtimeSubscription: () => { return () => {}; },');
}

fs.writeFileSync(file, code);
console.log('Fixed useAppStore.ts');
