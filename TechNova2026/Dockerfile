# =============================================================================
# TechNova 2026 — static site container
# Stage 1 stamps build metadata (version, build time, git sha) into a JSON
# file so the footer's build badge can show what's actually deployed.
# Stage 2 serves the site with a small, hardened nginx image.
# =============================================================================

# ---- Stage 1: metadata -----------------------------------------------------
FROM alpine:3.20 AS meta

ARG APP_VERSION=dev
ARG GIT_SHA=unknown

RUN BUILD_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ") && \
    printf '{"version":"%s","gitSha":"%s","builtAt":"%s"}' \
      "$APP_VERSION" "$GIT_SHA" "$BUILD_TIME" > /build-info.json

# ---- Stage 2: web server ----------------------------------------------------
FROM nginx:1.27-alpine

# Run as non-root for a safer Kubernetes security context.
RUN adduser -D -H -u 1001 appuser && \
    rm -rf /usr/share/nginx/html/*

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=meta /build-info.json /usr/share/nginx/html/build-info.json

COPY index.html about.html events.html speakers.html schedule.html \
     gallery.html register.html contact.html /usr/share/nginx/html/
COPY css/ /usr/share/nginx/html/css/
COPY js/  /usr/share/nginx/html/js/
COPY images/ /usr/share/nginx/html/images/

# nginx needs to write pid/cache/log paths — hand ownership to appuser.
RUN chown -R appuser:appuser /usr/share/nginx/html /var/cache/nginx /var/log/nginx /etc/nginx/conf.d && \
    touch /var/run/nginx.pid && \
    chown appuser:appuser /var/run/nginx.pid

USER appuser

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q -O- http://127.0.0.1:8080/ >/dev/null 2>&1 || exit 1

CMD ["nginx", "-g", "daemon off;"]
