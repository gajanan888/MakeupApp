import torch
from transformers import AutoProcessor, AutoModel, SiglipVisionModel, SiglipModel
from PIL import Image
import numpy as np

def check():
    processor = AutoProcessor.from_pretrained("google/siglip-base-patch16-224")
    
    # 1. Test with AutoModel
    model_auto = AutoModel.from_pretrained("google/siglip-base-patch16-224")
    print("AutoModel type:", type(model_auto))
    
    # Generate dummy image
    dummy_img = Image.fromarray(np.zeros((224, 224, 3), dtype=np.uint8))
    inputs = processor(images=dummy_img, return_tensors="pt")
    
    with torch.no_grad():
        out_auto = model_auto.get_image_features(**inputs)
        print("AutoModel get_image_features type:", type(out_auto))
        if hasattr(out_auto, "pooler_output"):
            print("AutoModel has pooler_output, shape:", out_auto.pooler_output.shape)
            
        # 2. Test with SiglipVisionModel
        model_vision = SiglipVisionModel.from_pretrained("google/siglip-base-patch16-224")
        out_vision = model_vision(**inputs)
        print("SiglipVisionModel output type:", type(out_vision))
        print("SiglipVisionModel pooler_output shape:", out_vision.pooler_output.shape)
        
        # 3. Test with SiglipModel
        model_siglip = SiglipModel.from_pretrained("google/siglip-base-patch16-224")
        out_siglip_features = model_siglip.get_image_features(**inputs)
        print("SiglipModel get_image_features type:", type(out_siglip_features))
        print("SiglipModel get_image_features shape:", out_siglip_features.shape)

if __name__ == "__main__":
    check()
