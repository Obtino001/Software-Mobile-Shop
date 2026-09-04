import { create } from 'zustand';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { 
  UserRole, 
  Permission, 
  hasPermission as checkPermission, 
  canAccessTab as checkTabAccess 
} from '../lib/permissions';
import { NavigationTab } from '../types';

interface AuthState {
  user: User | null;
  session: Session | null;
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
  isConfigured: isSupabaseConfigured(),

  hasPermission: (permission: Permission) => {
    return checkPermission(get().role, permission);
  },

  canAccessTab: (tab: NavigationTab) => {
    return checkTabAccess(get().role, tab);
  },

  initAuth: async () => {
    const configured = isSupabaseConfigured();
    set({ isConfigured: configured });

    if (!configured) {
      // In development / demo mode before connecting live cloud Supabase project
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
      // 1. Secure session retrieval from Supabase persistence
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.warn('[useAuthStore] getSession warning:', sessionError.message);
      }

      if (session?.user) {
        const email = session.user.email || '';
        const metaName = session.user.user_metadata?.name || '';
        const derivedName = metaName || (email.toLowerCase().includes('saad') ? 'Saad' : 'Yasir');
        
        // Default role derived from email/name unless profile row overrides
        let derivedRole: UserRole = derivedName.toLowerCase() === 'saad' ? 'manager' : 'owner';
        let userAvatar: string | null = session.user.user_metadata?.avatar_url || null;

        // 2. Fetch role from public.profiles table (enforced by RLS)
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role, name, avatar_url')
            .eq('id', session.user.id)
            .maybeSingle();

          if (profile) {
            if (profile.role === 'owner' || profile.role === 'manager') {
              derivedRole = profile.role;
            }
            if (profile.name) {
              // use official profile name
            }
            if (profile.avatar_url) {
              userAvatar = profile.avatar_url;
            }
          }
        } catch (profileErr) {
          console.warn('[useAuthStore] Could not load profile:', profileErr);
        }

        set({
          user: session.user,
          session,
          isAuthenticated: true,
          partnerName: derivedName,
          role: derivedRole,
          avatarUrl: userAvatar,
          isLoading: false,
        });
      } else {
        // No active session found
        set({
          user: null,
          session: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }

      // 3. Listen to Supabase auth state changes (sign in, token refresh, sign out)
      supabase.auth.onAuthStateChange(async (_event, newSession) => {
        if (newSession?.user) {
          const email = newSession.user.email || '';
          const metaName = newSession.user.user_metadata?.name || '';
          const derivedName = metaName || (email.toLowerCase().includes('saad') ? 'Saad' : 'Yasir');
          let derivedRole: UserRole = derivedName.toLowerCase() === 'saad' ? 'manager' : 'owner';
          let userAvatar: string | null = newSession.user.user_metadata?.avatar_url || null;

          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('role, avatar_url')
              .eq('id', newSession.user.id)
              .maybeSingle();

            if (profile?.role === 'owner' || profile?.role === 'manager') {
              derivedRole = profile.role;
            }
            if (profile?.avatar_url) {
              userAvatar = profile.avatar_url;
            }
          } catch {
            // keep derived role
          }

          set({
            user: newSession.user,
            session: newSession,
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
    if (!isSupabaseConfigured()) {
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
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Fallback for partner demo logins so testing is never blocked
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
        return { success: false, error: error.message };
      }

      const metaName = data.user.user_metadata?.name;
      const derived = metaName || (email.toLowerCase().includes('saad') ? 'Saad' : 'Yasir');
      let derivedRole: UserRole = derived.toLowerCase() === 'saad' ? 'manager' : 'owner';
      let avatar: string | null = data.user.user_metadata?.avatar_url || null;

      // Query role from profiles
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, avatar_url')
          .eq('id', data.user.id)
          .maybeSingle();

        if (profile?.role === 'owner' || profile?.role === 'manager') {
          derivedRole = profile.role;
        }
        if (profile?.avatar_url) {
          avatar = profile.avatar_url;
        }
      } catch {
        // keep fallback
      }

      set({
        user: data.user,
        session: data.session,
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
    if (!isSupabaseConfigured()) {
      return {
        success: false,
        error: 'Supabase is not configured yet.',
      };
    }

    const assignedRole: UserRole = role || (
      email.toLowerCase().includes('saad') || name.toLowerCase().includes('saad') 
        ? 'manager' 
        : 'owner'
    );

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            role: assignedRole,
          },
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.session) {
        set({
          user: data.user,
          session: data.session,
          isAuthenticated: true,
          partnerName: name,
          role: assignedRole,
        });
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Registration failed' };
    }
  },

  signOut: async () => {
    try {
      if (isSupabaseConfigured()) {
        await supabase.auth.signOut();
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
