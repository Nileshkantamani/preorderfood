import sqlite3

DB_PATH = "preorderfood.db"

conn = sqlite3.connect(DB_PATH)
cur = conn.cursor()

cur.execute("PRAGMA table_info(users);")
cols = [row[1] for row in cur.fetchall()]
print("Existing columns:", cols)

if "is_verified" not in cols:
    print("Adding is_verified column to users table...")
    cur.execute("ALTER TABLE users ADD COLUMN is_verified BOOLEAN NOT NULL DEFAULT 1;")
    conn.commit()
    print("Column added.")
else:
    print("Column is_verified already exists; no change made.")

conn.close()
