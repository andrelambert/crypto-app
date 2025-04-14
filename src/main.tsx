// src/main.tsx
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { createBrowserRouter, RouterProvider, Route, createRoutesFromElements } from "react-router-dom"

import App from "./App"
import AuthPage from "./pages/AuthPage" // nova página de autenticação
import CoinDetails from "./pages/CoinDetails"
import PopularCoins from "./pages/PopularCoins"

import "./App.css"

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/">
      <Route index element={<App />} />
      <Route path="auth" element={<AuthPage />} />
      <Route path="coin/:id" element={<CoinDetails />} />
      <Route path="coins" element={<PopularCoins />} />
    </Route>
  )
)

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
)
