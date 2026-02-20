SHELL := /bin/bash

APP_NAME := nvg8
COMPOSE_PROD := docker compose -p nvg8-prod -f docker-compose.yml -f docker-compose.prod.yml
COMPOSE_DEV  := docker compose -p nvg8-dev  -f docker-compose.yml -f docker-compose.dev.yml

# -------- SHADCN UI --------
FRONTEND_DIR ?= ./frontend
PKG_MGR      ?= npm

SKIP_SHADCN    ?= 0
SHADCN_ENFORCE ?= 0

SHADCN_COMPONENTS := \
	accordion avatar badge button card checkbox \
	dialog dropdown-menu input label progress radio-group \
	select separator sheet skeleton sonner table \
	tabs textarea toggle-group toggle

SHADCN_SENTINEL := $(FRONTEND_DIR)/components/ui/dialog.tsx

# ---------- Helpers ----------
# Usage: $(call rebuild_service,<compose_cmd>,<service_name>)
define rebuild_service
	@echo "-> Rebuild (no cache): $(2)"
	@$(1) build --no-cache $(2)
	@echo "-> Recreate container (no deps): $(2)"
	@$(1) up -d --no-deps --force-recreate $(2)
	@echo "✅ Done: $(2)"
endef

.PHONY: help ps up down restart build rebuild logs logs-backend logs-frontend \
        sh-backend sh-frontend db psql db-reset prune \
        dev-up dev-down dev-build dev-rebuild dev-logs \
        reset-prod reset-dev dev-back-fresh \
        shadcn-all shadcn-add shadcn-deps shadcn-check shadcn-ci shadcn-needed \
        dev-back-rebuild dev-front-rebuild dev-back-rebuild-hard dev-front-rebuild-hard \
        prod-back-rebuild prod-front-rebuild prod-back-rebuild-hard prod-front-rebuild-hard

help:
	@echo ""
	@echo "Targets:"
	@echo "  up/down/restart/ps/logs..."
	@echo ""
	@echo "Single-service rebuild (keeps other services running):"
	@echo "  dev-back-rebuild       Rebuild backend (uses cache) + recreate container (DB+FE keep running)"
	@echo "  dev-front-rebuild      Rebuild frontend (uses cache) + recreate container (DB+BE keep running)"
	@echo "  dev-back-rebuild-hard  Rebuild backend NO-CACHE + recreate container (DB+FE keep running)"
	@echo "  dev-front-rebuild-hard Rebuild frontend NO-CACHE + recreate container (DB+BE keep running)"
	@echo ""
	@echo "  prod-back-rebuild / prod-front-rebuild"
	@echo "  prod-back-rebuild-hard / prod-front-rebuild-hard"
	@echo ""
	@echo "ShadCN:"
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
	@echo "-> Rebuilding images (NO CACHE)..."
	$(COMPOSE_DEV) build --no-cache
	@echo "-> Starting dev stack..."
	$(COMPOSE_DEV) up -d --force-recreate
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

# Keep DB + FE running; just recreate backend container & wipe local build artifacts
dev-back-fresh:
	@echo "!!! DEV backend fresh (DB bleibt). Ctrl+C zum Abbrechen."
	sleep 2
	@echo "-> Entferne backend container..."
	$(COMPOSE_DEV) rm -sf backend
	@echo "-> Lösche lokale Build-Artefakte (backend/target)..."
	rm -rf ./backend/target
	@echo "-> Starte backend neu (cache build)..."
	$(COMPOSE_DEV) build backend
	$(COMPOSE_DEV) up -d --no-deps --force-recreate backend
	@echo "✅ DEV backend frisch gestartet (DB unverändert)."

# -------- Single-service rebuilds (DEV) --------
# Fast: uses cache
dev-back-rebuild: shadcn-ci
	$(call rebuild_service,$(COMPOSE_DEV),backend)

dev-front-rebuild: shadcn-ci
	$(call rebuild_service,$(COMPOSE_DEV),frontend)

# Hard: no cache (what you want for backend migration fixes)
dev-back-rebuild-hard: shadcn-ci
	$(call rebuild_service,$(COMPOSE_DEV),backend)
	@# NOTE: to truly enforce no-cache, we call build explicitly:
	@$(COMPOSE_DEV) build --no-cache backend
	@$(COMPOSE_DEV) up -d --no-deps --force-recreate backend

dev-front-rebuild-hard: shadcn-ci
	@$(COMPOSE_DEV) build --no-cache frontend
	@$(COMPOSE_DEV) up -d --no-deps --force-recreate frontend
	@echo "✅ Done: frontend"

# -------- Single-service rebuilds (PROD) --------
prod-back-rebuild: shadcn-ci
	@$(COMPOSE_PROD) build backend
	@$(COMPOSE_PROD) up -d --no-deps --force-recreate backend
	@echo "✅ Done: backend"

prod-front-rebuild: shadcn-ci
	@$(COMPOSE_PROD) build frontend
	@$(COMPOSE_PROD) up -d --no-deps --force-recreate frontend
	@echo "✅ Done: frontend"

prod-back-rebuild-hard: shadcn-ci
	@$(COMPOSE_PROD) build --no-cache backend
	@$(COMPOSE_PROD) up -d --no-deps --force-recreate backend
	@echo "✅ Done: backend"

prod-front-rebuild-hard: shadcn-ci
	@$(COMPOSE_PROD) build --no-cache frontend
	@$(COMPOSE_PROD) up -d --no-deps --force-recreate frontend
	@echo "✅ Done: frontend"

# -------- SHADCN TARGETS --------

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

shadcn-needed:
	@if [ "$(SKIP_SHADCN)" = "1" ]; then \
		echo "SKIP_SHADCN=1 -> shadcn wird übersprungen"; \
		exit 1; \
	fi
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

shadcn-ci:
	@if [ "$(SKIP_SHADCN)" = "1" ]; then \
		echo "-> SKIP_SHADCN=1: Überspringe ShadCN."; \
		exit 0; \
	fi
	@$(MAKE) -s shadcn-needed && $(MAKE) shadcn-add || true

shadcn-all:
	@$(MAKE) shadcn-add

shadcn-add: shadcn-check shadcn-deps
	@echo "-> Installiere/aktualisiere ShadCN Components: $(SHADCN_COMPONENTS)"
	@cd $(FRONTEND_DIR) && \
	for c in $(SHADCN_COMPONENTS); do \
		echo "   • $$c"; \
		npx shadcn@latest add $$c --yes --overwrite; \
	done
	@echo "✅ ShadCN Components installiert/aktualisiert."