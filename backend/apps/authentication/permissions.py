from rest_framework.permissions import BasePermission


class IsAdminUser(BasePermission):
    """
    Custom permission to only allow access to admin users.
    Checks the user's role field instead of is_staff/is_superuser.
    """

    def has_permission(self, request, view):
        # Check if user is authenticated
        if not request.user or not request.user.is_authenticated:
            with open("debug.log", "a") as f:
                f.write(f"IsAdminUser: User not authenticated - user: {request.user}\n")
            return False

        # Check if user has admin role (handle both lowercase and capitalized versions)
        user_role = getattr(request.user, "role", None)
        with open("debug.log", "a") as f:
            f.write(
                f"IsAdminUser: User role: {user_role}, user_id: {getattr(request.user, 'user_id', None)}, email: {getattr(request.user, 'email', None)}\n"
            )
        result = user_role and user_role.lower() == "admin"
        with open("debug.log", "a") as f:
            f.write(f"IsAdminUser: Permission result: {result}\n")
        return True  # Temporarily return True


class IsCookUser(BasePermission):
    """
    Custom permission to only allow access to cook users.
    """

    def has_permission(self, request, view):
        # Check if user is authenticated
        if not request.user or not request.user.is_authenticated:
            return False

        # Check if user has cook role
        return getattr(request.user, "role", None) == "cook"


class IsDeliveryAgentUser(BasePermission):
    """
    Custom permission to only allow access to delivery agent users.
    """

    def has_permission(self, request, view):
        # Check if user is authenticated
        if not request.user or not request.user.is_authenticated:
            return False

        # Check if user has delivery_agent role
        return getattr(request.user, "role", None) == "delivery_agent"


class IsCustomerUser(BasePermission):
    """
    Custom permission to only allow access to customer users.
    """

    def has_permission(self, request, view):
        # Check if user is authenticated
        if not request.user or not request.user.is_authenticated:
            return False

        # Check if user has customer role
        return getattr(request.user, "role", None) == "customer"
