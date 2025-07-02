import { useState } from "react"

export function App() {
  const [thought, setThought] = useState("")

  return (
    <div className="thought-container">
      <textarea
        className="thought-input"
        value={thought}
        onChange={(e) => setThought(e.target.value)}
        placeholder="What's on your mind?"
        autoFocus
        spellCheck={false}
      />
    </div>
  )
}
