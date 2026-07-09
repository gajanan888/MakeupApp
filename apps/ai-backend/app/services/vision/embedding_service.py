import logging
import cv2
import numpy as np
from app.core.config import get_settings

logger = logging.getLogger(__name__)


class EmbeddingService:
    """Service to crop faces and extract deep visual embeddings using vision models (SigLIP, CLIP, DINOv2)."""

    def __init__(self, model_name: str | None = None) -> None:
        settings = get_settings()
        self.model_name = model_name or settings.embedding_model_name
        self._processor = None
        self._model = None
        self._device = None

    def _load_model(self) -> None:
        """Lazy-loads the model and processor to save startup time and memory."""
        if self._model is not None:
            return

        # Local imports to delay loading heavy libraries
        import torch
        from transformers import AutoProcessor, AutoModel, AutoImageProcessor

        self._device = "cuda" if torch.cuda.is_available() else "cpu"
        logger.info(f"Loading embedding model '{self.model_name}' on device '{self._device}'...")

        try:
            if "siglip" in self.model_name.lower():
                self._processor = AutoProcessor.from_pretrained(self.model_name)
                self._model = AutoModel.from_pretrained(self.model_name).to(self._device)
            elif "clip" in self.model_name.lower():
                from transformers import CLIPProcessor, CLIPModel
                self._processor = CLIPProcessor.from_pretrained(self.model_name)
                self._model = CLIPModel.from_pretrained(self.model_name).to(self._device)
            elif "dinov2" in self.model_name.lower():
                self._processor = AutoImageProcessor.from_pretrained(self.model_name)
                self._model = AutoModel.from_pretrained(self.model_name).to(self._device)
            else:
                # General fallback
                self._processor = AutoProcessor.from_pretrained(self.model_name)
                self._model = AutoModel.from_pretrained(self.model_name).to(self._device)

            self._model.eval()
            logger.info(f"Model '{self.model_name}' loaded successfully.")
        except Exception as e:
            logger.error(f"Failed to load embedding model '{self.model_name}': {str(e)}")
            raise RuntimeError(f"Could not initialize embedding model: {str(e)}") from e

    def crop_face(self, image: np.ndarray, bbox) -> np.ndarray:
        """
        Crops the facial area from the image based on a bounding box.
        Adds a small 5% margin to capture surrounding makeup regions while avoiding background.
        """
        h, w = image.shape[:2]
        x, y, bw, bh = bbox.x, bbox.y, bbox.width, bbox.height

        margin_x = int(bw * 0.05)
        margin_y = int(bh * 0.05)

        x1 = max(0, x - margin_x)
        y1 = max(0, y - margin_y)
        x2 = min(w, x + bw + margin_x)
        y2 = min(h, y + bh + margin_y)

        cropped = image[y1:y2, x1:x2]
        return cropped

    def get_embedding(self, image: np.ndarray) -> list[float]:
        """
        Extracts a normalized embedding vector from the provided image.
        """
        self._load_model()
        import torch
        from PIL import Image

        # Convert OpenCV BGR image to PIL RGB Image
        rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        pil_image = Image.fromarray(rgb_image)

        try:
            inputs = self._processor(images=pil_image, return_tensors="pt").to(self._device)
            
            with torch.no_grad():
                if "siglip" in self.model_name.lower() or "clip" in self.model_name.lower():
                    # Vision-Language models have get_image_features method
                    features = self._model.get_image_features(**inputs)
                elif "dinov2" in self.model_name.lower():
                    # DINOv2 returns last_hidden_state, where index 0 is the CLS token
                    outputs = self._model(**inputs)
                    features = outputs.last_hidden_state[:, 0, :]
                else:
                    # Generic fallback: mean pooling of token embeddings
                    outputs = self._model(**inputs)
                    if hasattr(outputs, "last_hidden_state"):
                        features = outputs.last_hidden_state.mean(dim=1)
                    else:
                        features = outputs.pooler_output

                # If features is a dict-like or BaseModelOutput, extract the tensor
                if not isinstance(features, torch.Tensor):
                    if hasattr(features, "pooler_output") and features.pooler_output is not None:
                        features = features.pooler_output
                    elif hasattr(features, "last_hidden_state") and features.last_hidden_state is not None:
                        features = features.last_hidden_state[:, 0, :]
                    else:
                        raise ValueError(f"Could not extract tensor from model output: {type(features)}")

                # L2 normalize the embedding vector
                features = features / features.norm(dim=-1, keepdim=True)
                
                # Convert tensor to flat list of floats
                embedding_vector = features[0].cpu().numpy().tolist()
                return embedding_vector
        except Exception as e:
            logger.error(f"Failed to generate embedding: {str(e)}")
            raise RuntimeError(f"Embedding generation failed: {str(e)}") from e
