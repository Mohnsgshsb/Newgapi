from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from config import TMP_DIR
from pathlib import Path
import urllib.parse

router = APIRouter(prefix="/tmp", tags=["root"])

@router.get("/{filename}")
def get_tmp_file(filename: str):
    decoded = urllib.parse.unquote(filename)
    file_path = TMP_DIR / decoded
    if not file_path.exists():
        raise HTTPException(404, "File not found")
    return FileResponse(file_path)