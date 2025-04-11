import { useEffect, useState } from "react"

interface CoinSearchResult {
  id: string
  name: string
  symbol: string
  large: string
}

export default function SearchBar() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<CoinSearchResult[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (query.length > 1) {
        fetchSuggestions(query)
      } else {
        setResults([])
      }
    }, 400) // debounce

    return () => clearTimeout(delayDebounce)
  }, [query])

  const fetchSuggestions = async (q: string) => {
    setLoading(true)
    try {
      const res = await fetch(`https://api.coingecko.com/api/v3/search?query=${q}`)
      const data = await res.json()
      setResults(data.coins.slice(0, 5)) // limit to 5 suggestions
    } catch (error) {
      console.error("Error fetching suggestions:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-xl mx-auto mb-6">
      <input
        type="text"
        className="input input-bordered w-full"
        placeholder="Search for a cryptocurrency..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {loading && <div className="mt-2 text-sm">Loading...</div>}

      {results.length > 0 && (
        <ul className="menu bg-base-100 shadow rounded-box mt-2">
          {results.map((coin) => (
            <li key={coin.id}>
              <a className="flex items-center gap-3">
                <img src={coin.large} alt={coin.name} className="w-6 h-6" />
                <span>
                  {coin.name} ({coin.symbol.toUpperCase()})
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
