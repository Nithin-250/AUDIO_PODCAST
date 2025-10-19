from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from gtts import gTTS
from io import BytesIO
from fastapi.responses import StreamingResponse
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import requests
import os

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # TODO: restrict origins in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TTSRequest(BaseModel):
    text: str
    lang: str  # 'en' | 'ta' | 'hi'

@app.post("/tts")
async def tts(req: TTSRequest):
    text = (req.text or "").strip()
    if not text:
        raise HTTPException(status_code=400, detail="Empty text")
    if req.lang not in {"en", "ta", "hi"}:
        raise HTTPException(status_code=400, detail="Unsupported language")

    try:
        mp3 = BytesIO()
        gTTS(text=text, lang=req.lang).write_to_fp(mp3)
        mp3.seek(0)
        return StreamingResponse(mp3, media_type="audio/mpeg", headers={
            "Content-Disposition": 'inline; filename="speech.mp3"'
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"TTS failed: {e}")


class TranslateRequest(BaseModel):
    text: str
    target: str
    source: str | None = "auto"

@app.post("/translate")
async def translate(req: TranslateRequest):
    text = (req.text or "").strip()
    if not text:
        return JSONResponse({"translatedText": ""})
    target = (req.target or "en").lower()
    source = (req.source or "auto").lower()

    # Heuristic: if text is mostly ASCII, assume English source
    try:
        ascii_ratio = sum(1 for ch in text if ord(ch) < 128) / max(1, len(text))
        if source == "auto" and ascii_ratio > 0.85:
            source = "en"
    except Exception:
        pass

    providers = [
        "https://translate.astian.org/translate",
        "https://libretranslate.de/translate",
    ]

    # split into chunks to avoid limits
    def split_chunks(t: str, max_len: int = 4000):
        parts, cur = [], ""
        import re
        segments = re.findall(r"[^.!?\n\r\t]+[.!?\n\r\t]*", t) or [t]
        for seg in segments:
            if len(cur) + len(seg) > max_len and cur:
                parts.append(cur)
                cur = seg
            else:
                cur += seg
        if cur:
            parts.append(cur)
        return parts

    def has_target_script(s: str, lang: str) -> bool:
        try:
            if lang == "ta":
                return any(0x0B80 <= ord(ch) <= 0x0BFF for ch in s)
            if lang == "hi":
                return any(0x0900 <= ord(ch) <= 0x097F for ch in s)
        except Exception:
            return False
        return True

    chunks = split_chunks(text)
    # Try Libre-compatible providers
    for url in providers:
        try:
            out: list[str] = []
            for ch in chunks:
                r = requests.post(url, json={
                    "q": ch,
                    "source": source,
                    "target": target,
                    "format": "text"
                }, timeout=20)
                r.raise_for_status()
                data = r.json()
                piece = data.get("translatedText") or data.get("translated_text")
                if not piece:
                    raise ValueError("no piece")
                out.append(piece)
            joined = " ".join(out)
            if target in ("ta", "hi") and not has_target_script(joined, target):
                raise ValueError("no target script")
            return JSONResponse({"translatedText": joined})
        except Exception:
            continue

    # Try Google keyless endpoint as fallback (undocumented; may be rate-limited)
    try:
        out_parts: list[str] = []
        for ch in chunks:
            r = requests.get(
                "https://translate.googleapis.com/translate_a/single",
                params={
                    "client": "gtx",
                    "sl": source,
                    "tl": target,
                    "dt": "t",
                    "q": ch,
                },
                timeout=20,
            )
            r.raise_for_status()
            data = r.json()
            segs = data[0] if isinstance(data, list) and data else []
            out = "".join(s[0] for s in segs if s and isinstance(s, list) and s[0])
            if not out:
                raise ValueError("empty google piece")
            out_parts.append(out)
        joined = " ".join(out_parts)
        if target in ("ta", "hi") and not has_target_script(joined, target):
            raise ValueError("google no target script")
        return JSONResponse({"translatedText": joined})
    except Exception:
        pass

    # Try MyMemory as last resort
    try:
        langpair = f"{source}|{target}"
        r = requests.get(
            "https://api.mymemory.translated.net/get",
            params={"q": text[:4500], "langpair": langpair},
            timeout=20,
        )
        r.raise_for_status()
        data = r.json()
        joined = data.get("responseData", {}).get("translatedText", "")
        if joined and (target not in ("ta", "hi") or has_target_script(joined, target)):
            return JSONResponse({"translatedText": joined})
    except Exception:
        pass

    # fallback to original
    return JSONResponse({"translatedText": text})


class SummarizeRequest(BaseModel):
    text: str
    language: str | None = "en"

@app.post("/summarize")
async def summarize(req: SummarizeRequest):
    text = (req.text or "").strip()
    if not text:
        raise HTTPException(status_code=400, detail="Empty text")
    lang = (req.language or "en").lower()
    language_map = {
        "en": "English",
        "ta": "Tamil",
        "hi": "Hindi",
    }
    prompt_lang = language_map.get(lang, "English")
    system = (
        f"You are a concise assistant that summarizes long web articles for a podcast. "
        f"Return a clear, factual summary in {prompt_lang}. Keep it 6-10 bullet points or short paragraphs, suitable for voice narration."
    )
    model = os.environ.get("OPENAI_MODEL", "gpt-4o-mini")
    api_key = os.environ.get("OPENAI_API_KEY", "").strip()
    if not api_key:
        raise HTTPException(status_code=500, detail="Server missing OPENAI_API_KEY")
    try:
        r = requests.post(
            "https://api.openai.com/v1/chat/completions",
            json={
                "model": model,
                "messages": [
                    {"role": "system", "content": system},
                    {"role": "user", "content": f"Article content:\n\n{text[:24000]}"},
                ],
                "temperature": 0.3,
            },
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            timeout=60,
        )
        if r.status_code >= 400:
            try:
                err = r.json()
                detail = err.get("error", {}).get("message") or f"OpenAI error {r.status_code}"
            except Exception:
                detail = f"OpenAI error {r.status_code}"
            raise HTTPException(status_code=502, detail=detail)
        data = r.json()
        content = (
            (data.get("choices") or [{}])[0]
            .get("message", {})
            .get("content", "")
            .strip()
        )
        if not content:
            raise HTTPException(status_code=502, detail="Empty response from OpenAI")
        return JSONResponse({"summary": content})
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Summarize failed: {e}")


class TranslateLLMRequest(BaseModel):
    text: str
    target: str  # 'ta' | 'hi' | 'en'

@app.post("/translate_llm")
async def translate_llm(req: TranslateLLMRequest):
    text = (req.text or "").strip()
    if not text:
        return JSONResponse({"translatedText": ""})
    target = (req.target or "en").lower()

    language_map = {
        "en": "English",
        "ta": "Tamil",
        "hi": "Hindi",
    }
    target_name = language_map.get(target, target)

    api_key = os.environ.get("OPENAI_API_KEY", "").strip()
    if not api_key:
        raise HTTPException(status_code=500, detail="Server missing OPENAI_API_KEY")
    model = os.environ.get("OPENAI_MODEL", "gpt-4o-mini")

    system = (
        f"You are a translator. Translate the user's text into {target_name}. "
        f"Return only the translation, no explanations, no quotes."
    )
    try:
        r = requests.post(
            "https://api.openai.com/v1/chat/completions",
            json={
                "model": model,
                "messages": [
                    {"role": "system", "content": system},
                    {"role": "user", "content": text[:24000]},
                ],
                "temperature": 0.2,
            },
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            timeout=60,
        )
        if r.status_code >= 400:
            try:
                err = r.json()
                detail = err.get("error", {}).get("message") or f"OpenAI error {r.status_code}"
            except Exception:
                detail = f"OpenAI error {r.status_code}"
            raise HTTPException(status_code=502, detail=detail)
        data = r.json()
        content = (
            (data.get("choices") or [{}])[0]
            .get("message", {})
            .get("content", "")
            .strip()
        )
        return JSONResponse({"translatedText": content})
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Translate LLM failed: {e}")
