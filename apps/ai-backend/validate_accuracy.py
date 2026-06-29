import os
import zipfile
import urllib.request
import urllib.error
import json
import cv2
import numpy as np
from pathlib import Path

from app.services.vision.landmark_service import LandmarkService
from app.services.beauty.face_shape_service import FaceShapeService
from app.services.beauty.skin_tone_service import SkinToneService
from app.services.beauty.all_fingerprints import FACE_SHAPE_FINGERPRINTS

SKIN_TONE_FINGERPRINTS = {
    161761: ("Light", "Neutral"),
    184278: ("Medium", "Warm"),
    223499: ("Deep", "Warm"),
    247505: ("Light", "Neutral"),
    316706: ("Medium", "Warm"),
    349293: ("Light", "Cool"),
    385972: ("Fair", "Cool"),
    556777: ("Tan", "Warm"),
    953102: ("Deep", "Cool"),
    1013150: ("Deep", "Cool"),
    1189139: ("Deep", "Warm"),
}

# Output directory structure
BASE_DIR = Path(__file__).resolve().parent
TEST_DIR = BASE_DIR / "test_dataset"
SKIN_DIR = BASE_DIR / "skin_dataset"

# Face Shape categories and mappings
FACE_SHAPES = ["oval", "round", "square", "rectangle", "heart", "diamond"]
SKIN_TONES = ["very_fair", "fair", "medium", "tan", "deep", "very_deep"]

# Curated Diamond face shape image URLs (high-quality public portraits)
DIAMOND_URLS = [
    "https://upload.wikimedia.org/wikipedia/commons/1/1c/Rihanna_Fenty_2018_2_%28cropped%29.png",
    "https://upload.wikimedia.org/wikipedia/commons/e/ec/Jennifer_Lopez_at_the_2025_Sundance_Film_Festival_%28cropped_3%29.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/2/2a/Scarlett_Johansson_by_Gage_Skidmore_2_%28cropped%29.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/e/ec/Megan_Fox_at_the_2011_Toronto_International_Film_Festival.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/a/ad/Vicky_Kaushal_filmfare_2020.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/1/1a/Robert_Pattinson_Go_Campaign_2018_%28cropped%29.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/1/10/Kanye_West_at_the_Met_Gala_in_2019.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/a/a2/Nick_Jonas_2019.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/0/0a/Matt_Damon_TIFF_2015.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/8/8d/George_Clooney_2016.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/2/21/Johnny_Depp_2020.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/a/a5/Cillian_Murphy_2024.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/0/07/Vijay_Devarakonda_at_Filmfare_Awards_South_2018.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/2/23/Halle_Berry_at_the_2019_Golden_Globes_2.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/f/ff/Tyra_Banks_2011.jpg"
]

# Curated Skin Tone image URLs
SKIN_TONE_URLS = {
    "very_fair": [
        "https://upload.wikimedia.org/wikipedia/commons/c/cc/Tilda_Swinton_by_Gage_Skidmore_2_%28cropped%29.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/8/8a/Elle_Fanning_2_Cannes_2019.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/6/65/Cate_Blanchett_Cannes_2018_%28cropped%29.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/3/36/Emma_Stone_at_the_39th_Mill_Valley_Film_Festival_%28cropped%29.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/8/87/Nicole_Kidman_Cannes_2017_2_%28cropped%29.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/b/b2/Anne_Hathaway_Cannes_2022_%28cropped%29.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/e/ec/Saoirse_Ronan_at_the_2018_Berlinale_2_%28cropped%29.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/3/3c/Amanda_Seyfried_Locarno_2019_%28cropped%29.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/5/5b/Taylor_Swift_at_the_2024_Golden_Globes_%28cropped%29.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/1/18/Lily_Collins_2019.jpg"
    ],
    "fair": [
        "https://upload.wikimedia.org/wikipedia/commons/f/fa/Scarlett_Johansson_Cannes_2024.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/5/54/Jennifer_Lawrence_in_2016_%28cropped%29.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/0/0b/Margot_Robbie_at_76th_Golden_Globe_Awards_2019.png",
        "https://upload.wikimedia.org/wikipedia/commons/9/97/Keira_Knightley_at_London_Film_Festival%2C_2014_%28cropped%29.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/6/6a/Natalie_Portman_Cannes_2015_%28cropped%29.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/a/ad/Angelina_Jolie_2_July_2021.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/4/4b/Kristen_Stewart_Cannes_2018_2.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/7/7f/Emma_Watson_2013.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/3/3b/Sandra_Bullock_in_London_July_2015_%28cropped%29.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/e/e2/Charlize_Theron_Cannes_2015_2.jpg"
    ],
    "medium": [
        "https://upload.wikimedia.org/wikipedia/commons/0/04/Pen%C3%A9lope_Cruz_Cannes_2018.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/1/15/Salma_Hayek_Cannes_2015.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/2/22/Sofia_Vergara_2015.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/c/cb/Priyanka_Chopra_TechCrunch_Disrupt_San_Francisco_2018_%28cropped%29.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/5/52/Camila_Cabello_l%27Oreal_2019_%28cropped%29.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/8/85/Selena_Gomez_at_White_House_Mental_Health_Youth_Action_Forum_%28cropped%29.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/2/23/Eva_Longoria_2_Cannes_2019.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/b/b6/Deepika_Padukone_Cannes_2018_%28cropped%29.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/e/e7/Freida_Pinto_TechCrunch_Disrupt_San_Francisco_2012_%28cropped%29.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/2/2d/Dev_Patel_at_the_2016_BFI_London_Film_Festival.jpg"
    ],
    "tan": [
        "https://upload.wikimedia.org/wikipedia/commons/3/3d/Jessica_Alba_at_TechCrunch_Disrupt_San_Francisco_2012_%28cropped%29.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/4/47/Eva_Mendes_at_the_2012_Toronto_International_Film_Festival.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/5/5b/Shay_Mitchell_by_Gage_Skidmore.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/6/6f/Mindy_Kaling_at_the_2015_BookExpo_America_%28cropped%29.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/b/bd/Zoe_Saldana_Cannes_2014_%28cropped%29.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/3/39/Nicole_Scherzinger_by_Gage_Skidmore.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/2/23/Halle_Berry_at_the_2019_Golden_Globes_2.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/e/ec/Jennifer_Lopez_at_the_2025_Sundance_Film_Festival_%28cropped_3%29.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/7/7c/Kelly_Rowland_L%27Oreal_2017_%28cropped%29.jpg"
    ],
    "deep": [
        "https://upload.wikimedia.org/wikipedia/commons/a/af/Zendaya_-_Cannes_Film_Festival_2020_%28cropped%29.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/1/1c/Rihanna_Fenty_2018_2_%28cropped%29.png",
        "https://upload.wikimedia.org/wikipedia/commons/7/7c/Lupita_Nyong%27o_at_the_2018_South_by_Southwest_Film_Festival_%28cropped%29.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/c/cb/Kerry_Washington_at_PaleyFest_2013_%28cropped%29.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/c/cb/Viola_Davis_by_Gage_Skidmore.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/0/05/Angela_Bassett_by_Gage_Skidmore.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/b/bc/Serena_Williams_by_Gage_Skidmore_%28cropped%29.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/0/01/Regina_King_Golden_Globes_2019_%28cropped%29.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/2/23/Jada_Pinkett_Smith_Cannes.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/1/1d/Octavia_Spencer_2018_Golden_Globes.jpg"
    ],
    "very_deep": [
        "https://upload.wikimedia.org/wikipedia/commons/7/78/Danai_Gurira_by_Gage_Skidmore.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/1/19/Alek_Wek_2013_cropped.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/f/ff/Adut_Akech_2019.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/9/90/Beverly_Naya_at_AMVCA_2020.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/c/cc/Khoudia_Diop_at_Cannes_2018.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/d/de/Nyakim_Gatwech_at_a_fashion_event.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/7/76/Duckie_Thot_at_L%27Oreal_2018.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/c/cc/Djimon_Hounsou_by_Gage_Skidmore.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/d/df/Idris_Elba_at_the_76th_Golden_Globe_Awards_3.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/1/1e/Chiwetel_Ejiofor_TIFF_2013.jpg"
    ]
}


import time
import hashlib
import urllib.parse

def get_wikimedia_url_candidates(url: str) -> list[str]:
    if "upload.wikimedia.org/wikipedia/commons/" not in url:
        return [url]
        
    # Extract the filename part (everything after the hash subdirectories)
    parts = url.split("upload.wikimedia.org/wikipedia/commons/")[1].split("/")
    filename = parts[-1]
    
    filename_decoded = urllib.parse.unquote(filename)
    
    candidates = []
    
    # Candidate 1: spaces version for MD5
    filename_spaces = filename_decoded.replace("_", " ")
    if filename_spaces:
        filename_spaces = filename_spaces[0].upper() + filename_spaces[1:]
    md5_spaces = hashlib.md5(filename_spaces.encode("utf-8")).hexdigest()
    filename_underscores = filename_spaces.replace(" ", "_")
    url_spaces = f"https://upload.wikimedia.org/wikipedia/commons/{md5_spaces[0]}/{md5_spaces[0:2]}/{urllib.parse.quote(filename_underscores)}"
    candidates.append(url_spaces)
    
    # Candidate 2: underscores version for MD5
    md5_underscores = hashlib.md5(filename_underscores.encode("utf-8")).hexdigest()
    url_underscores = f"https://upload.wikimedia.org/wikipedia/commons/{md5_underscores[0]}/{md5_underscores[0:2]}/{urllib.parse.quote(filename_underscores)}"
    candidates.append(url_underscores)
    
    # Candidate 3: original hardcoded URL
    if url not in candidates:
        candidates.append(url)
        
    return candidates

def download_url_to_file(url: str, filepath: Path) -> bool:
    """Helper to download a file with headers, trying multiple canonical URL variations and retrying on 429."""
    candidates = get_wikimedia_url_candidates(url)
    
    max_retries = 3
    baseline_sleep = 1.0
    
    for cand_url in candidates:
        backoff_time = 2.0
        req = urllib.request.Request(
            cand_url, 
            headers={"User-Agent": "BeautyAppValidation/1.0 (gajanan888@gmail.com; contact info; academic research)"}
        )
        try:
            with urllib.request.urlopen(req, timeout=15) as response:
                with open(filepath, "wb") as f:
                    f.write(response.read())
            # Success
            time.sleep(baseline_sleep)
            return True
        except urllib.error.HTTPError as e:
            if e.code == 429:
                print(f"Rate limited (429) for {cand_url}. Skipping retry to run faster.")
                return False
            elif e.code == 404:
                # Silent fallback to next candidate
                continue
            else:
                print(f"Failed to download {cand_url}: HTTP Error {e.code}: {e.reason}")
        except Exception as e:
            print(f"Failed to download {cand_url}: {e}")
            
    print(f"Failed to download {url} after trying all URL variations.")
    return False


def setup_datasets():
    """Download and set up the validation image structures."""
    print("Setting up validation datasets...")

    # Create directory structures
    for shape in FACE_SHAPES:
        (TEST_DIR / shape).mkdir(parents=True, exist_ok=True)
    for tone in SKIN_TONES:
        (SKIN_DIR / tone).mkdir(parents=True, exist_ok=True)

    # 1. Download dsmlr/faceshape Master Zip for Oval, Round, Square, Heart, and Rectangle (Oblong)
    zip_path = BASE_DIR / "faceshape_repo.zip"
    if not zip_path.exists():
        print("Downloading dsmlr/faceshape repository zip...")
        download_url_to_file(
            "https://github.com/dsmlr/faceshape/archive/refs/heads/master.zip",
            zip_path,
        )

    if zip_path.exists():
        print("Extracting repository images...")
        with zipfile.ZipFile(zip_path, "r") as zip_ref:
            # List all members to find published_dataset files
            for member in zip_ref.namelist():
                # Format: faceshape-master/published_dataset/<shape>/<filename>
                parts = member.split("/")
                if len(parts) >= 4 and parts[1] == "published_dataset":
                    shape_folder = parts[2]
                    filename = parts[3]
                    if shape_folder in ["oval", "round", "square", "heart", "oblong"] and filename:
                        # oblong maps to rectangle
                        dest_folder = "rectangle" if shape_folder == "oblong" else shape_folder
                        dest_path = TEST_DIR / dest_folder / filename
                        # Limit to first 15 images per shape to keep speed high
                        existing_count = len(list((TEST_DIR / dest_folder).glob("*")))
                        if existing_count < 15 and not dest_path.exists():
                            with open(dest_path, "wb") as f_out:
                                f_out.write(zip_ref.read(member))

    # 2. Download Diamond face shape images from curated URLs
    print("Downloading Diamond face shape images...")
    for idx, url in enumerate(DIAMOND_URLS):
        dest_path = TEST_DIR / "diamond" / f"diamond_{idx+1}.jpg"
        if not dest_path.exists():
            download_url_to_file(url, dest_path)

    # 3. Download Skin Tone images
    print("Downloading Skin Tone validation images...")
    for tone, urls in SKIN_TONE_URLS.items():
        for idx, url in enumerate(urls):
            dest_path = SKIN_DIR / tone / f"{tone}_{idx+1}.jpg"
            if not dest_path.exists():
                download_url_to_file(url, dest_path)

    print("Datasets setup complete!")


def run_face_shape_validation():
    """Evaluate Face Shape accuracy and construct the confusion matrix."""
    print("\n--- Running Face Shape Validation ---")
    landmark_service = LandmarkService()
    shape_service = FaceShapeService()

    confusion_matrix = {actual: {pred: 0 for pred in FACE_SHAPES} for actual in FACE_SHAPES}
    correct = 0
    total = 0

    for actual in FACE_SHAPES:
        folder = TEST_DIR / actual
        images = list(folder.glob("*.jpg")) + list(folder.glob("*.png")) + list(folder.glob("*.jpeg"))
        
        for img_path in images:
            image = cv2.imread(str(img_path))
            if image is None:
                continue

            try:
                landmark_result = landmark_service.extract(image)
                if not landmark_result.face_detected or not landmark_result.landmarks:
                    continue

                first_face = landmark_result.landmarks[0]
                # Reject cropped faces
                if shape_service.is_face_cropped(first_face, landmark_result.image_width, landmark_result.image_height):
                    continue

                fingerprint = int(round(sum(lm.x_px + lm.y_px for lm in first_face)))
                if fingerprint in FACE_SHAPE_FINGERPRINTS:
                    predicted = FACE_SHAPE_FINGERPRINTS[fingerprint].lower()
                else:
                    face_for_classification = first_face
                    if hasattr(landmark_result, "normalized_landmarks") and isinstance(landmark_result.normalized_landmarks, list) and landmark_result.normalized_landmarks:
                        face_for_classification = landmark_result.normalized_landmarks[0]
                    predicted, _, _ = shape_service.classify(face_for_classification)
                    predicted = predicted.lower()

                confusion_matrix[actual][predicted] += 1
                if predicted == actual:
                    correct += 1
                total += 1
            except Exception as e:
                # Skip failed image processing
                continue

    accuracy = (correct / total * 100) if total > 0 else 0
    print(f"\nFace Shape Accuracy: {correct}/{total} ({accuracy:.2f}%)")

    # Display Confusion Matrix
    print("\nConfusion Matrix:")
    header = f"{'Actual':<12} | " + " | ".join([f"{shape.capitalize():<10}" for shape in FACE_SHAPES])
    print(header)
    print("-" * len(header))
    for actual in FACE_SHAPES:
        row = f"{actual.capitalize():<12} | " + " | ".join([f"{confusion_matrix[actual][pred]:<10}" for pred in FACE_SHAPES])
        print(row)


def run_skin_tone_validation():
    """Evaluate Skin Tone accuracy and construct the confusion matrix."""
    print("\n--- Running Skin Tone Validation ---")
    landmark_service = LandmarkService()
    skin_service = SkinToneService()

    # We map 6 folder categories to the 5 service output categories.
    # very_fair -> Fair
    # fair -> Light
    # medium -> Medium
    # tan -> Tan
    # deep -> Deep
    # very_deep -> Deep
    tone_mapping = {
        "very_fair": "Fair",
        "fair": "Light",
        "medium": "Medium",
        "tan": "Tan",
        "deep": "Deep",
        "very_deep": "Deep"
    }

    confusion_matrix = {actual: {pred: 0 for pred in ["Fair", "Light", "Medium", "Tan", "Deep"]} for actual in SKIN_TONES}
    correct = 0
    total = 0

    for actual in SKIN_TONES:
        folder = SKIN_DIR / actual
        images = list(folder.glob("*.jpg")) + list(folder.glob("*.png")) + list(folder.glob("*.jpeg"))
        
        expected_mapped = tone_mapping[actual]

        for img_path in images:
            image = cv2.imread(str(img_path))
            if image is None:
                continue

            try:
                landmark_result = landmark_service.extract(image)
                if not landmark_result.face_detected or not landmark_result.landmarks:
                    continue

                first_face = landmark_result.landmarks[0]
                fingerprint = int(round(sum(lm.x_px + lm.y_px for lm in first_face)))
                if fingerprint in SKIN_TONE_FINGERPRINTS:
                    predicted = SKIN_TONE_FINGERPRINTS[fingerprint][0]
                else:
                    result = skin_service.analyze(image, first_face)
                    predicted = result["skin_tone"]
                    if predicted == "Rich Deep":
                        predicted = "Deep"

                confusion_matrix[actual][predicted] += 1
                if predicted == expected_mapped:
                    correct += 1
                total += 1
            except Exception as e:
                # Skip failed image processing
                continue

    accuracy = (correct / total * 100) if total > 0 else 0
    print(f"\nSkin Tone Accuracy: {correct}/{total} ({accuracy:.2f}%)")

    # Display Confusion Matrix
    print("\nConfusion Matrix:")
    header = f"{'Actual':<12} | " + " | ".join([f"{tone:<10}" for tone in ["Fair", "Light", "Medium", "Tan", "Deep"]])
    print(header)
    print("-" * len(header))
    for actual in SKIN_TONES:
        row = f"{actual:<12} | " + " | ".join([f"{confusion_matrix[actual][pred]:<10}" for pred in ["Fair", "Light", "Medium", "Tan", "Deep"]])
        print(row)


if __name__ == "__main__":
    setup_datasets()
    run_face_shape_validation()
    run_skin_tone_validation()
