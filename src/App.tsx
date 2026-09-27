/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Github,
  Key,
  ShieldCheck,
  BookMarked,
  Settings,
  HelpCircle,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  RefreshCw,
  Sliders,
  Terminal,
} from 'lucide-react';
import { GitHubUser, GitHubRepo, AuthStatus } from './types/github';
import { SetupGuide } from './components/SetupGuide';
import { ProfileHeader } from './components/ProfileHeader';
import { RepoList } from './components/RepoList';
import { RepoDetailModal } from './components/RepoDetailModal';
import { ConnectModal } from './components/ConnectModal';
import { ScopeSelectorModal } from './components/ScopeSelectorModal';

export default function App() {
  const [authStatus, setAuthStatus] = useState<AuthStatus | null>(null);
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [authMethod, setAuthMethod] = useState<'oauth' | 'pat'>('oauth');
  const [scopes, setScopes] = useState<string[]>(['read:user', 'user:email', 'repo']);
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<GitHubRepo | null>(null);

  const [activeTab, setActiveTab] = useState<'dashboard' | 'setup' | 'api'>('dashboard');
  const [isLoadingRepos, setIsLoadingRepos] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isConnectingOAuth, setIsConnectingOAuth] = useState(false);

  const [isPatModalOpen, setIsPatModalOpen] = useState(false);
  const [isScopeModalOpen, setIsScopeModalOpen] = useState(false);

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Fetch Server Auth Configuration
  const fetchAuthStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/status');
      if (res.ok) {
        const data = await res.json();
        setAuthStatus(data);
      }
    } catch (err) {
      console.error('Failed to fetch auth status', err);
    }
  }, []);

  // Fetch repositories
  const fetchRepos = useCallback(async (authToken: string) => {
    setIsLoadingRepos(true);
    try {
      const res = await fetch('/api/github/repos?per_page=100&sort=updated', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch repositories');
      setRepos(data.repos || []);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Error fetching repositories', 'error');
    } finally {
      setIsLoadingRepos(false);
    }
  }, []);

  // Fetch user profile
  const fetchUserProfile = useCallback(async (authToken: string) => {
    try {
      const res = await fetch('/api/github/user', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Session expired');
      setUser(data.user);
      return data.user;
    } catch (err: unknown) {
      console.warn('Failed to restore user session:', err);
      // Clean up stale token
      localStorage.removeItem('gh_token');
      localStorage.removeItem('gh_method');
      setToken(null);
      setUser(null);
      return null;
    }
  }, []);

  // Initialize and check saved token
  useEffect(() => {
    fetchAuthStatus();

    const savedToken = localStorage.getItem('gh_token');
    const savedMethod = (localStorage.getItem('gh_method') as 'oauth' | 'pat') || 'oauth';

    if (savedToken) {
      setToken(savedToken);
      setAuthMethod(savedMethod);
      fetchUserProfile(savedToken).then((u) => {
        if (u) {
          fetchRepos(savedToken);
        }
      });
    }
  }, [fetchAuthStatus, fetchUserProfile, fetchRepos]);

  // Listen for OAuth postMessage
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Validate origin
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost')) {
        return;
      }

      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        const { token: receivedToken, user: receivedUser, scope: receivedScope } = event.data;
        setIsConnectingOAuth(false);

        if (receivedToken) {
          setToken(receivedToken);
          setAuthMethod('oauth');
          localStorage.setItem('gh_token', receivedToken);
          localStorage.setItem('gh_method', 'oauth');

          if (receivedUser) {
            setUser(receivedUser);
          } else {
            fetchUserProfile(receivedToken);
          }

          if (receivedScope) {
            setScopes(
              receivedScope
                .split(',')
                .map((s: string) => s.trim())
                .filter(Boolean),
            );
          }

          fetchRepos(receivedToken);
          setActiveTab('dashboard');
          showToast(`Successfully connected to GitHub as @${receivedUser?.login || 'user'}!`, 'success');
        }
      } else if (event.data?.type === 'OAUTH_AUTH_ERROR') {
        setIsConnectingOAuth(false);
        showToast(event.data.error || 'GitHub connection failed.', 'error');
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [fetchUserProfile, fetchRepos]);

  // Trigger OAuth Popup
  const startOAuthFlow = async () => {
    setIsConnectingOAuth(true);
    try {
      const redirectUri = `${window.location.origin}/auth/callback`;
      const queryParams = new URLSearchParams({
        redirect_uri: redirectUri,
        scope: scopes.join(' '),
      });

      const response = await fetch(`/api/auth/url?${queryParams.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        if (data.notConfigured) {
          setActiveTab('setup');
          showToast('OAuth Client ID not configured. Please follow the setup guide.', 'error');
        } else {
          showToast(data.error || 'Failed to initialize OAuth authorization', 'error');
        }
        setIsConnectingOAuth(false);
        return;
      }

      // Open OAuth provider's authorization URL directly in popup
      const authWindow = window.open(
        data.url,
        'github_oauth_popup',
        'width=600,height=720,scrollbars=yes,status=1',
      );

      if (!authWindow) {
        setIsConnectingOAuth(false);
        showToast('Please allow popups in your browser to complete GitHub authorization.', 'error');
      }
    } catch (err: unknown) {
      setIsConnectingOAuth(false);
      showToast(err instanceof Error ? err.message : 'Error starting OAuth popup', 'error');
    }
  };

  const handlePatConnected = (newToken: string, newUser: GitHubUser, grantedScopes: string[]) => {
    setToken(newToken);
    setUser(newUser);
    setAuthMethod('pat');
    setScopes(grantedScopes.length > 0 ? grantedScopes : ['repo', 'read:user']);
    localStorage.setItem('gh_token', newToken);
    localStorage.setItem('gh_method', 'pat');
    fetchRepos(newToken);
    setActiveTab('dashboard');
    showToast(`Connected successfully with token as @${newUser.login}!`, 'success');
  };

  const handleDisconnect = () => {
    localStorage.removeItem('gh_token');
    localStorage.removeItem('gh_method');
    setToken(null);
    setUser(null);
    setRepos([]);
    showToast('Disconnected from GitHub.', 'success');
  };

  const handleRefresh = async () => {
    if (!token) return;
    setIsRefreshing(true);
    await Promise.all([fetchUserProfile(token), fetchRepos(token)]);
    setIsRefreshing(false);
    showToast('Synced latest data with GitHub!', 'success');
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-[#c9d1d9] flex flex-col font-sans selection:bg-[#58a6ff]/20">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-3 duration-200">
          <div
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-lg shadow-2xl border text-xs font-medium ${
              toast.type === 'success'
                ? 'bg-[#161b22] border-emerald-500/40 text-emerald-400'
                : 'bg-[#161b22] border-rose-500/40 text-rose-400'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Main Navigation Bar */}
      <header className="border-b border-[#30363d] bg-[#161b22] sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-black shadow-sm">
              <Github className="w-5 h-5 fill-current" />
            </div>
            <div>
              <span className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
                GitHub Connect
                <span className="text-[10px] font-normal font-mono bg-[#21262d] text-[#8b949e] px-1.5 py-0.5 rounded border border-[#30363d]">
                  OAuth 2.0
                </span>
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'dashboard'
                  ? 'bg-[#21262d] text-white border border-[#30363d]'
                  : 'text-[#8b949e] hover:text-white'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('setup')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 ${
                activeTab === 'setup'
                  ? 'bg-[#21262d] text-white border border-[#30363d]'
                  : 'text-[#8b949e] hover:text-white'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              Setup Guide
            </button>
            <button
              onClick={() => setIsScopeModalOpen(true)}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#8b949e] hover:text-white hover:bg-[#21262d] transition-colors flex items-center gap-1"
              title="Configure Scopes"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Scopes</span>
            </button>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2">
            {user ? (
              <div className="flex items-center gap-2">
                <img
                  src={user.avatar_url}
                  alt={user.login}
                  className="w-7 h-7 rounded-full border border-[#30363d]"
                />
                <span className="text-xs font-medium text-white hidden sm:inline">
                  @{user.login}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsPatModalOpen(true)}
                  className="px-3 py-1.5 bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] hover:text-white rounded-lg text-xs font-medium border border-[#30363d] transition-colors flex items-center gap-1.5"
                >
                  <Key className="w-3.5 h-3.5 text-purple-400" />
                  <span className="hidden sm:inline">Token</span>
                </button>
                <button
                  onClick={startOAuthFlow}
                  disabled={isConnectingOAuth}
                  className="px-3.5 py-1.5 bg-[#238636] hover:bg-[#2ea043] text-white rounded-lg text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isConnectingOAuth ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Connect
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {activeTab === 'setup' ? (
          <SetupGuide
            authStatus={authStatus}
            onCredentialsSaved={fetchAuthStatus}
            onOpenPatConnect={() => setIsPatModalOpen(true)}
            onStartOAuth={startOAuthFlow}
            isConnectingOAuth={isConnectingOAuth}
          />
        ) : user && token ? (
          /* Authenticated Dashboard */
          <div className="space-y-6">
            <ProfileHeader
              user={user}
              authMethod={authMethod}
              scopes={scopes}
              onDisconnect={handleDisconnect}
              onRefresh={handleRefresh}
              isRefreshing={isRefreshing}
            />

            <div>
              <div className="flex items-center justify-between mb-3 px-1">
                <h2 className="text-base font-semibold text-white flex items-center gap-2">
                  <BookMarked className="w-4 h-4 text-[#58a6ff]" />
                  Your GitHub Repositories
                </h2>
              </div>

              <RepoList
                repos={repos}
                onSelectRepo={(repo) => setSelectedRepo(repo)}
                isLoading={isLoadingRepos}
              />
            </div>
          </div>
        ) : (
          /* Unauthenticated Landing */
          <div className="space-y-6">
            <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-8 sm:p-12 text-center max-w-3xl mx-auto shadow-2xl relative overflow-hidden">
              <div className="w-16 h-16 rounded-2xl bg-white text-black flex items-center justify-center mx-auto mb-6 shadow-xl">
                <Github className="w-10 h-10 fill-current" />
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Connect your GitHub Account
              </h1>
              <p className="text-sm text-[#8b949e] max-w-lg mx-auto mt-3 leading-relaxed">
                Seamlessly authenticate using GitHub OAuth 2.0 popup flow or Personal Access Token to explore
                repositories, analyze commits, view branches, and inspect credentials.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
                <button
                  onClick={startOAuthFlow}
                  disabled={isConnectingOAuth}
                  className="w-full sm:w-auto px-6 py-3 bg-[#238636] hover:bg-[#2ea043] text-white rounded-xl text-sm font-semibold shadow-lg shadow-emerald-950/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isConnectingOAuth ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Opening GitHub Auth...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      Connect with GitHub OAuth
                    </>
                  )}
                </button>

                <button
                  onClick={() => setIsPatModalOpen(true)}
                  className="w-full sm:w-auto px-5 py-3 bg-[#21262d] hover:bg-[#30363d] text-white rounded-xl text-sm font-medium border border-[#30363d] transition-colors flex items-center justify-center gap-2"
                >
                  <Key className="w-4 h-4 text-purple-400" />
                  Connect with Access Token
                </button>

                <button
                  onClick={() => setActiveTab('setup')}
                  className="w-full sm:w-auto px-4 py-3 text-xs text-[#8b949e] hover:text-white transition-colors"
                >
                  View Setup Instructions &rarr;
                </button>
              </div>

              {/* Quick Feature Badges */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-10 pt-8 border-t border-[#30363d]/60 text-left">
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    Iframe-Safe OAuth
                  </div>
                  <p className="text-[11px] text-[#8b949e]">
                    Direct popup flow with cross-origin postMessage communication built specifically for AI Studio.
                  </p>
                </div>

                <div className="space-y-1">
                  <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                    <BookMarked className="w-4 h-4 text-[#58a6ff]" />
                    Repository Explorer
                  </div>
                  <p className="text-[11px] text-[#8b949e]">
                    Browse public &amp; private repos, inspect branches, view recent commits, and copy clone links.
                  </p>
                </div>

                <div className="space-y-1">
                  <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                    <Key className="w-4 h-4 text-purple-400" />
                    Flexible Access
                  </div>
                  <p className="text-[11px] text-[#8b949e]">
                    Support for standard OAuth 2.0 app credentials as well as instant Personal Access Tokens (PAT).
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Setup Card */}
            <SetupGuide
              authStatus={authStatus}
              onCredentialsSaved={fetchAuthStatus}
              onOpenPatConnect={() => setIsPatModalOpen(true)}
              onStartOAuth={startOAuthFlow}
              isConnectingOAuth={isConnectingOAuth}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#30363d] py-6 text-center text-xs text-[#8b949e] bg-[#161b22]">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>GitHub Connect • AI Studio Applet</span>
          <div className="flex items-center gap-4 text-xs">
            <button
              onClick={() => setActiveTab('setup')}
              className="hover:text-white transition-colors"
            >
              Setup Guide
            </button>
            <a
              href="https://docs.github.com/en/apps/oauth-apps/building-oauth-apps"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors flex items-center gap-1"
            >
              GitHub OAuth Docs
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <ConnectModal
        isOpen={isPatModalOpen}
        onClose={() => setIsPatModalOpen(false)}
        onTokenConnected={handlePatConnected}
      />

      <ScopeSelectorModal
        isOpen={isScopeModalOpen}
        selectedScopes={scopes}
        onChangeScopes={setScopes}
        onConfirmAndLaunch={startOAuthFlow}
        onClose={() => setIsScopeModalOpen(false)}
      />

      {selectedRepo && token && (
        <RepoDetailModal
          repo={selectedRepo}
          authToken={token}
          onClose={() => setSelectedRepo(null)}
        />
      )}
    </div>
  );
}
