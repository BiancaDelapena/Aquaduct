from django.http import JsonResponse
from .services import create_jug_from_new_order_item

def home(request):
    data = {
        "message": "Hello from Aquaduct API!"
    }
    return JsonResponse(data)

def create_order(request):
    # create order
    # create order item
    # create new jug item

    create_jug_from_new_order_item(order_new_jug_item)