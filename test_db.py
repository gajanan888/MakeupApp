
import psycopg
conn = psycopg.connect('postgresql://postgres.otrhmajpdsfzcxbmxgle:Makeupapp123%40GOOGLE@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres')
cur = conn.cursor()
cur.execute('SELECT DISTINCT artist_id FROM artist_portfolio_embeddings')
e = [r[0] for r in cur.fetchall()]
cur.execute('SELECT id FROM "Artists"')
d = [r[0] for r in cur.fetchall()]
print('E:', e)
print('D:', d)
print('I:', set(e).intersection(set(d)))

