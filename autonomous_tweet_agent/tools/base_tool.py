class BaseTool:
    name = "base"
    description = "Base Tool"

    async def run(self, input_text: str):
        raise NotImplementedError
