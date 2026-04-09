# Desi Jarvis

A modular Python desktop assistant prototype with voice commands, reminders, browser actions, system automation, and plugin-ready structure.

## Problem It Solves

Many desktop assistant demos are either too shallow to extend or too messy to learn from. Desi Jarvis is a simple, readable prototype that shows how voice input, command routing, automation, and memory can work together in one Python project.

## Key Features

- Wake-word based voice interaction
- Text-to-speech output
- Browser search and website opening
- Application launch and close actions
- Windows system commands like shutdown, restart, sleep, and lock
- File and folder utilities
- Reminder scheduling and lightweight memory storage
- Optional OpenAI question-answer flow
- Plugin loading from a local `plugins/` directory

## Tech Stack

- Python
- SpeechRecognition
- pyttsx3
- PyAutoGUI
- Requests
- JSON-based local storage

## Project Structure

```text
.
|-- main.py
|-- config.json
|-- requirements.txt
|-- assistant/
|   |-- __init__.py
|   |-- automation.py
|   |-- brain.py
|   |-- commands.py
|   `-- voice.py
`-- plugins/
```

## Requirements

- Python 3.10+
- Windows is the primary target environment for automation commands in the current version
- A working microphone for voice interaction

## Installation

1. Create and activate a virtual environment.

```bash
python -m venv venv
venv\Scripts\activate
```

2. Install dependencies.

```bash
pip install -r requirements.txt
```

3. If needed, install platform-specific audio dependencies such as PyAudio.

## Configuration

Edit `config.json` to control:

- assistant name
- wake word
- preferred voice
- language
- plugin directory
- local memory and history files

Optional OpenAI usage:

- set `OPENAI_API_KEY` in your environment
- note that the current implementation uses a legacy OpenAI Python client pattern and may need updates depending on the installed SDK version

## Usage

Run the assistant:

```bash
python main.py
```

Example commands:

- `Hey Jarvis, open Chrome`
- `Hey Jarvis, search Google for Python decorators`
- `Hey Jarvis, search YouTube for desktop assistant demos`
- `Hey Jarvis, open website github.com`
- `Hey Jarvis, remind me at 16:00 to take a break`
- `Hey Jarvis, set voice male`
- `Hey Jarvis, shutdown`

## Plugins

The assistant looks for Python files inside the `plugins/` directory. Each plugin should expose a `register(brain)` function.

## Limitations

- Current automation helpers are mostly Windows-specific
- Voice recognition quality depends on microphone and ambient noise
- OpenAI integration is optional and not production-hardened
- Reminder scheduling is lightweight and best suited for experimentation

## Demo and Screenshot Plan

Suggested demo title:

- `Desi Jarvis Demo: Voice Commands and Desktop Automation in Python`

Suggested screenshot filenames:

- `docs/images/command-loop.png`
- `docs/images/config-example.png`
- `docs/images/plugin-structure.png`

Suggested Open Graph preview idea:

- Terminal-style command view with a microphone icon and the title `Desi Jarvis`

## Roadmap

- Improve plugin examples and extension docs
- Add better command parsing and intent handling
- Improve cross-platform support
- Modernize optional LLM integration paths

## Contributing

Contributions are welcome for maintainability, documentation, and safer automation behavior.

See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## License

This repository is available under the [MIT License](LICENSE).

## Author

Built by Nishant Kumar
