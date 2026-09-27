import React, { useState, useMemo } from 'react';
import {
  Search,
  BookMarked,
  Star,
  GitFork,
  ExternalLink,
  ChevronDown,
  Filter,
  ArrowUpDown,
  Lock,
  Globe,
  SlidersHorizontal,
} from 'lucide-react';
import { GitHubRepo } from '../types/github';

interface RepoListProps {
  repos: GitHubRepo[];
  onSelectRepo: (repo: GitHubRepo) => void;
  isLoading: boolean;
}

const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: '#3178c6',
  JavaScript: '#f1e05a',
  Python: '#3572A5',
  Rust: '#dea584',
  Go: '#00ADD8',
  HTML: '#e34c26',
  CSS: '#563d7c',
  Java: '#b07219',
  'C++': '#f34b7d',
  C: '#555555',
  Ruby: '#701516',
  PHP: '#4F5D95',
  Shell: '#89e051',
  Swift: '#F05138',
  Kotlin: '#A97BFF',
};

export const RepoList: React.FC<RepoListProps> = ({ repos, onSelectRepo, isLoading }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [visibilityFilter, setVisibilityFilter] = useState<'all' | 'public' | 'private'>('all');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'updated' | 'stars' | 'name' | 'forks'>('updated');

  const languages = useMemo(() => {
    const set = new Set<string>();
    repos.forEach((r) => {
      if (r.language) set.add(r.language);
    });
    return Array.from(set).sort();
  }, [repos]);

  const filteredRepos = useMemo(() => {
    return repos
      .filter((repo) => {
        const matchesSearch =
          repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (repo.description && repo.description.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesVisibility =
          visibilityFilter === 'all'
            ? true
            : visibilityFilter === 'private'
            ? repo.private
            : !repo.private;

        const matchesLanguage =
          selectedLanguage === 'all' ? true : repo.language === selectedLanguage;

        return matchesSearch && matchesVisibility && matchesLanguage;
      })
      .sort((a, b) => {
        if (sortBy === 'updated') {
          return new Date(b.pushed_at || b.updated_at).getTime() - new Date(a.pushed_at || a.updated_at).getTime();
        }
        if (sortBy === 'stars') {
          return b.stargazers_count - a.stargazers_count;
        }
        if (sortBy === 'forks') {
          return b.forks_count - a.forks_count;
        }
        return a.name.localeCompare(b.name);
      });
  }, [repos, searchQuery, visibilityFilter, selectedLanguage, sortBy]);

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 shadow-md space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#8b949e] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search repositories by name or description..."
              className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-[#8b949e] focus:outline-none focus:border-[#58a6ff] transition-colors"
            />
          </div>

          {/* Visibility pills */}
          <div className="flex items-center gap-1 bg-[#0d1117] p-1 rounded-lg border border-[#30363d]">
            {(['all', 'public', 'private'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setVisibilityFilter(type)}
                className={`px-3 py-1 rounded-md text-xs font-medium capitalize transition-colors ${
                  visibilityFilter === type
                    ? 'bg-[#238636] text-white shadow-xs'
                    : 'text-[#8b949e] hover:text-white'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Secondary Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#30363d]/60 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[#8b949e] flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" />
              Language:
            </span>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="bg-[#0d1117] border border-[#30363d] rounded-md px-2 py-1 text-xs text-white focus:outline-none focus:border-[#58a6ff]"
            >
              <option value="all">All Languages</option>
              {languages.map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[#8b949e] flex items-center gap-1">
              <ArrowUpDown className="w-3.5 h-3.5" />
              Sort:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-[#0d1117] border border-[#30363d] rounded-md px-2 py-1 text-xs text-white focus:outline-none focus:border-[#58a6ff]"
            >
              <option value="updated">Recently Updated</option>
              <option value="stars">Most Stars</option>
              <option value="forks">Most Forks</option>
              <option value="name">Repository Name</option>
            </select>
          </div>
        </div>
      </div>

      {/* Repositories Count */}
      <div className="flex items-center justify-between text-xs text-[#8b949e] px-1">
        <span>
          Showing <strong className="text-white">{filteredRepos.length}</strong> of{' '}
          <strong className="text-white">{repos.length}</strong> repositories
        </span>
      </div>

      {/* Grid of Repos */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-[#161b22] border border-[#30363d] rounded-xl p-5 h-36 animate-pulse"
            />
          ))}
        </div>
      ) : filteredRepos.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredRepos.map((repo) => (
            <div
              key={repo.id}
              onClick={() => onSelectRepo(repo)}
              className="group bg-[#161b22] hover:bg-[#1c2128] border border-[#30363d] hover:border-[#58a6ff]/50 rounded-xl p-5 shadow-md transition-all cursor-pointer flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <BookMarked className="w-4 h-4 text-[#8b949e] group-hover:text-[#58a6ff] transition-colors shrink-0" />
                    <h3 className="text-sm font-semibold text-[#58a6ff] group-hover:underline truncate max-w-[200px] sm:max-w-xs">
                      {repo.name}
                    </h3>
                  </div>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[#0d1117] text-[#8b949e] border border-[#30363d] shrink-0">
                    {repo.private ? 'Private' : 'Public'}
                  </span>
                </div>

                <p className="text-xs text-[#8b949e] line-clamp-2 min-h-8">
                  {repo.description || 'No description provided.'}
                </p>
              </div>

              <div className="flex items-center justify-between pt-4 mt-2 border-t border-[#30363d]/50 text-xs text-[#8b949e]">
                <div className="flex items-center gap-3">
                  {repo.language && (
                    <span className="flex items-center gap-1.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{
                          backgroundColor: LANGUAGE_COLORS[repo.language] || '#8b949e',
                        }}
                      />
                      <span className="text-white">{repo.language}</span>
                    </span>
                  )}
                  {repo.stargazers_count > 0 && (
                    <span className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-amber-400" />
                      {repo.stargazers_count}
                    </span>
                  )}
                  {repo.forks_count > 0 && (
                    <span className="flex items-center gap-1">
                      <GitFork className="w-3.5 h-3.5" />
                      {repo.forks_count}
                    </span>
                  )}
                </div>

                <span className="text-[11px] text-[#8b949e]">
                  {new Date(repo.pushed_at || repo.updated_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-12 text-center space-y-3">
          <BookMarked className="w-10 h-10 text-[#8b949e] mx-auto" />
          <h3 className="text-sm font-semibold text-white">No repositories found</h3>
          <p className="text-xs text-[#8b949e] max-w-sm mx-auto">
            {searchQuery
              ? `No repositories matched "${searchQuery}". Try adjusting your filters.`
              : 'Your GitHub account has no repositories in this category.'}
          </p>
        </div>
      )}
    </div>
  );
};
