import requests

def test_bulk_delete():
    url = "http://localhost:8000/reports/delete-bulk"
    payload = {"upload_ids": ["test1", "test2"]}
    try:
        response = requests.post(url, json=payload)
        print(f"Status Code: {response.status_code}")
        print(f"Response Body: {response.text}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_bulk_delete()
