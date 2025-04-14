import { useEffect, useState } from "react"
import { LineChart, Line, ResponsiveContainer } from "recharts"
import { Card, CardContent } from "@/components/ui/card"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

// Define a interface para o objeto Coin retornado pela API
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

// Função para formatar os valores monetários com precisão dinâmica
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: value < 1 ? 6 : 2,
  }).format(value)
}

// Função para formatar percentuais, adicionando "+" para valores positivos
const formatPercentage = (value: number) => {
  const formatted = value.toFixed(2)
  return value > 0 ? `+${formatted}%` : `${formatted}%`
}

// Normaliza os dados do sparkline para uma escala de 0 a 100
const normalizeSparkline = (prices: number[] | null | undefined): { name: string; value: number }[] => {
  if (!prices || prices.length === 0) return []

  const validPrices = prices.filter(price => typeof price === "number" && isFinite(price))
  if (validPrices.length < 2)
    return validPrices.map((_, index) => ({ name: `p${index}`, value: 50 }))

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

// Função para gerar os itens de paginação (números e ellipsis)
const generatePageNumbers = (current: number, total: number): (number | "ellipsis")[] => {
  const pages: (number | "ellipsis")[] = []
  if (total <= 7) {
    for (let i = 1; i <= total; i++) {
      pages.push(i)
    }
  } else {
    if (current <= 4) {
      // Mostra as primeiras 5 páginas, ellipsis e a última
      pages.push(1, 2, 3, 4, 5, "ellipsis", total)
    } else if (current >= total - 3) {
      // Mostra a primeira, ellipsis e as últimas 5 páginas
      pages.push(1, "ellipsis", total - 4, total - 3, total - 2, total - 1, total)
    } else {
      // Mostra a primeira, ellipsis, páginas próximas ao atual e a última
      pages.push(1, "ellipsis", current - 1, current, current + 1, "ellipsis", total)
    }
  }
  return pages
}

export default function PopularCoins() {
  const [allCoins, setAllCoins] = useState<Coin[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Estados para paginação
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  useEffect(() => {
    const fetchCoins = async () => {
      setLoading(true)
      setError(null)
      try {
        // Busca todos os resultados (não limitamos para 6)
        const res = await fetch("http://localhost:8000/api/coins/popular")
        if (!res.ok) throw new Error(`API request failed: ${res.status}`)
        const data = await res.json()

        // Filtra para remover stablecoins, por exemplo, Tether e USD Coin.
        const filtered = data.filter((coin: Coin) =>
          !["tether", "usd-coin"].includes(coin.id.toLowerCase())
        )
        setAllCoins(filtered)
      } catch (err) {
        console.error("Failed to fetch coins:", err)
        setError(err instanceof Error ? err.message : "Unknown error")
      } finally {
        setLoading(false)
      }
    }
    fetchCoins()
  }, [])

  // Calcula os índices para exibir os itens da página atual
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentCoins = allCoins.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(allCoins.length / itemsPerPage)

  if (loading) {
    return <p className="text-center text-gray-400 py-6">Loading popular coins...</p>
  }

  if (error) {
    return <p className="text-center text-red-500 py-6">Error: {error}</p>
  }

  // Gera os itens de paginação
  const pageItems = generatePageNumbers(currentPage, totalPages)

  return (
    <div className="w-xl mx-auto px-2">
      {currentCoins.map((coin) => {
        const normalizedSparklineData = normalizeSparkline(coin.sparkline_in_7d?.price)
        const isPositive = coin.price_change_percentage_24h >= 0
        const textColor = isPositive ? "text-green-500" : "text-red-500"
        const chartColor = isPositive
          ? "rgba(61, 171, 102, 0.85)"
          : "rgba(243, 61, 61, 0.85)"

        return (
          <Card key={coin.id} className="my-2 hover:scale-[1.01] transition-transform">
            <CardContent className="px-4 py-3 flex flex-wrap md:flex-nowrap items-center justify-between gap-3">
              {/* Esquerda: Imagem e nome da moeda */}
              <div className="flex items-center gap-3 flex-shrink-0 mr-1">
                <img src={coin.image} alt={coin.name} className="w-8 h-8" />
                <div>
                  <p className="font-medium text-base">{coin.symbol.toUpperCase()}</p>
                  <p className="text-sm">{coin.name}</p>
                </div>
              </div>

              {/* Centro: Gráfico sparkline */}
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

              {/* Direita: Preço atual e variação percentual */}
              <div className="text-right flex-shrink-0 ml-1">
                <p className="font-semibold text-base">{formatCurrency(coin.current_price)}</p>
                <p className={`text-sm font-medium ${textColor}`}>
                  {formatPercentage(coin.price_change_percentage_24h)}
                </p>
              </div>
            </CardContent>
          </Card>
        )
      })}

      {/* Paginação utilizando os componentes do shadcn */}
      <div className="mt-4">
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  setCurrentPage((prev) => Math.max(prev - 1, 1))
                }}
              />
            </PaginationItem>
            {pageItems.map((item, index) =>
              item === "ellipsis" ? (
                <PaginationItem key={`ellipsis-${index}`}>
                  <PaginationEllipsis />
                </PaginationItem>
              ) : (
                <PaginationItem key={item}>
                  <PaginationLink
                    href="#"
                    isActive={item === currentPage}
                    onClick={(e) => {
                      e.preventDefault()
                      setCurrentPage(item as number)
                    }}
                  >
                    {item}
                  </PaginationLink>
                </PaginationItem>
              )
            )}
            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  )
}
