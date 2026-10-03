import React, { useState } from 'react';
import { X, Lock, User, LogIn, UserPlus, LogOut } from 'lucide-react';
import { UserAccount, SourceId } from '../types';
import { loginWithUsername, registerWithUsername, logoutUser } from '../services/auth';
import { KNOWN_SOURCES } from '../utils/chapterUrl';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount | null;
  onUserChanged: (user: UserAccount | null) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, currentUser, onUserChanged }) => {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPasswordConfirm, setRegPasswordConfirm] = useState('');
  const [regSource, setRegSource] = useState<SourceId>('all');
  const [regError, setRegError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoading(true);
    const result = await loginWithUsername(loginIdentifier, loginPassword);
    setLoading(false);
    if (result.success && result.user) {
      onUserChanged(result.user);
      onClose();
      setLoginIdentifier(''); setLoginPassword('');
    } else {
      setLoginError(result.error || 'Login failed.');
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);
    if (regPassword !== regPasswordConfirm) {
      setRegError('Passwords do not match.');
      return;
    }
    setLoading(true);
    const result = await registerWithUsername(regUsername, regPassword, regSource);
    setLoading(false);
    if (result.success && result.user) {
      onUserChanged(result.user);
      onClose();
      setRegUsername(''); setRegPassword(''); setRegPasswordConfirm('');
    } else {
      setRegError(result.error || 'Registration failed.');
    }
  };

  const handleLogout = async () => {
    await logoutUser();
    onUserChanged(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5">

        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">Reader Account</h3>
              <p className="text-xs text-zinc-400">Private shelf, synced across devices</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {currentUser ? (
          <div className="space-y-4">
            <div className="p-4 bg-[#121319] border border-zinc-800 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-rose-600 to-amber-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                  {currentUser.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-white">@{currentUser.username}</span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Active</span>
                  </div>
                  <p className="text-[11px] font-mono text-zinc-400">Filter: {KNOWN_SOURCES[currentUser.preferredSource]?.name}</p>
                </div>
              </div>
            </div>

            <button onClick={handleLogout} className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5">
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center p-1 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-medium">
              <button onClick={() => setTab('login')} className={`flex-1 py-1.5 rounded-lg transition-all ${tab === 'login' ? 'bg-zinc-800 text-white font-semibold shadow-sm' : 'text-zinc-400 hover:text-white'}`}>Log In</button>
              <button onClick={() => setTab('register')} className={`flex-1 py-1.5 rounded-lg transition-all ${tab === 'register' ? 'bg-zinc-800 text-white font-semibold shadow-sm' : 'text-zinc-400 hover:text-white'}`}>Register</button>
            </div>

            {tab === 'login' && (
              <form onSubmit={handleLoginSubmit} className="space-y-3.5 text-xs">
                {loginError && <div className="p-2.5 rounded-xl bg-red-950/40 border border-red-800 text-red-300">{loginError}</div>}

                <div>
                  <label className="block text-zinc-400 mb-1">Username</label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-2.5 text-zinc-500" />
                    <input type="text" required placeholder="e.g. alex" value={loginIdentifier} onChange={(e) => setLoginIdentifier(e.target.value)} className="w-full pl-9 pr-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500" />
                  </div>
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-2.5 text-zinc-500" />
                    <input type="password" required placeholder="••••••••" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} className="w-full pl-9 pr-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500" />
                  </div>
                </div>

                <button type="submit" disabled={loading} className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5 disabled:opacity-50">
                  <LogIn className="w-4 h-4" />
                  <span>{loading ? 'Logging in...' : 'Log In'}</span>
                </button>
              </form>
            )}

            {tab === 'register' && (
              <form onSubmit={handleRegisterSubmit} className="space-y-3 text-xs">
                {regError && <div className="p-2.5 rounded-xl bg-red-950/40 border border-red-800 text-red-300">{regError}</div>}

                <div>
                  <label className="block text-zinc-400 mb-1">Choose Username *</label>
                  <input type="text" required placeholder="e.g. shadow_monarch" value={regUsername} onChange={(e) => setRegUsername(e.target.value)} className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500" />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-zinc-400 mb-1">Password *</label>
                    <input type="password" required placeholder="Min 6 chars" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500" />
                  </div>
                  <div>
                    <label className="block text-zinc-400 mb-1">Confirm *</label>
                    <input type="password" required placeholder="Confirm" value={regPasswordConfirm} onChange={(e) => setRegPasswordConfirm(e.target.value)} className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500" />
                  </div>
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">Preferred Source</label>
                  <select value={regSource} onChange={(e) => setRegSource(e.target.value as SourceId)} className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-xs focus:outline-none focus:border-rose-500 cursor-pointer">
                    <option value="all">⚡ All Sources (Fastest)</option>
                    <option value="arenascan">⚔️ ArenaScan</option>
                    <option value="kingofshojo">🌸 King of Shojo</option>
                    <option value="roliascan">📜 RoliaScan</option>
                  </select>
                </div>

                <button type="submit" disabled={loading} className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5 mt-2 disabled:opacity-50">
                  <UserPlus className="w-4 h-4" />
                  <span>{loading ? 'Creating...' : 'Create Account'}</span>
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
};
