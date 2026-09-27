import React, { useEffect, useState } from 'react';
import {
  X,
  GitBranch,
  GitCommit,
  ExternalLink,
  Copy,
  Check,
  Star,
  GitFork,
  AlertCircle,
  Clock,
  Shield,
} from 'lucide-react';
import { GitHubRepo, GitHubCommit, GitHubBranch } from '../types/github';

interface RepoDetailModalProps {
  repo: GitHubRepo | null;
  authToken: string;
  onClose: () => void;
}

export const RepoDetailModal: React.FC<RepoDetailModalProps> = ({
  repo,
  authToken,
  onClose,
}) => {
  const [commits, setCommits] = useState<GitHubCommit[]>([]);
  const [branches, setBranches] = useState<GitHubBranch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedClone, setCopiedClone] = useState<'https' | 'ssh' | null>(null);

  useEffect(() => {
    if (!repo) return;
    const fetchDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/github/repos/${repo.owner.login}/${repo.name}`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to load details');
        setCommits(data.commits || []);
        setBranches(data.branches || []);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Error fetching repo details');
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [repo, authToken]);

  if (!repo) return null;

  const httpsClone = `git clone https://github.com/${repo.full_name}.git`;
  const sshClone = `git clone git@github.com:${repo.full_name}.git`;

  const copyCloneCmd = (type: 'https' | 'ssh') => {
    navigator.clipboard.writeText(type === 'https' ? httpsClone : sshClone);
    setCopiedClone(type);
    setTimeout(() => setCopiedClone(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#30363d] bg-[#0d1117]">
          <div className="flex items-center gap-3">
            <img
              src={repo.owner.avatar_url}
              alt={repo.owner.login}
              className="w-8 h-8 rounded-full border border-[#30363d]"
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-white tracking-tight">{repo.name}</h3>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[#21262d] text-[#8b949e] border border-[#30363d]">
                  {repo.private ? 'Private' : 'Public'}
                </span>
              </div>
              <p className="text-xs text-[#8b949e]">
                Owner: <span className="text-white">@{repo.owner.login}</span> • Default branch:{' '}
                <span className="text-[#58a6ff] font-mono">{repo.default_branch}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={repo.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 text-[#8b949e] hover:text-white rounded-md hover:bg-[#21262d] transition-colors"
              title="Open on GitHub"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
            <button
              onClick={onClose}
              className="p-1.5 text-[#8b949e] hover:text-white rounded-md hover:bg-[#21262d] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 divide-y divide-[#30363d]">
          {/* Overview */}
          <div className="space-y-3">
            {repo.description && <p className="text-sm text-[#c9d1d9]">{repo.description}</p>}

            <div className="flex flex-wrap items-center gap-4 text-xs text-[#8b949e]">
              <span className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5 text-amber-400" />
                <strong className="text-white">{repo.stargazers_count}</strong> stars
              </span>
              <span className="flex items-center gap-1">
                <GitFork className="w-3.5 h-3.5 text-[#8b949e]" />
                <strong className="text-white">{repo.forks_count}</strong> forks
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[#8b949e]" />
                Updated {new Date(repo.updated_at).toLocaleDateString()}
              </span>
              {repo.language && (
                <span className="flex items-center gap-1.5 text-white">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
                  {repo.language}
                </span>
              )}
            </div>

            {/* Clone Commands */}
            <div className="pt-2 space-y-2">
              <label className="text-xs font-semibold text-[#8b949e] uppercase tracking-wider block">
                Clone Repository
              </label>
              <div className="grid grid-cols-1 gap-2">
                <div className="flex items-center justify-between p-2 bg-[#0d1117] border border-[#30363d] rounded-lg">
                  <span className="text-xs font-mono text-emerald-400 truncate mr-2">{httpsClone}</span>
                  <button
                    onClick={() => copyCloneCmd('https')}
                    className="text-xs text-[#8b949e] hover:text-white flex items-center gap-1 px-2 py-1 rounded bg-[#21262d] transition-colors shrink-0"
                  >
                    {copiedClone === 'https' ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" /> HTTPS
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Branches and Commits */}
          <div className="pt-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Branches */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-[#8b949e] flex items-center gap-1.5">
                    <GitBranch className="w-3.5 h-3.5" />
                    Branches ({branches.length})
                  </h4>
                </div>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {branches.length > 0 ? (
                    branches.map((b) => (
                      <div
                        key={b.name}
                        className="flex items-center justify-between p-2 rounded-lg bg-[#0d1117] border border-[#30363d] text-xs"
                      >
                        <span className="font-mono text-white flex items-center gap-1.5 truncate">
                          <GitBranch className="w-3 h-3 text-[#8b949e]" />
                          {b.name}
                        </span>
                        {b.name === repo.default_branch && (
                          <span className="text-[10px] bg-blue-500/15 text-blue-400 border border-blue-500/30 px-1.5 py-0.5 rounded">
                            default
                          </span>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-[#8b949e] py-2">
                      {loading ? 'Loading branches...' : 'No branches loaded'}
                    </div>
                  )}
                </div>
              </div>

              {/* Commits */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-[#8b949e] flex items-center gap-1.5">
                    <GitCommit className="w-3.5 h-3.5" />
                    Recent Commits
                  </h4>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {commits.length > 0 ? (
                    commits.map((c) => (
                      <div
                        key={c.sha}
                        className="p-2 rounded-lg bg-[#0d1117] border border-[#30363d] text-xs space-y-1"
                      >
                        <div className="text-white font-medium truncate" title={c.commit.message}>
                          {c.commit.message.split('\n')[0]}
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-[#8b949e]">
                          <span className="truncate">by {c.commit.author.name}</span>
                          <span className="font-mono text-[#58a6ff]">{c.sha.slice(0, 7)}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-[#8b949e] py-2">
                      {loading ? 'Loading commit history...' : 'No commits available'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-[#30363d] bg-[#0d1117] flex items-center justify-between">
          <span className="text-xs text-[#8b949e] font-mono">ID: {repo.id}</span>
          <a
            href={repo.html_url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-[#21262d] hover:bg-[#30363d] text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 border border-[#30363d]"
          >
            Open on GitHub
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
};
