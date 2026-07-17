#!/bin/sh
set -eu

# The allowlist passed to envsubst is required: without it, nginx's own runtime
# variables ($host, $uri, ...) would be expanded away to empty strings.

: "${BACKEND_URL:?BACKEND_URL is required, e.g. http://192.168.0.42:8095}"

BACKEND_URL="${BACKEND_URL%/}"
export BACKEND_URL

envsubst '${BACKEND_URL}' \
  < /etc/nginx/loop-templates/default.conf.template \
  > /etc/nginx/conf.d/default.conf

echo "[loop] proxying /api -> ${BACKEND_URL}"
