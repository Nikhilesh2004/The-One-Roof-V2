# The One Roof — image for Coolify on the VPS.
#
# Deliberately not a `standalone` build. Standalone trims node_modules to what
# the server traces, which drops Payload's CLI — and this project needs it at
# runtime for `payload migrate`, plus the tsx scripts (seed:site-content,
# create-admin). Disk is 200GB; a larger image costs nothing and keeps every
# maintenance command working inside the container.
FROM node:22.17.0-alpine

# sharp needs libc6-compat on alpine. It does the image resizing on this
# server, with no monthly limit on how many photos it can resize.
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# No `payload migrate` here: a build must not mutate the database. Migrations
# run at container start instead, where they see the real DATABASE_URL.
RUN npm run build

# Uploads live on a mounted volume, not in the image — otherwise every deploy
# would throw the shop's photography away. MEDIA_DIR must match the volume
# mount configured in Coolify.
ENV MEDIA_DIR=/app/media
RUN mkdir -p /app/media

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

CMD ["sh", "-c", "npm run migrate && npm start"]
