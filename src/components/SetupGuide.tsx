import React, { useState } from 'react';
import {
  ExternalLink,
  Copy,
  Check,
  Key,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  Globe,
  Settings,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { AuthStatus } from '../types/github';

interface SetupGuideProps {
  authStatus: AuthStatus | null;
  onCredentialsSaved: () => void;
  onOpenPatConnect: () => void;
  onStartOAuth: () => void;
  isConnectingOAuth: boolean;
}

export const SetupGuide: React.FC<SetupGuideProps> = ({
  authStatus,
  onCredentialsSaved,
  onOpenPatConnect,
  onStartOAuth,
  isConnectingOAuth,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [clientIdInput, setClientIdInput] = useState('');
  const [clientSecretInput, setClientSecretInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'oauth' | 'pat'>('oauth');

  const devCallback = authStatus?.callbackUrls.dev || 'https://ais-dev-w2om6i6ma3mbtudk65xt5c-552076348855.us-west2.run.app/auth/callback';
  const sharedCallback = authStatus?.callbackUrls.shared || 'https://ais-pre-w2om6i6ma3mbtudk65xt5c-552076348855.us-west2.run.app/auth/callback';
  const homepageUrl = authStatus?.appUrl || 'https://ais-dev-w2om6i6ma3mbtudk65xt5c-552076348855.us-west2.run.app';

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSaveCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientIdInput.trim() || !clientSecretInput.trim()) {
      setSaveError('Please enter both Client ID and Client Secret.');
      return;
    }
    setIsSaving(true);
    setSaveError(null);
    try {
      const res = await fetch('/api/auth/save-credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: clientIdInput.trim(),
          clientSecret: clientSecretInput.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save credentials');
      setSaveSuccess(true);
      onCredentialsSaved();
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : 'Error saving credentials');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Intro Hero Banner */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <Sparkles className="w-3.5 h-3.5" />
              Two Fast Ways to Connect
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Connect Your GitHub Account</h2>
            <p className="text-sm text-[#8b949e]">
              Link GitHub to browse repositories, inspect branches, view commits, and manage project workflows.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('oauth')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'oauth'
                  ? 'bg-[#238636] text-white shadow-sm'
                  : 'bg-[#21262d] text-[#8b949e] hover:text-white'
              }`}
            >
              OAuth App (Recommended)
            </button>
            <button
              onClick={() => setActiveTab('pat')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'pat'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-[#21262d] text-[#8b949e] hover:text-white'
              }`}
            >
              Personal Access Token
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'oauth' ? (
        <div className="space-y-6">
          {/* Status Box */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#30363d] pb-4">
              <div className="flex items-center gap-3">
                <div
                  className={`w-3 h-3 rounded-full ${
                    authStatus?.configured ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                  }`}
                />
                <div>
                  <h3 className="text-sm font-semibold text-white">OAuth App Server Status</h3>
                  <p className="text-xs text-[#8b949e]">
                    {authStatus?.configured
                      ? `Configured with Client ID: ${authStatus.clientIdMasked}`
                      : 'Client credentials not detected in server environment.'}
                  </p>
                </div>
              </div>

              {authStatus?.configured ? (
                <button
                  onClick={onStartOAuth}
                  disabled={isConnectingOAuth}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#238636] hover:bg-[#2ea043] text-white rounded-lg text-xs font-semibold shadow-md transition-all disabled:opacity-50"
                >
                  {isConnectingOAuth ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      Connect with GitHub
                    </>
                  )}
                </button>
              ) : (
                <span className="text-xs text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-md border border-amber-400/20">
                  Setup Steps Below
                </span>
              )}
            </div>

            {/* Step-by-step Guide */}
            <div className="space-y-4 pt-1">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[#8b949e]">
                Setup Instructions for GitHub OAuth
              </h4>

              {/* Step 1 */}
              <div className="bg-[#0d1117] border border-[#30363d] rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold flex items-center justify-center">
                      1
                    </span>
                    <span className="text-sm font-medium text-white">Create an OAuth App on GitHub</span>
                  </div>
                  <a
                    href="https://github.com/settings/developers"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    Open GitHub Developer Settings
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
                <p className="text-xs text-[#8b949e]">
                  Go to <strong>Settings &gt; Developer Settings &gt; OAuth Apps</strong> and click{' '}
                  <strong className="text-white">&quot;New OAuth App&quot;</strong>.
                </p>
              </div>

              {/* Step 2 */}
              <div className="bg-[#0d1117] border border-[#30363d] rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold flex items-center justify-center">
                    2
                  </span>
                  <span className="text-sm font-medium text-white">Fill in the Application Details</span>
                </div>

                <div className="grid gap-3 pt-1">
                  {/* Application name */}
                  <div className="space-y-1">
                    <label className="text-xs text-[#8b949e] font-mono">Application Name</label>
                    <div className="p-2 bg-[#161b22] border border-[#30363d] rounded text-xs text-white">
                      AI Studio GitHub Explorer (or any name you prefer)
                    </div>
                  </div>

                  {/* Homepage URL */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs text-[#8b949e] font-mono">Homepage URL</label>
                      <button
                        onClick={() => copyToClipboard(homepageUrl, 'homepage')}
                        className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                      >
                        {copiedKey === 'homepage' ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" /> Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" /> Copy
                          </>
                        )}
                      </button>
                    </div>
                    <div className="p-2 bg-[#161b22] border border-[#30363d] rounded text-xs font-mono text-emerald-400 truncate">
                      {homepageUrl}
                    </div>
                  </div>

                  {/* Callback URL Dev */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <label className="text-xs text-[#8b949e] font-mono">
                          Authorization Callback URL (Development)
                        </label>
                        <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded">Required</span>
                      </div>
                      <button
                        onClick={() => copyToClipboard(devCallback, 'devCallback')}
                        className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                      >
                        {copiedKey === 'devCallback' ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" /> Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" /> Copy
                          </>
                        )}
                      </button>
                    </div>
                    <div className="p-2 bg-[#161b22] border border-[#30363d] rounded text-xs font-mono text-emerald-400 break-all">
                      {devCallback}
                    </div>
                  </div>

                  {/* Callback URL Shared */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <label className="text-xs text-[#8b949e] font-mono">
                          Shared / Deployed Callback URL (Optional / Production)
                        </label>
                      </div>
                      <button
                        onClick={() => copyToClipboard(sharedCallback, 'sharedCallback')}
                        className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                      >
                        {copiedKey === 'sharedCallback' ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" /> Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" /> Copy
                          </>
                        )}
                      </button>
                    </div>
                    <div className="p-2 bg-[#161b22] border border-[#30363d] rounded text-xs font-mono text-gray-400 break-all">
                      {sharedCallback}
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="bg-[#0d1117] border border-[#30363d] rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold flex items-center justify-center">
                    3
                  </span>
                  <span className="text-sm font-medium text-white">Generate Client Secret &amp; Save Credentials</span>
                </div>
                <p className="text-xs text-[#8b949e]">
                  After registering, click <strong>&quot;Generate a new client secret&quot;</strong>. You can either set them in{' '}
                  <code className="text-xs text-emerald-400 bg-[#161b22] px-1 py-0.5 rounded">.env</code> as{' '}
                  <code className="text-xs text-white">GITHUB_CLIENT_ID</code> and{' '}
                  <code className="text-xs text-white">GITHUB_CLIENT_SECRET</code>, or paste them right here for instant
                  testing:
                </p>

                <form onSubmit={handleSaveCredentials} className="space-y-3 pt-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-[#8b949e] mb-1">Client ID</label>
                      <input
                        type="text"
                        value={clientIdInput}
                        onChange={(e) => setClientIdInput(e.target.value)}
                        placeholder="e.g. Ov23li..."
                        className="w-full bg-[#161b22] border border-[#30363d] rounded-lg px-3 py-1.5 text-xs text-white placeholder-[#484f58] focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#8b949e] mb-1">Client Secret</label>
                      <input
                        type="password"
                        value={clientSecretInput}
                        onChange={(e) => setClientSecretInput(e.target.value)}
                        placeholder="e.g. 5d9f0..."
                        className="w-full bg-[#161b22] border border-[#30363d] rounded-lg px-3 py-1.5 text-xs text-white placeholder-[#484f58] focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {saveError && (
                    <div className="text-xs text-rose-400 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {saveError}
                    </div>
                  )}

                  {saveSuccess && (
                    <div className="text-xs text-emerald-400 flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5" />
                      Credentials saved! You can now click &quot;Connect with GitHub&quot;.
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="px-4 py-2 bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                    >
                      {isSaving ? 'Saving...' : 'Save Credentials for Current Session'}
                    </button>

                    <button
                      type="button"
                      onClick={onStartOAuth}
                      disabled={isConnectingOAuth}
                      className="px-4 py-2 bg-[#238636] hover:bg-[#2ea043] text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      {isConnectingOAuth ? 'Opening Popup...' : 'Test Connect with GitHub'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* PAT Tab */
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6 space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-purple-400" />
                <h3 className="text-base font-semibold text-white">Instant Connect with Personal Access Token (PAT)</h3>
              </div>
              <p className="text-xs text-[#8b949e]">
                Don&apos;t want to register a full OAuth app? Generate a personal access token in 10 seconds to connect
                immediately.
              </p>
            </div>
            <a
              href="https://github.com/settings/tokens/new"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#21262d] hover:bg-[#30363d] text-white text-xs font-medium rounded-lg border border-[#30363d] transition-colors"
            >
              Generate Token on GitHub
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="bg-[#0d1117] border border-[#30363d] rounded-lg p-4 space-y-3">
            <h4 className="text-xs font-semibold text-white">Recommended Scopes for your Token:</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#8b949e]">
              <div className="flex items-center gap-2">
                <code className="text-emerald-400 bg-[#161b22] px-1.5 py-0.5 rounded font-mono">read:user</code>
                <span>Read user profile details</span>
              </div>
              <div className="flex items-center gap-2">
                <code className="text-emerald-400 bg-[#161b22] px-1.5 py-0.5 rounded font-mono">user:email</code>
                <span>Read primary email addresses</span>
              </div>
              <div className="flex items-center gap-2">
                <code className="text-emerald-400 bg-[#161b22] px-1.5 py-0.5 rounded font-mono">repo</code>
                <span>Full access to private &amp; public repos</span>
              </div>
              <div className="flex items-center gap-2">
                <code className="text-emerald-400 bg-[#161b22] px-1.5 py-0.5 rounded font-mono">public_repo</code>
                <span>Access public repositories only (safer)</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={onOpenPatConnect}
                className="w-full sm:w-auto px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold shadow-md transition-colors flex items-center justify-center gap-2"
              >
                <Key className="w-4 h-4" />
                Paste &amp; Connect with Access Token
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
