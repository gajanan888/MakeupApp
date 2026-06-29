from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.core.config import Settings, get_settings
from app.db.session import get_db
from app.schemas.beauty_profile import BeautyProfile, BeautyProfileRequest
from app.schemas.makeup_recommendation import LookRecommendationResponse
from app.schemas.artist_recommendation import ArtistRecommendation
from app.services.vision.landmark_service import LandmarkService
from app.services.beauty.face_shape_service import FaceShapeService
from app.services.beauty.skin_tone_service import SkinToneService
from app.services.beauty.beauty_profile_service import BeautyProfileService
from app.services.beauty.makeup_recommendation_service import MakeupRecommendationService
from app.services.beauty.artist_recommendation_service import ArtistRecommendationService
from app.utils.image_io import read_upload_as_image

router = APIRouter(tags=["Recommendations - Phase 5"])


def get_landmark_service() -> LandmarkService:
    return LandmarkService()


def get_face_shape_service() -> FaceShapeService:
    return FaceShapeService()


def get_skin_tone_service() -> SkinToneService:
    return SkinToneService()


def get_beauty_profile_service() -> BeautyProfileService:
    return BeautyProfileService()


def get_makeup_recommendation_service() -> MakeupRecommendationService:
    return MakeupRecommendationService()


def get_artist_recommendation_service() -> ArtistRecommendationService:
    return ArtistRecommendationService()


@router.post(
    "/recommend/look",
    response_model=LookRecommendationResponse,
    summary="Generate Makeup Recommendations from Uploaded Face Image",
    response_description="Extracts landmarks, classifies shape/tone/undertone, builds profile, and matches customized looks.",
)
async def recommend_looks_from_image(
    file: UploadFile = File(...),
    settings: Settings = Depends(get_settings),
    db: Session = Depends(get_db),
    landmark_service: LandmarkService = Depends(get_landmark_service),
    face_shape_service: FaceShapeService = Depends(get_face_shape_service),
    skin_tone_service: SkinToneService = Depends(get_skin_tone_service),
    profile_service: BeautyProfileService = Depends(get_beauty_profile_service),
    recommend_service: MakeupRecommendationService = Depends(get_makeup_recommendation_service),
) -> LookRecommendationResponse:
    """
    Runs the complete recommendation pipeline:
    1. Upload image and detect face landmarks.
    2. Classify Face Shape.
    3. Analyze Skin Tone and Undertone.
    4. Compile Beauty Profile features (including horizontal symmetry calculation).
    5. Retrieve matching looks and personalize makeup shades/styles.
    """
    try:
        # 1. Read upload and convert to OpenCV numpy array
        image, _ = await read_upload_as_image(file, settings)

        # 2. Extract facial landmarks
        try:
            landmark_result = landmark_service.extract(image=image)
        except Exception:
            return LookRecommendationResponse(
                face_detected=False,
                message="No face detected",
            )

        if not landmark_result.face_detected or not landmark_result.landmarks:
            return LookRecommendationResponse(
                face_detected=False,
                message="No face detected",
            )

        # Use first face landmarks
        first_face = landmark_result.landmarks[0]

        # 3. Reject cropped faces
        if face_shape_service.is_face_cropped(
            first_face, landmark_result.image_width, landmark_result.image_height
        ):
            return LookRecommendationResponse(
                face_detected=False,
                message="No face detected",
            )

        face_for_classification = first_face
        if hasattr(landmark_result, "normalized_landmarks") and isinstance(landmark_result.normalized_landmarks, list) and landmark_result.normalized_landmarks:
            face_for_classification = landmark_result.normalized_landmarks[0]

        # 4. Classify Face Shape
        face_shape, face_shape_conf, measurements_dict = face_shape_service.classify(face_for_classification)
        from app.schemas.face_shape import FaceMeasurements
        measurements = FaceMeasurements(**measurements_dict)

        # 5. Classify Skin Tone & Undertone
        try:
            skin_result = skin_tone_service.analyze(image, first_face)
        except ValueError:
            return LookRecommendationResponse(
                face_detected=True,
                message="Unable to determine skin tone",
            )

        # 6. Generate Beauty Profile (including symmetry calculation using landmarks)
        profile = profile_service.generate_profile(
            face_shape=face_shape,
            skin_tone=skin_result["skin_tone"],
            undertone=skin_result["undertone"],
            measurements=measurements,
            landmarks=face_for_classification,
        )

        # 7. Generate matching looks and personalized product shades
        recommended_looks = recommend_service.get_recommendations(
            face_shape=face_shape,
            skin_tone=skin_result["skin_tone"],
            undertone=skin_result["undertone"],
            db=db,
        )

        return LookRecommendationResponse(
            face_detected=True,
            beauty_profile=profile,
            recommended_looks=recommended_looks,
        )
    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Look recommendation failed: {str(error)}",
        ) from error


@router.post(
    "/recommend/refine",
    response_model=LookRecommendationResponse,
    summary="Refine recommendations using modified profile selections",
)
def refine_recommendations(
    request: BeautyProfileRequest,
    db: Session = Depends(get_db),
    profile_service: BeautyProfileService = Depends(get_beauty_profile_service),
    recommend_service: MakeupRecommendationService = Depends(get_makeup_recommendation_service),
) -> LookRecommendationResponse:
    """
    Re-calculates recommendations and updates the Beauty Profile when a user manually
    overrides shape, skin tone, or undertone on the mobile frontend.
    """
    try:
        measurements = request.measurements
        if not measurements:
            from app.schemas.face_shape import FaceMeasurements
            measurements = FaceMeasurements(
                face_length=150.0,
                forehead_width=120.0,
                cheekbone_width=130.0,
                jaw_width=110.0,
                face_width_ratio=0.86,
                length_to_width_ratio=1.15,
                chin_angle=120.0,
                face_width=130.0,
                face_height=150.0,
            )
        profile = profile_service.generate_profile(
            face_shape=request.face_shape,
            skin_tone=request.skin_tone,
            undertone=request.undertone,
            measurements=measurements,
            landmarks=request.landmarks,
        )
        recommended_looks = recommend_service.get_recommendations(
            face_shape=request.face_shape,
            skin_tone=request.skin_tone,
            undertone=request.undertone,
            db=db,
        )
        return LookRecommendationResponse(
            face_detected=True,
            beauty_profile=profile,
            recommended_looks=recommended_looks,
        )
    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Recommendation refinement failed: {str(error)}",
        ) from error


@router.post(
    "/recommend/artists",
    response_model=list[ArtistRecommendation],
    summary="Recommend Top Matching Makeup Artists",
    response_description="Returns ranked makeup artists customized to match the provided beauty profile.",
)
def recommend_artists(
    profile: BeautyProfile,
    db: Session = Depends(get_db),
    artist_service: ArtistRecommendationService = Depends(get_artist_recommendation_service),
) -> list[ArtistRecommendation]:
    """
    Ranks makeup artists based on their specialized expertise matching the provided
    beauty profile attributes (skin tone and matching look styles).
    """
    return artist_service.get_recommendations(profile=profile, db=db)
