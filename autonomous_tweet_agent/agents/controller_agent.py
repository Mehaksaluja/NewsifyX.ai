class ControllerAgent:
    """
    Executes each tool step sequentially and passes output to next tool.
    """

    def __init__(self, registry):
        self.registry = registry

    async def execute_plan(self, plan):
        results = []
        last_output = "" # Pichle step ka result yahan store hota hai

        for step in plan["steps"]:
            tool_name = step.get("tool")
            
            # --- BUG FIX: Handle None/null input ---
            raw_input = step.get("input")
            if raw_input is None:
                tool_input = ""
            else:
                tool_input = str(raw_input)
            # ---------------------------------------

            # Hum "output" shabd bhi check karenge
            if "above" in tool_input.lower() or \
               "previous" in tool_input.lower() or \
               "output" in tool_input.lower():
                
                print(f"[Debug] Controller: Replacing '{tool_input}' with last_output.")
                tool_input = last_output # Asli data (tweet/hashtags) yahan pass hoga

            tool = self.registry.get(tool_name)
            if not tool:
                results.append(f"Tool '{tool_name}' not found")
                print(f"❌ Tool '{tool_name}' not found")
                continue

            # Tool ko asli data (last_output) ke saath run karenge
            print(f"\n🔧 Running tool: {tool_name}")
            output = await tool.run(tool_input)
            print(f"📤 Output from {tool_name}: {output}")

            last_output = output # Naye result ko save karenge
            results.append(output)

        return results