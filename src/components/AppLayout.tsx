import { useState } from "react"
import { supabase } from "../lib/supabaseClient"

interface Props {
  children: React.ReactNode
  isAuthenticated: boolean
}

export default function AppLayout({ children, isAuthenticated }: Props) {
  const [activeTab, setActiveTab] = useState("coins")

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.reload()
  }

  return (
    <div className="min-h-screen bg-base-200 text-base-content">
      <header className="w-full flex justify-between items-center p-4 bg-base-100 shadow">
        <h1 className="text-xl font-bold">Crypto App</h1>
        {isAuthenticated ? (
          <button className="btn btn-error btn-sm" onClick={handleLogout}>
            Log Out
          </button>
        ) : (
          <a href="#auth" className="btn btn-primary btn-sm">Sign In / Sign Up</a>
        )}
      </header>

      <div className="tabs tabs-boxed justify-center mt-6">
        <a
          className={`tab ${activeTab === "coins" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("coins")}
        >
          Coins
        </a>
        <a
          className={`tab ${activeTab === "alerts" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("alerts")}
        >
          Alerts
        </a>
      </div>

    <main className="max-w-6xl mx-auto px-4 py-6">
        {activeTab === "coins" && (
            <div>{children}</div>
        )}
        {activeTab === "alerts" && (
            isAuthenticated ? (
            <p>[Here we will render alerts later]</p>
            ) : (
            <p className="text-center mt-10 text-warning text-lg">
                Please log in to view your alerts.
            </p>
            )
        )}
    </main>

    </div>
  )
}
