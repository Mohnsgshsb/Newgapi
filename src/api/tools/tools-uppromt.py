from fastapi import APIRouter, HTTPException
import httpx

router = APIRouter(tags=["tools"])

@router.get("/promt-enchan", summary="Improve Prompt")
async def magic_enhance(userPrompt: str, page: str = "image-prompt-generator"):
    data = {
        "userPrompt": userPrompt,
        "page": page
    }

    headers = {
        'authority': 'imageprompt.org',
        'accept': '*/*',
        'accept-language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
        'baggage': 'sentry-environment=vercel-production,sentry-release=cb2998e2584f7e2ff62695b5afa9c852fc8d4bfd,sentry-public_key=a8864b61109c38b3bf1b1f93712338fc,sentry-trace_id=6085df9e24634e5f9b9cd26f704d25fa,sentry-sampled=true,sentry-sample_rand=0.5642325354901057,sentry-sample_rate=1',
        'content-type': 'application/json',
        'origin': 'https://imageprompt.org',
        'referer': 'https://imageprompt.org/image-prompt-generator',
        'sec-ch-ua': '"Chromium";v="139", "Not;A=Brand";v="99"',
        'sec-ch-ua-mobile': '?1',
        'sec-ch-ua-platform': '"Android"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin',
        'sentry-trace': '6085df9e24634e5f9b9cd26f704d25fa-8fb6293d37c7c1de-1',
        'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36'
    }

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post('https://imageprompt.org/api/ai/prompts/magic-enhance', json=data, headers=headers)
            response.raise_for_status()
            return response.json()
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=e.response.status_code, detail=f"API request failed: {e.response.text}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))