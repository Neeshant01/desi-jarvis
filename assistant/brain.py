import os
import json
import time
import threading
import datetime
import subprocess
from assistant import commands
from assistant import automation


class Brain:
    def __init__(self, config, voice):
        self.config = config
        self.voice = voice
        self.history_file = config.get("history_file", "history.txt")
        self.memory_file = config.get("memory_file", "memory.json")
        self.task_file = config.get("task_file", "tasks.json")
        self._load_memory()
        self._load_plugins()

    def _load_memory(self):
        try:
            if os.path.exists(self.memory_file):
                with open(self.memory_file, "r", encoding="utf-8") as f:
                    self.memory = json.load(f)
            else:
                self.memory = {"preferences": {}}
        except Exception:
            self.memory = {"preferences": {}}

    def _save_memory(self):
        try:
            with open(self.memory_file, "w", encoding="utf-8") as f:
                json.dump(self.memory, f, indent=2)
        except Exception as e:
            print(f"memory save failed: {e}")

    def _load_plugins(self):
        self.plugins = []
        plugins_dir = self.config.get("plugins_dir", "plugins")
        if not os.path.exists(plugins_dir):
            os.makedirs(plugins_dir, exist_ok=True)
        # Plugins are Python files with register(brain) function
        for file in os.listdir(plugins_dir):
            if file.endswith(".py"):
                try:
                    path = os.path.join(plugins_dir, file)
                    module_name = file[:-3]
                    import importlib.util
                    spec = importlib.util.spec_from_file_location(module_name, path)
                    module = importlib.util.module_from_spec(spec)
                    spec.loader.exec_module(module)
                    if hasattr(module, "register"):
                        module.register(self)
                        self.plugins.append(module_name)
                except Exception as e:
                    print(f"Plugin load failed for {file}: {e}")

    def _log_history(self, command_text, response):
        try:
            with open(self.history_file, "a", encoding="utf-8") as f:
                f.write(f"{datetime.datetime.now().isoformat()} | {command_text} -> {response}\n")
        except Exception as e:
            print(f"history log error: {e}")

    def set_preference(self, key, value):
        self.memory.setdefault("preferences", {})[key] = value
        self._save_memory()

    def get_preference(self, key, default=None):
        return self.memory.get("preferences", {}).get(key, default)

    def set_alarm(self, time_str, message):
        if commands.add_reminder(self.task_file, time_str, message):
            # start checker thread if not running
            t = threading.Thread(target=self._alarm_checker, daemon=True)
            t.start()
            return True
        return False

    def _alarm_checker(self):
        while True:
            reminders = commands.read_reminders(self.task_file)
            now = datetime.datetime.now().strftime("%H:%M")
            updated = []
            for r in reminders:
                if r["time"] == now:
                    self.voice.speak(f"Reminder: {r.get('message', 'You set an alarm')}")
                else:
                    updated.append(r)
            if len(updated) != len(reminders):
                commands.save_json(self.task_file, {"reminders": updated})
            time.sleep(60)

    def ask_openai(self, command_text):
        try:
            import openai
            api_key = os.getenv("OPENAI_API_KEY")
            if not api_key:
                return "OpenAI key not set. Set OPENAI_API_KEY environment variable."
            openai.api_key = api_key
            response = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "system", "content": "You are a helpful assistant."},
                          {"role": "user", "content": command_text}],
                max_tokens=150,
                temperature=0.6,
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            return f"OpenAI integration error: {e}"

    def process(self, command_text):
        command_text = command_text.lower().strip()
        if not command_text:
            return "I didn't catch that. Please repeat."

        response = ""

        if "wake word" in command_text or "name" in command_text:
            response = "Use config.json to change the assistant name and wake word."

        elif "change name" in command_text or "assistant name" in command_text:
            words = command_text.split()
            for i, w in enumerate(words):
                if w in ["name", "called"] and i + 1 < len(words):
                    new_name = words[i + 1].capitalize()
                    self.config["assistant_name"] = new_name
                    self.voice.update_name(new_name)
                    self.set_preference("assistant_name", new_name)
                    response = f"Name changed to {new_name}."
                    break

        elif "change wake word" in command_text or "set wake word" in command_text:
            words = command_text.split()
            if "to" in words:
                idx = words.index("to")
                if idx + 1 < len(words):
                    new_wake = words[idx + 1]
                    self.config["wake_word"] = new_wake.lower()
                    self.voice.update_wake_word(new_wake)
                    self.set_preference("wake_word", new_wake)
                    response = f"Wake word changed to {new_wake}."
            if not response:
                response = "Please say: set wake word to <word>."

        elif "open" in command_text and "website" in command_text:
            site = command_text.replace("open", "").replace("website", "").strip()
            if commands.open_website(site):
                response = f"Opening website {site}."

        elif "search google" in command_text:
            query = command_text.replace("search google", "").strip()
            if commands.google_search(query):
                response = f"Searching Google for {query}."

        elif "search youtube" in command_text or "youtube" in command_text:
            query = command_text.replace("search youtube", "").replace("youtube", "").strip()
            if commands.youtube_search(query):
                response = f"Searching YouTube for {query}."

        elif "open" in command_text and ("chrome" in command_text or "vscode" in command_text):
            if automation.open_application(command_text):
                response = "Application opened."
            else:
                response = "Could not open application."

        elif "close" in command_text and ("chrome" in command_text or "vscode" in command_text):
            if automation.close_application(command_text):
                response = "Application closed."
            else:
                response = "Could not close application."

        elif "shutdown" in command_text:
            if automation.perform_system_action("shutdown"):
                response = "Shutting down system in 10 seconds."
            else:
                response = "Failed to shutdown."

        elif "restart" in command_text:
            if automation.perform_system_action("restart"):
                response = "Restarting system in 10 seconds."
            else:
                response = "Failed to restart."

        elif "sleep" in command_text:
            if automation.perform_system_action("sleep"):
                response = "Sleeping now."
            else:
                response = "Failed to sleep."

        elif "lock" in command_text:
            if automation.perform_system_action("lock"):
                response = "Locking workstation."
            else:
                response = "Failed to lock workstation."

        elif "create file" in command_text:
            path = command_text.replace("create file", "").strip()
            if automation.create_file(path):
                response = f"Created file {path}."
            else:
                response = "Failed to create file."

        elif "delete file" in command_text or "remove file" in command_text:
            path = command_text.replace("delete file", "").replace("remove file", "").strip()
            if automation.delete_file(path):
                response = f"Deleted {path}."
            else:
                response = "Failed to delete."

        elif "open folder" in command_text or "open directory" in command_text:
            path = command_text.replace("open folder", "").replace("open directory", "").strip()
            if automation.open_path(path):
                response = f"Opened {path}."
            else:
                response = "Path not found."

        elif "remind me" in command_text:
            try:
                # simple format: remind me at 14:30 to take medicine
                if " at " in command_text and " to " in command_text:
                    parts = command_text.split(" at ", 1)[1]
                    time_part, msg = parts.split(" to ", 1)
                    if commands.add_reminder(self.task_file, time_part.strip(), msg.strip()):
                        response = f"Reminder set for {time_part.strip()}."
                    else:
                        response = "Could not set reminder."
                else:
                    response = "Please use: remind me at HH:MM to <task>."
            except Exception:
                response = "Could not schedule reminder."

        elif "memory" in command_text or "remember" in command_text:
            if "set" in command_text:
                # set memory to key value
                words = command_text.replace("remember", "").replace("set", "").strip().split(" to ")
                if len(words) == 2:
                    self.set_preference(words[0].strip(), words[1].strip())
                    response = "Preference remembered."
                else:
                    response = "Say remember <key> to <value>."
            elif "get" in command_text:
                key = command_text.replace("get", "").replace("memory", "").strip()
                value = self.get_preference(key)
                if value:
                    response = f"{key} is {value}."
                else:
                    response = "No data found."
            else:
                response = "You can say remember <key> to <value> or get <key>."

        elif "wikipedia" in command_text:
            topic = command_text.replace("wikipedia", "").strip()
            summary = commands.get_wikipedia_summary(topic)
            response = summary

        elif "history" in command_text:
            try:
                if os.path.exists(self.history_file):
                    with open(self.history_file, "r", encoding="utf-8") as f:
                        response = f.read().splitlines()[-5:]
                        response = "\n".join(response)
                else:
                    response = "No history yet."
            except Exception as e:
                response = f"History error: {e}"

        elif self.config.get("openai_enabled", False):
            response = self.ask_openai(command_text)

        else:
            response = "Command not recognized. Try again or ask to search internet."

        self._log_history(command_text, response)
        return response
