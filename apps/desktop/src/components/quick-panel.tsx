import { useState, useEffect, useRef } from "react"
import { invoke } from "@tauri-apps/api/core"
import { trpc } from "../api"

interface SpotifyTrackInfo {
  artist: string
  track: string
}

export function QuickPanel() {
  const [input, setInput] = useState("")
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const LINE_HEIGHT = 20 // pixels per line

  const { mutate: createThought } = trpc.createThought.useMutation()

  useEffect(() => {
    inputRef.current?.focus()
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
      invoke("close_quickpanel")
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      const trimmedInput = input.trim()
      if (trimmedInput) {
        try {
          // Get both Arc URL and Spotify info in parallel
          const [url, spotifyInfo] = await Promise.all([
            invoke<string>("active_arc_url"),
            invoke<SpotifyTrackInfo>("get_spotify_track"),
          ])

          let contextInfo = `\n\nFrom: ${url}`
          if (spotifyInfo.artist !== "Not playing") {
            contextInfo += `\nListening to: ${spotifyInfo.track} by ${spotifyInfo.artist}`
          }

          createThought(trimmedInput + contextInfo, {
            onSuccess: () => {
              setInput("")
            },
            onError: (error) => {
              console.error(error)
              setInput(`Error: ${error.message}`)
            },
          })
        } catch (error) {
          console.error(error)
          // If we can't get the context info, just create the thought without it
          createThought(trimmedInput, {
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
  }

  return (
    <div className="flex w-full items-start justify-center h-auto">
      <div
        className="w-[600px] bg-white/20 backdrop-blur-[3px] pt-2 pb-1 px-2 rounded-xl shadow-2xl overflow-hidden"
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
      </div>
    </div>
  )
}
