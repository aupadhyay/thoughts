.PHONY: build clean run test release install browser

# Default configuration
CONFIG ?= debug
ARGS ?=

# Paths
BUILD_PATH = .build
BINARY_PATH = $(BUILD_PATH)/$(CONFIG)/Thoughts
APP_NAME = Thoughts.app
APP_PATH = $(HOME)/Applications/$(APP_NAME)
CONTENTS_PATH = $(APP_PATH)/Contents
RESOURCES_PATH = $(CONTENTS_PATH)/Resources

build:
	swift build --configuration $(CONFIG)

release:
	swift build -c release --arch arm64
	
install: release
	mkdir -p "$(CONTENTS_PATH)/MacOS"
	mkdir -p "$(RESOURCES_PATH)"
	cp $(BUILD_PATH)/release/Thoughts "$(CONTENTS_PATH)/MacOS/Thoughts"
	cp Sources/Thoughts/Info.plist "$(CONTENTS_PATH)/Info.plist"
	[ -f Sources/Thoughts/AppIcon.icns ] && cp Sources/Thoughts/AppIcon.icns "$(RESOURCES_PATH)/" || true
	touch "$(APP_PATH)"
	@echo "Installed to ~/Applications/Thoughts.app"

run: build
	$(BINARY_PATH) $(ARGS)

browser: build
	$(BINARY_PATH) --browser

clean:
	swift package clean
	rm -rf $(BUILD_PATH)
	rm -rf *.xcodeproj
	rm -rf $(APP_PATH)

test:
	swift test

update:
	swift package update

.DEFAULT_GOAL := build 