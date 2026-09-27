import React, { useState } from 'react';
import { X, ShieldCheck, Check, Sparkles } from 'lucide-react';

interface ScopeOption {
  id: string;
  name: string;
  desc: string;
  recommended?: boolean;
}

const AVAILABLE_SCOPES: ScopeOption[] = [
  { id: 'read:user', name: 'read:user', desc: 'Read your profile data, username, and public information', recommended: true },
  { id: 'user:email', name: 'user:email', desc: 'Read your primary and verified email addresses', recommended: true },
  { id: 'repo', name: 'repo', desc: 'Full control of private and public repositories, branches, and commits', recommended: true },
  { id: 'public_repo', name: 'public_repo', desc: 'Limits repository access to public repositories only' },
  { id: 'read:org', name: 'read:org', desc: 'Read organization and team membership' },
  { id: 'gist', name: 'gist', desc: 'Create and edit your GitHub gists' },
  { id: 'workflow', name: 'workflow', desc: 'Update GitHub Actions workflows' },
];

interface ScopeSelectorModalProps {
  isOpen: boolean;
  selectedScopes: string[];
  onChangeScopes: (scopes: string[]) => void;
  onConfirmAndLaunch: () => void;
  onClose: () => void;
}

export const ScopeSelectorModal: React.FC<ScopeSelectorModalProps> = ({
  isOpen,
  selectedScopes,
  onChangeScopes,
  onConfirmAndLaunch,
  onClose,
}) => {
  if (!isOpen) return null;

  const toggleScope = (scopeId: string) => {
    if (selectedScopes.includes(scopeId)) {
      onChangeScopes(selectedScopes.filter((s) => s !== scopeId));
    } else {
      onChangeScopes([...selectedScopes, scopeId]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between p-4 border-b border-[#30363d] bg-[#0d1117]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-white">OAuth Permissions &amp; Scopes</h3>
          </div>
          <button
            onClick={onClose}
            className="text-[#8b949e] hover:text-white p-1 rounded-md hover:bg-[#21262d] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
          <p className="text-xs text-[#8b949e]">
            Select which permissions you want to request during the GitHub OAuth authorization flow:
          </p>

          <div className="space-y-2">
            {AVAILABLE_SCOPES.map((scope) => {
              const isChecked = selectedScopes.includes(scope.id);
              return (
                <div
                  key={scope.id}
                  onClick={() => toggleScope(scope.id)}
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                    isChecked
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-white'
                      : 'bg-[#0d1117] border-[#30363d] text-[#8b949e] hover:border-[#8b949e]'
                  }`}
                >
                  <div
                    className={`w-4 h-4 mt-0.5 rounded flex items-center justify-center border transition-colors ${
                      isChecked
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : 'border-[#484f58] bg-[#161b22]'
                    }`}
                  >
                    {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>

                  <div className="space-y-0.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-semibold text-white">{scope.name}</span>
                      {scope.recommended && (
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.2 rounded font-sans">
                          Recommended
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#8b949e] leading-relaxed">{scope.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-4 border-t border-[#30363d] bg-[#0d1117] flex items-center justify-between">
          <span className="text-xs text-[#8b949e] font-mono">
            {selectedScopes.length} scopes selected
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-[#8b949e] hover:text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onClose();
                onConfirmAndLaunch();
              }}
              className="px-4 py-2 bg-[#238636] hover:bg-[#2ea043] text-white rounded-lg text-xs font-semibold shadow-md transition-colors flex items-center gap-1.5"
            >
              <ShieldCheck className="w-4 h-4" />
              Authorize with GitHub
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
