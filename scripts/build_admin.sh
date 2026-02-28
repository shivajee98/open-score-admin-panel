#!/bin/bash
# Build and package admin-panel for deployment
set -e

ROOT="/home/shivajee/Desktop/open_score"
APP="admin-panel"
DEST="$ROOT/backend/public"


# Generate Build/Version Info
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
# Run git command inside the backend directory which is a git repo
GIT_HASH=$(cd "$ROOT/backend" && git rev-parse --short HEAD)
VERSION_INFO="{\"version\": \"$TIMESTAMP\", \"commit\": \"$GIT_HASH\"}"

# Save to Admin Out (for static verify)
mkdir -p "$ROOT/$APP/out"
echo "$VERSION_INFO" > "$ROOT/$APP/out/version.json"

# Save to Backend Public (for API verify)
echo "$VERSION_INFO" > "$ROOT/backend/public/api_version.json"

echo "Building $APP..."
cd "$ROOT/$APP"
npm run build
# Ensure version.json is still there after build (sometimes build clean output)
echo "$VERSION_INFO" > "$ROOT/$APP/out/version.json"

echo "Zipping to $DEST/admin_dist.zip..."
cd "$ROOT/$APP/out"
rm -f "$DEST/admin_dist.zip"
zip -r "$DEST/admin_dist.zip" .

# Commit and Push
echo "Committing and Pushing to Backend Repo..."
cd "$ROOT/backend"
git add .
git commit -m "chore: update admin panel build $TIMESTAMP" || echo "Nothing to commit"
git push -f origin main

echo "$APP ready! Size: $(du -h "$DEST/admin_dist.zip" | cut -f1)"

echo "Waiting 10 seconds for GitHub to sync..."
sleep 10

echo "Triggering Deployment Phase 1 (Update Script)..."
curl -sL "https://api.msmeloan.sbs/deploy_v2.php?key=openscore_deploy_2026"

echo "Waiting 5 seconds..."
sleep 5

echo "Triggering Deployment Phase 2 (Apply Changes)..."
curl -sL "https://api.msmeloan.sbs/deploy_v2.php?key=openscore_deploy_2026"

echo "----------------------------------------"
echo "VERIFYING DEPLOYMENT..."

# Poll for Version Update
MAX_RETRIES=10
COUNT=0
URL="https://admin.msmeloan.sbs/version.json"
EXPECTED_HASH="$GIT_HASH"

while [ $COUNT -lt $MAX_RETRIES ]; do
    REMOTE_JSON=$(curl -s "$URL")
    # Extract commit hash using grep/sed simply
    REMOTE_HASH=$(echo "$REMOTE_JSON" | grep -o '"commit": "[^"]*"' | cut -d'"' -f4)
    
    if [[ "$REMOTE_HASH" == "$EXPECTED_HASH" ]]; then
        echo "✅ SUCCESS: Live version matches local build ($REMOTE_HASH)"
        exit 0
    else
        echo "⏳ ($COUNT/$MAX_RETRIES) Waiting for update... (Remote: $REMOTE_HASH vs Local: $EXPECTED_HASH)"
        sleep 5
    fi
    COUNT=$((COUNT+1))
done

echo "❌ ERROR: Deployment verification timed out. Live version mismatch."
echo "Remote Content: $REMOTE_JSON"
exit 1

