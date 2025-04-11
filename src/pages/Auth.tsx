import { useState } from "react"
import { supabase } from "../lib/supabaseClient"

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
      // Attempt to log in with email/password
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        // Show the error returned by Supabase
        setError(error.message)
      } else {
        alert("Logged in successfully!")
      }

    } else {
      /**
       * ✨ SIGN UP LOGIC
       *
       * Supabase does not return an error if the email is already confirmed.
       * So we manually check whether the email already exists and is confirmed
       * by trying to log in silently. If that works — or fails with invalid password —
       * we assume the user already exists and suggest login instead of sign up.
       */

      // Step 1: Try silent login to detect if the email already exists
      const { error: existingError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      // If login worked or failed due to wrong password, assume user already exists
      if (!existingError || existingError.message.includes("Invalid login credentials")) {
        setError("This email is already registered. Try logging in instead.");
        setLoading(false);
        return;
      }

      // Step 2: If not registered or pending confirmation, proceed with sign up
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) {
        // Handle unexpected sign-up error
        setError(signUpError.message);
        setLoading(false);
        return;
      }

      // Success: user created (or pending confirmation)
      alert("Account created successfully! Please confirm your email.");
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200">
      <div className="card w-96 bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title justify-center">
            {isLogin ? "Login" : "Sign Up"}
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
              placeholder="Password"
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
              {loading ? "Loading..." : isLogin ? "Log In" : "Create Account"}
            </button>
          </form>

          <div className="divider">or</div>

          <button
            className="btn btn-ghost text-sm"
            onClick={() => {
              setIsLogin(!isLogin)
              setError("") // Clear errors on toggle
            }}
          >
            {isLogin
              ? "Don't have an account? Sign up"
              : "Already have an account? Log in"}
          </button>
        </div>
      </div>
    </div>
  )
}
