.PHONY: build preview dev clean init help

# Default target
help:
	@echo "SoundArt - Audio Reactive Visualizer"
	@echo ""
	@echo "Usage: make <command>"
	@echo ""
	@echo "Commands:"
	@echo "  init     Install npm dependencies (first time setup)"
	@echo "  dev      HTTPS dev server with hot reload (for mobile testing)"
	@echo "  build    Build static files to build/"
	@echo "  preview  Preview production build (HTTP)"
	@echo "  clean    Remove build artifacts and Docker images"
	@echo ""
	@echo "Mobile Testing (HTTPS required for microphone):"
	@echo "  make dev -> https://<lan-ip>:5173"
	@echo ""

# Install dependencies
init:
	@echo "Installing dependencies..."
	docker compose run --rm init
	@echo ""
	@echo "Dependencies installed! Run 'make dev' to start the dev server."

# HTTPS dev server with hot reload
dev:
	@echo ""
	@echo "Starting Vite dev server with HTTPS + hot reload..."
	@echo ""
	@echo "Access URLs:"
	@echo "  Local:  https://localhost:5173"
	@if command -v hostname >/dev/null 2>&1; then \
		IP=$$(hostname -I 2>/dev/null | awk '{print $$1}'); \
		if [ -z "$$IP" ]; then \
			IP=$$(ipconfig getifaddr en0 2>/dev/null); \
		fi; \
		if [ -n "$$IP" ]; then \
			echo "  LAN:    https://$$IP:5173"; \
		fi; \
	fi
	@echo ""
	@echo "Note: Accept the certificate warning on first visit."
	@echo "Press Ctrl+C to stop."
	@echo ""
	docker compose run --rm --service-ports dev

# Build static files
build:
	@echo "Building Svelte app..."
	@mkdir -p build
	docker compose run --rm build
	@echo ""
	@echo "Build complete! Output in build/"

# Preview production build (HTTP only)
preview: build
	@echo ""
	@echo "Previewing production build..."
	@echo ""
	@echo "Access URLs:"
	@echo "  Local:  http://localhost:4173"
	@if command -v hostname >/dev/null 2>&1; then \
		IP=$$(hostname -I 2>/dev/null | awk '{print $$1}'); \
		if [ -z "$$IP" ]; then \
			IP=$$(ipconfig getifaddr en0 2>/dev/null); \
		fi; \
		if [ -n "$$IP" ]; then \
			echo "  LAN:    http://$$IP:4173"; \
		fi; \
	fi
	@echo ""
	@echo "Press Ctrl+C to stop."
	@echo ""
	docker compose run --rm --service-ports preview

# Clean build artifacts and Docker resources
clean:
	@echo "Cleaning up..."
	rm -rf build
	rm -rf node_modules
	rm -rf .svelte-kit
	docker compose down --rmi local --volumes 2>/dev/null || true
	@echo "Clean complete!"
