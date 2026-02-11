SHELL := /bin/bash

APP_NAME := nvg8
COMPOSE_PROD := docker compose -f docker-compose.yml
COMPOSE_DEV  := docker compose -f docker-compose.dev.yml

.PHONY: help ps up down restart build rebuild logs logs-backend logs-frontend \
        sh-backend sh-frontend db psql db-reset prune \
        dev-up dev-down dev-build dev-rebuild dev-logs \
        reset-prod reset-dev

help:
	@echo ""
	@echo "Targets:"
	@echo "  up            Start prod stack (detached)"
	@echo "  down          Stop prod stack"
	@echo "  restart       Restart prod stack"
	@echo "  ps            Show containers"
	@echo "  build         Build images (prod)"
	@echo "  rebuild       Rebuild images (no cache) (prod)"
	@echo "  logs          Follow logs (all) (prod)"
	@echo "  logs-backend  Follow backend logs (prod)"
	@echo "  logs-frontend Follow frontend logs (prod)"
	@echo "  sh-backend    Shell into backend container"
	@echo "  sh-frontend   Shell into frontend container"
	@echo "  db            Open psql shell"
	@echo "  psql          Run example query (list users)"
	@echo "  db-reset      Drop volume and recreate DB (DANGER)"
	@echo "  prune         Remove unused docker stuff (DANGER)"
	@echo "  reset-prod    HARD reset prod: containers+volumes+images then build+up (DANGER)"
	@echo ""
	@echo "Dev (needs docker-compose.dev.yml):"
	@echo "  dev-up, dev-down, dev-build, dev-rebuild, dev-logs"
	@echo "  reset-dev     HARD reset dev: containers+volumes+images then build+up (DANGER)"
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

build:
	$(COMPOSE_PROD) build

rebuild:
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
# Removes stack containers, volumes, and stack images, then rebuilds and starts.

reset-prod:
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

reset-dev:
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

dev-build:
	$(COMPOSE_DEV) build

dev-rebuild:
	$(COMPOSE_DEV) build --no-cache

dev-logs:
	$(COMPOSE_DEV) logs -f --tail=200
