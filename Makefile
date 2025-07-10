.PHONY: build clean run test release install browser watch-openapi watch-openapi-fswatch

# Default configuration
CONFIG ?= debug
ARGS ?=

# Paths
SWIFT_DIR = swift
BUILD_PATH = $(SWIFT_DIR)/.build
BINARY_PATH = $(BUILD_PATH)/$(CONFIG)/Thoughts
APP_NAME = Thoughts.app
APP_PATH = /Applications/$(APP_NAME)
CONTENTS_PATH = $(APP_PATH)/Contents
RESOURCES_PATH = $(CONTENTS_PATH)/Resources

TAURI_DIR = apps/desktop/src-tauri

build:
	cd $(TAURI_DIR) && pnpm run tauri build

run:
	cd $(TAURI_DIR) && pnpm run tauri dev

swift-build:
	cd $(SWIFT_DIR) && swift build --configuration $(CONFIG)

swift-release:
	cd $(SWIFT_DIR) && swift build -c release --arch arm64
	
swift-install: release
	mkdir -p "$(CONTENTS_PATH)/MacOS"
	mkdir -p "$(RESOURCES_PATH)"
	cp $(BUILD_PATH)/release/Thoughts "$(CONTENTS_PATH)/MacOS/Thoughts"
	cp $(SWIFT_DIR)/Sources/Thoughts/Info.plist "$(CONTENTS_PATH)/Info.plist"
	[ -f $(SWIFT_DIR)/Sources/Thoughts/AppIcon.icns ] && cp $(SWIFT_DIR)/Sources/Thoughts/AppIcon.icns "$(RESOURCES_PATH)/" || true
	touch "$(APP_PATH)"
	@echo "Installed to ~/Applications/Thoughts.app"

swift-run: build
	cd $(SWIFT_DIR) && swift run --configuration debug Thoughts $(ARGS) 2>&1

generate-swift-client:
	openapi-generator-cli generate \
      -i backend/openapi.json \
      -g swift5 \
      -o swift/OpenAPIClient \
      --additional-properties=asyncAwait=true,packageName=OpenAPIClient

.DEFAULT_GOAL := build 