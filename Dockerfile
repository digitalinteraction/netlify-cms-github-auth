# Generates a container to run the compilled node.js scripts in
# -> runs as the "node" user so any extra folders will need to be chown-ed
# -> Uses a multi-stage to compile JavaScript and produce a slim image

# [0] A common base for both stages
FROM node:14-alpine as base
RUN mkdir /app && chown -R node:node /app
COPY --chown=node ["package*.json", "tsconfig.json", "/app/"]
USER node
WORKDIR /app

# [1] A builder to install modules and run a build
FROM base as builder
ENV NODE_ENV development
RUN npm ci
COPY --chown=node ["src", "/app/src"]
RUN npm run build

# [2] From the base again, install production deps and copy compilled code
FROM base as dist
EXPOSE 3000
ENV NODE_ENV production
RUN npm ci
COPY --from=builder --chown=node ["/app/dist", "/app/dist"]
ENTRYPOINT ["node", "dist/index.js"]
