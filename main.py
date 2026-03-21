import json
import os
import time
from assistant.voice import VoiceAssistant
from assistant.brain import Brain


def load_config(path="config.json"):
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"Could not load config: {e}")
        return {}


def save_config(config, path="config.json"):
    try:
        with open(path, "w", encoding="utf-8") as f:
            json.dump(config, f, indent=2)
        return True
    except Exception as e:
        print(f"Could not save config: {e}")
        return False


def run_assistant():
    config = load_config()

    # override with memory preferences
    assistant_name = config.get("assistant_name", "Jarvis")
    wake_word = config.get("wake_word", "hey jarvis")
    voice = VoiceAssistant(config)
    brain = Brain(config, voice)

    voice.speak(f"{assistant_name} is online. Say '{wake_word}' to wake me.")

    while True:
        try:
            text = voice.listen()
            if not text:
                time.sleep(0.5)
                continue

            if "exit" in text or "quit" in text or "stop" in text:
                voice.speak("Shutting down. Goodbye.")
                break

            if brain.config.get("wake_word") and not voice.is_wake_word(text):
                # optionally allow typing command
                continue

            # remove wake word for processing
            cleaned = text
            wake = brain.config.get("wake_word", "").lower()
            if wake and wake in cleaned:
                cleaned = cleaned.replace(wake, "").strip()
            cleaned = cleaned.replace(assistant_name.lower(), "").strip()

            if not cleaned:
                voice.speak("Yes?")
                continue

            response = brain.process(cleaned)
            voice.speak(response)

            # allow manual config update
            if cleaned.startswith("set voice"):
                want = cleaned.replace("set voice", "").strip()
                config["voice"] = want
                voice._configure_voice(want)
                save_config(config)

            if cleaned.startswith("set language"):
                lang = cleaned.replace("set language", "").strip()
                config["language"] = lang
                voice.language = lang
                save_config(config)

        except KeyboardInterrupt:
            print("KeyboardInterrupt received, exiting.")
            break
        except Exception as e:
            voice.speak(f"I had an error: {e}")


if __name__ == "__main__":
    run_assistant()
