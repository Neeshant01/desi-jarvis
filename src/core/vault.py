import os
import base64
import json
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

class ConfigVault:
    def __init__(self, passphrase: str = None, salt: bytes = None):
        if passphrase is None:
            # Fallback/default passphrase for local dev if not supplied
            passphrase = os.getenv("JARVIS_MASTER_PASSPHRASE", "jarvis_default_secure_passphrase_2026")
        
        if salt is None:
            # Fixed salt for local convenience or loaded from file
            salt = os.getenv("JARVIS_SALT", "jarvis_system_salt").encode()
            if len(salt) < 16:
                salt = salt.ljust(16, b"0")[:16]

        # Derive a 256-bit key using PBKDF2
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100_000,
        )
        key = base64.urlsafe_b64encode(kdf.derive(passphrase.encode()))
        self.fernet = Fernet(key)
        
        # Path to local encrypted vault store
        root_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        self.vault_file = os.path.join(root_dir, ".vault.enc")
        self.encrypted_store = {}
        self.load_vault()

    def load_vault(self):
        """Loads encrypted keys from disk if the file exists."""
        if os.path.exists(self.vault_file):
            try:
                with open(self.vault_file, "r") as f:
                    self.encrypted_store = json.load(f)
            except Exception as e:
                print(f"Error loading config vault file: {e}")

    def save_vault(self):
        """Saves encrypted keys dictionary to disk."""
        try:
            with open(self.vault_file, "w") as f:
                json.dump(self.encrypted_store, f)
        except Exception as e:
            print(f"Error writing config vault file: {e}")

    def set(self, key_name: str, value: str):
        """Encrypts and stores a configuration key."""
        encrypted_val = self.fernet.encrypt(value.encode()).decode()
        self.encrypted_store[key_name] = encrypted_val
        self.save_vault()

    def get(self, key_name: str) -> str:
        """Decrypts and returns the key. Exposes decrypted value only on demand."""
        encrypted_val = self.encrypted_store.get(key_name)
        if not encrypted_val:
            # Fallback to system env vars if not set in vault
            env_val = os.getenv(key_name)
            if env_val:
                return env_val
            return ""
        
        try:
            decrypted_val = self.fernet.decrypt(encrypted_val.encode()).decode()
            return decrypted_val
        except Exception:
            return ""

# Initialize global vault instance
vault = ConfigVault()
