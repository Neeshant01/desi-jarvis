import asyncio
import time
import urllib.request
import json
import base64
import os

async def generate_edge_tts(text: str):
    import edge_tts
    communicate = edge_tts.Communicate(text, "en-IN-PrabhatNeural", rate="+20%")
    audio_bytes = b""
    async for chunk in communicate.stream():
        if chunk["type"] == "audio":
            audio_bytes += chunk["data"]
    return len(audio_bytes)

async def test():
    t0 = time.time()
    text = "Of course, sir. Why don't scientists trust atoms? Because they make up everything. Simple, yet scientifically accurate."
    
    t1 = time.time()
    await generate_edge_tts(text)
    t2 = time.time()
    
    print(f"Edge TTS Time: {t2 - t1:.2f}s")
    
if __name__ == "__main__":
    asyncio.run(test())
