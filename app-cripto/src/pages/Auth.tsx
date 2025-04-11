import { useState } from "react"
import { supabase } from "../lib/supabaseClient.ts"

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

    const { error } = isLogin
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password })

    if (error) {
      setError(error.message)
    } else {
      alert(isLogin ? "Login feito!" : "Cadastro realizado!")
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200">
      <div className="card w-96 bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title justify-center">
            {isLogin ? "Login" : "Cadastro"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              placeholder="Email"
              className="input input-bordered w-full"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <input
              type="password"
              placeholder="Senha"
              className="input input-bordered w-full"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <button
              type="submit"
              className={`btn w-full ${loading ? "btn-disabled" : "btn-primary"}`}
            >
              {loading ? "Carregando..." : isLogin ? "Entrar" : "Cadastrar"}
            </button>
          </form>

          <div className="divider">ou</div>

          <button
            className="btn btn-ghost text-sm"
            onClick={() => setIsLogin(!isLogin)}
          >
            {isLogin
              ? "Não tem conta? Cadastre-se"
              : "Já tem conta? Fazer login"}
          </button>
        </div>
      </div>
    </div>
  )
}
