
import asyncio
import cv2
from app.services.vision.look_analyzer_service import LookAnalyzerService

async def main():
    look_analyzer = LookAnalyzerService()
    img = cv2.imread('c:/Users/Lenovo/Documents/MakeupApp/apps/ai-backend/scratch/rushali_img.png')
    
    # download it first if we don't have it
    import urllib.request
    import numpy as np
    req = urllib.request.urlopen('https://res.cloudinary.com/djonmzyiu/image/upload/v1785500838/ymv8sdwvuaqsiz4j8tsz.png')
    arr = np.asarray(bytearray(req.read()), dtype=np.uint8)
    img = cv2.imdecode(arr, -1)
    
    res = await look_analyzer.analyze_image(img, use_gemini=True)
    print(res)

asyncio.run(main())

