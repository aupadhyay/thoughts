# thoughts

a lightweight macOS application for quickly capturing thoughts using a global keyboard shortcut. features a floating window with a clean, modern interface similar to spotlight.

## features

- floating cloudy window interface
- global keyboard shortcut for quick access
- automatic saving to sqlite database
- menu bar icon for easy access
- fast and lightweight

## requirements

- macOS 12.0 or later
- xcode 13.0 or later
- swift 5.5 or later

## installation

### quick install

```bash
# build and install to applications folder
make install
```

### development setup

1. clone the repository
2. choose one:
   - `make run` - build and run directly for development
   - `make install` - build and install to applications folder
   - `make release` - just build the release version

or manually:

```bash
# run for development
swift build
.build/debug/thoughts

# install to applications
make install
```

## project structure

```
sources/
  thoughts/
    thoughtsapp.swift    # main application entry
    contentview.swift    # main ui view
    thoughtmodel.swift   # database and data model
```
