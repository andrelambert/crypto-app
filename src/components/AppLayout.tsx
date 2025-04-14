import { useState } from "react"
import { supabase } from "../lib/supabaseClient"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Link } from "react-router-dom"

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
    <div className="min-h-screen bg-background text-foreground">
      <header className="w-full flex justify-between items-center p-4 border-b shadow-sm">
        <h1 className="text-xl font-bold">CryptoPulse</h1>
        {isAuthenticated ? (
          <Button variant="destructive" size="sm" onClick={handleLogout}>
            Log Out
          </Button>
        ) : (
          <Button asChild size="sm">
            <Link to="/auth">Sign In / Sign Up</Link>
          </Button>
        )}
      </header>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="max-w-6xl mx-auto px-4 py-6">
        <TabsList className="mb-4 flex justify-center">
          <TabsTrigger value="coins">Coins</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="coins">{children}</TabsContent>

        <TabsContent value="alerts">
          {isAuthenticated ? (
            <p>[Here we will render alerts later]</p>
          ) : (
            <p className="text-center mt-10 text-yellow-600 text-lg">
              Please log in to view your alerts.
            </p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
