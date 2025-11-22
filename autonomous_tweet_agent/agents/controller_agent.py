class ControllerAgent:
    def __init__(self, registry):
        self.registry = registry

    async def execute_plan(self, plan):
        results = []
        last_output = ""

        for step in plan["steps"]:
            tool_name = step.get("tool")
            raw_input = step.get("input")
            if raw_input is None:
                tool_input = ""
            else:
                tool_input = str(raw_input)
            if "above" in tool_input.lower() or \
               "previous" in tool_input.lower() or \
               "output" in tool_input.lower():
                
                print(f"[Debug] Controller: Replacing '{tool_input}' with last_output.")
                tool_input = last_output

            tool = self.registry.get(tool_name)
            if not tool:
                results.append(f"Tool '{tool_name}' not found")
                print(f"Tool '{tool_name}' not found")
                continue

            print(f"\nRunning tool: {tool_name}")
            output = await tool.run(tool_input)
            print(f"Output from {tool_name}: {output}")

            last_output = output
            results.append(output)

        return results