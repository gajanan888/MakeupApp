
import psycopg
conn = psycopg.connect('postgresql://postgres.otrhmajpdsfzcxbmxgle:Makeupapp123%40GOOGLE@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres')
cur = conn.cursor()
cur.execute('''
    SELECT p.occasion, p.outfit, p.makeup_style, p.image_url 
    FROM artist_portfolio_embeddings p 
    JOIN \"Artists\" a ON p.artist_id = a.id
    WHERE a.name = 'Rushali'
''')
for row in cur.fetchall():
    print(f'Occasion: {row[0]}, Outfit: {row[1]}, Makeup: {row[2]}, URL: {row[3]}')

