from rest_framework.permissions import BasePermission

class IsRole(BasePermission):
    """Allows access only to users with one of the specified roles."""
    def __init__(self, *roles):
        self.roles = roles

    def __call__(self):
        return self

    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in self.roles

class IsOwnerOrAdmin(BasePermission):
    """
    Object-level permission: only the owner (customer) or an admin can access.
    Assumes the object has a 'customer' or 'user' attribute.
    """
    def has_object_permission(self, request, view, obj):
        if request.user.role == 'Admin':
            return True
        # For objects linked to a customer (like Order, Address, Jug)
        if hasattr(obj, 'customer'):
            return obj.customer == request.user
        if hasattr(obj, 'user'):
            return obj.user == request.user
        if hasattr(obj, 'owner'):
            return obj.owner == request.user
        return False