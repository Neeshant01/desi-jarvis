import asyncio
import time
import urllib.request
import json
import base64
import os

async def generate_edge_tts(text: str):
    import edge_tts
    communicate = edge_tts.Communicate(text, "en-IN-PrabhatNeural", rate="+20%")
    t_start = time.time()
    first_chunk = False
    
    async for chunk in communicate.stream():
        if chunk["type"] == "audio" and not first_chunk:
            t_first = time.time()
            print(f"Time to first chunk: {t_first - t_start:.2f}s")
            first_chunk = True

async def test():
    t0 = time.time()
    text = "Of course, sir. Why don't scientists trust atoms? Because they make up everything. Simple, yet scientifically accurate."
    
    t1 = time.time()
    await generate_edge_tts(text)
    t2 = time.time()
    
    print(f"Total Edge TTS Time: {t2 - t1:.2f}s")
    
if __name__ == "__main__":
    asyncio.run(test())
