import os
from openai import AsyncOpenAI
from dotenv import load_dotenv

load_dotenv()

DEFAULT_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")


class OpenAIModelAdapter:
    def __init__(self, model_name: str | None = None):
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            print("CRITICAL ERROR: OPENAI_API_KEY not found in .env file!")

        self.model_name = model_name or DEFAULT_MODEL
        try:
            self.client = AsyncOpenAI(api_key=api_key)
            print(f"OpenAI Adapter initialized with {self.model_name}")
        except Exception as e:
            self.client = None
            print(f"Error configuring OpenAI: {e}")

    async def generate(self, prompt: str) -> str:
        if self.client is None:
            return "Error: OpenAI client not configured"
        try:
            response = await self.client.chat.completions.create(
                model=self.model_name,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.7,
            )
            return (response.choices[0].message.content or "").strip()
        except Exception as e:
            print(f"Error generating text with OpenAI: {e}")
            return f"Error: {e}"


# Backwards-compatible alias
GroqModelAdapter = OpenAIModelAdapter
