# backend/services/search.py

import httpx
from time import time
from typing import Dict, List

# Cache for all coin metadata
COINS_CACHE: Dict[str, Dict] = {}
TTL_COINS = 60 * 60 * 24  # 24 hours

# Cached structure per coin: { id, name, symbol, thumb }

async def fetch_all_coins():
    """Fetch top 1000 coins with image + symbol + name from CoinGecko."""
    all_coins = []
    pages = [1, 2, 3, 4]  # 4 * 250 = 1000 coins

    async with httpx.AsyncClient() as client:
        for page in pages:
            res = await client.get(
                "https://api.coingecko.com/api/v3/coins/markets",
                params={
                    "vs_currency": "usd",
                    "order": "market_cap_desc",
                    "per_page": 250,
                    "page": page,
                    "sparkline": False,
                },
            )
            if res.status_code == 200:
                data = res.json()
                for coin in data:
                    all_coins.append({
                        "id": coin["id"],
                        "name": coin["name"],
                        "symbol": coin["symbol"],
                        "thumb": coin["image"],
                    })

    return all_coins


async def get_cached_coins():
    now = time()
    if "coins" not in COINS_CACHE or now - COINS_CACHE["coins"]["timestamp"] > TTL_COINS:
        all_coins = await fetch_all_coins()
        COINS_CACHE["coins"] = {
            "data": all_coins,
            "timestamp": now
        }
    return COINS_CACHE["coins"]["data"]


async def search_local_coins(q: str):
    """Filter local cache of coins based on query."""
    coins = await get_cached_coins()
    query = q.strip().lower()

    # Match against name or symbol
    matches = [
        coin for coin in coins
        if query in coin["name"].lower() or query in coin["symbol"].lower()
    ]

    return matches[:10]
