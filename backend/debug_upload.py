import requests
import os

def test_upload():
    url = "http://localhost:8000/upload"
    file_path = "c:\\Mchensy\\public\\mock_medical_bill_alex_rivera.png"
    
    if not os.path.exists(file_path):
        print(f"Error: {file_path} not found")
        return

    with open(file_path, "rb") as f:
        files = {"file": f}
        data = {
            "claim_id": "ABC-DEBUG-01",
            "policy_number": "POL-DEBUG-01",
            "insurance_type": "health",
            "claim_type": "reimbursement"
        }
        
        print(f"Uploading {file_path} to {url}...")
        try:
            response = requests.post(url, files=files, data=data)
            print(f"Response Status: {response.status_code}")
            print(f"Response JSON: {response.json()}")
            
            upload_id = response.json().get("upload_id")
            if upload_id:
                print(f"Polling quality report for {upload_id}...")
                import time
                for _ in range(10):
                    time.sleep(2)
                    report_resp = requests.get(f"http://localhost:8000/quality-report/{upload_id}")
                    report = report_resp.json()
                    print(f"Status: {report.get('status')} - Progress: {report.get('current_check')}")
                    if report.get('status') == 'complete':
                        print("Success!")
                        print(f"Extracted Name: {report.get('audit', {}).get('patient_name')}")
                        break
                    if report.get('status') == 'error':
                        print(f"ERROR: {report.get('error')}")
                        break
        except Exception as e:
            print(f"Request failed: {e}")

if __name__ == "__main__":
    test_upload()
