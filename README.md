# JARVIS-Like AI Desktop Assistant (Python)

A modular desktop AI assistant prototype built with Python. It listens for voice commands (wake word), executes system tasks, performs web searches, and can be extended using plugins.

## Features

- Voice command recognition (speechrecognition)
- Custom wake word (`hey jarvis`) and assistant name
- Text-to-speech responses (pyttsx3, male/female voices)
- Open/close applications (Chrome, VS Code, etc.)
- System controls: shutdown, restart, sleep, lock
- File management: create/delete/open file or folder
- Keyboard/mouse automation with PyAutoGUI
- Web automation: Google/Youtube search, open URL
- Simple memory store and command history
- Reminder scheduling
- Optional OpenAI integration (chat and question-answer)
- Plugin architecture

## Project Structure

- `main.py` - entrypoint
- `assistant/voice.py` - voice I/O module
- `assistant/brain.py` - command processing and memory
- `assistant/commands.py` - helper actions and web automation
- `assistant/automation.py` - system/app/file automation
- `config.json` - runtime settings
- `requirements.txt` - Python dependencies
- `README.md` - documentation

## Installation

1. Clone or download this repo.
2. Create a Python 3 virtual environment and activate it.

```bash
python -m venv venv
venv\Scripts\activate  # Windows
```

3. Install dependencies:

```bash
pip install -r requirements.txt
```

4. (Windows only) Install PyAudio, or use `pipwin install pyaudio`.

5. Configure `config.json` if needed.

6. (Optional) Set OpenAI key:

```bash
set OPENAI_API_KEY=your-key
```

## Usage

Run the assistant:

```bash
python main.py
```

Say: "Hey Jarvis" (default wake word), then command.

Example commands:

- "Hey Jarvis, open Chrome"
- "Hey Jarvis, open VS Code"
- "Hey Jarvis, search Google for Python decorators"
- "Hey Jarvis, search YouTube for product demo"
- "Hey Jarvis, open website github.com"
- "Hey Jarvis, create file C:\\Temp\\note.txt"
- "Hey Jarvis, delete file C:\\Temp\\note.txt"
- "Hey Jarvis, remind me at 16:00 to take a break"
- "Hey Jarvis, set voice male"
- "Hey Jarvis, set language en"
- "Hey Jarvis, shutdown"
- "Hey Jarvis, restart"

## Config file example

```json
{
  "assistant_name": "Jarvis",
  "wake_word": "hey jarvis",
  "voice": "female",
  "language": "en",
  "openai_enabled": false,
  "plugins_dir": "plugins",
  "task_file": "tasks.json",
  "memory_file": "memory.json",
  "history_file": "history.txt"
}
```

## Plugin system

Add Python files to `plugins/` with a `register(brain)` function. Example:

```python
# plugins/example.py

def register(brain):
    def ping_pong(command_text):
        if "ping" in command_text:
            brain.voice.speak("pong")
            return True
        return False

    brain.plugin_ping_pong = ping_pong
```

## Future improvements

- Add NLP parser (spaCy, Rasa)
- Add secure voice authentication and wake-word model
- GUI status dashboard
- Multi-platform robust path detection
- More advanced memory and persistent state across sessions

## Notes

- Ensure microphone is available and permission granted.
- Error handling prints exceptions and keeps assistant running.
