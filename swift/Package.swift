// swift-tools-version:5.5
import PackageDescription

let package = Package(
    name: "Thoughts",
    platforms: [
        .macOS(.v12)
    ],
    dependencies: [
        .package(url: "https://github.com/stephencelis/SQLite.swift.git", from: "0.14.1"),
        .package(url: "https://github.com/sindresorhus/KeyboardShortcuts", .exact("1.15.0")),
    ],
    targets: [
        .executableTarget(
            name: "Thoughts",
            dependencies: [
                .product(name: "SQLite", package: "SQLite.swift"),
                .product(name: "KeyboardShortcuts", package: "KeyboardShortcuts"),
            ],
            path: "Sources"
        ),
    ]
)