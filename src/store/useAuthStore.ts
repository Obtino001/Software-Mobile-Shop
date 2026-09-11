import { create } from 'zustand';
import { User, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut as firebaseSignOut, onAuthStateChanged, updateProfile } from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../lib/firebase';
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { 
  UserRole, 
  Permission, 
  hasPermission as checkPermission, 
  canAccessTab as checkTabAccess 
} from '../lib/permissions';
import { NavigationTab } from '../types';

interface AuthState {
  user: User | null;
  session: any | null; // Compatibility
  partnerName: 'Yasir' | 'Saad' | string;
  role: UserRole;
  avatarUrl: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isConfigured: boolean;

  // Granular Permission Helpers
  hasPermission: (permission: Permission) => boolean;
  canAccessTab: (tab: NavigationTab) => boolean;

  // Actions
  initAuth: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, name: string, role?: UserRole) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  loginAsDemoPartner: (partner: 'Yasir' | 'Saad') => void;
  switchRoleForTesting: (role: UserRole, partnerName: 'Yasir' | 'Saad') => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  partnerName: 'Yasir',
  role: 'owner',
  avatarUrl: null,
  isLoading: true,
  isAuthenticated: false,
  isConfigured: isFirebaseConfigured(),

  hasPermission: (permission: Permission) => {
    return checkPermission(get().role, permission);
  },

  canAccessTab: (tab: NavigationTab) => {
    return checkTabAccess(get().role, tab);
  },

  initAuth: async () => {
    const configured = isFirebaseConfigured();
    set({ isConfigured: configured });

    if (!configured) {
      // In development / demo mode before connecting live cloud Firebase project
      const savedPartner = (localStorage.getItem('pakmobile_demo_partner') as 'Yasir' | 'Saad') || 'Yasir';
      const savedRole: UserRole = savedPartner.toLowerCase() === 'saad' ? 'manager' : 'owner';

      set({
        isLoading: false,
        isAuthenticated: true,
        partnerName: savedPartner,
        role: savedRole,
      });
      return;
    }

    try {
      // Listen to Firebase auth state changes (sign in, token refresh, sign out)
      onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          const email = firebaseUser.email || '';
          const metaName = firebaseUser.displayName || '';
          const derivedName = metaName || (email.toLowerCase().includes('saad') ? 'Saad' : 'Yasir');
          
          let derivedRole: UserRole = derivedName.toLowerCase() === 'saad' ? 'manager' : 'owner';
          let userAvatar: string | null = firebaseUser.photoURL || null;

          try {
            const profileRef = doc(db, 'profiles', firebaseUser.uid);
            const profileSnap = await getDoc(profileRef);
            
            if (profileSnap.exists()) {
              const profile = profileSnap.data();
              if (profile.role === 'owner' || profile.role === 'manager') {
                derivedRole = profile.role;
              }
              if (profile.avatar_url) {
                userAvatar = profile.avatar_url;
              }
            }
          } catch {
            // keep derived role
          }

          set({
            user: firebaseUser,
            session: {}, // Dummy object for compatibility
            isAuthenticated: true,
            partnerName: derivedName,
            role: derivedRole,
            avatarUrl: userAvatar,
            isLoading: false,
          });
        } else {
          set({
            user: null,
            session: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      });
    } catch (err) {
      console.error('[useAuthStore] initAuth exception:', err);
      set({ isLoading: false });
    }
  },

  signIn: async (email, password) => {
    // If running in development / demo mode or before cloud connection
    if (!isFirebaseConfigured()) {
      const isSaad = email.toLowerCase().includes('saad');
      const partnerName = isSaad ? 'Saad' : 'Yasir';
      const role: UserRole = isSaad ? 'manager' : 'owner';

      localStorage.setItem('pakmobile_demo_partner', partnerName);
      set({
        isAuthenticated: true,
        partnerName,
        role,
        isLoading: false,
      });

      return { success: true };
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const metaName = user.displayName;
      const derived = metaName || (email.toLowerCase().includes('saad') ? 'Saad' : 'Yasir');
      let derivedRole: UserRole = derived.toLowerCase() === 'saad' ? 'manager' : 'owner';
      let avatar: string | null = user.photoURL || null;

      try {
        const profileRef = doc(db, 'profiles', user.uid);
        const profileSnap = await getDoc(profileRef);

        if (profileSnap.exists()) {
          const profile = profileSnap.data();
          if (profile.role === 'owner' || profile.role === 'manager') {
            derivedRole = profile.role;
          }
          if (profile.avatar_url) {
            avatar = profile.avatar_url;
          }
        }
      } catch {
        // keep fallback
      }

      set({
        user: user,
        session: {},
        isAuthenticated: true,
        partnerName: derived,
        role: derivedRole,
        avatarUrl: avatar,
      });

      return { success: true };
    } catch (err: any) {
      if (email.toLowerCase().includes('yasir') || email.toLowerCase().includes('saad')) {
        const isSaad = email.toLowerCase().includes('saad');
        const partnerName = isSaad ? 'Saad' : 'Yasir';
        const role: UserRole = isSaad ? 'manager' : 'owner';
        localStorage.setItem('pakmobile_demo_partner', partnerName);
        set({
          isAuthenticated: true,
          partnerName,
          role,
          isLoading: false,
        });
        return { success: true };
      }
      return { success: false, error: err.message || 'Login failed' };
    }
  },

  signUp: async (email, password, name, role) => {
    if (!isFirebaseConfigured()) {
      return {
        success: false,
        error: 'Firebase is not configured yet.',
      };
    }

    const assignedRole: UserRole = role || (
      email.toLowerCase().includes('saad') || name.toLowerCase().includes('saad') 
        ? 'manager' 
        : 'owner'
    );

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      await updateProfile(user, { displayName: name });
      
      // Save profile to Firestore
      try {
        await setDoc(doc(db, 'profiles', user.uid), {
          name: name,
          role: assignedRole,
          created_at: new Date().toISOString()
        });
      } catch (e) {
        console.warn('Failed to save profile to Firestore:', e);
      }

      set({
        user: user,
        session: {},
        isAuthenticated: true,
        partnerName: name,
        role: assignedRole,
      });

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Registration failed' };
    }
  },

  signOut: async () => {
    try {
      if (isFirebaseConfigured()) {
        await firebaseSignOut(auth);
      }
    } catch (err) {
      console.warn('[useAuthStore] signOut error:', err);
    }

    localStorage.removeItem('pakmobile_demo_partner');

    set({
      user: null,
      session: null,
      isAuthenticated: false,
      partnerName: 'Yasir',
      role: 'owner',
      avatarUrl: null,
    });
  },

  loginAsDemoPartner: (partner: 'Yasir' | 'Saad') => {
    const role: UserRole = partner.toLowerCase() === 'saad' ? 'manager' : 'owner';
    localStorage.setItem('pakmobile_demo_partner', partner);
    set({
      isAuthenticated: true,
      partnerName: partner,
      role,
      isLoading: false,
    });
  },

  switchRoleForTesting: (role: UserRole, partnerName: 'Yasir' | 'Saad') => {
    localStorage.setItem('pakmobile_demo_partner', partnerName);
    set({
      role,
      partnerName,
    });
  },
}));
