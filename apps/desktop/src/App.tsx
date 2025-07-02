import { useState } from "react"

export function App() {
  const [thought, setThought] = useState("")

  return (
    <div className="thought-container bg-red-500">
      <textarea
        className="thought-input bg-blue-500"
        value={thought}
        onChange={(e) => setThought(e.target.value)}
        placeholder="What's on your mind?"
        autoFocus
        spellCheck={false}
      />
    </div>
  )
}
