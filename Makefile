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

build:
	cd $(SWIFT_DIR) && swift build --configuration $(CONFIG)

release:
	cd $(SWIFT_DIR) && swift build -c release --arch arm64
	
install: release
	mkdir -p "$(CONTENTS_PATH)/MacOS"
	mkdir -p "$(RESOURCES_PATH)"
	cp $(BUILD_PATH)/release/Thoughts "$(CONTENTS_PATH)/MacOS/Thoughts"
	cp $(SWIFT_DIR)/Sources/Thoughts/Info.plist "$(CONTENTS_PATH)/Info.plist"
	[ -f $(SWIFT_DIR)/Sources/Thoughts/AppIcon.icns ] && cp $(SWIFT_DIR)/Sources/Thoughts/AppIcon.icns "$(RESOURCES_PATH)/" || true
	touch "$(APP_PATH)"
	@echo "Installed to ~/Applications/Thoughts.app"

run: build
	cd $(SWIFT_DIR) && swift run --configuration debug Thoughts $(ARGS) 2>&1

browser: build
	$(BINARY_PATH) --browser

clean:
	cd $(SWIFT_DIR) && swift package clean
	rm -rf $(BUILD_PATH)
	rm -rf *.xcodeproj
	rm -rf $(APP_PATH)

generate-swift-client:
	openapi-generator-cli generate \
      -i backend/openapi.json \
      -g swift5 \
      -o swift/OpenAPIClient \
      --additional-properties=asyncAwait=true,packageName=OpenAPIClient

test:
	cd $(SWIFT_DIR) && swift test

update:
	cd $(SWIFT_DIR) && swift package update

.DEFAULT_GOAL := build 