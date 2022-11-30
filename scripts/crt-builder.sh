#!/usr/bin/env bash

# The crt-builder is used to detemine build metadata and create Vault builds.
# We use it in build-vault.yml for building release artifacts with CRT. It is
# also used by Enos for artifact_source:local scenario variants.

set -euo pipefail

# We don't want to get stuck in some kind of interactive pager
export GIT_PAGER=cat

# Get the full version information
function version() {
  local version
  local prerelease
  local metadata

  version=$(version_base)
  prerelease=$(version_pre)
  metadata=$(version_metadata)

  if [ -n "$metadata" ] && [ -n "$prerelease" ]; then
    echo "$version-$prerelease+$metadata"
  elif [ -n "$metadata" ]; then
    echo "$version+$metadata"
  elif [ -n "$prerelease" ]; then
    echo "$version-$prerelease"
  else
    echo "$version"
  fi
}

# Get the base version
function version_base() {
  : "${VAULT_VERSION:=""}"

  if [ -n "$VAULT_VERSION" ]; then
    echo "$VAULT_VERSION"
    return
  fi

  : "${VERSION_FILE:=$(repo_root)/sdk/version/version_base.go}"
  awk '$1 == "Version" && $2 == "=" { gsub(/"/, "", $3); print $3 }' < "$VERSION_FILE"
}

# Get the version pre-release
function version_pre() {
  : "${VAULT_PRERELEASE:=""}"

  if [ -n "$VAULT_PRERELEASE" ]; then
    echo "$VAULT_PRERELEASE"
    return
  fi

  : "${VERSION_FILE:=$(repo_root)/sdk/version/version_base.go}"
  awk '$1 == "VersionPrerelease" && $2 == "=" { gsub(/"/, "", $3); print $3 }' < "$VERSION_FILE"
}

# Get the version metadata, which is commonly the edition
function version_metadata() {
  : "${VAULT_METADATA:=""}"

  if [ -n "$VAULT_METADATA" ]; then
    echo "$VAULT_METADATA"
    return
  fi

  : "${VERSION_FILE:=$(repo_root)/sdk/version/version_base.go}"
  awk '$1 == "VersionMetadata" && $2 == "=" { gsub(/"/, "", $3); print $3 }' < "$VERSION_FILE"
}

# Get the build date from the latest commit since it can be used across all
# builds
function build_date() {
  # It's tricky to do an RFC3339 format in a cross platform way, so we hardcode UTC
  : "${DATE_FORMAT:="%Y-%m-%dT%H:%M:%SZ"}"
  git show --no-show-signature -s --format=%cd --date=format:"$DATE_FORMAT" HEAD
}

# Get the revision, which is the latest commit SHA
function build_revision() {
  git rev-parse HEAD
}

# Determine our repository by looking at our origin URL
function repo() {
  basename -s .git "$(git config --get remote.origin.url)"
}

# Determine the root directory of the repository
function repo_root() {
  git rev-parse --show-toplevel
}

# Determine the artifact basename based on metadata
function artifact_basename() {
  : "${PKG_NAME:="vault"}"
  : "${GOOS:=$(go env GOOS)}"
  : "${GOARCH:=$(go env GOARCH)}"

  echo "${PKG_NAME}_$(version)_${GOOS}_${GOARCH}"
}

# Build the UI
function build_ui() {
  local repo_root
  repo_root=$(repo_root)

  pushd "$repo_root"
  mkdir -p http/web_ui
  popd
  pushd "$repo_root/ui"
  yarn install --ignore-optional
  npm rebuild node-sass
  yarn --verbose run build
  popd
}

# Build Vault
function build() {
  local version
  local revision
  local prerelease
  local build_date
  local ldflags
  local msg

  # Get or set our basic build metadata
  version=$(version_base)
  revision=$(build_revision)
  metadata=$(version_metadata)
  prerelease=$(version_pre)
  build_date=$(build_date)
  : "${GO_TAGS:=""}"
  : "${KEEP_SYMBOLS:=""}"

  # Build our ldflags
  msg="--> Building Vault v$version, revision $revision, built $build_date"

  # Strip the symbol and dwarf information by default
  if [ -n "$KEEP_SYMBOLS" ]; then
    ldflags=""
  else
    ldflags="-s -w "
  fi

  ldflags="${ldflags}-X github.com/hashicorp/vault/sdk/version.Version=$version -X github.com/hashicorp/vault/sdk/version.GitCommit=$revision -X github.com/hashicorp/vault/sdk/version.BuildDate=$build_date"

  if [ -n "$prerelease" ]; then
    msg="${msg}, prerelease ${prerelease}"
    ldflags="${ldflags} -X github.com/hashicorp/vault/sdk/version.VersionPrerelease=$prerelease"
  fi

  if [ -n "$metadata" ]; then
    msg="${msg}, metadata ${VAULT_METADATA}"
    ldflags="${ldflags} -X github.com/hashicorp/vault/sdk/version.VersionMetadata=$metadata"
  fi

  # Build vault
  echo "$msg"
  pushd "$(repo_root)"
  mkdir -p dist
  mkdir -p out
  set -x
  go build -v -tags "$GO_TAGS" -ldflags "$ldflags" -o dist/
  set +x
  popd
}

# Bundle the dist directory
function bundle() {
  : "${BUNDLE_PATH:=$(repo_root)/vault.zip}"
  echo "--> Bundling dist/* to $BUNDLE_PATH"
  zip -r -j "$BUNDLE_PATH" dist/
}

# Prepare legal requirements for packaging
function prepare_legal() {
  : "${PKG_NAME:="vault"}"

  pushd "$(repo_root)"
  mkdir -p dist
  curl -o dist/EULA.txt https://eula.hashicorp.com/EULA.txt
  curl -o dist/TermsOfEvaluation.txt https://eula.hashicorp.com/TermsOfEvaluation.txt
  mkdir -p ".release/linux/package/usr/share/doc/$PKG_NAME"
  cp dist/EULA.txt ".release/linux/package/usr/share/doc/$PKG_NAME/EULA.txt"
  cp dist/TermsOfEvaluation.txt ".release/linux/package/usr/share/doc/$PKG_NAME/TermsOfEvaluation.txt"
  popd
}

# Run the CRT Builder
function main() {
  case $1 in
  artifact-basename)
    artifact_basename
  ;;
  build)
    build
  ;;
  build-ui)
    build_ui
  ;;
  bundle)
    bundle
  ;;
  date)
    build_date
  ;;
  prepare-legal)
    prepare_legal
  ;;
  revision)
    build_revision
  ;;
  version)
    version
  ;;
  version-base)
    version_base
  ;;
  version-pre)
    version_pre
  ;;
  version-meta)
    version_metadata
  ;;
  *)
    echo "unknown sub-command" >&2
    exit 1
  ;;
  esac
}

main "$@"
