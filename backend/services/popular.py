import httpx
import asyncio
from time import time
from typing import List, Dict

# --- Caches ---
CACHE_MARKET_RANK: Dict[str, Dict] = {}
CACHE_MARKET_DATA: Dict[str, Dict] = {}

# --- TTLs ---
TTL_RANK = 60 * 5         # 5 minutes para ranking
TTL_DATA = 60 * 5         # 5 minutes para dados detalhados

# --- Coin IDs to exclude ---
EXCLUDED_IDS = {"tether", "usd-coin", "binance-usd"}

# --- Main fetch function ---
async def get_popular_coins() -> List[Dict]:
    now = time()

    # --- Step 1: Obter ranking de moedas (ordem por market cap) ---
    if "rank" not in CACHE_MARKET_RANK or now - CACHE_MARKET_RANK["rank"]["timestamp"] > TTL_RANK:
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                rank_res = await client.get(
                    "https://api.coingecko.com/api/v3/coins/markets",
                    params={
                        "vs_currency": "usd",
                        "order": "market_cap_desc",
                        "per_page": 50,
                        "page": 1,
                        "sparkline": False,
                    },
                )
                if rank_res.status_code == 200:
                    full_data = rank_res.json()
                    filtered = [c for c in full_data if c["id"] not in EXCLUDED_IDS][:50]
                    CACHE_MARKET_RANK["rank"] = {
                        "data": filtered,
                        "timestamp": now
                    }
                else:
                    print("Erro ao buscar ranking das moedas:", rank_res.status_code)
        except Exception as e:
            print("Exceção ao buscar ranking das moedas:", e)

    top_coins = CACHE_MARKET_RANK.get("rank", {}).get("data", [])
    coin_ids = [coin["id"] for coin in top_coins]

    # --- Step 2: Obter dados frescos (price, sparkline, variação, etc.) ---
    if "data" not in CACHE_MARKET_DATA or now - CACHE_MARKET_DATA["data"]["timestamp"] > TTL_DATA:
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                data_res = await client.get(
                    "https://api.coingecko.com/api/v3/coins/markets",
                    params={
                        "vs_currency": "usd",
                        "ids": ",".join(coin_ids),
                        "sparkline": True,
                        "price_change_percentage": "24h",
                    },
                )
                if data_res.status_code == 200:
                    fresh_data = data_res.json()
                    CACHE_MARKET_DATA["data"] = {
                        "data": {coin["id"]: coin for coin in fresh_data},
                        "timestamp": now,
                    }
                else:
                    print("Erro ao buscar dados frescos das moedas:", data_res.status_code)
        except Exception as e:
            print("Exceção ao buscar dados frescos das moedas:", e)

    merged_data = []
    for coin in top_coins:
        fresh = CACHE_MARKET_DATA.get("data", {}).get("data", {}).get(coin["id"])
        if fresh:
            merged_data.append(fresh)

    return merged_data
