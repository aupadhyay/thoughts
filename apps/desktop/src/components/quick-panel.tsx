import { useState, useEffect, useRef } from "react"
import { invoke } from "@tauri-apps/api/core"
import { trpc } from "../api"

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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      invoke("close_quickpanel")
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      const trimmedInput = input.trim()
      if (trimmedInput) {
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

  return (
    <div className="flex w-full items-start justify-center h-auto">
      <div
        className="w-[600px] bg-white/20 backdrop-blur-[3px] py-1 px-2 rounded-xl shadow-2xl overflow-hidden"
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
