import os
import re
import json
import webbrowser
import datetime
import requests
from assistant import automation


def load_json(path, default=None):
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return default if default is not None else {}


def save_json(path, data):
    try:
        with open(path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
        return True
    except Exception as e:
        print(f"save_json error: {e}")
        return False


def google_search(query):
    if not query:
        return False
    url = f"https://www.google.com/search?q={query.replace(' ', '+')}"
    webbrowser.open(url)
    return True


def youtube_search(query):
    if not query:
        return False
    url = f"https://www.youtube.com/results?search_query={query.replace(' ', '+')}"
    webbrowser.open(url)
    return True


def open_website(url):
    if not url:
        return False
    if not re.match(r"^https?://", url):
        url = "https://" + url
    webbrowser.open(url)
    return True


def get_wikipedia_summary(topic):
    if not topic:
        return "No topic provided."
    try:
        api = f"https://en.wikipedia.org/api/rest_v1/page/summary/{topic.replace(' ', '_')}"
        resp = requests.get(api, timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            return data.get("extract", "No summary found.")
        return "No summary available."
    except Exception as e:
        return f"Error fetching summary: {e}"


def add_reminder(task_file, time_str, message):
    data = load_json(task_file, default={"reminders": []})
    data.setdefault("reminders", []).append({
        "time": time_str,
        "message": message,
        "created": datetime.datetime.now().isoformat(),
    })
    return save_json(task_file, data)


def read_reminders(task_file):
    data = load_json(task_file, default={"reminders": []})
    return data.get("reminders", [])
