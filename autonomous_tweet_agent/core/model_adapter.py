import os
from groq import Groq
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class GroqModelAdapter:
    """
    Adapter for Groq Cloud API (Free Tier).
    Uses Open Source models (Llama 3) on the cloud.
    """
    
    def __init__(self, model_name="llama-3.3-70b-versatile"):
        """
        Initializes the Groq client.
        Default model: Llama 3 (8B) - Fast & Smart.
        """
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            print("❌ CRITICAL ERROR: GROQ_API_KEY not found in .env file!")
        
        try:
            self.client = Groq(api_key=api_key)
            self.model_name = model_name
            print(f"⚡ Groq AI Adapter initialized with {model_name}")
        except Exception as e:
            print(f"Error configuring Groq: {e}")

    async def generate(self, prompt: str) -> str:
        """
        Generates text using Groq API.
        """
        try:
            # Groq sync call (Fast enough to not block much)
            chat_completion = self.client.chat.completions.create(
                messages=[
                    {
                        "role": "user",
                        "content": prompt,
                    }
                ],
                model=self.model_name,
                temperature=0.7, # Thoda creative hone ke liye
            )
            return chat_completion.choices[0].message.content.strip()
        
        except Exception as e:
            print(f"❌ Error generating text with Groq: {e}")
            return f"Error: {e}"