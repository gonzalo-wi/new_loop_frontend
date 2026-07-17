# ---- build ----
FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# VITE_API_URL is intentionally left unset: the bundle falls back to the
# relative "/api", which nginx proxies to BACKEND_URL at runtime. This keeps
# the image environment-agnostic — the same artifact ships to any backend.
#
# The Maps key, unlike the backend URL, is a Vite var baked into the JS at
# build time — it cannot be swapped at runtime, so it must be a build arg.
# Empty is fine: the truck map degrades to a "open in Google Maps" link.
ARG VITE_GOOGLE_MAPS_API_KEY=""
ENV VITE_GOOGLE_MAPS_API_KEY=$VITE_GOOGLE_MAPS_API_KEY
RUN npm run build

# ---- runtime ----
FROM nginx:1.27-alpine

COPY --from=build /app/dist /usr/share/nginx/html

COPY docker/default.conf.template /etc/nginx/loop-templates/default.conf.template
COPY docker/40-loop-envsubst.sh /docker-entrypoint.d/40-loop-envsubst.sh
RUN chmod +x /docker-entrypoint.d/40-loop-envsubst.sh

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD wget -qO- http://localhost/healthz || exit 1
