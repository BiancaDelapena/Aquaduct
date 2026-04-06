from django.http import JsonResponse

# Example view
def home(request):
    data = {
        "message": "Hello from Aquaduct API!"
    }
    return JsonResponse(data)