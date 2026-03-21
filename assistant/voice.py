import json
import os
import pyttsx3
import speech_recognition as sr


class VoiceAssistant:
    def __init__(self, config):
        self.config = config
        self.assistant_name = config.get("assistant_name", "Jarvis")
        self.wake_word = config.get("wake_word", "hey jarvis").lower()
        self.language = config.get("language", "en")
        self.engine = pyttsx3.init()
        self._configure_voice(config.get("voice", "female"))

    def _configure_voice(self, voice_pref):
        voices = self.engine.getProperty("voices")
        # Default to first voice if any
        selected = None
        if voice_pref.lower() in ["female", "f"]:
            for v in voices:
                if "female" in v.name.lower() or "female" in v.id.lower():
                    selected = v
                    break
        elif voice_pref.lower() in ["male", "m"]:
            for v in voices:
                if "male" in v.name.lower() or "male" in v.id.lower():
                    selected = v
                    break
        if selected is None and voices:
            selected = voices[0]
        if selected is not None:
            self.engine.setProperty("voice", selected.id)

    def speak(self, text):
        print(f"Jarvis: {text}")
        try:
            self.engine.say(text)
            self.engine.runAndWait()
        except Exception as e:
            print(f"TTS error: {e}")

    def listen(self, timeout=6, phrase_time_limit=8):
        recognizer = sr.Recognizer()
        try:
            with sr.Microphone() as source:
                print("Listening...")
                recognizer.adjust_for_ambient_noise(source, duration=0.8)
                audio = recognizer.listen(source, timeout=timeout, phrase_time_limit=phrase_time_limit)
            text = recognizer.recognize_google(audio, language=self.language)
            text = text.lower().strip()
            print(f"User: {text}")
            return text
        except sr.WaitTimeoutError:
            return ""
        except sr.UnknownValueError:
            return ""
        except Exception as e:
            print(f"Speech recognition error: {e}")
            return ""

    def is_wake_word(self, command_text):
        if not command_text:
            return False
        lower_text = command_text.lower()
        return self.wake_word in lower_text or self.assistant_name.lower() in lower_text

    def update_wake_word(self, wake_word):
        self.wake_word = wake_word.lower()

    def update_name(self, name):
        self.assistant_name = name
