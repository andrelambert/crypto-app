import { useState } from "react"
import { supabase } from "../../lib/supabaseClient"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

export default function Auth() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [isLogin, setIsLogin] = useState(true)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    if (isLogin) {
      // Tentativa de login com email/senha
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError(error.message)
      } else {
        alert("Logged in successfully!")
      }
    } else {
      // Tenta login silencioso para detectar se o e-mail já está cadastrado
      const { error: existingError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (!existingError || existingError.message.includes("Invalid login credentials")) {
        setError("This email is already registered. Try logging in instead.")
        setLoading(false)
        return
      }

      // Se o usuário não estiver registrado ou estiver pendente, procede com o sign up
      const { error: signUpError } = await supabase.auth.signUp({ email, password })

      if (signUpError) {
        setError(signUpError.message)
        setLoading(false)
        return
      }

      alert("Account created successfully! Please confirm your email.")
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200">
      <Card className="w-96">
        <CardHeader className="text-center">
          <CardTitle>{isLogin ? "Login" : "Sign Up"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Loading..." : isLogin ? "Log In" : "Create Account"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col items-center space-y-4">
          <Separator>or</Separator>
          <Button
            variant="ghost"
            onClick={() => {
              setIsLogin(!isLogin)
              setError("")
            }}
          >
            {isLogin
              ? "Don't have an account? Sign up"
              : "Already have an account? Log in"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
