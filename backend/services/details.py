import httpx
from time import time
from typing import Dict

# Cache para detalhes de moedas
COIN_DETAILS_CACHE: Dict[str, Dict] = {}
TTL_DETAILS = 60 * 5  # 5 minutos

async def get_coin_details(coin_id: str):
    """Busca detalhes de uma moeda específica com cache."""
    now = time()
    coin_id = coin_id.lower().strip()

    if coin_id in COIN_DETAILS_CACHE and now - COIN_DETAILS_CACHE[coin_id]["timestamp"] < TTL_DETAILS:
        return COIN_DETAILS_CACHE[coin_id]["data"]

    url = f"https://api.coingecko.com/api/v3/coins/{coin_id}"
    params = {
        "localization": "false",
        "sparkline": "true"
    }

    async with httpx.AsyncClient() as client:
        res = await client.get(url, params=params)
        if res.status_code != 200:
            return {"error": f"Coin not found or failed to fetch: {coin_id}"}

        data = res.json()
        COIN_DETAILS_CACHE[coin_id] = {
            "data": data,
            "timestamp": now
        }
        return data
