import os
import subprocess
import platform
import ctypes
import pyautogui


def open_application(app_name):
    app_name = app_name.lower()
    try:
        if "chrome" in app_name:
            subprocess.Popen(["C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"])
            return True
        if "vscode" in app_name or "visual studio code" in app_name:
            subprocess.Popen(["code"])
            return True
        if os.path.exists(app_name):
            os.startfile(app_name)
            return True
        return False
    except Exception as e:
        print(f"open_application error: {e}")
        return False


def close_application(app_name):
    app_name = app_name.lower()
    try:
        if platform.system() == "Windows":
            if "chrome" in app_name:
                os.system("taskkill /F /IM chrome.exe")
                return True
            if "vscode" in app_name or "code" in app_name:
                os.system("taskkill /F /IM Code.exe")
                return True
            os.system(f"taskkill /F /IM {app_name}")
            return True
        else:
            os.system(f"pkill -f {app_name}")
            return True
    except Exception as e:
        print(f"close_application error: {e}")
        return False


def perform_system_action(action):
    system = platform.system()
    try:
        if system == "Windows":
            if action == "shutdown":
                os.system("shutdown /s /t 10")
            elif action == "restart":
                os.system("shutdown /r /t 10")
            elif action == "sleep":
                os.system("rundll32.exe powrprof.dll,SetSuspendState 0,1,0")
            elif action == "lock":
                ctypes.windll.user32.LockWorkStation()
            else:
                return False
            return True
        return False
    except Exception as e:
        print(f"perform_system_action error: {e}")
        return False


def create_file(path):
    try:
        dir_name = os.path.dirname(path)
        if dir_name and not os.path.exists(dir_name):
            os.makedirs(dir_name)
        with open(path, "w", encoding="utf-8") as f:
            f.write("")
        return True
    except Exception as e:
        print(f"create_file error: {e}")
        return False


def delete_file(path):
    try:
        if os.path.exists(path):
            if os.path.isfile(path):
                os.remove(path)
            else:
                os.rmdir(path)
        return True
    except Exception as e:
        print(f"delete_file error: {e}")
        return False


def open_path(path):
    try:
        if os.path.exists(path):
            if platform.system() == "Windows":
                os.startfile(path)
            else:
                subprocess.Popen(["xdg-open", path])
            return True
        return False
    except Exception as e:
        print(f"open_path error: {e}")
        return False


def press_key(key):
    try:
        pyautogui.press(key)
        return True
    except Exception as e:
        print(f"press_key error: {e}")
        return False


def type_text(text):
    try:
        pyautogui.typewrite(text)
        return True
    except Exception as e:
        print(f"type_text error: {e}")
        return False


def move_mouse(x, y):
    try:
        pyautogui.moveTo(x, y)
        return True
    except Exception as e:
        print(f"move_mouse error: {e}")
        return False


def click_mouse():
    try:
        pyautogui.click()
        return True
    except Exception as e:
        print(f"click_mouse error: {e}")
        return False
