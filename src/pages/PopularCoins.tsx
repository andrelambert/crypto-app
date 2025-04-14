import { useEffect, useState } from "react"
import { LineChart, Line, ResponsiveContainer } from "recharts"
import { Card, CardContent } from "@/components/ui/card"

// Define the shape of a Coin object returned from CoinGecko API
interface Coin {
  id: string
  symbol: string
  name: string
  image: string
  current_price: number
  market_cap_rank: number
  sparkline_in_7d: {
    price: number[]
  }
  price_change_percentage_24h: number
}

// Format price to currency with dynamic decimal precision
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: value < 1 ? 6 : 2,
  }).format(value)
}

// Format percentage change and add "+" for positive values
const formatPercentage = (value: number) => {
  const formatted = value.toFixed(2)
  return value > 0 ? `+${formatted}%` : `${formatted}%`
}

// Normalize sparkline data to a 0-100 scale for consistent chart rendering
const normalizeSparkline = (prices: number[] | null | undefined): { name: string; value: number }[] => {
  if (!prices || prices.length === 0) return []

  const validPrices = prices.filter(price => typeof price === "number" && isFinite(price))
  if (validPrices.length < 2) return validPrices.map((_, index) => ({ name: `p${index}`, value: 50 }))

  const minPrice = Math.min(...validPrices)
  const maxPrice = Math.max(...validPrices)
  const range = maxPrice - minPrice

  if (range === 0) {
    return validPrices.map((_, index) => ({ name: `p${index}`, value: 50 }))
  }

  return validPrices.map((price, index) => ({
    name: `p${index}`,
    value: ((price - minPrice) / range) * 100,
  }))
}

export default function PopularCoins() {
  const [coins, setCoins] = useState<Coin[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCoins = async () => {
      setLoading(true)
      setError(null)
      try {
        // Fetch top 10 coins including sparkline data and 24h price change
        const res = await fetch("http://localhost:8000/api/coins/popular")

        if (!res.ok) throw new Error(`API request failed: ${res.status}`)
        const data = await res.json()

        // Filter out stablecoins like Tether and USDC, then keep top 6
        const filtered = data
          .filter((coin: Coin) => !["tether", "usd-coin"].includes(coin.id.toLowerCase()))
          .slice(0, 6)

        setCoins(filtered)
      } catch (err) {
        console.error("Failed to fetch coins:", err)
        setError(err instanceof Error ? err.message : "Unknown error")
      } finally {
        setLoading(false)
      }
    }

    fetchCoins()
  }, [])

  // Render loading state
  if (loading) {
    return <p className="text-center text-gray-400 py-6">Loading popular coins...</p>
  }

  // Render error message if something went wrong
  if (error) {
    return <p className="text-center text-red-500 py-6">Error: {error}</p>
  }

  return (
    // Container for the list of coins
    // Using Tailwind CSS for styling
    // Adjust the width and padding as needed
    <div className="w-xl mx-auto px-2">
      {coins.map((coin) => {
        const normalizedSparklineData = normalizeSparkline(coin.sparkline_in_7d?.price)
        const isPositive = coin.price_change_percentage_24h >= 0
        const textColor = isPositive ? "text-green-500" : "text-red-500"
        const chartColor = isPositive ? "rgba(61, 171, 102, 0.85)" : "rgba(243, 61, 61, 0.85)" // Color of the sparkline chart

        return (
          <Card
            key={coin.id}
            className="my-2 hover:scale-[1.01] transition-transform"
          >
            <CardContent className="px-4 py-3 flex flex-wrap md:flex-nowrap items-center justify-between gap-3">
              {/* Left: Coin image and name */}
              <div className="flex items-center gap-3 flex-shrink-0 mr-1">
                <img src={coin.image} alt={coin.name} className="w-8 h-8" />
                <div>
                  <p className="font-medium text-base">{coin.symbol.toUpperCase()}</p>
                  <p className="text-sm">{coin.name}</p>
                </div>
              </div>

              {/* Center: Sparkline chart */}
              <div className="flex-1 flex justify-center items-center h-10 min-w-[50px] max-w-[100px] mx-auto">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={normalizedSparklineData}>
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke={chartColor}
                      strokeWidth={1.5}
                      dot={false}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Right: Current price and percentage variation */}
              <div className="text-right flex-shrink-0 ml-1">
                <p className="font-semibold text-base">
                  {formatCurrency(coin.current_price)}
                </p>
                <p className={`text-sm font-medium ${textColor}`}>
                  {formatPercentage(coin.price_change_percentage_24h)}
                </p>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
