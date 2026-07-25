import torch
import cv2
import numpy as np
import logging
from transformers import AutoProcessor, AutoModel
from PIL import Image

logger = logging.getLogger(__name__)


class SigLIPEncoder:
    """
    Singleton service wrapper for Google's SigLIP image embedding model.
    Loads model/processor once and reuses them across requests.
    """
    def __init__(self) -> None:
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.model_name = "google/siglip-base-patch16-224"
        self.processor = None
        self.model = None

    def load_model(self) -> None:
        """Loads SigLIP model and processor into memory if not already loaded."""
        if self.model is None or self.processor is None:
            logger.info(f"Loading SigLIP model '{self.model_name}' on {self.device}...")
            self.processor = AutoProcessor.from_pretrained(self.model_name)
            self.model = AutoModel.from_pretrained(self.model_name).to(self.device)
            self.model.eval()
            logger.info("SigLIP model loaded successfully.")

    def get_image_embedding(self, image_np: np.ndarray) -> list[float]:
        """
        Generates a normalized 768-dimensional embedding list for a BGR numpy image.
        """
        self.load_model()
        
        # 1. Convert BGR to RGB
        image_rgb = cv2.cvtColor(image_np, cv2.COLOR_BGR2RGB)
        
        # 2. Convert to PIL Image
        pil_image = Image.fromarray(image_rgb)
        
        # 3. Process image and feed to SigLIP
        inputs = self.processor(images=pil_image, return_tensors="pt").to(self.device)
        
        with torch.no_grad():
            output = self.model.get_image_features(**inputs)
            
            # Extract pooler_output tensor from the BaseModelOutputWithPooling wrapper
            image_features = output.pooler_output
            
            # 4. Normalize the embedding to unit sphere (L2 norm)
            image_features = image_features / image_features.norm(p=2, dim=-1, keepdim=True)
            
            # 5. Extract to list
            embedding = image_features.cpu().numpy()[0].tolist()
            
        return embedding


# SigLIP singleton instance
siglip_encoder = SigLIPEncoder()
