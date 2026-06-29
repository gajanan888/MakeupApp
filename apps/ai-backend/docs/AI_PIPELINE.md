# AI Beauty Recommendation Backend

## Target Pipeline

1. Phase 1: Face detection with MediaPipe Face Detection. Implemented.
2. Phase 2: Face landmark extraction with MediaPipe Face Mesh. Implemented.
3. Phase 3: Face shape classification from landmark ratios.
4. Phase 4: Skin tone detection from stable cheek and forehead regions.
5. Phase 5: Undertone detection from LAB/HSV skin color statistics.
6. Phase 6: Beauty profile generation from all vision signals.
7. Phase 7: Personalized makeup recommendation generation.
8. Phase 8: Virtual makeup rendering with OpenCV masks and landmarks.
9. Phase 9: Makeup artist recommendation using budget, preferences, and specialization.

## Project Structure

```text
app/
  api/v1/endpoints/        FastAPI routers by feature
  core/                    Settings and error mapping
  db/                      PostgreSQL session setup
  models/                  SQLAlchemy models
  schemas/                 Pydantic request and response models
  services/
    vision/                Face detection, landmarks, virtual makeup
    beauty/                Face shape, skin tone, beauty profile
    recommendation/        Makeup and artist recommendations
  utils/                   Image parsing and file helpers
```

## Phase 1 Implementation

`FaceDetectionService` accepts a decoded OpenCV BGR image, converts it to RGB, runs MediaPipe Face Detection, and returns:

- whether a face was detected
- number of faces
- image dimensions
- bounding boxes in pixel coordinates
- confidence score per face
- saved upload path

## Phase 2 Implementation

`LandmarkService` accepts a decoded OpenCV BGR image, converts it to RGB, runs MediaPipe Face Mesh, and returns:

- whether landmarks were extracted
- number of detected faces
- all Face Mesh landmarks for each face
- normalized and pixel coordinates
- grouped semantic regions for downstream phases

Current grouped regions:

- jawline
- left eye
- right eye
- left eyebrow
- right eyebrow
- outer lips
- inner lips
- nose
- left cheek
- right cheek
- forehead

## API Examples

Health check:

```powershell
Invoke-WebRequest -Uri http://127.0.0.1:8000/api/v1/ -UseBasicParsing
```

Face detection:

```powershell
curl.exe -X POST http://127.0.0.1:8000/api/v1/vision/detect-face `
  -F "file=@uploads/photo.jpeg"
```

Landmark extraction:

```powershell
curl.exe -X POST http://127.0.0.1:8000/api/v1/vision/extract-landmarks `
  -F "file=@uploads/photo.jpeg"
```

Legacy-compatible face detection:

```powershell
curl.exe -X POST http://127.0.0.1:8000/vision/detect-face `
  -F "file=@uploads/photo.jpeg"
```

## Testing Strategy

- Unit tests: image decoding, size/type validation, bounding box conversion.
- Service tests: run face detection on known positive and negative fixtures.
- API tests: upload success, unsupported type, oversized image, invalid image bytes.
- Integration tests: database-backed recommendation phases when PostgreSQL models are added.
