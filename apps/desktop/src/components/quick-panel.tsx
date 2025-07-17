import { useState, useEffect, useRef } from "react"
import { invoke } from "@tauri-apps/api/core"
import { trpc } from "../api"
import { hide } from "@tauri-apps/api/app"
import { getCurrentWindow } from "@tauri-apps/api/window"

interface SpotifyTrackInfo {
  artist: string
  track: string
}

interface ContextInfo {
  url: string
  spotify: SpotifyTrackInfo
}

export function QuickPanel() {
  const [input, setInput] = useState("")
  const [contextInfo, setContextInfo] = useState<ContextInfo | null>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const LINE_HEIGHT = 20 // pixels per line

  const { mutate: createThought } = trpc.createThought.useMutation()

  const fetchContextInfo = async () => {
    try {
      const [url, spotifyInfo] = await Promise.all([
        invoke<string>("active_arc_url"),
        invoke<SpotifyTrackInfo>("get_spotify_track"),
      ])
      setContextInfo({ url, spotify: spotifyInfo })
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
      const lineCount = (input.match(/\n/g) || []).length + 1
      textarea.style.height = `${lineCount * LINE_HEIGHT}px`
    }
  }, [input])

  const handleKeyDown = async (e: React.KeyboardEvent) => {
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
          if (contextInfo.spotify.artist !== "Not playing") {
            thoughtText += `\nListening to: ${contextInfo.spotify.track} by ${contextInfo.spotify.artist}`
          }
        }

        createThought(thoughtText, {
          onSuccess: () => {
            setInput("")
          },
          onError: (error) => {
            console.error(error)
            setInput(`Error: ${error.message}`)
          },
        })
      }
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
          className="w-full px-2 bg-transparent text-white text-lg outline-none placeholder:text-white/50 resize-none overflow-hidden leading-[20px]"
          placeholder="wazzzzzup"
          rows={1}
        />
        {contextInfo && (
          <div className="text-white/50 text-xs px-2 pb-1 pt-0.5">
            {truncateUrl(contextInfo.url)}
            {contextInfo.spotify.artist !== "Not playing" && (
              <span>{` • ${contextInfo.spotify.track} by ${contextInfo.spotify.artist}`}</span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
