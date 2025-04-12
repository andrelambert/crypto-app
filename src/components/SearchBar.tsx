import React, { useEffect, useState, useRef, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils" // shadcn utility for merging classNames

// --- CoinGecko Search Result type ---
interface CoinSearchResult {
  id: string
  name: string
  symbol: string
  thumb: string
  large: string
}

// --- Props for reuse and behavior customization ---
interface SearchBarProps {
  onCoinSelect?: (coin: CoinSearchResult) => void
  className?: string
}

export default function SearchBar({ onCoinSelect, className }: SearchBarProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<CoinSearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showResults, setShowResults] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)

  // --- Fetch data from CoinGecko (debounced) ---
  const fetchSuggestions = useCallback(async (q: string) => {
    setLoading(true)
    setError(null)
    setResults([])
    setShowResults(true)

    try {
      const res = await fetch(`https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(q)}`)
      if (!res.ok) throw new Error(`API Error: ${res.statusText}`)

      const data = await res.json()
      const coins = data?.coins ?? []
      setResults(coins.slice(0, 5)) // show up to 5 results
    } catch (err) {
      console.error("Error fetching suggestions:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch suggestions")
    } finally {
      setLoading(false)
    }
  }, [])

  // --- Debounce input ---
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([])
      setError(null)
      setLoading(false)
      if (query.trim().length === 0) setShowResults(false)
      return
    }

    const delayDebounce = setTimeout(() => {
      fetchSuggestions(query)
    }, 400)

    return () => clearTimeout(delayDebounce)
  }, [query, fetchSuggestions])

  // --- Close dropdown on outside click ---
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowResults(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // --- Handle selection of a coin ---
  const handleResultClick = (coin: CoinSearchResult) => {
    setQuery("")
    setResults([])
    setShowResults(false)
    if (onCoinSelect) onCoinSelect(coin)
  }

  return (
    <div ref={containerRef} className={cn("relative w-full max-w-xl mx-auto", className)}>
      {/* Controlled Input */}
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

      {/* Suggestions Dropdown */}
      {showResults && (
        <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-[#2d333c] border border-[#444c56] rounded-lg shadow-lg overflow-hidden max-h-80 overflow-y-auto">
          {/* Loading State */}
          {loading && (
            <div className="p-3 space-y-2">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full rounded-md bg-[#3b434d]" />
              ))}
            </div>
          )}

          {/* Error State */}
          {!loading && error && (
            <div className="p-4 text-center text-red-400 text-sm">{error}</div>
          )}

          {/* No Results State */}
          {!loading && !error && results.length === 0 && query.trim().length > 1 && (
            <div className="p-4 text-center text-gray-400 text-sm">
              No results found for "{query}"
            </div>
          )}

          {/* Result List */}
          {!loading && !error && results.length > 0 && (
            <ul className="divide-y divide-[#3b434d]">
              {results.map((coin) => (
                <li key={coin.id}>
                  <button
                    type="button"
                    onClick={() => handleResultClick(coin)}
                    className="w-full text-left p-3 hover:bg-[#39414d] focus:outline-none focus:bg-[#3f4a59] transition duration-150 ease-in-out flex items-center gap-3"
                  >
                    <img src={coin.thumb} alt={coin.name} className="w-6 h-6 rounded-full" />
                    <span className="text-sm text-gray-200 font-medium">
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
