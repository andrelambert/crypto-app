# backend/services/popular.py

import httpx
import asyncio
from time import time
from typing import List, Dict

# --- Caches ---
CACHE_MARKET_RANK: Dict[str, Dict] = {}
CACHE_MARKET_DATA: Dict[str, Dict] = {}

# --- TTLs ---
TTL_RANK = 60 * 60 * 24     # 24 hours
TTL_DATA = 60 * 5           # 5 minutes

# --- Coin IDs to exclude ---
EXCLUDED_IDS = {"tether", "usd-coin", "binance-usd"}

# --- Main fetch function ---
async def get_popular_coins() -> List[Dict]:
    now = time()

    # --- Step 1: get coin ranking (market cap order) ---
    if "rank" not in CACHE_MARKET_RANK or now - CACHE_MARKET_RANK["rank"]["timestamp"] > TTL_RANK:
        async with httpx.AsyncClient() as client:
            rank_res = await client.get(
                "https://api.coingecko.com/api/v3/coins/markets",
                params={
                    "vs_currency": "usd",
                    "order": "market_cap_desc",
                    "per_page": 10,
                    "page": 1,
                    "sparkline": False,
                },
            )
            full_data = rank_res.json()
            filtered = [c for c in full_data if c["id"] not in EXCLUDED_IDS][:6]
            CACHE_MARKET_RANK["rank"] = {
                "data": filtered,
                "timestamp": now
            }

    top_coins = CACHE_MARKET_RANK["rank"]["data"]
    coin_ids = [coin["id"] for coin in top_coins]

    # --- Step 2: get fresh price/sparkline data ---
    if "data" not in CACHE_MARKET_DATA or now - CACHE_MARKET_DATA["data"]["timestamp"] > TTL_DATA:
        async with httpx.AsyncClient() as client:
            data_res = await client.get(
                "https://api.coingecko.com/api/v3/coins/markets",
                params={
                    "vs_currency": "usd",
                    "ids": ",".join(coin_ids),
                    "sparkline": True,
                    "price_change_percentage": "24h",
                },
            )
            fresh_data = data_res.json()
            CACHE_MARKET_DATA["data"] = {
                "data": {coin["id"]: coin for coin in fresh_data},
                "timestamp": now,
            }

    merged_data = []
    for coin in top_coins:
        fresh = CACHE_MARKET_DATA["data"]["data"].get(coin["id"])
        if fresh:
            merged_data.append(fresh)

    return merged_data
