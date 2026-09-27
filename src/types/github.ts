export interface GitHubUser {
  id: number;
  login: string;
  name: string | null;
  avatar_url: string;
  html_url: string;
  bio: string | null;
  company: string | null;
  blog: string | null;
  location: string | null;
  email: string | null;
  public_repos: number;
  public_gists: number;
  followers: number;
  following: number;
  created_at: string;
  updated_at: string;
  total_private_repos?: number;
  owned_private_repos?: number;
  collaborators?: number;
}

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  html_url: string;
  description: string | null;
  fork: boolean;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  homepage: string | null;
  size: number;
  stargazers_count: number;
  watchers_count: number;
  language: string | null;
  forks_count: number;
  open_issues_count: number;
  default_branch: string;
  topics?: string[];
  owner: {
    login: string;
    avatar_url: string;
    html_url: string;
  };
}

export interface GitHubCommit {
  sha: string;
  commit: {
    message: string;
    author: {
      name: string;
      email: string;
      date: string;
    };
  };
  html_url: string;
  author: {
    login: string;
    avatar_url: string;
  } | null;
}

export interface GitHubBranch {
  name: string;
  commit: {
    sha: string;
    url: string;
  };
  protected?: boolean;
}

export interface AuthStatus {
  configured: boolean;
  hasClientId: boolean;
  hasClientSecret: boolean;
  clientIdMasked: string;
  appUrl: string;
  callbackUrls: {
    dev: string;
    shared: string;
  };
}
