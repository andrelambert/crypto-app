import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { LineChart, Line, ResponsiveContainer } from "recharts"
import { Card, CardContent } from "@/components/ui/card"
import { Toggle } from "@/components/ui/toggle"
import { Star } from "lucide-react"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
} from "@/components/ui/alert-dialog"
import { supabase } from "@/lib/supabaseClient"

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
  if (range === 0) return validPrices.map((_, index) => ({ name: `p${index}`, value: 50 }))
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
      pages.push(1, 2, 3, 4, 5, "ellipsis", total)
    } else if (current >= total - 3) {
      pages.push(1, "ellipsis", total - 4, total - 3, total - 2, total - 1, total)
    } else {
      pages.push(1, "ellipsis", current - 1, current, current + 1, "ellipsis", total)
    }
  }
  return pages
}

export default function PopularCoins() {
  const [allCoins, setAllCoins] = useState<Coin[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5
  const navigate = useNavigate()

  // Estado para usuário (autenticação) – assumindo que você está usando supabase
  const [user, setUser] = useState<any>(null)
  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser()
      setUser(data.user)
    }
    fetchUser()
  }, [])

  // Estado para controlar o Alert Dialog (usuário não logado)
  const [showFavoriteAlert, setShowFavoriteAlert] = useState(false)

  // Função para adicionar moeda aos favoritos no Supabase
  const addToFavorites = async (coin: Coin) => {
    const { error } = await supabase.from("favorite_cryptos").insert({
      user_id: user.id,
      coin_id: coin.id,
      // Inclua outros campos se necessário
    })
    if (error) {
      console.error("Erro ao adicionar aos favoritos:", error)
    } else {
      console.log("Moeda adicionada aos favoritos com sucesso!")
    }
  }

  useEffect(() => {
    const fetchCoins = async () => {
      setLoading(true)
      setError(null)
      try {
        // Busca todos os resultados
        const res = await fetch("http://localhost:8000/api/coins/popular")
        if (!res.ok) throw new Error(`API request failed: ${res.status}`)
        const data = await res.json()
        // Filtra para remover stablecoins
        const filtered = data.filter((coin: Coin) =>
          !["tether", "usd-coin"].includes(coin.id.toLowerCase())
        )
        setAllCoins(filtered)
      } catch (err) {
        console.error("Falha ao buscar as moedas:", err)
        setError(err instanceof Error ? err.message : "Unknown error")
      } finally {
        setLoading(false)
      }
    }
    fetchCoins()
  }, [])

  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentCoins = allCoins.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(allCoins.length / itemsPerPage)
  const pageItems = generatePageNumbers(currentPage, totalPages)

  if (loading) {
    return <p className="text-center text-gray-400 py-6">Loading popular coins...</p>
  }

  if (error) {
    return <p className="text-center text-red-500 py-6">Error: {error}</p>
  }

  return (
    <div className="w-xl mx-auto px-2">
      {currentCoins.map((coin) => {
        const normalizedSparklineData = normalizeSparkline(coin.sparkline_in_7d?.price)
        const isPositive = coin.price_change_percentage_24h >= 0
        const textColor = isPositive ? "text-[#41a271]" : "text-[#EF5E6A]"
        const chartColor = isPositive
          ? "rgba(61, 171, 102, 0.85)"
          : "rgba(243, 61, 61, 0.85)"

        return (
          <Card
            key={coin.id}
            className="my-2 hover:scale-[1.01] transition-transform cursor-pointer"
            onClick={() => navigate(`/coin/${coin.id}`)}
          >
            <CardContent className="px-4 py-1 flex flex-wrap md:flex-nowrap items-center justify-between gap-3">
              {/* Esquerda: Imagem e dados da moeda */}
              <div className="flex items-center gap-3 flex-shrink-0 mr-1">
                <img src={coin.image} alt={coin.name} className="w-9 h-9" />
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
              {/* Direita: Informações de preço e botão Favoritar */}
              <div className="flex items-center gap-2 flex-shrink-0 ml-1">
                <div className="text-right">
                  <p className="text-base font-medium">{formatCurrency(coin.current_price)}</p>
                  <p className={`text-sm font-medium ${textColor}`}>
                    {formatPercentage(coin.price_change_percentage_24h)}
                  </p>
                </div>
                <Toggle
                  className="cursor-pointer"
                  variant={user ? "default" : "outline"}
                  onClick={(e) => {
                    e.stopPropagation()
                    if (!user) {
                      setShowFavoriteAlert(true)
                    } else {
                      addToFavorites(coin)
                    }
                  }}
                >
                  <Star size={16} />
                </Toggle>
              </div>
            </CardContent>
          </Card>
        )
      })}
      {/* Alert Dialog para usuário deslogado */}
      <AlertDialog open={showFavoriteAlert} onOpenChange={setShowFavoriteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>You need to sign in</AlertDialogTitle>
            <AlertDialogDescription>
              You need to sign in to be able to favorite a coin.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowFavoriteAlert(false)}>
              Ok
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {/* Paginação utilizando os componentes do shadcn */}
      <div className="pt-4 mt-4">
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
