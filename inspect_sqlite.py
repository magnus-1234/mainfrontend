import sqlite3
try:
    conn = sqlite3.connect('h:\\Whiteout Survival Bot\\data\\music_states.db')
    c = conn.cursor()
    c.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = c.fetchall()
    print('Tables:', tables)
    for t in tables:
        c.execute(f'PRAGMA table_info({t[0]})')
        print(t[0], 'schema:', c.fetchall())
        c.execute(f'SELECT count(*) FROM {t[0]}')
        print(t[0], 'count:', c.fetchone()[0])
        c.execute(f'SELECT * FROM {t[0]} LIMIT 5')
        print(t[0], 'rows:', c.fetchall())
except Exception as e:
    print("Error:", e)
