import httpx
import asyncio
from time import time
from typing import Dict, List

# Cache para metadados de moedas
COINS_CACHE: Dict[str, Dict] = {}
TTL_COINS = 60 * 60 * 24  # 24 hours

# Cached structure per coin: { id, name, symbol, thumb }

async def fetch_page(client: httpx.AsyncClient, page: int) -> List[Dict]:
    try:
        res = await client.get(
            "https://api.coingecko.com/api/v3/coins/markets",
            params={
                "vs_currency": "usd",
                "order": "market_cap_desc",
                "per_page": 250,
                "page": page,
                "sparkline": False,
            },
            timeout=10.0
        )
        if res.status_code == 200:
            coins_page = res.json()
            return [{
                "id": coin["id"],
                "name": coin["name"],
                "symbol": coin["symbol"],
                "thumb": coin["image"],
            } for coin in coins_page]
        else:
            print(f"Erro ao buscar página {page}, status code:", res.status_code)
            return []
    except Exception as e:
        print(f"Exceção ao buscar página {page}:", e)
        return []

async def fetch_all_coins() -> List[Dict]:
    """Busca as top 500 moedas com imagem, símbolo e nome na CoinGecko."""
    all_coins = []
    pages = [1, 2]  # 2 páginas * 250 = 500 moedas
    async with httpx.AsyncClient() as client:
        tasks = [fetch_page(client, page) for page in pages]
        results = await asyncio.gather(*tasks)
        for coin_list in results:
            all_coins.extend(coin_list)
    return all_coins

async def get_cached_coins() -> List[Dict]:
    now = time()
    if "coins" not in COINS_CACHE or now - COINS_CACHE["coins"]["timestamp"] > TTL_COINS:
        all_coins = await fetch_all_coins()
        COINS_CACHE["coins"] = {
            "data": all_coins,
            "timestamp": now
        }
    return COINS_CACHE["coins"]["data"]

async def search_local_coins(q: str) -> List[Dict]:
    """Filtra a cache local de moedas com base na query."""
    coins = await get_cached_coins()
    query = q.strip().lower()
    matches = [
        coin for coin in coins
        if query in coin["name"].lower() or query in coin["symbol"].lower()
    ]
    return matches[:10]
