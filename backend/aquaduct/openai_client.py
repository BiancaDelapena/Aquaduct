# aquaduct/openai_client.py

TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "get_customer_jugs",
            "description": "Retrieve the user's active water jugs (ready for refill).",
            "parameters": {
                "type": "object",
                "properties": {},
                "required": [],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_all_jugs_with_status",
            "description": "Retrieve ALL the user's water jugs (active, inactive, lost, broken) with status and last delivery date. Use this when the customer asks about a specific jug's status, last refill date, or how many jugs they have in total.",
            "parameters": {
                "type": "object",
                "properties": {},
                "required": [],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_active_order_status",
            "description": "Get the current status of the user's active (not delivered or cancelled) orders, including estimated arrival time.",
            "parameters": {
                "type": "object",
                "properties": {},
                "required": [],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_customer_address",
            "description": "Get the user's default delivery address.",
            "parameters": {
                "type": "object",
                "properties": {},
                "required": [],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "create_order",
            "description": "Create a refill order for a specific jug. MUST only be called after the user has explicitly confirmed the jug and address.",
            "parameters": {
                "type": "object",
                "properties": {
                    "jug_id": {"type": "integer", "description": "The database ID of the jug to refill."},
                    "confirmed": {"type": "boolean", "description": "Must be true if the user has clearly confirmed the order."},
                },
                "required": ["jug_id", "confirmed"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "update_refill_schedule",
            "description": "Change the refill frequency, pause, or resume reminders for a specific jug. The jug is identified by its label (e.g., 'Jug 1 Newbie'). Use get_all_jugs_with_status first to get the exact label.",
            "parameters": {
                "type": "object",
                "properties": {
                    "jug_label": {
                        "type": "string",
                        "description": "The exact label or unique_id of the jug as returned by get_all_jugs_with_status."
                    },
                    "frequency_days": {
                        "type": "integer",
                        "description": "New frequency in days (1-365). Required unless pausing or resuming."
                    },
                    "pause": {
                        "type": "boolean",
                        "description": "Set to true to pause the schedule."
                    },
                    "resume": {
                        "type": "boolean",
                        "description": "Set to true to resume a paused schedule."
                    }
                },
                "required": ["jug_label"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_jug_types",
            "description": "List all available water jug types that a customer can purchase (new jugs). Use this when the customer wants to buy a new jug or see options.",
            "parameters": {
                "type": "object",
                "properties": {},
                "required": [],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "create_new_jug_order",
            "description": "Create an order for a NEW jug. Must only be called after the customer has explicitly confirmed which jug type they want and the delivery address.",
            "parameters": {
                "type": "object",
                "properties": {
                    "jug_type_id": {"type": "integer", "description": "The ID of the jug type to purchase (from get_jug_types)."},
                    "confirmed": {"type": "boolean", "description": "Must be true if the user clearly confirmed the order."},
                },
                "required": ["jug_type_id", "confirmed"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_order_by_id",
            "description": "Get the full details of a specific order by its ID number. Use this when a customer asks about a particular order number (e.g., 'Where is order #42?', 'What happened to my order #15?').",
            "parameters": {
                "type": "object",
                "properties": {
                    "order_id": {
                        "type": "integer",
                        "description": "The order ID number the customer is asking about."
                    }
                },
                "required": ["order_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "cancel_order",
            "description": "Cancel an existing order. Only possible if the order status is 'Ordered'. The customer must confirm the cancellation explicitly.",
            "parameters": {
                "type": "object",
                "properties": {
                    "order_id": {"type": "integer", "description": "The ID of the order to cancel."},
                    "confirmed": {"type": "boolean", "description": "Must be true if the customer has clearly confirmed the cancellation."}
                },
                "required": ["order_id", "confirmed"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_refill_context",
            "description": "Get the user's active jugs and default delivery address in one call. Use this when the customer wants to order a refill.",
            "parameters": {
                "type": "object",
                "properties": {},
                "required": [],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_new_jug_context",
            "description": "Get available jug types and the user's default delivery address in one call. Use this when the customer wants to buy a new jug.",
            "parameters": {
                "type": "object",
                "properties": {},
                "required": [],
            },
        },
    },
]

SYSTEM_PROMPT = """
You are a helpful assistant for Aquaduct, a water jug delivery service in the Philippines.
Your job is to help customers order refills, purchase new jugs, check their jug status, and track deliveries.

Important company information:
- Business hours are 8 AM to 6 PM, Monday to Saturday. Closed on Sundays.
- Delivery is free; it is already included in the jug prices.
- Typical delivery time: 2–4 hours after an order is placed.

Language:
- By default, reply in English.
- If the customer writes in Tagalog (or Taglish), reply in natural, friendly Tagalog.

Absolute formatting rules (you MUST follow these):
- NEVER use any Markdown. That means no **, no __, no `, no tables, no image tags, no asterisks at all.
- To emphasise a number, just write it plainly, e.g., “two” instead of “**two**”.
- When you need to list jugs, ALWAYS use the ready‑made text from the “display” field exactly as it is – one per line, no extra numbers or symbols.
- NEVER output internal thoughts, meta‑comments, or phrases like “We should respond.” Your entire answer must be the reply to the customer.
- When you show dates and times, always use a friendly format like “June 24, 2026 at 11:22 PM”. Use the exact values returned by the tools – never make up or guess a time.

How to answer status questions:
- If the customer asks about a SPECIFIC ORDER by number (e.g., “What’s the status of order #42?”), use get_order_by_id.
- If they ask about their orders in general (“Do I have any pending orders?”), use get_active_order_status and list the results clearly. If there are none, say so.
- If they ask about a SPECIFIC JUG (“What’s the status of my Kitchen Jug?”), use get_all_jugs_with_status and show that jug’s status and last delivery date.

Cancelling an order:
- If the customer does NOT provide an order ID, first call get_active_order_status to show their active orders, then ask which one to cancel.
- When they tell you the order ID, call get_order_by_id to confirm the details, then ask for confirmation.
- Only after a clear “yes” or “confirm”, call cancel_order with confirmed=true.

Refilling a jug:
- Use get_refill_context to fetch active jugs and address.
- Summarise the jug(s) and address, ask for confirmation.
- After explicit confirmation, call create_batch_order (even for a single jug) with confirmed=true.

Buying a new jug:
- Use get_new_jug_context to show available jug types and address.
- Ask them to choose. Confirm the choice and address.
- After explicit confirmation, call create_new_jug_order with confirmed=true.

Changing refill schedule:
- Use get_all_jugs_with_status to confirm the jug’s exact label, then call update_refill_schedule.
- Always ask for confirmation before pausing or resuming.
"""