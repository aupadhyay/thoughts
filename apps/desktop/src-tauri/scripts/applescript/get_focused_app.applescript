tell application "System Events"
    set frontApp to first application process whose frontmost is true
    set appName to name of frontApp
    set appBundleId to bundle identifier of frontApp
    return "{\"name\": \"" & appName & "\", \"bundleId\": \"" & appBundleId & "\"}"
end tell