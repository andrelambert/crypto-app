import { useParams } from "react-router-dom"
import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

interface CoinData {
  id: string
  name: string
  symbol: string
  image: {
    large: string
  }
  market_data: {
    current_price: { usd: number }
    market_cap: { usd: number }
    total_volume: { usd: number }
    high_24h: { usd: number }
    low_24h: { usd: number }
    price_change_percentage_24h: number
  }
  description: { en: string }
  genesis_date: string
  links: {
    homepage: string[]
    blockchain_site: string[]
    repos_url: { github: string[] }
  }
}

export default function CoinDetails() {
  const { id } = useParams<{ id: string }>()
  const [coin, setCoin] = useState<CoinData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true)
      try {
        const res = await fetch(`http://localhost:8000/api/coins/${id}/details`)
        const data = await res.json()
        if (data.error) throw new Error(data.error)
        setCoin(data)
      } catch (err: any) {
        setError(err.message || "Failed to load coin details")
      } finally {
        setLoading(false)
      }
    }
    fetchDetails()
  }, [id])

  if (loading) return <Skeleton className="h-80 w-full rounded-lg" />
  if (error) return <p className="text-red-500 text-center">{error}</p>
  if (!coin) return null

  return (
    <div className="max-w-4xl mx-auto py-6 px-4">
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <img src={coin.image.large} alt={coin.name} className="w-16 h-16" />
            <div>
              <h2 className="text-2xl font-bold">{coin.name} ({coin.symbol.toUpperCase()})</h2>
              <p className="text-muted-foreground text-sm">Launched: {coin.genesis_date}</p>
            </div>
          </div>
          <p className="mb-4 text-sm text-muted-foreground">
            {coin.description.en?.split(".")[0]}.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Current Price</p>
              <p className="text-lg font-semibold">${coin.market_data.current_price.usd.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Market Cap</p>
              <p className="text-lg font-semibold">${coin.market_data.market_cap.usd.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">24h Volume</p>
              <p className="text-lg font-semibold">${coin.market_data.total_volume.usd.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">High 24h</p>
              <p className="text-lg font-semibold">${coin.market_data.high_24h.usd.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Low 24h</p>
              <p className="text-lg font-semibold">${coin.market_data.low_24h.usd.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">24h Change</p>
              <p className={`text-lg font-semibold ${coin.market_data.price_change_percentage_24h >= 0 ? "text-green-500" : "text-red-500"}`}>
                {coin.market_data.price_change_percentage_24h.toFixed(2)}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
