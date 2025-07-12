#!/usr/bin/env bash
set -e

# Initialize repo if needed
if [ ! -d .git ]; then
  echo "Initializing new Git repository..."
  git init
fi

# Ensure remote origin is set
if ! git remote get-url origin >/dev/null 2>&1; then
  echo -n "Enter your GitHub repo URL (e.g. git@github.com:username/repo.git): "
  read REMOTE_URL
  git remote add origin "$REMOTE_URL"
fi

# Add, commit, and push
git add .
git commit -m "Save current progress"
git push -u origin main

echo "☑️ Code pushed to origin/main" 