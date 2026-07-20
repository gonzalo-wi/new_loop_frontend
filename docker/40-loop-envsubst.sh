#!/bin/sh
set -eu

# The allowlist passed to envsubst is required: without it, nginx's own runtime
# variables ($host, $uri, ...) would be expanded away to empty strings.

: "${BACKEND_URL:?BACKEND_URL is required, e.g. http://192.168.0.42:8095}"

BACKEND_URL="${BACKEND_URL%/}"
export BACKEND_URL

# Sized for APK uploads from the admin panel; raise if builds outgrow it.
MAX_UPLOAD_SIZE="${MAX_UPLOAD_SIZE:-256m}"
export MAX_UPLOAD_SIZE

envsubst '${BACKEND_URL} ${MAX_UPLOAD_SIZE}' \
  < /etc/nginx/loop-templates/default.conf.template \
  > /etc/nginx/conf.d/default.conf

echo "[loop] proxying /api -> ${BACKEND_URL} (max upload ${MAX_UPLOAD_SIZE})"
