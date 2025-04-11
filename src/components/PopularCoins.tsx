import { useEffect, useState } from "react"

interface Coin {
  id: string
  symbol: string
  name: string
  image: string
  current_price: number
  market_cap_rank: number
}

export default function PopularCoins() {
  const [coins, setCoins] = useState<Coin[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCoins = async () => {
      try {
        const res = await fetch(
          "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=5&page=1&sparkline=false"
        )
        const data = await res.json()
        setCoins(data)
      } catch (err) {
        console.error("Failed to fetch coins:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchCoins()
  }, [])

  if (loading) {
    return <p className="text-center">Loading popular coins...</p>
  }

  return (
    <div className="space-y-4">
      {coins.map((coin) => (
        <div
          key={coin.id}
          className="flex items-center justify-between bg-base-100 p-4 rounded-lg shadow"
        >
          <div className="flex items-center gap-4">
            <img src={coin.image} alt={coin.name} className="w-8 h-8" />
            <div>
              <p className="font-semibold">
                {coin.name} ({coin.symbol.toUpperCase()})
              </p>
              <p className="text-sm text-base-content/70">
                Rank #{coin.market_cap_rank}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold">${coin.current_price.toLocaleString()}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
