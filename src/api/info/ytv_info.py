from fastapi import APIRouter, Query, HTTPException
import yt_dlp
from config import COOKIES

router = APIRouter(prefix="/yt-info", tags=["YouTube"])

def get_info(url: str):
    ydl_opts = {
        "quiet": True,
        "skip_download": True,
        "nocheckcertificate": True,
        "cookiefile": COOKIES
    }

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        try:
            info = ydl.extract_info(url, download=False)
            return {
                "id": info.get("id"),
                "title": info.get("title"),
                "uploader": info.get("uploader"),
                "duration": info.get("duration"),
                "thumbnail": info.get("thumbnail"),
                "webpage_url": info.get("webpage_url"),
            }
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))

@router.get("/")
def ytv_info(url: str = Query(..., description="Get Metadata Video YouTube")):
    return get_info(url)