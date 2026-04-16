#!/bin/bash
# Runs on SessionStart. In a worktree: installs deps + starts dev server.
# In the main repo: exits immediately (no-op).

set -e

# ── Worktree detection ────────────────────────────────────────────────────────
# In a worktree, git-dir differs from git-common-dir.
GIT_DIR=$(git rev-parse --git-dir 2>/dev/null) || exit 0
GIT_COMMON_DIR=$(git rev-parse --git-common-dir 2>/dev/null) || exit 0

if [ "$GIT_DIR" = "$GIT_COMMON_DIR" ]; then
  exit 0  # main repo — skip
fi

WORKTREE_ROOT=$(git rev-parse --show-toplevel)
cd "$WORKTREE_ROOT"
mkdir -p .claude

# ── Dev server already running? ───────────────────────────────────────────────
if [ -f ".claude/dev-server.pid" ] && [ -f ".claude/dev-server.port" ]; then
  PID=$(cat .claude/dev-server.pid)
  PORT=$(cat .claude/dev-server.port)
  if kill -0 "$PID" 2>/dev/null; then
    echo "Dev server already running on port $PORT (PID $PID)."
    exit 0
  fi
fi

# ── npm install (skip if node_modules is up to date) ─────────────────────────
if [ ! -d "node_modules" ] || [ "package.json" -nt "node_modules" ]; then
  echo "Running npm install…"
  npm install
fi

# ── Find a free port ──────────────────────────────────────────────────────────
PORT=$(node -e "
const net = require('net');
const s = net.createServer();
s.listen(0, '127.0.0.1', () => { console.log(s.address().port); s.close(); });
")

# ── Start dev server ──────────────────────────────────────────────────────────
PORT=$PORT npm run dev > .claude/dev-server.log 2>&1 &
echo $! > .claude/dev-server.pid
echo "$PORT" > .claude/dev-server.port

echo "Dev server started on port $PORT. Access at http://localhost:$PORT"
