
## verificar cache:http://localhost:8000/debug/cache-size

## forçar carregamento de cache: http://localhost:8000/api/coins/local-search?q=bitcoin

# rodar servidor react:
npm run dev

# rodar backend:
uvicorn main:app --reload --port 8000