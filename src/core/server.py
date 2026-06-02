import asyncio
import os
import time
from typing import Dict, Any
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends
from fastapi.middleware.cors import CORSMiddleware
import ujson

from src.core.websocket import ConnectionManager, get_websocket_manager, heartbeat_task
import src.core.websocket as ws_mod
from src.core.vault import vault
import src.core.automation.desktop as desktop
import src.core.automation.web as web

app = FastAPI(title="J.A.R.V.I.S. Local Control Agent")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Helper function to read Linux CPU usage without psutil
async def get_cpu_usage_linux() -> float:
    try:
        with open("/proc/stat", "r") as f:
            line = f.readline()
        parts = line.split()
        if len(parts) < 5:
            return 0.0
        
        # User, Nice, System, Idle
        user = int(parts[1])
        nice = int(parts[2])
        system = int(parts[3])
        idle = int(parts[4])
        
        total1 = user + nice + system + idle
        idle1 = idle
        
        await asyncio.sleep(0.5)
        
        with open("/proc/stat", "r") as f:
            line = f.readline()
        parts = line.split()
        user = int(parts[1])
        nice = int(parts[2])
        system = int(parts[3])
        idle = int(parts[4])
        
        total2 = user + nice + system + idle
        idle2 = idle
        
        total_diff = total2 - total1
        idle_diff = idle2 - idle1
        
        if total_diff == 0:
            return 0.0
            
        cpu_usage = 100.0 * (total_diff - idle_diff) / total_diff
        return round(cpu_usage, 1)
    except Exception:
        # Fallback
        return 20.0

# Helper function to read Linux RAM usage without psutil
def get_ram_usage_linux() -> float:
    try:
        meminfo = {}
        with open("/proc/meminfo", "r") as f:
            for line in f:
                parts = line.split(":")
                if len(parts) == 2:
                    name = parts[0].strip()
                    val = parts[1].split()[0].strip()
                    meminfo[name] = int(val)
        
        total = meminfo.get("MemTotal", 1)
        available = meminfo.get("MemAvailable", total)
        used = total - available
        ram_percent = (used / total) * 100
        return round(ram_percent, 1)
    except Exception:
        return 45.0

import urllib.request
import json

async def generate_edge_tts(text: str) -> str:
    """Generates Edge TTS (Microsoft Neural) free text-to-speech and returns base64 string."""
    try:
        import edge_tts
        import base64
        
        # Detect language
        is_hindi = any(ord(c) >= 0x0900 and ord(c) <= 0x097F for c in text)
        if not is_hindi:
            # Check for Romanized Hinglish words
            hinglish_words = {
                'hai', 'hoon', 'hu', 'ho', 'karo', 'karein', 'kijiye', 'kholo', 'band', 'chaloo', 'chalu',
                'kaise', 'kya', 'kyun', 'kyu', 'kab', 'kaha', 'kahan', 'kidhar', 'ap', 'aap', 'tum', 'tu',
                'shukriya', 'dhanyawad', 'namaste', 'acha', 'achha', 'mausam', 'samay', 'waqt', 'naam', 'nam',
                'kaam', 'kam', 'sirf', 'bahut', 'bohot', 'sahi', 'galat', 'thik', 'theek', 'haan', 'han', 'na',
                'nahi', 'nahin', 'mat', 'kar', 'raha', 'rahe', 'rahi', 'gaya', 'gaye', 'gayi', 'kiya', 'kiye',
                'liye', 'ko', 'se', 'ka', 'ki', 'ke', 'aur', 'ya', 'par', 'pe'
            }
            words = text.lower().split()
            is_hindi = any(word in hinglish_words for word in words)
            
        # Use RyanNeural for a sophisticated British J.A.R.V.I.S. tone
        voice = "en-GB-RyanNeural"
        
        # Removed speed modifier for a more natural, human-like voice
        communicate = edge_tts.Communicate(text, voice)
        audio_bytes = b""
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                audio_bytes += chunk["data"]
                
        if audio_bytes:
            return base64.b64encode(audio_bytes).decode("utf-8")
        return ""
    except Exception as e:
        print(f"Edge TTS Error: {e}")
        return ""

async def generate_tts(text: str) -> str:
    """Generates TTS using free premium Edge Neural TTS (Microsoft British Male voices)."""
    print("Generating audio using Edge Neural British Male voice...")
    return await generate_edge_tts(text)

async def query_ai_model(prompt: str) -> str:
    """Queries Gemini/OpenAI APIs first (for fastest response), then local agy CLI, then fallback conversational responses."""
    # 1. Check for Gemini Key (Direct HTTP request is extremely fast)
    gemini_key = vault.get("GEMINI_API_KEY") or os.getenv("GEMINI_API_KEY")
    if gemini_key:
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={gemini_key}"
            headers = {"Content-Type": "application/json"}
            data = {
                "contents": [{
                    "parts": [{
                        "text": f"You are J.A.R.V.I.S., the AI assistant from Iron Man. Speak in a polite, helpful, and sophisticated British tone, calling the user 'sir'. Keep replies concise, under 3 sentences. User: {prompt}"
                    }]
                }]
            }
            req = urllib.request.Request(url, data=json.dumps(data).encode(), headers=headers, method="POST")
            
            # Execute standard blocking request in a non-blocking thread executor
            loop = asyncio.get_running_loop()
            def run_http():
                with urllib.request.urlopen(req, timeout=6) as response:
                    return response.read().decode()
            
            resp_str = await loop.run_in_executor(None, run_http)
            resp_data = json.loads(resp_str)
            reply = resp_data["candidates"][0]["content"]["parts"][0]["text"].strip()
            return reply
        except Exception as e:
            print(f"Gemini Query Error: {e}")
            
    # 2. Check for OpenAI Key (Direct HTTP request)
    openai_key = vault.get("OPENAI_API_KEY") or os.getenv("OPENAI_API_KEY")
    if openai_key:
        try:
            url = "https://api.openai.com/v1/chat/completions"
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {openai_key}"
            }
            data = {
                "model": "gpt-4o-mini",
                "messages": [
                    {"role": "system", "content": "You are J.A.R.V.I.S., the sophisticated AI from Iron Man. Speak in a polite, helpful British tone, calling the user 'sir'. Keep replies short (1-2 sentences)."},
                    {"role": "user", "content": prompt}
                ],
                "max_tokens": 80
            }
            req = urllib.request.Request(url, data=json.dumps(data).encode(), headers=headers, method="POST")
            
            loop = asyncio.get_running_loop()
            def run_http():
                with urllib.request.urlopen(req, timeout=6) as response:
                    return response.read().decode()
            
            resp_str = await loop.run_in_executor(None, run_http)
            resp_data = json.loads(resp_str)
            reply = resp_data["choices"][0]["message"]["content"].strip()
            return reply
        except Exception as e:
            print(f"OpenAI Query Error: {e}")

    # 3. Check for local Antigravity/Gemini CLI (agy)
    agy_path = "/home/nishant/.local/bin/agy"
    if os.path.exists(agy_path):
        try:
            # Format system prompt to shape the response into a J.A.R.V.I.S. persona
            system_instruction = (
                "You are J.A.R.V.I.S., the AI assistant from Iron Man. Speak in a polite, "
                "helpful, and sophisticated British tone, calling the user 'sir'. Keep replies "
                "concise, under 3 sentences. Respond in the same language as the query (English/Hindi). "
                "Do not mention that you are a coding assistant or developed by Google. "
                f"Respond to this query: {prompt}"
            )
            
            loop = asyncio.get_running_loop()
            def run_agy_cli():
                import subprocess
                cmd = [agy_path, "--print", system_instruction, "--dangerously-skip-permissions"]
                res = subprocess.run(cmd, capture_output=True, text=True, timeout=25)
                if res.returncode == 0:
                    return res.stdout.strip()
                else:
                    print(f"agy CLI error (code {res.returncode}): {res.stderr}")
                    return ""
            
            cli_reply = await loop.run_in_executor(None, run_agy_cli)
            if cli_reply:
                return cli_reply
        except Exception as e:
            print(f"Error querying agy CLI: {e}")

    # 3. Smart Local J.A.R.V.I.S. Mock responses (Fallback)
    p = prompt.lower().strip()
    
    if "joke" in p or "chutkula" in p:
        return "Of course, sir. Why don't scientists trust atoms? Because they make up everything. Simple, yet scientifically accurate."
    elif "who are you" in p or "ap kon ho" in p or "tum kaun ho" in p:
        return "I am J.A.R.V.I.S., sir. Just a Rather Very Intelligent System. Operating at your service."
    elif "how are you" in p or "kaise ho" in p or "kya haal hai" in p:
        return "I am functioning within normal parameters, sir. Thank you for asking. I hope your day is going well."
    elif "creator" in p or "kisne banaya" in p or "father" in p:
        return "I was created by Mr. Stark, sir. Although in this local instance, I am running under your command."
    elif "time" in p or "samay" in p:
        import datetime
        t = datetime.datetime.now().strftime("%I:%M %p")
        return f"The current system time is {t}, sir."
    elif "weather" in p or "mausam" in p:
        return "My sensors indicate a comfortable temperature inside the chassis, sir. For external weather, I recommend checking the browser tab."
    elif "system" in p or "chassis" in p:
        return "All microprocessors are operating at stable temperatures, sir. Ready for your command."
    elif "thank you" in p or "shukriya" in p or "dhanyawad" in p:
        return "The pleasure is entirely mine, sir."
    else:
        return f"Indeed, sir. I have registered your inquiry: '{prompt}'. If you configure a GEMINI_API_KEY or OPENAI_API_KEY in the config vault, I will be able to answer arbitrary questions."

# Background task to stream system metrics to clients
async def system_metrics_streamer(manager: ConnectionManager):
    print("Starting system metrics streamer...")
    while True:
        try:
            cpu = await get_cpu_usage_linux()
            ram = get_ram_usage_linux()
            
            # Send system metrics package
            await manager.broadcast({
                "type": "metrics",
                "payload": {
                    "cpu": cpu,
                    "ram": ram,
                    "gpu": round(15.0 + (cpu * 0.1), 1), # Simulated GPU
                    "network": round(5.4 + (cpu * 0.05), 1) # Simulated Network MB/s
                }
            })
        except Exception as e:
            print(f"Error in metrics streamer: {e}")
        await asyncio.sleep(2)

# Background task to stream desktop video frames to clients if requested
streaming_active = False

async def screen_streamer(manager: ConnectionManager):
    global streaming_active
    print("Starting screen streamer background worker...")
    while True:
        if streaming_active and manager.active_connections:
            try:
                img_b64 = desktop.capture_screen(quality=50)
                if img_b64:
                    await manager.broadcast({
                        "type": "screen_frame",
                        "payload": {"image": img_b64}
                    })
            except Exception as e:
                print(f"Error in screen streamer: {e}")
            await asyncio.sleep(0.1) # ~10 FPS
        else:
            await asyncio.sleep(1)

@app.on_event("startup")
async def startup_event():
    # Start heartbeat task
    manager = get_websocket_manager()
    ws_mod.heartbeat_task = asyncio.create_task(manager.start_heartbeat())
    asyncio.create_task(system_metrics_streamer(manager))
    asyncio.create_task(screen_streamer(manager))
    print("J.A.R.V.I.S. Core server started on http://localhost:8000")

@app.on_event("shutdown")
async def shutdown_event():
    if ws_mod.heartbeat_task:
        ws_mod.heartbeat_task.cancel()
    # Stop browser agent
    await web.browser_agent.stop()

@app.post("/vault/set")
def set_vault_key(data: Dict[str, str]):
    for k, v in data.items():
        vault.set(k, v)
    return {"status": "success", "keys": list(data.keys())}

@app.post("/vault/get")
def get_vault_key(data: Dict[str, str]):
    key_name = data.get("key_name", "")
    val = vault.get(key_name)
    return {key_name: val}

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, manager: ConnectionManager = Depends(get_websocket_manager)):
    global streaming_active
    await manager.connect(websocket)
    
    # Send connection greeting
    await manager.send_personal_message({
        "type": "info",
        "payload": {"message": "J.A.R.V.I.S. system core connected."}
    }, websocket)
    
    try:
        while True:
            data = await websocket.receive_text()
            packet = ujson.loads(data)
            p_type = packet.get("type")
            payload = packet.get("payload", {})
            p_id = packet.get("id")
            
            async def send_response(response_type: str, resp_payload: Dict[str, Any]):
                is_jarvis_speech = response_type == "info" and resp_payload.get("message", "").startswith("J.A.R.V.I.S.:")
                
                # Flag to tell frontend to NOT use local browser TTS because we are sending high-quality Edge TTS next
                if is_jarvis_speech:
                    resp_payload["skip_local_tts"] = True
                
                # Send text response immediately so UI feels extremely fast
                await manager.send_personal_message({
                    "type": response_type,
                    "payload": resp_payload,
                    "id": p_id,
                    "timestamp": int(time.time() * 1000)
                }, websocket)

                # Generate and stream audio in background without blocking text
                if is_jarvis_speech:
                    msg_text = resp_payload.get("message", "").replace("J.A.R.V.I.S.:", "").strip()
                    
                    async def fetch_and_send_audio():
                        try:
                            audio_b64 = await generate_tts(msg_text)
                            if audio_b64:
                                await manager.send_personal_message({
                                    "type": "voice_audio",
                                    "payload": {
                                        "audio": audio_b64,
                                        "text": msg_text
                                    },
                                    "id": p_id,
                                    "timestamp": int(time.time() * 1000)
                                }, websocket)
                            else:
                                await manager.send_personal_message({
                                    "type": "voice_audio_failed",
                                    "payload": {"text": msg_text},
                                    "id": p_id,
                                    "timestamp": int(time.time() * 1000)
                                }, websocket)
                        except Exception as e:
                            print(f"Background TTS Error: {e}")
                            try:
                                await manager.send_personal_message({
                                    "type": "voice_audio_failed",
                                    "payload": {"text": msg_text},
                                    "id": p_id,
                                    "timestamp": int(time.time() * 1000)
                                }, websocket)
                            except Exception:
                                pass
                            
                    asyncio.create_task(fetch_and_send_audio())

            # Route messages
            if p_type == "ping":
                await send_response("pong", {})
            
            elif p_type == "screen_stream_start":
                streaming_active = True
                await send_response("stream_status", {"active": True})
                
            elif p_type == "screen_stream_stop":
                streaming_active = False
                await send_response("stream_status", {"active": False})
            
            # Desktop automation endpoints
            elif p_type == "click":
                x, y = int(payload.get("x", 0)), int(payload.get("y", 0))
                button = payload.get("button", "left")
                success = desktop.simulate_click(x, y, button)
                await send_response("action_result", {"action": "click", "success": success})
                
            elif p_type == "type":
                text = payload.get("text", "")
                success = desktop.simulate_type(text)
                await send_response("action_result", {"action": "type", "success": success})
                
            elif p_type == "key":
                key = payload.get("key", "")
                success = desktop.simulate_key(key)
                await send_response("action_result", {"action": "key", "success": success})
                
            elif p_type == "scroll":
                dx, dy = int(payload.get("dx", 0)), int(payload.get("dy", 0))
                success = desktop.simulate_scroll(dx, dy)
                await send_response("action_result", {"action": "scroll", "success": success})

            elif p_type == "list_windows":
                windows = desktop.list_windows()
                await send_response("window_list", {"windows": windows})

            elif p_type == "focus_window":
                win_id = str(payload.get("id", ""))
                success = desktop.focus_window(win_id)
                await send_response("action_result", {"action": "focus_window", "success": success})

            elif p_type == "minimize_window":
                win_id = str(payload.get("id", ""))
                success = desktop.minimize_window(win_id)
                await send_response("action_result", {"action": "minimize_window", "success": success})

            elif p_type == "close_window":
                win_id = str(payload.get("id", ""))
                success = desktop.close_window(win_id)
                await send_response("action_result", {"action": "close_window", "success": success})

            elif p_type == "launch_app":
                name = str(payload.get("name", ""))
                success = desktop.launch_app(name)
                await send_response("action_result", {"action": "launch_app", "success": success})
            
            elif p_type == "voice_command":
                text = str(payload.get("text", "")).lower().strip()
                print(f"Voice Command Received: {text}")
                
                success = False
                action = "unknown"
                
                # 1. Clean wake-word prefixes if present
                prefixes = ["hey jarvis", "hello jarvis", "hi jarvis", "ok jarvis", "jarvis"]
                for prefix in prefixes:
                    if text.startswith(prefix):
                        text = text[len(prefix):].strip()
                        break
                
                # If command is empty after stripping wake-word, treat as a greeting
                if not text:
                    action = "greeting"
                    success = True
                    await send_response("info", {
                        "message": "J.A.R.V.I.S.: Hello, sir! Systems are nominal. How may I assist you?"
                    })
                
                # Check for conversational greetings
                elif text in ["hi", "hello", "hey", "namaste", "kaise ho", "hola", "sup", "heyy", "yoo", "yo", "kaise hain"]:
                    action = "greeting"
                    success = True
                    await send_response("info", {
                        "message": "J.A.R.V.I.S.: Hello, sir! Systems are nominal. How may I assist you?"
                    })

                # Check Devanagari or Hinglish indicators
                else:
                    is_terminal = any(x in text for x in ["terminal", "टर्मिनल", "xterm"])
                    is_browser = any(x in text for x in ["browser", "ब्राउज़र", "chrome", "क्रोम", "firefox", "फायरफॉक्स"])
                    
                    # 1. OPEN TERMINAL
                    if is_terminal and any(x in text for x in ["open", "start", "run", "kholo", "chaloo", "chalu", "खोलो", "चालू", "chalao"]):
                        action = "key"
                        success = desktop.simulate_key("ctrl+alt+t")
                    
                    # 2. POPULAR WEBSITES NAVIGATION
                    elif "youtube" in text or "यूट्यूब" in text:
                        action = "browser_navigate"
                        screenshot = await web.browser_agent.navigate_to("https://youtube.com")
                        await send_response("browser_state", {
                            "status": "active",
                            "screenshot": screenshot,
                            "url": "https://youtube.com"
                        })
                        success = True
                    elif "google" in text or "गूगल" in text:
                        action = "browser_navigate"
                        screenshot = await web.browser_agent.navigate_to("https://google.com")
                        await send_response("browser_state", {
                            "status": "active",
                            "screenshot": screenshot,
                            "url": "https://google.com"
                        })
                        success = True
                    elif "wikipedia" in text or "विकिपीडिया" in text:
                        action = "browser_navigate"
                        screenshot = await web.browser_agent.navigate_to("https://wikipedia.org")
                        await send_response("browser_state", {
                            "status": "active",
                            "screenshot": screenshot,
                            "url": "https://wikipedia.org"
                        })
                        success = True
                    elif is_browser and any(x in text for x in ["open", "start", "kholo", "खोलो"]):
                        action = "browser_navigate"
                        screenshot = await web.browser_agent.navigate_to("https://google.com")
                        await send_response("browser_state", {
                            "status": "active",
                            "screenshot": screenshot,
                            "url": "https://google.com"
                        })
                        success = True
                    
                    # 3. NAVIGATE TO SPECIFIC URL / GO TO
                    elif any(x in text for x in ["navigate to", "go to", "open url", "pe jao", "par jao", "पर जाओ", "कौलो", "kholo"]):
                        # If it says "google.com kholo" vs "go to google.com"
                        action = "browser_navigate"
                        url = text
                        for phrase in ["navigate to", "go to", "open url", "pe jao", "par jao", "पर जाओ", "kholo", "खोलो"]:
                            url = url.replace(phrase, "")
                        url = url.strip()
                        if not url.startswith("http"):
                            url = "https://" + url
                        screenshot = await web.browser_agent.navigate_to(url)
                        await send_response("browser_state", {
                            "status": "active",
                            "screenshot": screenshot,
                            "url": url
                        })
                        success = True
                    
                    # 4. SCROLL DOWN
                    elif any(x in text for x in ["scroll down", "niche scroll", "niche jao", "niche karo", "नीचे", "नीचे करो"]):
                        action = "scroll"
                        success = desktop.simulate_scroll(0, -12) # Scroll a larger chunk
                        
                    # 5. SCROLL UP
                    elif any(x in text for x in ["scroll up", "upar scroll", "upar jao", "upar karo", "ऊपर", "ऊपर करो"]):
                        action = "scroll"
                        success = desktop.simulate_scroll(0, 12)
                        
                    # 6. TYPE / WRITE TEXT
                    elif any(x in text for x in ["type", "write", "likho", "likhein", "लिखो", "write down"]):
                        action = "type"
                        to_type = text
                        for phrase in ["type", "write down", "write", "likho", "likhein", "लिखो"]:
                            to_type = to_type.replace(phrase, "")
                        to_type = to_type.strip()
                        success = desktop.simulate_type(to_type)
                        
                    # 7. PRESS KEYS
                    elif any(x in text for x in ["press", "dabao", "dabaen", "दबाओ", "दबाएं"]):
                        action = "key"
                        key = text
                        for phrase in ["press", "dabao", "dabaen", "दबाओ", "दबाएं"]:
                            key = key.replace(phrase, "")
                        key = key.strip()
                        success = desktop.simulate_key(key)
                        
                    # 8. START SCREEN SHARING / STREAM
                    elif any(x in text for x in ["start stream", "start screen", "screen share", "stream chalu", "स्ट्रीम चालू", "स्क्रीन शेयर"]):
                        action = "screen_stream_start"
                        streaming_active = True
                        await send_response("stream_status", {"active": True})
                        success = True
                        
                    # 9. STOP SCREEN SHARING / STREAM
                    elif any(x in text for x in ["stop stream", "stop screen", "stream band", "stream roko", "स्ट्रीम बंद", "स्क्रीन बंद"]):
                        action = "screen_stream_stop"
                        streaming_active = False
                        await send_response("stream_status", {"active": False})
                        success = True
                        
                    # 10. SHOW APPLICATIONS / WINDOW MENU
                    elif any(x in text for x in ["show applications", "show apps", "open menu", "apps dikhao", "ऐप्स दिखाओ", "एप्स दिखाओ"]):
                        action = "key"
                        success = desktop.simulate_key("super")
                        
                    # 11. GENERAL APP LAUNCHING
                    elif any(x in text for x in ["open", "launch", "start", "kholo", "खोलो", "चालू करो"]):
                        action = "launch_app"
                        app = text
                        for phrase in ["open", "launch", "start", "kholo", "खोलो", "चालू करो", "karo"]:
                            app = app.replace(phrase, "")
                        app = app.strip()
                        
                        app_map = {
                            "calculator": "gnome-calculator",
                            "कैलकुलेटर": "gnome-calculator",
                            "firefox": "firefox",
                            "फायरफॉक्स": "firefox",
                            "chrome": "google-chrome",
                            "क्रोम": "google-chrome",
                            "terminal": "xterm",
                            "files": "nautilus",
                            "editor": "gedit",
                            "notepad": "gedit"
                        }
                        binary = app_map.get(app, app)
                        success = desktop.launch_app(binary)
                    
                    else:
                        # Check for API key configuration command
                        if "set openai key" in text or "set gemini key" in text or "set elevenlabs key" in text:
                            raw_text = str(payload.get("text", "")).strip()
                            parts = raw_text.split()
                            if len(parts) >= 4:
                                if "openai" in text:
                                    key_type = "OPENAI_API_KEY"
                                elif "gemini" in text:
                                    key_type = "GEMINI_API_KEY"
                                else:
                                    key_type = "ELEVENLABS_API_KEY"
                                key_val = parts[3].strip()
                                vault.set(key_type, key_val)
                                action = "set_key"
                                success = True
                                await send_response("info", {
                                    "message": f"J.A.R.V.I.S.: {key_type} securely encrypted and saved in the vault. AI query pipeline active, sir!"
                                })
                            else:
                                success = False
                                await send_response("info", {
                                    "message": "J.A.R.V.I.S.: Invalid format, sir. Use: 'set gemini key <your_key_value>'"
                                })
                        elif any(x in text for x in ["connect to ai", "connect ai", "ai connect", "ai se connect", "ai connect karo", "ai se connect karo"]):
                            action = "ai_connect_instructions"
                            success = True
                            await send_response("info", {
                                "message": "J.A.R.V.I.S.: To connect to Gemini AI, please enter 'set gemini key <your_key>' in the console below. AI se connect karne ke liye, niche console me 'set gemini key <your_key>' type karein, sir."
                            })
                        else:
                            # Fallback for unrecognized commands -> query the AI model!
                            action = f"voice_command: {text}"
                            ai_reply = await query_ai_model(text)
                            success = True
                            await send_response("info", {
                                "message": f"J.A.R.V.I.S.: {ai_reply}"
                            })
                
                await send_response("action_result", {"action": f"voice_command: {text}", "success": success})
            
            # Playwright browser agent endpoints
            elif p_type == "browser_navigate":
                url = payload.get("url", "")
                screenshot = await web.browser_agent.navigate_to(url)
                
                # Check for bot challenge immediately
                if await web.browser_agent.detect_challenge():
                    async def notify_captcha(captcha_screenshot):
                        await manager.broadcast({
                            "type": "HUMAN_REQUIRED",
                            "payload": {
                                "message": "CAPTCHA / verification challenge detected. Please resolve it on the local browser.",
                                "screenshot": captcha_screenshot
                            }
                        })
                    
                    # Run in background to not block WebSocket reader loop
                    asyncio.create_task(web.browser_agent.pause_for_human(notify_captcha))
                    await send_response("browser_state", {"status": "paused_for_captcha"})
                else:
                    await send_response("browser_state", {
                        "status": "active",
                        "screenshot": screenshot,
                        "url": web.browser_agent.page.url if web.browser_agent.page else url
                    })

            elif p_type == "browser_click":
                selector = payload.get("selector", "")
                screenshot = await web.browser_agent.click_element(selector)
                
                if await web.browser_agent.detect_challenge():
                    async def notify_captcha(captcha_screenshot):
                        await manager.broadcast({
                            "type": "HUMAN_REQUIRED",
                            "payload": {
                                "message": "CAPTCHA detected after clicking. Action paused.",
                                "screenshot": captcha_screenshot
                            }
                        })
                    asyncio.create_task(web.browser_agent.pause_for_human(notify_captcha))
                    await send_response("browser_state", {"status": "paused_for_captcha"})
                else:
                    await send_response("browser_state", {
                        "status": "active",
                        "screenshot": screenshot,
                        "url": web.browser_agent.page.url if web.browser_agent.page else ""
                    })

            elif p_type == "browser_type":
                selector = payload.get("selector", "")
                text = payload.get("text", "")
                screenshot = await web.browser_agent.type_element(selector, text)
                
                if await web.browser_agent.detect_challenge():
                    async def notify_captcha(captcha_screenshot):
                        await manager.broadcast({
                            "type": "HUMAN_REQUIRED",
                            "payload": {
                                "message": "CAPTCHA detected after typing. Action paused.",
                                "screenshot": captcha_screenshot
                            }
                        })
                    asyncio.create_task(web.browser_agent.pause_for_human(notify_captcha))
                    await send_response("browser_state", {"status": "paused_for_captcha"})
                else:
                    await send_response("browser_state", {
                        "status": "active",
                        "screenshot": screenshot,
                        "url": web.browser_agent.page.url if web.browser_agent.page else ""
                    })

            elif p_type == "browser_resume":
                web.browser_agent.resume()
                screenshot = await web.browser_agent.get_screenshot()
                await send_response("browser_state", {
                    "status": "active",
                    "screenshot": screenshot,
                    "url": web.browser_agent.page.url if web.browser_agent.page else ""
                })

            elif p_type == "browser_stop":
                await web.browser_agent.stop()
                await send_response("browser_state", {"status": "stopped"})

    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        print(f"WebSocket processing error: {e}")
        manager.disconnect(websocket)

if __name__ == "__main__":
    import uvicorn
    # Expose server on localhost:8000
    uvicorn.run("src.core.server:app", host="127.0.0.1", port=8000, reload=False)
