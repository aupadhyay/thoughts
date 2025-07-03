import { QuickPanel } from "./components/quick-panel"

export function App() {
  return (
    <div className="flex h-screen w-screen">
      <QuickPanel isOpen={true} />
    </div>
  )
}
