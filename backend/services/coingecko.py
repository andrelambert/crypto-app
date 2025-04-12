import httpx
import asyncio
from typing import Dict
from time import time

# Simple in-memory cache with TTL
CACHE: Dict[str, Dict] = {}
CACHE_TTL = 60 * 60  # 1 hour in seconds

# Fetch from CoinGecko and store in cache
async def search_coins(query: str):
    query = query.strip().lower()

    now = time()
    if query in CACHE and now - CACHE[query]["timestamp"] < CACHE_TTL:
        return CACHE[query]["data"]

    async with httpx.AsyncClient() as client:
        res = await client.get("https://api.coingecko.com/api/v3/search", params={"query": query})
        data = res.json()

        coins = data.get("coins", [])[:10]  # Limit results

        # Save in cache
        CACHE[query] = {
            "data": coins,
            "timestamp": now
        }

        return coins
