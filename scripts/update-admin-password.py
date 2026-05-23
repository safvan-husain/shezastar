#!/usr/bin/env python3
"""Update a ShezaStar admin password using the same scrypt settings as lib/auth/admin-auth-core.ts."""

from __future__ import annotations

import argparse
import os
import secrets
from datetime import datetime, timezone
from pathlib import Path

import scrypt
from pymongo import MongoClient


def load_env_file(path: Path) -> None:
    if not path.exists():
        return

    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue

        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip()

        if (
            (value.startswith('"') and value.endswith('"'))
            or (value.startswith("'") and value.endswith("'"))
        ):
            value = value[1:-1]

        os.environ.setdefault(key, value)


def hash_admin_password(password: str, salt: str) -> str:
    # Matches Node crypto.scryptSync(password, salt, 64) defaults: N=16384, r=8, p=1
    derived = scrypt.hash(
        password.encode("utf-8"),
        salt.encode("utf-8"),
        N=2**14,
        r=8,
        p=1,
        buflen=64,
    )
    return derived.hex()


def main() -> None:
    parser = argparse.ArgumentParser(description="Update ShezaStar admin password in MongoDB")
    parser.add_argument("password", help="New admin password")
    parser.add_argument(
        "--email",
        help="Admin email to update (defaults to ADMIN_EMAIL env, else first super_admin, else first admin)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Show which admin would be updated without writing to MongoDB",
    )
    args = parser.parse_args()

    root = Path(__file__).resolve().parents[1]
    load_env_file(root / ".env.production")
    load_env_file(root / ".env")

    mongo_uri = os.environ.get("MONGODB_URI")
    if not mongo_uri:
        raise SystemExit("MONGODB_URI is not set in .env.production or .env")

    db_name = os.environ.get("DB_NAME", "shezastar")
    target_email = (args.email or os.environ.get("ADMIN_EMAIL") or "").strip().lower()

    client = MongoClient(mongo_uri)
    collection = client[db_name]["admins"]

    admin = None
    if target_email:
        admin = collection.find_one({"email": target_email})

    if admin is None:
        admin = collection.find_one({"role": "super_admin"}, sort=[("createdAt", 1)])

    if admin is None:
        admin = collection.find_one({}, sort=[("createdAt", 1)])

    if admin is None:
        raise SystemExit("No admin account found in the admins collection")

    salt = secrets.token_hex(16)
    password_hash = hash_admin_password(args.password, salt)

    label = admin.get("email") or admin.get("displayName") or str(admin["_id"])
    print(f"Target admin: {label} (role={admin.get('role', 'unknown')})")

    if args.dry_run:
        print("Dry run only. No database changes were made.")
        return

    result = collection.update_one(
        {"_id": admin["_id"]},
        {
            "$set": {
                "passwordHash": password_hash,
                "salt": salt,
                "updatedAt": datetime.now(timezone.utc),
            }
        },
    )

    if result.modified_count != 1:
        raise SystemExit("Password update did not modify any documents")

    print("Admin password updated successfully.")


if __name__ == "__main__":
    main()
