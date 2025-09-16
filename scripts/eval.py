# scripts/eval.py
import asyncio, json, httpx, sys
API = "http://localhost:8000"

TEST_URLS = [
    # add ~200 mixed URLs later
    "https://www.cdc.gov/flu/index.htm",
    "https://example.com/free-gift-card-claim",
]

async def run():
    results = []
    async with httpx.AsyncClient() as hc:
        for u in TEST_URLS:
            r = await hc.post(f"{API}/api/check", json={"url": u})
            results.append((u, r.status_code, r.json()))
    # toy metric: show all "danger"
    dangers = [x for x in results if x[2].get("verdict") == "danger"]
    print(json.dumps({"count": len(results), "dangers": len(dangers), "samples": results[:3]}, indent=2))

if __name__ == "__main__":
    asyncio.run(run())
