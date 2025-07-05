import { useState, useEffect, useRef } from "react"

export function QuickPanel() {
  const [input, setInput] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  return (
    <div className="flex w-full items-start justify-center">
      <div
        className="w-[600px] bg-white/20 backdrop-blur-[3px] py-1 px-2 rounded-xl shadow-2xl overflow-hidden"
        data-tauri-drag-region
      >
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="w-full px-2 bg-transparent text-gray-800 text-lg outline-none"
          placeholder="wazzzzzup"
        />
      </div>
    </div>
  )
}
