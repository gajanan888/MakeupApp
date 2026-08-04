import httpx
import os

def test():
    test_img = "test_face_warm.png"
    if not os.path.exists(test_img):
        print(f"Error: {test_img} not found.")
        return
        
    files = {"file": (test_img, open(test_img, "rb"), "image/png")}
    
    # 1. Test live FastAPI directly
    try:
        r_fastapi = httpx.post("http://127.0.0.1:8000/api/artist/recommend", files=files, timeout=30.0)
        print("FastAPI directly (8000) Status:", r_fastapi.status_code)
        if r_fastapi.status_code == 200:
            print("FastAPI returns success!")
        else:
            print("FastAPI error response:", r_fastapi.text)
    except Exception as e:
        print("Failed to reach FastAPI directly:", e)

    # 2. Test live Express proxy
    files_proxy = {"file": (test_img, open(test_img, "rb"), "image/png")}
    try:
        r_proxy = httpx.post("http://127.0.0.1:5000/api/artist/recommend", files=files_proxy, timeout=30.0)
        print("Express Proxy (5000) Status:", r_proxy.status_code)
        if r_proxy.status_code == 200:
            print("Express Proxy returns success!")
        else:
            print("Express Proxy error response:", r_proxy.text)
    except Exception as e:
        print("Failed to reach Express Proxy:", e)

if __name__ == "__main__":
    test()
