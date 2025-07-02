import { invoke } from "@tauri-apps/api/core"
import { getCurrentWindow, PhysicalSize } from "@tauri-apps/api/window"

let thoughtInput: HTMLTextAreaElement | null

async function saveThought() {
  if (thoughtInput && thoughtInput.value.trim()) {
    try {
      await invoke("save_thought", {
        content: thoughtInput.value.trim(),
      })
      thoughtInput.value = ""
      // Hide window after saving
      const window = getCurrentWindow()
      await window.hide()
    } catch (error) {
      console.error("Error saving thought:", error)
    }
  }
}

function adjustTextareaHeight() {
  if (thoughtInput) {
    thoughtInput.style.height = "auto"
    thoughtInput.style.height = Math.min(thoughtInput.scrollHeight, 200) + "px"

    // Update window height to match content
    const window = getCurrentWindow()
    const newHeight = Math.max(
      36,
      Math.min(thoughtInput.scrollHeight + 16, 200)
    )
    window.setSize({ width: 400, height: newHeight } as PhysicalSize)
  }
}

window.addEventListener("DOMContentLoaded", () => {
  thoughtInput = document.querySelector("#thought-input")

  if (thoughtInput) {
    // Focus input when window shows
    thoughtInput.focus()

    // Handle Enter key (save) and Escape key (hide)
    thoughtInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        saveThought()
      } else if (e.key === "Escape") {
        e.preventDefault()
        getCurrentWindow().hide()
      }
    })

    // Auto-resize textarea
    thoughtInput.addEventListener("input", adjustTextareaHeight)

    // Initial height adjustment
    adjustTextareaHeight()
  }
})
