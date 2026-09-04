import React, { useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { useToast } from '../../components/ui/toast';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { 
  Smartphone, 
  Lock, 
  Mail, 
  User, 
  ShieldCheck, 
  Cloud, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  ArrowRight,
  Database
} from 'lucide-react';

export function LoginScreen() {
  const { signIn, signUp, loginAsDemoPartner, isConfigured } = useAuthStore();
  const { success, error } = useToast();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('yasir@pakmobile.shop');
  const [password, setPassword] = useState('yasir');
  const [name, setName] = useState('Yasir');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSetupGuide, setShowSetupGuide] = useState(!isConfigured);

  const handleQuickSelectPartner = (partner: 'Yasir' | 'Saad') => {
    setName(partner);
    setEmail(`${partner.toLowerCase()}@pakmobile.shop`);
    setPassword(partner.toLowerCase());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      error('Missing credentials', 'Please enter both email and password');
      return;
    }

    setLoading(true);

    if (mode === 'signin') {
      const res = await signIn(email, password);
      setLoading(false);
      if (res.success) {
        success('Welcome back!', `Signed in successfully`);
      } else {
        error('Sign in failed', res.error || 'Invalid email or password');
      }
    } else {
      if (!name) {
        error('Missing name', 'Please provide a name');
        setLoading(false);
        return;
      }
      const res = await signUp(email, password, name);
      setLoading(false);
      if (res.success) {
        success('Account created!', 'Check your email or sign in directly');
        setMode('signin');
      } else {
        error('Registration failed', res.error || 'Could not create account');
      }
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-slate-950 text-white selection:bg-emerald-500 selection:text-white">
      {/* Background glowing effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-600/15 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-teal-600/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10 space-y-5">
        {/* App Logo & Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-white shadow-xl shadow-emerald-500/25 ring-1 ring-white/20">
            <Smartphone className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            Yasir & Saad Mobile Trading
          </h1>
          <p className="text-xs text-slate-400 font-medium">
            Cloud ERP & Mobile Phone Inventory System
          </p>

          {/* Cloud Database Status Pill */}
          <div className="flex items-center justify-center pt-1">
            {isConfigured ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <Cloud className="h-3 w-3" /> Supabase Cloud Connected
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setShowSetupGuide(!showSetupGuide)}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 hover:bg-amber-500/25 transition-all"
              >
                <Database className="h-3 w-3" />
                Supabase Setup Required (Click for Guide)
              </button>
            )}
          </div>
        </div>

        {/* Setup Guide Modal / Accordion */}
        {showSetupGuide && !isConfigured && (
          <div className="p-4 rounded-2xl bg-slate-900 border border-amber-500/30 text-xs space-y-2.5 shadow-xl">
            <div className="flex items-center justify-between text-amber-400 font-bold">
              <span className="flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4" /> Connect Supabase Cloud Database
              </span>
              <button
                type="button"
                onClick={() => setShowSetupGuide(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <p className="text-slate-300 leading-relaxed">
              To connect your live PostgreSQL database:
            </p>
            <ol className="list-decimal pl-4 space-y-1 text-slate-400 text-[11px]">
              <li>Create a free project at <span className="text-emerald-400 font-mono">supabase.com</span>.</li>
              <li>Execute the SQL migration script from <span className="text-emerald-400 font-mono">supabase/schema.sql</span> in the Supabase SQL Editor.</li>
              <li>Paste your <span className="text-white font-mono">VITE_SUPABASE_URL</span> and <span className="text-white font-mono">VITE_SUPABASE_ANON_KEY</span> into <span className="text-white font-mono">.env</span>.</li>
            </ol>
            <div className="pt-1 flex items-center justify-between border-t border-slate-800">
              <span className="text-[10px] text-slate-500">Want to test right now?</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => loginAsDemoPartner('Yasir')}
                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px]"
                >
                  Enter as Yasir (Owner)
                </button>
                <button
                  type="button"
                  onClick={() => loginAsDemoPartner('Saad')}
                  className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px]"
                >
                  Enter as Saad (Manager)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Auth Form Card */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/90 backdrop-blur-xl p-6 shadow-2xl space-y-4">
          {/* Quick Partner Switcher Pills */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Select User Role:
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickSelectPartner('Yasir')}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all ${
                  email.includes('yasir')
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/30'
                    : 'border-slate-800 bg-slate-950/50 text-slate-400 hover:text-white'
                }`}
              >
                <div className="h-5 w-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-black">
                  Y
                </div>
                <div>
                  <span>Yasir</span>
                  <span className="text-[9px] block text-emerald-400 font-normal">Owner (Full Access)</span>
                </div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickSelectPartner('Saad')}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all ${
                  email.includes('saad')
                    ? 'border-blue-500 bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/30'
                    : 'border-slate-800 bg-slate-950/50 text-slate-400 hover:text-white'
                }`}
              >
                <div className="h-5 w-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-black">
                  S
                </div>
                <div>
                  <span>Saad</span>
                  <span className="text-[9px] block text-blue-400 font-normal">Manager (Entry User)</span>
                </div>
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3 pt-1">
            {mode === 'signup' && (
              <Input
                label="Partner / User Name *"
                placeholder="e.g. Yasir or Saad"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            )}

            <Input
              label="Email Address *"
              type="email"
              placeholder="name@pakmobile.shop"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <div className="relative">
              <Input
                label="Password *"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter password..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-8 text-slate-400 hover:text-white"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            <Button
              type="submit"
              variant="primary"
              disabled={loading}
              className="w-full h-12 text-sm font-bold shadow-lg shadow-emerald-600/20"
            >
              {loading ? (
                'Authenticating with Supabase...'
              ) : mode === 'signin' ? (
                <>Sign In to Shop ERP <ArrowRight className="h-4 w-4 ml-1.5" /></>
              ) : (
                <>Register Partner Account <ShieldCheck className="h-4 w-4 ml-1.5" /></>
              )}
            </Button>
          </form>

          {/* Switch Mode */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>
              {mode === 'signin' ? "Don't have an account?" : 'Already registered?'}
            </span>
            <button
              type="button"
              onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
              className="font-bold text-emerald-400 hover:underline"
            >
              {mode === 'signin' ? 'Create Account' : 'Sign In'}
            </button>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-center text-[10px] text-slate-500">
          Protected with PostgreSQL Row Level Security (RLS) & Supabase JWT
        </p>
      </div>
    </div>
  );
}
