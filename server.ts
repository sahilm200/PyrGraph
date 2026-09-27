import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Runtime credential storage if user enters them via UI
const runtimeCredentials = {
  clientId: process.env.GITHUB_CLIENT_ID || process.env.CLIENT_ID || '',
  clientSecret: process.env.GITHUB_CLIENT_SECRET || process.env.CLIENT_SECRET || '',
};

const DEV_APP_URL = 'https://ais-dev-w2om6i6ma3mbtudk65xt5c-552076348855.us-west2.run.app';
const SHARED_APP_URL = 'https://ais-pre-w2om6i6ma3mbtudk65xt5c-552076348855.us-west2.run.app';

function getActiveClientId(): string {
  return runtimeCredentials.clientId || process.env.GITHUB_CLIENT_ID || process.env.CLIENT_ID || '';
}

function getActiveClientSecret(): string {
  return runtimeCredentials.clientSecret || process.env.GITHUB_CLIENT_SECRET || process.env.CLIENT_SECRET || '';
}

// 1. Auth Status & Instructions
app.get('/api/auth/status', (req: Request, res: Response) => {
  const clientId = getActiveClientId();
  const clientSecret = getActiveClientSecret();
  const appUrl = process.env.APP_URL || DEV_APP_URL;

  res.json({
    configured: Boolean(clientId && clientSecret),
    hasClientId: Boolean(clientId),
    hasClientSecret: Boolean(clientSecret),
    clientIdMasked: clientId ? `${clientId.slice(0, 4)}••••${clientId.slice(-3)}` : '',
    appUrl,
    callbackUrls: {
      dev: `${DEV_APP_URL}/auth/callback`,
      shared: `${SHARED_APP_URL}/auth/callback`,
    },
  });
});

// 2. Save credentials dynamically from UI
app.post('/api/auth/save-credentials', (req: Request, res: Response) => {
  const { clientId, clientSecret } = req.body;
  if (!clientId || !clientSecret) {
    res.status(400).json({ error: 'Both Client ID and Client Secret are required.' });
    return;
  }
  runtimeCredentials.clientId = String(clientId).trim();
  runtimeCredentials.clientSecret = String(clientSecret).trim();
  res.json({
    success: true,
    message: 'Credentials updated successfully for current session.',
  });
});

// 3. Construct OAuth Authorize URL for Client popup
app.get('/api/auth/url', (req: Request, res: Response) => {
  const clientId = getActiveClientId();
  if (!clientId) {
    res.status(400).json({
      error: 'GitHub Client ID is not configured. Please set GITHUB_CLIENT_ID or provide it in the setup dialog.',
      notConfigured: true,
    });
    return;
  }

  const redirectUri = (req.query.redirect_uri as string) || `${process.env.APP_URL || DEV_APP_URL}/auth/callback`;
  const scope = (req.query.scope as string) || 'read:user user:email repo';
  const state = Math.random().toString(36).substring(2, 15);

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope,
    state,
    allow_signup: 'true',
  });

  const url = `https://github.com/login/oauth/authorize?${params.toString()}`;
  res.json({ url, state });
});

// 4. OAuth Callback Handler
const handleOAuthCallback = async (req: Request, res: Response) => {
  const { code, state, error, error_description } = req.query;

  if (error || !code) {
    const errorMsg = (error_description as string) || (error as string) || 'Authorization failed or was cancelled.';
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Authentication Error</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0d1117; color: #c9d1d9; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
            .card { background: #161b22; border: 1px solid #30363d; border-radius: 8px; padding: 24px; max-width: 440px; text-align: center; }
            h2 { color: #f85149; margin-top: 0; }
            button { background: #21262d; color: #c9d1d9; border: 1px solid #30363d; padding: 8px 16px; border-radius: 6px; cursor: pointer; margin-top: 16px; }
          </style>
        </head>
        <body>
          <div class="card">
            <h2>Authentication Failed</h2>
            <p>${escapeHtml(errorMsg)}</p>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_ERROR', error: ${JSON.stringify(errorMsg)} }, '*');
                setTimeout(() => window.close(), 1500);
              }
            </script>
            <button onclick="window.close()">Close Window</button>
          </div>
        </body>
      </html>
    `);
    return;
  }

  const clientId = getActiveClientId();
  const clientSecret = getActiveClientSecret();

  if (!clientId || !clientSecret) {
    const errorMsg = 'OAuth Client credentials are not configured on the server. Please configure GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET.';
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Setup Required</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0d1117; color: #c9d1d9; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
            .card { background: #161b22; border: 1px solid #f0883e; border-radius: 8px; padding: 24px; max-width: 480px; text-align: center; }
            h2 { color: #f0883e; margin-top: 0; }
          </style>
        </head>
        <body>
          <div class="card">
            <h2>GitHub App Credentials Missing</h2>
            <p>${escapeHtml(errorMsg)}</p>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_ERROR', error: ${JSON.stringify(errorMsg)} }, '*');
                setTimeout(() => window.close(), 2500);
              }
            </script>
          </div>
        </body>
      </html>
    `);
    return;
  }

  try {
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'GitHub-Connect-AI-Studio',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      throw new Error(tokenData.error_description || tokenData.error);
    }

    const accessToken = tokenData.access_token;

    // Fetch user details
    const userRes = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'User-Agent': 'GitHub-Connect-AI-Studio',
      },
    });
    const userData = await userRes.json();

    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>GitHub Connected</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0d1117; color: #c9d1d9; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
            .card { background: #161b22; border: 1px solid #30363d; border-radius: 12px; padding: 32px; max-width: 420px; text-align: center; box-shadow: 0 8px 24px rgba(0,0,0,0.5); }
            .avatar { width: 64px; height: 64px; border-radius: 50%; border: 2px solid #238636; margin-bottom: 12px; }
            h2 { color: #f0f6fc; margin: 8px 0; font-size: 20px; }
            p { color: #8b949e; margin: 4px 0 16px; font-size: 14px; }
            .success-badge { display: inline-flex; align-items: center; gap: 6px; background: rgba(35, 134, 54, 0.15); color: #3fb950; padding: 4px 12px; border-radius: 20px; font-size: 13px; font-weight: 500; }
          </style>
        </head>
        <body>
          <div class="card">
            ${userData.avatar_url ? `<img class="avatar" src="${escapeHtml(userData.avatar_url)}" alt="avatar" />` : ''}
            <div class="success-badge">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
              Connected as @${escapeHtml(userData.login || 'GitHub User')}
            </div>
            <h2>Authentication Successful!</h2>
            <p>Syncing your repositories and returning to the workspace...</p>
            <script>
              if (window.opener) {
                window.opener.postMessage({
                  type: 'OAUTH_AUTH_SUCCESS',
                  token: ${JSON.stringify(accessToken)},
                  scope: ${JSON.stringify(tokenData.scope || '')},
                  user: ${JSON.stringify(userData)}
                }, '*');
                setTimeout(() => window.close(), 600);
              } else {
                window.location.href = '/';
              }
            </script>
          </div>
        </body>
      </html>
    `);
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown token exchange error';
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Authentication Error</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0d1117; color: #c9d1d9; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
            .card { background: #161b22; border: 1px solid #f85149; border-radius: 8px; padding: 24px; max-width: 440px; text-align: center; }
            h2 { color: #f85149; margin-top: 0; }
          </style>
        </head>
        <body>
          <div class="card">
            <h2>Connection Error</h2>
            <p>${escapeHtml(errorMessage)}</p>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_ERROR', error: ${JSON.stringify(errorMessage)} }, '*');
                setTimeout(() => window.close(), 2000);
              }
            </script>
          </div>
        </body>
      </html>
    `);
  }
};

app.get(['/auth/callback', '/auth/callback/'], handleOAuthCallback);

// 5. Direct Token Validation (e.g., for Personal Access Tokens or verification)
app.post('/api/github/validate-token', async (req: Request, res: Response) => {
  const token = req.body.token || req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (!token) {
    res.status(400).json({ error: 'Token is required' });
    return;
  }

  try {
    const userRes = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${token}`,
        'User-Agent': 'GitHub-Connect-AI-Studio',
      },
    });

    if (!userRes.ok) {
      const err = await userRes.json();
      res.status(userRes.status).json({ error: err.message || 'Invalid GitHub token' });
      return;
    }

    const userData = await userRes.json();
    const scopes = userRes.headers.get('x-oauth-scopes') || '';

    res.json({
      valid: true,
      user: userData,
      scopes: scopes.split(',').map((s) => s.trim()).filter(Boolean),
    });
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to validate token' });
  }
});

// Helper for extracting token from header
function getAuthHeader(req: Request): string | null {
  return req.headers.authorization || null;
}

// 6. Proxy GitHub User Profile & Details
app.get('/api/github/user', async (req: Request, res: Response) => {
  const authHeader = getAuthHeader(req);
  if (!authHeader) {
    res.status(401).json({ error: 'Unauthorized: missing access token' });
    return;
  }

  try {
    const userRes = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: authHeader,
        'User-Agent': 'GitHub-Connect-AI-Studio',
      },
    });

    if (!userRes.ok) {
      const err = await userRes.json();
      res.status(userRes.status).json({ error: err.message || 'Failed to fetch user' });
      return;
    }

    const userData = await userRes.json();

    // Optionally fetch emails if scope permits
    let emails = [];
    try {
      const emailsRes = await fetch('https://api.github.com/user/emails', {
        headers: {
          Authorization: authHeader,
          'User-Agent': 'GitHub-Connect-AI-Studio',
        },
      });
      if (emailsRes.ok) {
        emails = await emailsRes.json();
      }
    } catch {
      // Ignore email errors if scope not available
    }

    res.json({ user: userData, emails });
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Error fetching user' });
  }
});

// 7. Proxy GitHub User Repositories
app.get('/api/github/repos', async (req: Request, res: Response) => {
  const authHeader = getAuthHeader(req);
  if (!authHeader) {
    res.status(401).json({ error: 'Unauthorized: missing access token' });
    return;
  }

  const perPage = req.query.per_page || '30';
  const sort = req.query.sort || 'updated';
  const type = req.query.type || 'all';

  try {
    const reposRes = await fetch(`https://api.github.com/user/repos?sort=${sort}&per_page=${perPage}&type=${type}`, {
      headers: {
        Authorization: authHeader,
        'User-Agent': 'GitHub-Connect-AI-Studio',
      },
    });

    if (!reposRes.ok) {
      const err = await reposRes.json();
      res.status(reposRes.status).json({ error: err.message || 'Failed to fetch repos' });
      return;
    }

    const repos = await reposRes.json();
    res.json({ repos });
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Error fetching repos' });
  }
});

// 8. Proxy GitHub Repo Details & Commits
app.get('/api/github/repos/:owner/:repo', async (req: Request, res: Response) => {
  const authHeader = getAuthHeader(req);
  const { owner, repo } = req.params;

  try {
    const [repoRes, commitsRes, branchesRes] = await Promise.all([
      fetch(`https://api.github.com/repos/${owner}/${repo}`, {
        headers: {
          ...(authHeader ? { Authorization: authHeader } : {}),
          'User-Agent': 'GitHub-Connect-AI-Studio',
        },
      }),
      fetch(`https://api.github.com/repos/${owner}/${repo}/commits?per_page=10`, {
        headers: {
          ...(authHeader ? { Authorization: authHeader } : {}),
          'User-Agent': 'GitHub-Connect-AI-Studio',
        },
      }),
      fetch(`https://api.github.com/repos/${owner}/${repo}/branches?per_page=20`, {
        headers: {
          ...(authHeader ? { Authorization: authHeader } : {}),
          'User-Agent': 'GitHub-Connect-AI-Studio',
        },
      }),
    ]);

    if (!repoRes.ok) {
      const err = await repoRes.json();
      res.status(repoRes.status).json({ error: err.message || 'Failed to fetch repo details' });
      return;
    }

    const repository = await repoRes.json();
    const commits = commitsRes.ok ? await commitsRes.json() : [];
    const branches = branchesRes.ok ? await branchesRes.json() : [];

    res.json({
      repository,
      commits,
      branches,
    });
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Error fetching repo details' });
  }
});

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// 9. Vite integration
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, () => {
    console.log(`> Server ready on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
