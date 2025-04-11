import { useEffect, useState } from "react"
import { supabase } from "./lib/supabaseClient"
import Auth from "./pages/Auth"

export default function App() {
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    // Retrieve the current user session
    supabase.auth.getUser().then(({ data }) => setUser(data.user))

    // Listen for auth state changes
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  return user ? (
    <div className="min-h-screen flex flex-col items-center justify-center bg-base-200">
      <h1 className="text-2xl font-bold mb-4">Welcome, {user.email}</h1>
      <button className="btn btn-error" onClick={handleLogout}>
        Log Out
      </button>
    </div>
  ) : (
    <Auth />
  )
}
