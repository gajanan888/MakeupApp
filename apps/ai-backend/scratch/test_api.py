import httpx
import asyncio

async def run_test_flow():
    # Use the latest analyzed selfie ID from the DB
    # We will query it first from the database
    from app.db.session import SessionLocal
    from app.models.virtual_preview import SelfieModel, FaceAnalysisModel
    
    db = SessionLocal()
    latest = db.query(SelfieModel).join(FaceAnalysisModel).order_by(SelfieModel.created_at.desc()).first()
    db.close()
    
    if not latest:
        print("Error: No analyzed selfies in DB to test API.")
        return
        
    selfie_id = str(latest.id)
    print(f"Testing API flow with Selfie ID: {selfie_id}")
    
    client = httpx.AsyncClient(timeout=30.0)
    
    # 1. Test /submit-preferences
    pref_payload = {
        "selfie_id": selfie_id,
        "preferences": {
            "event": "Wedding",
            "location": "Indoor",
            "time": "Evening",
            "outfit": "Western Dress",
            "outfit_color": "Black",
            "style": "Soft Glam",
            "boldness": "3 = Medium",
            "accessories": "None",
            "hair_type": "Curly",
            "hair_length": "Long"
        }
    }
    
    print("\n--- Sending POST /submit-preferences ---")
    try:
        r1 = await client.post("http://localhost:8000/api/v1/virtual-preview/submit-preferences", json=pref_payload)
        print(f"Status Code: {r1.status_code}")
        print("Response:", r1.text)
        if r1.status_code != 200:
            return
        chat_session_id = r1.json().get("chat_session_id")
    except Exception as e:
        print("Request failed:", str(e))
        return

    # 2. Test /generate-prompt
    print("\n--- Sending POST /generate-prompt ---")
    try:
        r2 = await client.post("http://localhost:8000/api/v1/virtual-preview/generate-prompt", json={
            "chat_session_id": chat_session_id
        })
        print(f"Status Code: {r2.status_code}")
        print("Response:", r2.text)
        if r2.status_code != 200:
            return
        prompt = r2.json().get("prompt")
    except Exception as e:
        print("Request failed:", str(e))
        return

    # 3. Test /generate-preview
    print("\n--- Sending POST /generate-preview ---")
    try:
        r3 = await client.post("http://localhost:8000/api/v1/virtual-preview/generate-preview", json={
            "selfie_id": selfie_id,
            "prompt": prompt,
            "chat_session_id": chat_session_id
        })
        print(f"Status Code: {r3.status_code}")
        print("Response:", r3.text[:1000]) # Truncate if long
    except Exception as e:
        print("Request failed:", str(e))
        return

if __name__ == "__main__":
    asyncio.run(run_test_flow())
