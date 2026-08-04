
import psycopg
conn = psycopg.connect('postgresql://postgres.otrhmajpdsfzcxbmxgle:Makeupapp123%40GOOGLE@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres')
cur = conn.cursor()
cur.execute('SELECT id, artist_id, image_type, occasion, outfit FROM artist_portfolio_embeddings LIMIT 20')
for row in cur.fetchall():
    print(row)

