import React from 'react';
import { BookOpen, Sun, Moon, Plus, Filter, User, Link2 } from 'lucide-react';
import { UserAccount, SourceId } from '../types';

interface HeaderProps {
  isDarkMode: boolean;
  onToggleTheme: () => void;
  onOpenAddModal: () => void;
  onOpenAddUrlModal: () => void;
  onOpenLoginModal: () => void;
  currentUser: UserAccount | null;
  selectedSource: SourceId;
  onSelectSource: (source: SourceId) => void;
}

export const Header: React.FC<HeaderProps> = ({
  isDarkMode,
  onToggleTheme,
  onOpenAddModal,
  onOpenAddUrlModal,
  onOpenLoginModal,
  currentUser,
  selectedSource,
  onSelectSource,
}) => {
  return (
    <header className={`sticky top-0 z-40 backdrop-blur-md border-b transition-colors ${
      isDarkMode ? 'bg-[#0b0c10]/95 border-[#1c1f2e] text-white' : 'bg-white/95 border-slate-200 text-slate-800 shadow-sm'
    }`}>
      <div className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">

        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-rose-500 via-[#ff4655] to-red-700 flex items-center justify-center shadow-md shadow-rose-950/40 shrink-0">
            <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
          </div>
          <div className={`font-comic text-base sm:text-xl tracking-tight flex items-center gap-1 ${
            isDarkMode ? 'text-white' : 'text-slate-900'
          }`}>
            <span>MANHWA</span>
            <span className="text-[#ff4655] font-light">/</span>
            <span className="hidden xs:inline">STREAM</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">

          <div className={`flex items-center gap-1 sm:gap-2 border rounded-lg px-2 sm:px-2.5 py-1 text-xs ${
            isDarkMode ? 'bg-[#12141d] border-[#222638] text-white' : 'bg-slate-100 border-slate-300 text-slate-800'
          }`}>
            <Filter className={`w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0 ${isDarkMode ? 'text-zinc-400' : 'text-slate-500'}`} />
            <select
              value={selectedSource}
              onChange={(e) => onSelectSource(e.target.value as SourceId)}
              className="bg-transparent font-medium text-[11px] sm:text-xs focus:outline-none cursor-pointer max-w-[80px] xs:max-w-[100px] sm:max-w-none"
            >
              <option value="all" className={isDarkMode ? 'bg-[#12141d] text-white' : 'bg-white text-slate-800'}>⚡ All Sites</option>
              <option value="arenascan" className={isDarkMode ? 'bg-[#12141d] text-white' : 'bg-white text-slate-800'}>⚔️ Arena</option>
              <option value="kingofshojo" className={isDarkMode ? 'bg-[#12141d] text-white' : 'bg-white text-slate-800'}>🌸 Shojo</option>
              <option value="roliascan" className={isDarkMode ? 'bg-[#12141d] text-white' : 'bg-white text-slate-800'}>📜 Rolia</option>
            </select>
          </div>

          <button
            onClick={onOpenAddUrlModal}
            className="hidden sm:flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] sm:text-xs font-semibold transition-all shadow-sm active:scale-95 cursor-pointer"
            title="Add by URL"
          >
            <Link2 className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Add by URL</span>
          </button>

          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-[#ff4655] hover:bg-[#e03847] text-white text-[11px] sm:text-xs font-semibold transition-all shadow-sm active:scale-95 cursor-pointer"
            title="Add Series"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Add Series</span>
          </button>

          <button
            onClick={onOpenLoginModal}
            className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg border text-xs transition-colors cursor-pointer ${
              isDarkMode ? 'bg-[#12141d] hover:bg-[#1a1c26] border-[#222638] text-zinc-200' : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
            }`}
            title="Manage account"
          >
            <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-[#ff4655] to-amber-500 flex items-center justify-center text-white text-[10px] font-bold shadow-sm shrink-0">
              {currentUser ? currentUser.username.charAt(0).toUpperCase() : <User className="w-3 h-3" />}
            </div>
            <span className="font-semibold hidden lg:inline">
              {currentUser ? 'Library' : 'Sign In'}
            </span>
          </button>

          <button
            onClick={onToggleTheme}
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer shrink-0 ${
              isDarkMode ? 'bg-[#12141d] hover:bg-[#1c1f2e] border-[#222638] text-amber-400' : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
            }`}
            aria-label="Toggle theme"
          >
            {isDarkMode ? <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
          </button>

        </div>
      </div>
    </header>
  );
};
