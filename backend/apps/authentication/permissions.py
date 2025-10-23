from rest_framework.permissions import BasePermission


class IsAdminUser(BasePermission):
    """
    Custom permission to only allow access to admin users.
    Checks the user's role field instead of is_staff/is_superuser.
    """

    def has_permission(self, request, view):
        # Check if user is authenticated
        if not request.user or not request.user.is_authenticated:
            return False

        # Check if user has admin role
        return getattr(request.user, 'role', None) == 'admin'


class IsCookUser(BasePermission):
    """
    Custom permission to only allow access to cook users.
    """

    def has_permission(self, request, view):
        # Check if user is authenticated
        if not request.user or not request.user.is_authenticated:
            return False

        # Check if user has cook role
        return getattr(request.user, 'role', None) == 'cook'


class IsDeliveryAgentUser(BasePermission):
    """
    Custom permission to only allow access to delivery agent users.
    """

    def has_permission(self, request, view):
        # Check if user is authenticated
        if not request.user or not request.user.is_authenticated:
            return False

        # Check if user has delivery_agent role
        return getattr(request.user, 'role', None) == 'delivery_agent'


class IsCustomerUser(BasePermission):
    """
    Custom permission to only allow access to customer users.
    """

    def has_permission(self, request, view):
        # Check if user is authenticated
        if not request.user or not request.user.is_authenticated:
            return False

        # Check if user has customer role
        return getattr(request.user, 'role', None) == 'customer'