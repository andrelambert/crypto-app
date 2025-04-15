from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from services.coingecko import search_coins
from services.popular import get_popular_coins
from services.search import get_cached_coins, search_local_coins
from services.details import get_coin_details

app = FastAPI()

# Permitir acesso do frontend (Vite em localhost:5173)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def load_coin_cache_on_start():
    print("⚙️  Aquecendo cache de busca local...")
    await get_cached_coins()
    print("✅ Cache de moedas para busca local pronto!")
    print("⚙️  Aquecendo cache de moedas populares...")
    await get_popular_coins()
    print("✅ Cache de moedas populares pronto!")

@app.get("/api/coins/search")
async def search_endpoint(q: str = Query(..., min_length=2)):
    return await search_coins(q)

@app.get("/api/coins/popular")
async def popular_endpoint():
    return await get_popular_coins()

@app.get("/api/coins/local-search")
async def local_search(q: str):
    return await search_local_coins(q)

@app.get("/debug/cache-size")
async def debug_cache():
    from services.search import COINS_CACHE
    return {
        "cache_keys": list(COINS_CACHE.keys()),
        "count": len(COINS_CACHE.get("coins", {}).get("data", []))
    }

@app.get("/api/coins/{coin_id}/details")
async def coin_details_endpoint(coin_id: str):
    return await get_coin_details(coin_id)
