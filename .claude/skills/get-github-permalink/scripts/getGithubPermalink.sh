#! /bin/bash

die() {
    echo "Error: $*" >&2
    exit 1
}

# Usage helper to avoid repeated text.
usage() {
    die "Usage: $0 <path> <start_line> <end_line>(optional)"
}

file_path="${1:-}"
start_line="${2:-}"
end_line="${3:-}"

[[ -z "$file_path" || -z "$start_line" ]] && usage

# Ensure file exists
[[ ! -f "$file_path" ]] && die "File not found: $file_path"

# Resolve absolute path
abs_path=$(realpath "$file_path")

# Detect git repo root based on file location
repo_root=$(git -C "$(dirname "$abs_path")" rev-parse --show-toplevel 2>/dev/null) \
    || die "File is not inside a git repository"

# Get commit hash from correct repo
commit_hash=$(git -C "$repo_root" rev-parse HEAD) \
    || die "Cannot get commit hash"

# Get remote URL
remote_url=$(git -C "$repo_root" remote get-url origin 2>/dev/null) \
    || die "Cannot get remote URL"

# Normalize remote URL (support ssh + https)
if [[ "$remote_url" =~ ^git@ ]]; then
    # git@github.com:user/repo.git
    repo_name=$(echo "$remote_url" | sed -E 's#git@[^:]+:([^\.]+)(\.git)?#\1#')
elif [[ "$remote_url" =~ ^https?:// ]]; then
    # https://github.com/user/repo.git
    repo_name=$(echo "$remote_url" | sed -E 's#https?://[^/]+/([^\.]+)(\.git)?#\1#')
else
    die "Unsupported remote URL format: $remote_url"
fi
# Replace dmkt9/ExpensifyApp with Expensify/App
repo_name=$(echo $repo_name | sed -E 's#dmkt9/ExpensifyApp#Expensify/App#')

# Make file path relative to repo root
relative_path="${abs_path#$repo_root/}"

# Build permalink
if [[ -n "${end_line:-}" && "$end_line" != "$start_line" ]]; then
    permalink="https://github.com/$repo_name/blob/$commit_hash/$relative_path#L$start_line-L$end_line"
else
    permalink="https://github.com/$repo_name/blob/$commit_hash/$relative_path#L$start_line"
fi

echo "$permalink"