
import psycopg
conn = psycopg.connect('postgresql://postgres.otrhmajpdsfzcxbmxgle:Makeupapp123%40GOOGLE@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres')
cur = conn.cursor()
cur.execute('''
    SELECT a.name, p.image_url, p.occasion, p.outfit, p.makeup_style, p.jewelry 
    FROM artist_portfolio_embeddings p 
    JOIN \"Artists\" a ON p.artist_id = a.id
    WHERE p.image_type = 'after'
''')
for row in cur.fetchall():
    print(f'Artist: {row[0]}, Occasion: {row[2]}, Outfit: {row[3]}')
    print(f'  Makeup: {row[4]}')
    print(f'  URL: {row[1]}')
    print('-'*40)

