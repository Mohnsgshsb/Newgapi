from fastapi import APIRouter, UploadFile, File, HTTPException
import httpx
import base64

router = APIRouter(tags=["tools"])

@router.post("/topromt", summary="Convert Image To Promt")
async def image_to_prompt(image: UploadFile = File(...), language: str = "id"):
    try:
        img_bytes = await image.read()
        
        base64_data = base64.b64encode(img_bytes).decode('utf-8')
        base64Url = f"data:{image.content_type};base64,{base64_data}"

        data = {
            "base64Url": base64Url,
            "imageModelId": 0,
            "language": language
        }

        headers = {
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36',
            'Referer': 'https://imageprompt.org/image-to-prompt'
        }

        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post('https://imageprompt.org/api/ai/prompts/image', json=data, headers=headers)
            response.raise_for_status()
            return response.json()

    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=e.response.status_code, detail=f"API request failed: {e.response.text}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))