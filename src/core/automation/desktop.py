import os
import subprocess
import base64
from io import BytesIO
from PIL import Image, ImageDraw
import mss
import pyautogui
from pynput.keyboard import Controller as KeyboardController, Key
from pynput.mouse import Button, Controller as MouseController

# Set PyAutoGUI failsafe to True (move mouse to corner to abort)
pyautogui.FAILSAFE = True

keyboard = KeyboardController()
mouse = MouseController()

def get_screen_size():
    """Returns (width, height) of the primary monitor."""
    return pyautogui.size()

def capture_screen(highlight_rect=None, quality=70) -> str:
    """
    Captures the primary screen, optionally draws a highlight box,
    and returns a base64-encoded JPEG image string.
    """
    try:
        with mss.mss() as sct:
            # Capture primary monitor
            monitor = sct.monitors[1]
            sct_img = sct.grab(monitor)
            
            # Convert to PIL Image
            img = Image.frombytes("RGB", sct_img.size, sct_img.bgra, "raw", "BGRX")
            
            # Draw red highlight box if specified
            if highlight_rect:
                draw = ImageDraw.Draw(img)
                x, y, w, h = highlight_rect
                # Draw outer and inner outline for visibility
                draw.rectangle([x, y, x + w, y + h], outline="red", width=3)
                draw.rectangle([x - 1, y - 1, x + w + 1, y + h + 1], outline="black", width=1)
            
            # Compress to JPEG
            buffered = BytesIO()
            img.save(buffered, format="JPEG", quality=quality)
            img_str = base64.b64encode(buffered.getvalue()).decode("utf-8")
            return img_str
    except Exception as e:
        print(f"Screen capture failed: {e}")
        return ""

def simulate_click(x: int, y: int, button: str = "left"):
    """Moves the mouse to (x, y) and clicks."""
    try:
        pyautogui.moveTo(x, y, duration=0.2)
        if button == "double":
            pyautogui.doubleClick(x, y)
        else:
            pyautogui.click(x, y, button=button)
        return True
    except Exception as e:
        print(f"Click failed: {e}")
        return False

def simulate_type(text: str):
    """Types a string of text."""
    try:
        pyautogui.write(text, interval=0.01)
        return True
    except Exception as e:
        print(f"Typing failed: {e}")
        return False

def simulate_key(key: str):
    """Presses a single key or key combination."""
    try:
        keys = key.split("+")
        # Handle combinations like ctrl+c
        if len(keys) > 1:
            for k in keys[:-1]:
                pyautogui.keyDown(k.strip().lower())
            pyautogui.press(keys[-1].strip().lower())
            for k in reversed(keys[:-1]):
                pyautogui.keyUp(k.strip().lower())
        else:
            pyautogui.press(key.strip())
        return True
    except Exception as e:
        print(f"Key press failed: {e}")
        return False

def simulate_scroll(dx: int, dy: int):
    """Scrolls mouse wheel."""
    try:
        mouse.scroll(dx, dy)
        return True
    except Exception as e:
        print(f"Scroll failed: {e}")
        return False

def list_windows():
    """Returns a list of active windows using xdotool (Linux X11)."""
    try:
        # Search all visible windows
        cmd = ["xdotool", "search", "--onlyvisible", "--name", "."]
        output = subprocess.check_output(cmd).decode().splitlines()
        
        windows = []
        for win_id in output:
            win_id = win_id.strip()
            if not win_id:
                continue
            try:
                # Get the name of the window
                name = subprocess.check_output(["xdotool", "getwindowname", win_id]).decode().strip()
                # Get the class of the window
                win_class = subprocess.check_output(["xdotool", "getwindowclassname", win_id]).decode().strip()
                windows.append({
                    "id": win_id,
                    "name": name,
                    "class": win_class
                })
            except Exception:
                continue
        return windows
    except Exception as e:
        print(f"Failed to list windows: {e}")
        return []

def focus_window(window_id: str):
    """Focuses a window by its ID."""
    try:
        subprocess.run(["xdotool", "windowactivate", window_id], check=True)
        return True
    except Exception as e:
        print(f"Failed to focus window {window_id}: {e}")
        return False

def minimize_window(window_id: str):
    """Minimizes a window by its ID."""
    try:
        subprocess.run(["xdotool", "windowminimize", window_id], check=True)
        return True
    except Exception as e:
        print(f"Failed to minimize window {window_id}: {e}")
        return False

def close_window(window_id: str):
    """Closes a window by its ID."""
    try:
        subprocess.run(["xdotool", "windowkill", window_id], check=True)
        return True
    except Exception as e:
        print(f"Failed to close window {window_id}: {e}")
        return False

def launch_app(app_name: str):
    """Launches an application by binary name."""
    try:
        # Launch in background
        subprocess.Popen([app_name], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        return True
    except FileNotFoundError:
        # Try running in shell if not found directly
        try:
            subprocess.Popen(app_name, shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            return True
        except Exception as e:
            print(f"Failed to launch {app_name}: {e}")
            return False
    except Exception as e:
        print(f"Failed to launch {app_name}: {e}")
        return False
