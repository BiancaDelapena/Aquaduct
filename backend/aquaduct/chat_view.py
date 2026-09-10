# aquaduct/chat_view.py
import json
from openai import OpenAI
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from .models import ChatSession, ChatMessage
from .openai_client import TOOLS, SYSTEM_PROMPT
from .chat_tools import (
    get_customer_jugs, get_all_jugs_with_status, get_active_order_status, get_customer_address, create_order,
    update_refill_schedule, get_jug_types, create_new_jug_order, get_order_by_id, cancel_order,
    get_refill_context, get_new_jug_context,

)

# OpenRouter client
client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=settings.OPENROUTER_API_KEY,
)

TOOL_MAP = {
    "get_customer_jugs": get_customer_jugs,
    "get_all_jugs_with_status": get_all_jugs_with_status,
    "get_active_order_status": get_active_order_status,
    "get_customer_address": get_customer_address,
    "create_order": create_order,
    "update_refill_schedule": update_refill_schedule,
    "get_jug_types": get_jug_types,
    "create_new_jug_order": create_new_jug_order,
    "get_order_by_id": get_order_by_id, 
    "cancel_order": cancel_order,
    "get_refill_context": get_refill_context,
    "get_new_jug_context": get_new_jug_context,
}

class ChatView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Return the current user's chat history."""
        user = request.user
        try:
            session = ChatSession.objects.get(user=user)
        except ChatSession.DoesNotExist:
            return Response({"messages": []})

        messages = session.messages.all().order_by('created_at')
        data = []
        for msg in messages:
            if msg.role == ChatMessage.Role.USER:
                sender = 'user'
            elif msg.role == ChatMessage.Role.ASSISTANT:
                sender = 'bot'
            else:
                continue   # skip tool messages
            data.append({
                'id': msg.id,
                'sender': sender,
                'text': msg.content,
                'timestamp': msg.created_at.isoformat(),
            })

        return Response({"messages": data})
    
    def delete(self, request):
        """Delete the current chat session (all messages)."""
        user = request.user
        ChatSession.objects.filter(user=user).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    def post(self, request):
        user = request.user
        user_message = request.data.get('message', '').strip()
        if not user_message:
            return Response({"error": "Empty message"}, status=400)

        session, _ = ChatSession.objects.get_or_create(user=user)

        # Save user message
        ChatMessage.objects.create(
            session=session,
            role=ChatMessage.Role.USER,
            content=user_message,
        )

        # Build conversation history (only once)
        conversation = [{"role": "system", "content": SYSTEM_PROMPT}]
        for msg in session.messages.all().order_by('created_at'):
            if msg.role == ChatMessage.Role.USER:
                conversation.append({"role": "user", "content": msg.content})
            elif msg.role == ChatMessage.Role.ASSISTANT:
                # For now, treat assistant messages as plain text
                conversation.append({"role": "assistant", "content": msg.content})
            elif msg.role == ChatMessage.Role.TOOL:
                # Not replaying old tool calls for MVP
                pass

        # First call
        try:
            response = client.chat.completions.create(
                model="openai/gpt-oss-120b:free",
                messages=conversation,
                tools=TOOLS,
                tool_choice="auto",
            )
        except Exception as e:
            return Response({"reply": f"Sorry, I encountered an error: {str(e)}"}, status=500)

        response_message = response.choices[0].message

        # Process tool calls
        while response_message.tool_calls:
            tool_results = []
            for tool_call in response_message.tool_calls:
                function_name = tool_call.function.name
                args = json.loads(tool_call.function.arguments)

                try:
                    result = TOOL_MAP[function_name](user=user, **args)
                except Exception as e:
                    result = {"error": str(e)}

                # Save tool call
                ChatMessage.objects.create(
                    session=session,
                    role=ChatMessage.Role.TOOL,
                    content=json.dumps(result),
                    tool_name=function_name,
                    tool_args=args,
                )

                tool_results.append({
                    "tool_call_id": tool_call.id,
                    "role": "tool",
                    "name": function_name,
                    "content": json.dumps(result),
                })

            # Append assistant request + tool results to conversation
            conversation.append({
                "role": "assistant",
                "content": None,
                "tool_calls": [
                    {
                        "id": tc.id,
                        "type": "function",
                        "function": {
                            "name": tc.function.name,
                            "arguments": tc.function.arguments,
                        }
                    }
                    for tc in response_message.tool_calls
                ]
            })
            for tr in tool_results:
                conversation.append(tr)

            # Continue
            try:
                response = client.chat.completions.create(
                    model="openai/gpt-oss-120b:free",
                    messages=conversation,
                    tools=TOOLS,
                    tool_choice="auto",
                )
                response_message = response.choices[0].message
            except Exception as e:
                return Response({"reply": f"Error processing tool call: {str(e)}"}, status=500)

        # Final reply
        assistant_reply = response_message.content
        try:
            ChatMessage.objects.create(
                session=session,
                role=ChatMessage.Role.ASSISTANT,
                content=assistant_reply,
            )
        except Exception as e:
            # If saving fails, still return the reply to the user
            return Response({"reply": f"Your request was processed, but there was an issue saving the chat: {str(e)}"})

        return Response({"reply": assistant_reply})