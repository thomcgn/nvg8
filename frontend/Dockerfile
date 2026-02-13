FROM node:20-alpine
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# shadcn/ui Komponenten generieren, falls sie fehlen
RUN if [ ! -f components/ui/card.tsx ]; then \
    npx --yes shadcn@latest add \
      card label checkbox progress radio-group select separator sheet skeleton table tabs; \
  fi

RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]