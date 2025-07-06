import { QuickPanel } from "./components/quick-panel"
import { MainWindow } from "./components/main-window"
import { createBrowserRouter, RouterProvider } from "react-router-dom"
import { trpc, trpcClient } from "./api"
import { useState } from "react"
import { QueryClient } from "@tanstack/react-query"

const router = createBrowserRouter([
  {
    path: "/main-window",
    element: <MainWindow />,
  },
  {
    path: "/quick-panel",
    element: <QuickPanel />,
  },
])

export function App() {
  const [queryClient] = useState(() => new QueryClient())
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <RouterProvider router={router} />
    </trpc.Provider>
  )
}
