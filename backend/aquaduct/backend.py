# aquaduct/backend.py
from django.contrib.auth.backends import ModelBackend
from django.contrib.auth import get_user_model
from django.core.exceptions import PermissionDenied

User = get_user_model()

class LockoutModelBackend(ModelBackend):
    def authenticate(self, request, username=None, password=None, **kwargs):
        user = None
        if username is None:
            username = kwargs.get(User.USERNAME_FIELD)
        try:
            user = User._default_manager.get_by_natural_key(username)
        except User.DoesNotExist:
            User().set_password(password)
        else:
            if user.is_locked_out:
                return None
            if user.check_password(password) and self.user_can_authenticate(user):
                return user
        return None