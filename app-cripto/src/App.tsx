import { useEffect, useState } from "react"
import { supabase } from "./lib/supabaseClient"
import Auth from "./pages/Auth"

function App() {
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))

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
      <h1 className="text-2xl font-bold mb-4">Bem-vindo, {user.email}</h1>
      <button className="btn btn-error" onClick={handleLogout}>Sair</button>
    </div>
  ) : (
    <Auth />
  )
}

export default App
