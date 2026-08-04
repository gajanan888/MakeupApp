
import psycopg
conn = psycopg.connect('postgresql://postgres.otrhmajpdsfzcxbmxgle:Makeupapp123%40GOOGLE@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres')
cur = conn.cursor()
cur.execute('''
    SELECT a.name, p.occasion, p.outfit, p.makeup_style, p.image_url 
    FROM artist_portfolio_embeddings p 
    JOIN \"Artists\" a ON p.artist_id = a.id
    WHERE a.name IN ('Raksha', 'Vedant', 'Rushali', 'Vaibhav Melgiri')
''')
for row in cur.fetchall():
    print(f'{row[0]}: Occasion: {row[1]}, Outfit: {row[2]}, Makeup: {row[3]}, URL: {row[3]}')

