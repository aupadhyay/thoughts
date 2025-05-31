# Thoughts

A lightweight macOS application for quickly capturing thoughts using a global keyboard shortcut. Features a floating window with a clean, modern interface similar to Spotlight.

## Features

- 🌤 Floating cloudy window interface
- ⌨️ Global keyboard shortcut for quick access
- 💾 Automatic saving to SQLite database
- 🎯 Menu bar icon for easy access
- ⚡️ Fast and lightweight

## Requirements

- macOS 12.0 or later
- Xcode 13.0 or later
- Swift 5.5 or later

## Installation

### Quick Install

```bash
# Build and install to Applications folder
make install
```

### Development Setup

1. Clone the repository
2. Choose one:
   - `make run` - Build and run directly for development
   - `make install` - Build and install to Applications folder
   - `make release` - Just build the release version

Or manually:

```bash
# Run for development
swift build
.build/debug/Thoughts

# Install to Applications
make install
```

## Development

The project uses Swift Package Manager for dependency management. Main dependencies:

- SQLite.swift for database operations

## Project Structure

```
Sources/
  Thoughts/
    ThoughtsApp.swift    # Main application entry
    ContentView.swift    # Main UI view
    ThoughtModel.swift   # Database and data model
```

## License

MIT License
