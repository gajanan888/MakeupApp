import logging
import cv2
import numpy as np
from app.core.config import get_settings

logger = logging.getLogger(__name__)


class EmbeddingService:
    """Service to crop faces and extract deep visual embeddings using vision models (SigLIP, CLIP, DINOv2) with OpenCV fallback."""

    def __init__(self, model_name: str | None = None) -> None:
        settings = get_settings()
        self.model_name = model_name or settings.embedding_model_name
        self._processor = None
        self._model = None
        self._device = None
        self._failed_load = False

    def _load_model(self) -> None:
        """Lazy-loads the model and processor to save startup time and memory."""
        if self._model is not None or self._failed_load:
            return

        try:
            import torch
            from transformers import AutoProcessor, AutoModel, AutoImageProcessor

            self._device = "cuda" if torch.cuda.is_available() else "cpu"
            logger.info(f"Loading embedding model '{self.model_name}' on device '{self._device}'...")

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
                self._processor = AutoProcessor.from_pretrained(self.model_name)
                self._model = AutoModel.from_pretrained(self.model_name).to(self._device)

            self._model.eval()
            logger.info(f"Model '{self.model_name}' loaded successfully.")
        except Exception as e:
            logger.warning(f"Embedding model '{self.model_name}' unavailable ({str(e)}). Using OpenCV fallback feature extractor.")
            self._failed_load = True

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

    def _get_opencv_fallback_embedding(self, image: np.ndarray, dim: int = 768) -> list[float]:
        """
        Generates a 768-dim normalized embedding using OpenCV color & texture histograms
        when PyTorch/Transformers are unavailable.
        """
        if image is None or image.size == 0:
            vec = np.ones(dim, dtype=np.float32)
            return (vec / np.linalg.norm(vec)).tolist()

        resized = cv2.resize(image, (128, 128))
        hsv = cv2.cvtColor(resized, cv2.COLOR_BGR2HSV)
        
        h_hist = cv2.calcHist([hsv], [0], None, [256], [0, 256]).flatten()
        s_hist = cv2.calcHist([hsv], [1], None, [256], [0, 256]).flatten()
        v_hist = cv2.calcHist([hsv], [2], None, [256], [0, 256]).flatten()
        
        gray = cv2.cvtColor(resized, cv2.COLOR_BGR2GRAY)
        sobelx = cv2.Sobel(gray, cv2.CV_32F, 1, 0, ksize=3)
        sobely = cv2.Sobel(gray, cv2.CV_32F, 0, 1, ksize=3)
        mag = cv2.magnitude(sobelx, sobely)
        mag_hist = cv2.calcHist([mag], [0], None, [128], [0, 256]).flatten()
        
        concat = np.concatenate([h_hist, s_hist, v_hist, mag_hist]).astype(np.float32)
        if len(concat) < dim:
            concat = np.pad(concat, (0, dim - len(concat)))
        else:
            concat = concat[:dim]

        norm = np.linalg.norm(concat)
        if norm > 0:
            concat = concat / norm
        return concat.tolist()

    def get_embedding(self, image: np.ndarray) -> list[float]:
        """
        Extracts a normalized embedding vector from the provided image.
        """
        self._load_model()
        if self._failed_load or self._model is None:
            return self._get_opencv_fallback_embedding(image)

        try:
            import torch
            from PIL import Image

            rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            pil_image = Image.fromarray(rgb_image)

            inputs = self._processor(images=pil_image, return_tensors="pt").to(self._device)
            
            with torch.no_grad():
                if "siglip" in self.model_name.lower() or "clip" in self.model_name.lower():
                    features = self._model.get_image_features(**inputs)
                elif "dinov2" in self.model_name.lower():
                    outputs = self._model(**inputs)
                    features = outputs.last_hidden_state[:, 0, :]
                else:
                    outputs = self._model(**inputs)
                    if hasattr(outputs, "last_hidden_state"):
                        features = outputs.last_hidden_state.mean(dim=1)
                    else:
                        features = outputs.pooler_output

                if not isinstance(features, torch.Tensor):
                    if hasattr(features, "pooler_output") and features.pooler_output is not None:
                        features = features.pooler_output
                    elif hasattr(features, "last_hidden_state") and features.last_hidden_state is not None:
                        features = features.last_hidden_state[:, 0, :]
                    else:
                        raise ValueError(f"Could not extract tensor from model output: {type(features)}")

                features = features / features.norm(dim=-1, keepdim=True)
                embedding_vector = features[0].cpu().numpy().tolist()
                return embedding_vector
        except Exception as e:
            logger.warning(f"Failed to generate deep embedding ({str(e)}). Falling back to OpenCV feature embedding.")
            return self._get_opencv_fallback_embedding(image)
