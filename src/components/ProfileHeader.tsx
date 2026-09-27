import React from 'react';
import {
  LogOut,
  MapPin,
  Building,
  Link as LinkIcon,
  Mail,
  Shield,
  BookMarked,
  Users,
  Star,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import { GitHubUser } from '../types/github';

interface ProfileHeaderProps {
  user: GitHubUser;
  authMethod: 'oauth' | 'pat';
  scopes: string[];
  onDisconnect: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  user,
  authMethod,
  scopes,
  onDisconnect,
  onRefresh,
  isRefreshing,
}) => {
  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6 shadow-xl space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* User Identity */}
        <div className="flex items-start gap-4">
          <div className="relative">
            <img
              src={user.avatar_url}
              alt={user.login}
              className="w-16 h-16 rounded-full border-2 border-[#30363d] shadow-md object-cover"
            />
            <span
              className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-[#161b22] ${
                authMethod === 'oauth' ? 'bg-emerald-400' : 'bg-purple-400'
              }`}
              title={authMethod === 'oauth' ? 'Connected via OAuth' : 'Connected via Personal Access Token'}
            />
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-white tracking-tight">{user.name || user.login}</h1>
              <a
                href={user.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-[#8b949e] hover:text-[#58a6ff] flex items-center gap-1 font-mono transition-colors"
              >
                @{user.login}
                <ExternalLink className="w-3 h-3" />
              </a>
              <span
                className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${
                  authMethod === 'oauth'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                }`}
              >
                {authMethod === 'oauth' ? 'OAuth Session' : 'Personal Token'}
              </span>
            </div>

            {user.bio && <p className="text-xs text-[#c9d1d9] max-w-xl">{user.bio}</p>}

            {/* Meta tags */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#8b949e] pt-1">
              {user.company && (
                <span className="flex items-center gap-1">
                  <Building className="w-3.5 h-3.5" />
                  {user.company}
                </span>
              )}
              {user.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {user.location}
                </span>
              )}
              {user.blog && (
                <a
                  href={user.blog.startsWith('http') ? user.blog : `https://${user.blog}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-[#58a6ff] transition-colors"
                >
                  <LinkIcon className="w-3.5 h-3.5" />
                  {user.blog.replace(/^https?:\/\//, '')}
                </a>
              )}
              {user.email && (
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5" />
                  {user.email}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 self-end md:self-auto">
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            title="Refresh Repositories and User Info"
            className="p-2 bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] rounded-lg border border-[#30363d] transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#58a6ff]' : ''}`} />
          </button>
          <button
            onClick={onDisconnect}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#21262d] hover:bg-rose-500/20 text-[#8b949e] hover:text-rose-400 border border-[#30363d] hover:border-rose-500/30 rounded-lg text-xs font-medium transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Disconnect
          </button>
        </div>
      </div>

      {/* Stats and Scopes Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-[#30363d]">
        <div className="bg-[#0d1117] border border-[#30363d] rounded-lg p-3">
          <div className="flex items-center justify-between text-[#8b949e] text-xs">
            <span>Repositories</span>
            <BookMarked className="w-3.5 h-3.5" />
          </div>
          <div className="text-xl font-bold text-white mt-1">
            {user.public_repos + (user.total_private_repos || 0)}
          </div>
          <div className="text-[10px] text-[#8b949e] mt-0.5">
            {user.public_repos} public {user.total_private_repos ? `• ${user.total_private_repos} private` : ''}
          </div>
        </div>

        <div className="bg-[#0d1117] border border-[#30363d] rounded-lg p-3">
          <div className="flex items-center justify-between text-[#8b949e] text-xs">
            <span>Followers</span>
            <Users className="w-3.5 h-3.5" />
          </div>
          <div className="text-xl font-bold text-white mt-1">{user.followers}</div>
          <div className="text-[10px] text-[#8b949e] mt-0.5">Following {user.following}</div>
        </div>

        <div className="bg-[#0d1117] border border-[#30363d] rounded-lg p-3">
          <div className="flex items-center justify-between text-[#8b949e] text-xs">
            <span>Public Gists</span>
            <Star className="w-3.5 h-3.5" />
          </div>
          <div className="text-xl font-bold text-white mt-1">{user.public_gists}</div>
          <div className="text-[10px] text-[#8b949e] mt-0.5">Snippets &amp; notes</div>
        </div>

        <div className="bg-[#0d1117] border border-[#30363d] rounded-lg p-3">
          <div className="flex items-center justify-between text-[#8b949e] text-xs">
            <span>Granted Scopes</span>
            <Shield className="w-3.5 h-3.5" />
          </div>
          <div className="text-xs font-mono text-emerald-400 mt-1 truncate">
            {scopes.length > 0 ? scopes.join(', ') : 'read:user, repo'}
          </div>
          <div className="text-[10px] text-[#8b949e] mt-0.5">Active OAuth privileges</div>
        </div>
      </div>
    </div>
  );
};
