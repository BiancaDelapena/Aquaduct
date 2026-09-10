# test_tools.py
from openai import OpenAI
from dotenv import load_dotenv
import os, json

load_dotenv()

client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=os.getenv("OPENROUTER_API_KEY"),
)

# Replace with the exact model ID that worked for you (e.g., "openai/gpt-oss-20b:free")
MODEL = "openai/gpt-oss-120b:free"

response = client.chat.completions.create(
    model=MODEL,
    messages=[{"role": "user", "content": "What jugs do I have?"}],
    tools=[{
        "type": "function",
        "function": {
            "name": "get_customer_jugs",
            "description": "List the user's water jugs",
            "parameters": {"type": "object", "properties": {}}
        }
    }],
    tool_choice="auto",
)

message = response.choices[0].message
print("Response message:", message)

if message.tool_calls:
    print("✅ Model supports function calling!")
    for tool_call in message.tool_calls:
        print(f"   Called: {tool_call.function.name}")
        print(f"   Arguments: {tool_call.function.arguments}")
else:
    print("❌ Model returned text only (no tool call). It may not support function calling.")
    print("   Text:", message.content)