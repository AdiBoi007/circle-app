FROM node:22-bookworm-slim

WORKDIR /app

# tsx is the runtime entry point in server/package.json, so dev dependencies
# are intentionally retained. Locked installs also support migrate/bootstrap.
COPY package.json package-lock.json ./
RUN npm ci --include=dev && npm cache clean --force

COPY --chown=node:node src ./src
COPY --chown=node:node migrations ./migrations

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=8787

USER node
EXPOSE 8787
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:8787/api/health',{signal:AbortSignal.timeout(4000)}).then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
CMD ["npm", "start"]
