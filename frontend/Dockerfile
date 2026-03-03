FROM node:20-alpine AS build
WORKDIR /app

# npm: lockfile aus dem Root + frontend package.json
COPY package*.json ./
COPY frontend/package*.json ./frontend/

RUN npm ci

COPY . .

WORKDIR /app/frontend
RUN npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/frontend/.next/standalone ./
COPY --from=build /app/frontend/.next/static ./.next/static
COPY --from=build /app/frontend/public ./public

EXPOSE 3000
CMD ["node","server.js"]