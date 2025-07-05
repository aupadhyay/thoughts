import { QuickPanel } from "./components/quick-panel"
import { MainWindow } from "./components/main-window"
import { createBrowserRouter, RouterProvider } from "react-router-dom"

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
  return <RouterProvider router={router} />
}
