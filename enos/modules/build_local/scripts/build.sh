#!/bin/bash
set -eux -o pipefail

# Install yarn so we can build the UI
npm install --global yarn || true

export CGO_ENABLED=0

root_dir="$(git rev-parse --show-toplevel)"
pushd "$root_dir" > /dev/null
make crt-build-ui crt-build crt-bundle
popd > /dev/null
