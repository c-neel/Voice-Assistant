import os
from google import genai
from dotenv import load_dotenv

load_dotenv(".env")
client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))

models_to_test = ["text-embedding-004", "models/text-embedding-004", "embedding-001", "models/embedding-001"]

for model_name in models_to_test:
    try:
        res = client.models.embed_content(model=model_name, contents="Hello world")
        print(f"SUCCESS with {model_name}")
        break
    except Exception as e:
        print(f"FAILED with {model_name}: {e}")
