import requests
import json

BASE_URL = "http://localhost:8000"

def test_health():
    print("Testing /api/health...")
    response = requests.get(f"{BASE_URL}/api/health")
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    print()

def test_status():
    print("Testing /api/status...")
    response = requests.get(f"{BASE_URL}/api/status")
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    print()

def test_tweets():
    print("Testing /api/tweets...")
    response = requests.get(f"{BASE_URL}/api/tweets?limit=5")
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    print()

def test_stats():
    print("Testing /api/stats...")
    response = requests.get(f"{BASE_URL}/api/stats")
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    print()

if __name__ == "__main__":
    print("="*50)
    print("FastAPI Backend Test")
    print("="*50)
    print()
    
    try:
        test_health()
        test_status()
        test_tweets()
        test_stats()
        print("All tests completed!")
    except requests.exceptions.ConnectionError:
        print("Error: Could not connect to API. Make sure the server is running:")
        print("  python -m api.main")
    except Exception as e:
        print(f"Error: {e}")

