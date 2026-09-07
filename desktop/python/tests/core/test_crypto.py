import base64
import json
from pathlib import Path
from unittest.mock import patch

from repo_save_editor.core.crypto import decrypt_save, encrypt_save

VECTOR_PATH = Path(__file__).parents[4] / "compatibility" / "es3" / "known-vector.json"
COMPATIBILITY = json.loads(VECTOR_PATH.read_text(encoding="utf-8"))
COMPATIBILITY_DATA = COMPATIBILITY["plaintext"]
COMPATIBILITY_VECTOR = base64.b64decode(COMPATIBILITY["container_base64"])
COMPATIBILITY_IV = bytes.fromhex(COMPATIBILITY["iv_hex"])


def test_crypto_round_trip(sample_save):
    encrypted = encrypt_save(sample_save)

    assert len(encrypted) > 16
    assert (len(encrypted) - 16) % 16 == 0
    assert decrypt_save(encrypted) == sample_save


def test_known_es3_compatibility_vector():
    # Intentionally locks the compatibility password, PBKDF2 parameters, AES-CBC,
    # PKCS#7, IV handling, and serialized bytes against format drift.
    assert decrypt_save(COMPATIBILITY_VECTOR) == COMPATIBILITY_DATA

    with patch("repo_save_editor.core.crypto.os.urandom", return_value=COMPATIBILITY_IV):
        assert encrypt_save(COMPATIBILITY_DATA) == COMPATIBILITY_VECTOR
