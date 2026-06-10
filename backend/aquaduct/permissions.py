from rest_framework.permissions import BasePermission

class IsRole(BasePermission):
    def has_permission(self, request, view):
        required_role = getattr(view, 'required_role', None)
        if required_role is None:
            return False
        return request.user.is_authenticated and request.user.role == required_role

class IsOwnerOrAdmin(BasePermission):
    """
    Object-level permission: only the owner (customer) or an admin can access.
    Assumes the object has a 'customer' or 'user' or 'owner' attribute.
    """
    def has_object_permission(self, request, view, obj):
        if request.user.role == 'Admin':
            return True
        if hasattr(obj, 'customer'):
            return obj.customer == request.user
        if hasattr(obj, 'user'):
            return obj.user == request.user
        if hasattr(obj, 'owner'):
            return obj.owner == request.user
        return False