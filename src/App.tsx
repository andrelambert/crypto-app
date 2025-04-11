import { useEffect, useState } from "react"
import { supabase } from "./lib/supabaseClient"

import Auth from "./pages/Auth"
import AppLayout from "./components/AppLayout"
import PopularCoins from "./components/PopularCoins"
import SearchBar from "./components/SearchBar"

function App() {
  const [user, setUser] = useState<any>(null)
  const [showAuth, setShowAuth] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  if (showAuth) {
    return <Auth />
  }

  return (
    <AppLayout isAuthenticated={!!user}>
      <SearchBar />
      <PopularCoins />
    </AppLayout>
  )
}

export default App
