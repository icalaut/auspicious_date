#!/bin/sh
set -eu

cd "$(dirname "$0")/.."
mkdir -p dist
cp "擇日.html" dist/index.html
cp "擇日.html" "dist/擇日.html"
