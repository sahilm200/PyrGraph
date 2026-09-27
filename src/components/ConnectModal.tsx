import React, { useState } from 'react';
import { X, Key, ShieldCheck, AlertCircle, CheckCircle, ExternalLink } from 'lucide-react';
import { GitHubUser } from '../types/github';

interface ConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTokenConnected: (token: string, user: GitHubUser, scopes: string[]) => void;
}

export const ConnectModal: React.FC<ConnectModalProps> = ({
  isOpen,
  onClose,
  onTokenConnected,
}) => {
  const [tokenInput, setTokenInput] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleValidateAndConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = tokenInput.trim();
    if (!token) {
      setError('Please provide a personal access token.');
      return;
    }

    setIsValidating(true);
    setError(null);

    try {
      const res = await fetch('/api/github/validate-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      const data = await res.json();
      if (!res.ok || !data.valid) {
        throw new Error(data.error || 'Token validation failed. Check permissions and expiry.');
      }

      onTokenConnected(token, data.user, data.scopes || []);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid GitHub token');
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between p-4 border-b border-[#30363d]">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-semibold text-white">Connect with Personal Access Token</h3>
          </div>
          <button
            onClick={onClose}
            className="text-[#8b949e] hover:text-white p-1 rounded-md hover:bg-[#21262d] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleValidateAndConnect} className="p-5 space-y-4">
          <p className="text-xs text-[#8b949e]">
            Paste your GitHub Personal Access Token (classic or fine-grained). Your token stays in your browser and is only
            used for direct API requests.
          </p>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-white">Access Token</label>
            <input
              type="password"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx or github_pat_..."
              autoFocus
              className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-xs text-white placeholder-[#484f58] font-mono focus:outline-none focus:border-purple-500"
            />
          </div>

          {error && (
            <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-lg text-xs text-rose-400 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center justify-between text-xs text-[#8b949e] pt-1">
            <a
              href="https://github.com/settings/tokens/new"
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-400 hover:text-purple-300 flex items-center gap-1"
            >
              Need a token? Generate one on GitHub
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#30363d]">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-[#8b949e] hover:text-white hover:bg-[#21262d] rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isValidating || !tokenInput.trim()}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50"
            >
              {isValidating ? (
                <>
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <CheckCircle className="w-3.5 h-3.5" />
                  Connect Account
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
