FROM node:20-alpine
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# shadcn/ui Komponenten installieren/überschreiben (entspricht deinem ui/ Ordner)
# Wichtig: --overwrite sorgt dafür, dass fehlende/abweichende Dateien zuverlässig passen
RUN set -eux; \
  if [ ! -f shadcn.json ]; then \
    echo "❌ shadcn.json fehlt. Bitte lokal einmal ausführen: npx shadcn@latest init"; \
    exit 1; \
  fi; \
  npx --yes shadcn@latest add \
    accordion avatar badge button card checkbox \
    dialog dropdown-menu input label progress radio-group \
    select separator sheet skeleton sonner table \
    tabs textarea toggle-group toggle \
    --overwrite --yes

RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
