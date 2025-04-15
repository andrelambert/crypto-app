import { useEffect, useState, useRef, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { useNavigate } from "react-router-dom"

interface CoinSearchResult {
  id: string
  name: string
  symbol: string
  thumb: string
}

interface SearchBarProps {
  className?: string
}

export default function SearchBar({ className }: SearchBarProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<CoinSearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showResults, setShowResults] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  const fetchSuggestions = useCallback(async (q: string) => {
    setLoading(true)
    setError(null)
    setResults([])
    setShowResults(true)

    try {
      const res = await fetch(`http://localhost:8000/api/coins/local-search?q=${encodeURIComponent(q)}`)
      if (!res.ok) throw new Error("Failed to fetch suggestions")
      const data = await res.json()
      setResults(data)
    } catch (err) {
      console.error("Error fetching from backend:", err)
      setError("Failed to load suggestions")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([])
      setLoading(false)
      setError(null)
      if (query.trim().length === 0) setShowResults(false)
      return
    }

    const delayDebounce = setTimeout(() => {
      fetchSuggestions(query)
    }, 400)

    return () => clearTimeout(delayDebounce)
  }, [query, fetchSuggestions])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowResults(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleResultClick = (coin: CoinSearchResult) => {
    setQuery("")
    setResults([])
    setShowResults(false)
    navigate(`/coin/${coin.id}`)
  }

  return (
    <div ref={containerRef} className={cn("relative w-lg mx-auto", className)}>
      <Input
        type="text"
        placeholder="Search for a cryptocurrency..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => {
          if (query.trim().length > 1) setShowResults(true)
        }}
        className="text-base mb-1"
      />

      {showResults && (
        <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-popover border border-border rounded-lg shadow-lg overflow-hidden max-h-80 overflow-y-auto">
          {loading && (
            <div className="p-3 space-y-2">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full rounded-md bg-muted" />
              ))}
            </div>
          )}

          {!loading && error && (
            <div className="p-4 text-center text-red-400 text-sm">{error}</div>
          )}

          {!loading && !error && results.length === 0 && query.trim().length > 1 && (
            <div className="p-4 text-center text-gray-400 text-sm">
              No results found for "{query}"
            </div>
          )}

          {!loading && !error && results.length > 0 && (
            <ul className="divide-y divide-muted">
              {results.map((coin) => (
                <li key={coin.id}>
                  <button
                    type="button"
                    onClick={() => handleResultClick(coin)}
                    className="cursor-pointer w-full text-left p-3 hover:bg-muted focus:outline-none transition duration-150 ease-in-out flex items-center gap-3"
                  >
                    <img src={coin.thumb} alt={coin.name} className="w-6 h-6 rounded-full" />
                    <span className="text-sm text-foreground font-medium">
                      {coin.name} ({coin.symbol.toUpperCase()})
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
