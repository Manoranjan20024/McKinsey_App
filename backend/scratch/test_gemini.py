import os
import asyncio
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")

async def test():
    if not api_key:
        print("No API Key")
        return
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel("gemini-1.5-flash") # Using a 1.5 flash for test to see if it works
    try:
        response = await model.generate_content_async("Hello, respond with 'Success' if you can read this.")
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(test())
