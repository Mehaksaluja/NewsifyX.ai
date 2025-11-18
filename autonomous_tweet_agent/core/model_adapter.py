import asyncio
import subprocess

class OllamaModelAdapter:
    """
    Adapter for using local LLM through Ollama via `ollama run <model>`.
    Handles Windows UTF-8 issues.
    """

    def __init__(self, model_name="qwen2.5:1.5b"):
        self.model_name = model_name

    async def generate(self, prompt: str):
        return await asyncio.to_thread(self._run_ollama, prompt)

    def _run_ollama(self, prompt: str):
        try:
            process = subprocess.Popen(
                ["ollama", "run", self.model_name],
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                encoding="utf-8",     # UTF-8 fix
                errors="ignore"       # avoid decoding crash
            )

            output, error = process.communicate(prompt)

            if error and error.strip():
                print("Ollama Error:", error)

            return output.strip()

        except Exception as e:
            print("Exception while calling Ollama:", e)
            return f"ERROR: {e}"
