// swift-tools-version:5.5
import PackageDescription

let package = Package(
    name: "Thoughts",
    platforms: [
        .macOS(.v12)
    ],
    dependencies: [
        .package(url: "https://github.com/sindresorhus/KeyboardShortcuts", .exact("1.15.0")),
        .package(path: "OpenAPIClient"),
    ],
    targets: [
        .executableTarget(
            name: "Thoughts",
            dependencies: [
                .product(name: "OpenAPIClient", package: "OpenAPIClient"),
                .product(name: "KeyboardShortcuts", package: "KeyboardShortcuts"),
            ],
            path: "Sources"
        ),
    ]
)