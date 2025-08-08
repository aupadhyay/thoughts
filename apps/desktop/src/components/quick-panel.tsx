import { useState, useEffect, useRef } from "react"
import { invoke } from "@tauri-apps/api/core"
import { trpc } from "../api"
import { getCurrentWindow } from "@tauri-apps/api/window"

export interface SpotifyTrackInfo {
  artist: string
  track: string
}

export interface FocusedAppInfo {
  name: string
  bundleId: string
}

export interface Image {
  mimeType: string
  dataUri: string
}

export interface ContextInfo {
  url?: string
  spotify?: SpotifyTrackInfo
  focusedApp?: FocusedAppInfo
  images?: Image[]
}

export function QuickPanel() {
  const [input, setInput] = useState("")
  const [contextInfo, setContextInfo] = useState<ContextInfo | null>(null)
  const [pastedImages, setPastedImages] = useState<
    { mimeType: string; dataUri: string }[]
  >([])
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const { mutate: createThought } = trpc.createThought.useMutation()

  const fetchContextInfo = async () => {
    try {
      const [url, spotifyInfo, focusedAppInfo] = await Promise.all([
        invoke<string>("active_arc_url"),
        invoke<SpotifyTrackInfo>("get_spotify_track"),
        invoke<FocusedAppInfo>("get_focused_app"),
      ])
      setContextInfo({ url, spotify: spotifyInfo, focusedApp: focusedAppInfo })
    } catch (error) {
      console.error("Failed to fetch context:", error)
    }
  }

  useEffect(() => {
    const window = getCurrentWindow()

    const unlistenVisibilityChange = window.onFocusChanged(
      ({ payload: focused }) => {
        if (focused) {
          fetchContextInfo()
        }
      }
    )

    fetchContextInfo()
    inputRef.current?.focus()

    return () => {
      unlistenVisibilityChange.then((unlisten) => unlisten())
    }
  }, [])

  useEffect(() => {
    const textarea = inputRef.current
    if (textarea) {
      // Reset height to auto to get proper scrollHeight
      textarea.style.height = "auto"
      // Set the height to scrollHeight which includes wrapped content
      textarea.style.height = `${textarea.scrollHeight}px`
    }
  }, [input])

  const handleKeyDown = async (e: React.KeyboardEvent) => {
    if (e.metaKey && e.key.toLowerCase() === "k") {
      e.preventDefault()
      try {
        await invoke("open_main_window")
      } catch (err) {
        console.error("Failed to open main window", err)
      }
      return
    }
    if (e.key === "Escape") {
      const window = getCurrentWindow()
      window.hide()
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      const trimmedInput = input.trim()
      if (trimmedInput) {
        let thoughtText = trimmedInput

        if (contextInfo) {
          thoughtText += `\n\nFrom: ${contextInfo.url}`
          if (contextInfo.focusedApp) {
            thoughtText += `\nFocused app: ${contextInfo.focusedApp.name}`
          }
          if (
            contextInfo.spotify &&
            contextInfo.spotify.artist !== "Not playing"
          ) {
            thoughtText += `\nListening to: ${contextInfo.spotify.track} by ${contextInfo.spotify.artist}`
          }
        }

        const metadata = {
          url: contextInfo?.url ?? null,
          spotify: contextInfo?.spotify ?? null,
          focusedApp: contextInfo?.focusedApp ?? null,
          images: pastedImages.map((img) => ({
            mimeType: img.mimeType,
            dataUri: img.dataUri,
          })),
        }

        createThought(
          { content: thoughtText, metadata: JSON.stringify(metadata) },
          {
            onSuccess: () => {
              setInput("")
              setPastedImages([])
            },
            onError: (error) => {
              console.error(error)
              setInput(`Error: ${error.message}`)
            },
          }
        )
      }
    }
  }

  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items
    if (!items) return
    const imagePromises: Promise<{
      mimeType: string
      dataUri: string
    } | null>[] = []
    for (let i = 0; i < items.length; i += 1) {
      const item = items[i]
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile()
        if (file) {
          imagePromises.push(
            new Promise((resolve) => {
              const reader = new FileReader()
              reader.onload = () => {
                resolve({
                  mimeType: file.type,
                  dataUri: reader.result as string,
                })
              }
              reader.onerror = () => resolve(null)
              reader.readAsDataURL(file)
            })
          )
        }
      }
    }

    const images = (await Promise.all(imagePromises)).filter(
      (x): x is { mimeType: string; dataUri: string } => Boolean(x)
    )
    if (images.length > 0) {
      setPastedImages((prev) => [...prev, ...images])
    }
  }

  const truncateUrl = (url: string) => {
    if (url.length > 50) {
      return `${url.substring(0, 47)}...`
    }
    return url
  }

  return (
    <div className="flex w-full items-start justify-center h-auto">
      <div
        className="w-[600px] bg-[#1e1e1e] pt-2 pb-1 px-2 rounded-xl overflow-hidden relative"
        data-tauri-drag-region
      >
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          className="w-full px-2 bg-transparent text-white text-lg outline-none placeholder:text-white/50 resize-none overflow-hidden leading-[20px]"
          placeholder="wazzzzzup"
          rows={1}
        />
        {(contextInfo || pastedImages.length > 0) && (
          <div className="text-white/50 text-xs px-2 pb-1 pt-0.5">
            {contextInfo && (
              <>
                {truncateUrl(contextInfo.url ?? "")}
                {contextInfo.focusedApp && (
                  <span>{`${contextInfo.url ? " • " : ""}${contextInfo.focusedApp.name}`}</span>
                )}
                {contextInfo.spotify &&
                  contextInfo.spotify.artist !== "Not playing" && (
                    <span>{` • ${contextInfo.spotify.track} by ${contextInfo.spotify.artist}`}</span>
                  )}
              </>
            )}
            {pastedImages.length > 0 && (
              <span>{`${contextInfo ? " • " : ""}Pasted image${pastedImages.length > 1 ? "s" : ""} (${pastedImages.length})`}</span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
