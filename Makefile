SHELL := /bin/bash

APP_NAME := nvg8
COMPOSE_PROD := docker compose -f docker-compose.yml
COMPOSE_DEV  := docker compose -f docker-compose.dev.yml

# -------- SHADCN UI --------
# Frontend-Ordner + Package Manager (npm/pnpm/yarn)
FRONTEND_DIR ?= ./frontend
PKG_MGR      ?= npm

# CI/Flags:
# - SKIP_SHADCN=1    -> shadcn steps komplett überspringen (z.B. wenn UI schon im Repo fix ist)
# - SHADCN_ENFORCE=1 -> shadcn immer ausführen (z.B. in CI um sicherzugehen)
SKIP_SHADCN    ?= 0
SHADCN_ENFORCE ?= 0

# Komponenten (entspricht deinem ui/ Ordner)
SHADCN_COMPONENTS := \
	accordion avatar badge button card checkbox \
	dialog dropdown-menu input label progress radio-group \
	select separator sheet skeleton sonner table \
	tabs textarea toggle-group toggle

# Eine "Sentinel"-Datei, die sicher existieren muss, wenn ShadCN komplett ist
SHADCN_SENTINEL := $(FRONTEND_DIR)/components/ui/dialog.tsx

.PHONY: help ps up down restart build rebuild logs logs-backend logs-frontend \
        sh-backend sh-frontend db psql db-reset prune \
        dev-up dev-down dev-build dev-rebuild dev-logs \
        reset-prod reset-dev dev-back-fresh \
        shadcn-all shadcn-add shadcn-deps shadcn-check shadcn-ci shadcn-needed

help:
	@echo ""
	@echo "Targets:"
	@echo "  up            Start prod stack (detached)"
	@echo "  down          Stop prod stack"
	@echo "  restart       Restart prod stack"
	@echo "  ps            Show containers"
	@echo "  build         Build images (prod) [CI-safe: runs shadcn-ci if needed]"
	@echo "  rebuild       Rebuild images (no cache) (prod) [CI-safe: runs shadcn-ci if needed]"
	@echo "  logs          Follow logs (all) (prod)"
	@echo "  logs-backend  Follow backend logs (prod)"
	@echo "  logs-frontend Follow frontend logs (prod)"
	@echo "  sh-backend    Shell into backend container"
	@echo "  sh-frontend   Shell into frontend container"
	@echo "  db            Open psql shell"
	@echo "  psql          Run example query (list users)"
	@echo "  db-reset      Drop volume and recreate DB (DANGER)"
	@echo "  prune         Remove unused docker stuff (DANGER)"
	@echo "  reset-prod    HARD reset prod: containers+volumes+images then build+up (DANGER) [CI-safe]"
	@echo ""
	@echo "Dev (needs docker-compose.dev.yml):"
	@echo "  dev-up, dev-down, dev-build, dev-rebuild, dev-logs [CI-safe]"
	@echo "  dev-back-fresh  Recreate ONLY dev backend container + wipe backend/target (DB bleibt)"
	@echo "  reset-dev     HARD reset dev: containers+volumes+images then build+up (DANGER) [CI-safe]"
	@echo ""
	@echo "ShadCN:"
	@echo "  shadcn-all    Force install/overwrite all ShadCN components"
	@echo "  shadcn-ci     CI-safe: runs only if needed (or SHADCN_ENFORCE=1)"
	@echo "Flags:"
	@echo "  SKIP_SHADCN=1    -> skip shadcn completely"
	@echo "  SHADCN_ENFORCE=1 -> always run shadcn (even if files exist)"
	@echo ""

ps:
	$(COMPOSE_PROD) ps

up:
	$(COMPOSE_PROD) up -d

down:
	$(COMPOSE_PROD) down

restart:
	$(COMPOSE_PROD) down
	$(COMPOSE_PROD) up -d

# CI-safe: ensure shadcn is present before building images
build: shadcn-ci
	$(COMPOSE_PROD) build

rebuild: shadcn-ci
	$(COMPOSE_PROD) build --no-cache

logs:
	$(COMPOSE_PROD) logs -f --tail=200

logs-backend:
	$(COMPOSE_PROD) logs -f --tail=200 backend

logs-frontend:
	$(COMPOSE_PROD) logs -f --tail=200 frontend

sh-backend:
	docker exec -it $(APP_NAME)-backend sh

sh-frontend:
	docker exec -it $(APP_NAME)-frontend sh

db:
	docker exec -it $(APP_NAME)-postgres psql -U dev -d nvg8db

psql:
	docker exec -it $(APP_NAME)-postgres psql -U dev -d nvg8db -c "select id,email,role,enabled,last_login from users order by id;"

db-reset:
	@echo "!!! This will delete postgres_data volume. Press Ctrl+C to cancel."
	sleep 2
	$(COMPOSE_PROD) down -v
	$(COMPOSE_PROD) up -d

prune:
	@echo "!!! This will remove unused docker images/containers/networks. Press Ctrl+C to cancel."
	sleep 2
	docker system prune -af

# -------- HARD RESET (PROD/DEV) --------

reset-prod: shadcn-ci
	@echo "!!! HARD RESET PROD: removes containers, volumes, images for prod stack. DB DATA WILL BE LOST. Ctrl+C to cancel."
	sleep 3
	@echo "-> Bringing down prod stack (including volumes, orphans)..."
	$(COMPOSE_PROD) down -v --remove-orphans
	@echo "-> Removing prod images built by this compose..."
	@IMAGES="$$( $(COMPOSE_PROD) config --images 2>/dev/null | sort -u )"; \
	if [ -n "$$IMAGES" ]; then echo "$$IMAGES" | xargs -r docker rmi -f; else echo "(no images found)"; fi
	@echo "-> Rebuilding and starting prod stack..."
	$(COMPOSE_PROD) up -d --build --force-recreate
	@echo "✅ PROD reset done."

reset-dev: shadcn-ci
	@echo "!!! HARD RESET DEV: removes containers, volumes, images for dev stack. DB DATA WILL BE LOST. Ctrl+C to cancel."
	sleep 3
	@echo "-> Bringing down dev stack (including volumes, orphans)..."
	$(COMPOSE_DEV) down -v --remove-orphans
	@echo "-> Removing dev images built by this compose..."
	@IMAGES="$$( $(COMPOSE_DEV) config --images 2>/dev/null | sort -u )"; \
	if [ -n "$$IMAGES" ]; then echo "$$IMAGES" | xargs -r docker rmi -f; else echo "(no images found)"; fi
	@echo "-> Rebuilding and starting dev stack..."
	$(COMPOSE_DEV) up -d --build --force-recreate
	@echo "✅ DEV reset done."

# -------- DEV (optional) --------

dev-up:
	$(COMPOSE_DEV) up -d

dev-down:
	$(COMPOSE_DEV) down

# CI-safe
dev-build: shadcn-ci
	$(COMPOSE_DEV) build

# CI-safe
dev-rebuild: shadcn-ci
	$(COMPOSE_DEV) build --no-cache

dev-logs:
	$(COMPOSE_DEV) logs -f --tail=200

dev-back-fresh:
	@echo "!!! DEV backend fresh (DB bleibt). Ctrl+C zum Abbrechen."
	sleep 2
	@echo "-> Entferne backend container..."
	$(COMPOSE_DEV) rm -sf backend
	@echo "-> Lösche lokale Build-Artefakte (backend/target)..."
	rm -rf ./backend/target
	@echo "-> (Optional) Maven local repo cache NICHT gelöscht (m2_cache bleibt)."
	@echo "-> Starte backend neu..."
	$(COMPOSE_DEV) up -d --no-deps backend
	@echo "✅ DEV backend frisch gestartet (DB unverändert)."

# -------- SHADCN TARGETS --------

# Prüft, ob shadcn config existiert (shadcn.json ODER components.json)
shadcn-check:
	@test -f "$(FRONTEND_DIR)/shadcn.json" -o -f "$(FRONTEND_DIR)/components.json" || ( \
		echo "❌ Weder shadcn.json noch components.json gefunden in $(FRONTEND_DIR)."; \
		echo "   Bitte im Frontend einmal ausführen:"; \
		echo "     cd $(FRONTEND_DIR) && npx shadcn@latest init"; \
		exit 1 \
	)

shadcn-deps:
	@echo "-> Installiere Frontend Dependencies..."
	@cd $(FRONTEND_DIR) && $(PKG_MGR) install

# Hilfsziel: zeigt, ob ShadCN "gebraucht" wird
shadcn-needed:
	@if [ "$(SKIP_SHADCN)" = "1" ]; then \
		echo "SKIP_SHADCN=1 -> shadcn wird übersprungen"; \
		exit 1; \
	fi
	@# true -> needed, false -> not needed
	@if [ "$(SHADCN_ENFORCE)" = "1" ]; then \
		echo "SHADCN_ENFORCE=1 -> shadcn wird erzwungen"; \
		exit 0; \
	fi
	@if [ ! -f "$(SHADCN_SENTINEL)" ]; then \
		echo "ShadCN fehlt (Sentinel nicht gefunden): $(SHADCN_SENTINEL)"; \
		exit 0; \
	fi
	@echo "ShadCN ok (Sentinel vorhanden): $(SHADCN_SENTINEL)"; \
	exit 1

# CI-safe: nur ausführen wenn nötig (oder erzwungen)
shadcn-ci:
	@# Wenn übersprungen: exit 0
	@if [ "$(SKIP_SHADCN)" = "1" ]; then \
		echo "-> SKIP_SHADCN=1: Überspringe ShadCN."; \
		exit 0; \
	fi
	@# Wenn erzwungen oder Sentinel fehlt: ausführen
	@$(MAKE) -s shadcn-needed && $(MAKE) shadcn-add || true

# Force install/overwrite
shadcn-all:
	@$(MAKE) shadcn-add

# Installiert/aktualisiert alle Komponenten
shadcn-add: shadcn-check shadcn-deps
	@echo "-> Installiere/aktualisiere ShadCN Components: $(SHADCN_COMPONENTS)"
	@cd $(FRONTEND_DIR) && \
	for c in $(SHADCN_COMPONENTS); do \
		echo "   • $$c"; \
		npx shadcn@latest add $$c --yes --overwrite; \
	done
	@echo "✅ ShadCN Components installiert/aktualisiert."
