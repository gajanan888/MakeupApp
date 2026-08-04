import asyncio
from app.db.session import SessionLocal
from app.models.virtual_preview import SelfieModel, FaceAnalysisModel, ChatSessionModel
from app.generation.service import ImageGenerationService

async def main():
    db = SessionLocal()
    # Query analyzed selfies
    analyzed_selfies = db.query(SelfieModel).join(
        FaceAnalysisModel, SelfieModel.id == FaceAnalysisModel.selfie_id
    ).order_by(SelfieModel.created_at.desc()).all()
    
    if not analyzed_selfies:
        print("No analyzed selfies found!")
        return
        
    latest_selfie = analyzed_selfies[0]
    print(f"Testing with Selfie ID: {latest_selfie.id}")
    
    # Check if there is an old entry too
    old_selfies = [s for s in analyzed_selfies if isinstance(db.query(FaceAnalysisModel).filter(FaceAnalysisModel.selfie_id == s.id).first().landmarks, dict) and "landmarks_stub" in db.query(FaceAnalysisModel).filter(FaceAnalysisModel.selfie_id == s.id).first().landmarks]
    
    test_selfies = [latest_selfie]
    if old_selfies:
        test_selfies.append(old_selfies[0])
        
    for s_item in test_selfies:
        analysis = db.query(FaceAnalysisModel).filter(FaceAnalysisModel.selfie_id == s_item.id).first()
        print(f"Selfie: {s_item.id}, Schema keys: {list(analysis.landmarks.keys()) if isinstance(analysis.landmarks, dict) else 'list'}")
        
        masks = {
            "lip": analysis.lip_mask_path,
            "eye": analysis.eye_mask_path,
            "eyebrow": analysis.eyebrow_mask_path,
            "hair": analysis.hair_mask_path,
            "skin": analysis.skin_mask_path,
            "cheek": analysis.cheek_mask_path,
            "forehead": analysis.forehead_mask_path,
            "jawline": analysis.jawline_mask_path,
        }
        
        # Build dummy session preferences
        prefs = {
            "event": "Wedding",
            "location": "Indoor",
            "time": "Evening",
            "outfit": "Western Dress",
            "outfit_color": "Black",
            "style": "Soft Glam",
            "boldness": "3 = Medium",
            "accessories": "None",
            "hair_type": "Curly",
            "hair_length": "Long",
            "foundation": "Natural Beige",
            "lipstick": "Vibrant Rosewood",
            "blush": "Dusty Rose / Rose-Pink",
            "eye_makeup": "Shimmering Gold & Bronze",
            "contour": "Medium",
            "highlight": "Dewy"
        }
        
        generator = ImageGenerationService()
        try:
            print(f"Starting generate_makeup_preview for selfie {s_item.id}...")
            url, score = await generator.generate_makeup_preview(
                s_item, "Dummy Prompt", masks, prefs
            )
            print("SUCCESS! Output URL:", url, "Score:", score)
        except Exception as e:
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
