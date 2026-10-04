import React from 'react';
import { X, Sparkles, ExternalLink, Edit3, CheckCircle, Layers, Lock } from 'lucide-react';

interface UserGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDontShowAgain: () => void;
}

export const UserGuideModal: React.FC<UserGuideModalProps> = ({
  isOpen,
  onClose,
  onDontShowAgain,
}) => {
  if (!isOpen) return null;

  const handleGotIt = () => {
    const cb = document.getElementById('dont-show-again') as HTMLInputElement | null;
    if (cb?.checked) onDontShowAgain();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 my-8 max-h-[90vh] overflow-y-auto">

        <div className="flex items-start justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
              <Sparkles className="w-5 h-5" />
            </span>
            <div>
              <h2 className="font-bold text-xl text-white">Welcome to ManhwaStream</h2>
              <p className="text-xs text-zinc-400">Your multi-source reading tracker</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-5 text-sm">
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm mb-1">Track across multiple sites</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                ArenaScan, King of Shojo, and RoliaScan — all in one shelf. The same series is
                automatically merged even if the title differs slightly between sites.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
              <ExternalLink className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm mb-1">Read Latest</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Click <strong className="text-white">Read Latest</strong> to open the series page
                on the source site. Your progress is automatically set to the latest chapter.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm mb-1">Caught Up</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Already read to the latest chapter? Click <strong className="text-white">Caught Up</strong> to
                mark all chapters as read without leaving the app.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <Edit3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm mb-1">Manual progress</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Use the <strong className="text-white">[−] [+]</strong> steppers to adjust your
                chapter, or click the <strong className="text-white">number</strong> in the middle
                to set an exact value.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm mb-1">Synced across devices</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Sign in to save your shelf to the cloud. Your progress appears on every device
                where you log in with the same account.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-zinc-800">
          <label className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer">
            <input
              type="checkbox"
              id="dont-show-again"
              className="rounded border-zinc-700 bg-zinc-900 text-rose-600 focus:ring-rose-500"
            />
            <span>Don't show this again</span>
          </label>
          <button
            onClick={handleGotIt}
            className="w-full sm:w-auto px-6 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-colors"
          >
            Got it
          </button>
        </div>

      </div>
    </div>
  );
};
