import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).with_name("preorderfood.db")


def main() -> None:
    if not DB_PATH.exists():
        print(f"Database not found at {DB_PATH}")
        return

    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    # Check existing columns on restaurants table
    cur.execute("PRAGMA table_info(restaurants);")
    cols = [row[1] for row in cur.fetchall()]
    if "is_visible" in cols:
        print("Column 'is_visible' already exists on restaurants table. Nothing to do.")
        conn.close()
        return

    print("Adding 'is_visible' column to restaurants table...")
    cur.execute(
        "ALTER TABLE restaurants ADD COLUMN is_visible INTEGER NOT NULL DEFAULT 1;"
    )
    conn.commit()
    conn.close()
    print("Done.")


if __name__ == "__main__":
    main()
