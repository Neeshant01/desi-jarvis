# Desi Jarvis: Modular Python Desktop Voice Assistant

![GitHub license](https://img.shields.io/github/license/Neeshant01/desi-jarvis?style=flat-square) ![GitHub top language](https://img.shields.io/github/languages/top/Neeshant01/desi-jarvis?style=flat-square) ![GitHub stars](https://img.shields.io/github/stars/Neeshant01/desi-jarvis?style=flat-square)

## Overview

**Desi Jarvis** is a **modular Python desktop assistant** prototype designed for voice commands, system automation, and personalized interactions. It offers a flexible and extensible framework for building intelligent desktop applications, focusing on clear architecture and ease of learning. This project demonstrates how voice input, command routing, automation, and memory can be integrated into a single Python solution.

## Problem Solved

Many existing desktop assistant demonstrations are either too complex to extend or lack a clear, understandable structure for learning. Desi Jarvis addresses this by providing a simple, readable, and modular prototype. It serves as an educational resource and a foundation for developers looking to implement voice-controlled automation and intelligent features on their desktops.

## Key Features

*   **Wake-word Based Voice Interaction**: Activate the assistant using a customizable wake word.
*   **Text-to-Speech Output**: Provides audible responses and feedback.
*   **Browser Automation**: Perform web searches and open websites directly via voice commands.
*   **Application Control**: Launch and close desktop applications.
*   **Windows System Commands**: Execute system-level actions such as shutdown, restart, sleep, and lock (primarily for Windows environments).
*   **File and Folder Utilities**: Manage files and directories with voice commands.
*   **Reminder Scheduling**: Set and manage reminders with lightweight memory storage.
*   **Optional OpenAI Integration**: Extend capabilities with an optional question-answering flow using OpenAI.
*   **Plugin System**: Easily extend functionality by loading custom Python plugins from a dedicated directory.

## Tech Stack

Desi Jarvis is built using the following technologies:

*   **Core Language**: Python
*   **Speech Recognition**: `SpeechRecognition` library
*   **Text-to-Speech**: `pyttsx3`
*   **GUI Automation**: `PyAutoGUI`
*   **Web Requests**: `Requests`
*   **Data Storage**: JSON-based local storage

## Architecture Overview

The project is structured to promote modularity and clarity:

*   `main.py`: The main entry point for the assistant.
*   `config.json`: Configuration file for assistant settings.
*   `requirements.txt`: Lists all Python dependencies.
*   `assistant/`: Contains core assistant modules (`automation.py`, `brain.py`, `commands.py`, `voice.py`).
*   `plugins/`: Directory for custom Python plugins.

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

To run Desi Jarvis, you will need:

*   Python 3.10+
*   A working microphone for voice interaction.
*   **Operating System**: Windows is the primary target environment for automation commands in the current version.

## Installation

1.  **Create and Activate a Virtual Environment**:
    ```bash
    python -m venv venv
    # On Windows:
    venv\Scripts\activate
    # On macOS/Linux:
    source venv/bin/activate
    ```
2.  **Install Dependencies**:
    ```bash
    pip install -r requirements.txt
    ```
3.  **Platform-Specific Audio Dependencies**: If necessary, install `PyAudio` or other platform-specific audio libraries.

## Configuration

Edit `config.json` to customize the assistant:

*   `assistant name`
*   `wake word`
*   `preferred voice`
*   `language`
*   `plugin directory`
*   `local memory` and `history files`

**Optional OpenAI Usage**:

*   Set `OPENAI_API_KEY` in your environment variables.
*   *Note*: The current OpenAI integration uses a legacy client pattern and may require updates depending on your installed SDK version.

## Usage

To start the assistant, run:

```bash
python main.py
```

**Example Commands**:

*   `Hey Jarvis, open Chrome`
*   `Hey Jarvis, search Google for Python decorators`
*   `Hey Jarvis, search YouTube for desktop assistant demos`
*   `Hey Jarvis, open website github.com`
*   `Hey Jarvis, remind me at 16:00 to take a break`
*   `Hey Jarvis, set voice male`
*   `Hey Jarvis, shutdown`

## Plugins

The assistant automatically discovers and loads Python files within the `plugins/` directory. Each plugin should expose a `register(brain)` function to integrate with the assistant's core functionalities.

## Limitations

*   **Platform Specificity**: Current automation helpers are predominantly Windows-specific.
*   **Voice Recognition**: Quality is dependent on microphone hardware and ambient noise levels.
*   **OpenAI Integration**: Optional and not designed for production-hardened use.
*   **Reminder System**: Lightweight and best suited for experimental purposes.

## Roadmap

Future development areas include:

*   Improving plugin examples and documentation for easier extension.
*   Enhancing command parsing and intent handling for more natural interactions.
*   Expanding cross-platform support beyond Windows.
*   Modernizing optional LLM integration paths for improved performance and features.

## Contributing

Contributions are welcome, especially for improving maintainability, documentation, and safer automation behaviors. Please refer to the [CONTRIBUTING.md](CONTRIBUTING.md) file for detailed guidelines.

## License

This project is released under the [MIT License](LICENSE).

## Author

Built by Nishant Kumar
