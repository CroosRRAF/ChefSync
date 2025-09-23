"""
Custom JWT Authentication for ChefSync
"""

from django.contrib.auth import get_user_model
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.tokens import UntypedToken

from .services.jwt_service import JWTTokenService


class CustomJWTAuthentication(JWTAuthentication):
    """
    Custom JWT Authentication that validates tokens against database
    """

    def get_validated_token(self, raw_token):
        """
        Validates an encoded JSON web token and returns a validated token
        wrapper object.
        """
        try:
            # Use the parent's method to get validated token
            validated_token = super().get_validated_token(raw_token)

            # Additional validation against database
            is_valid, user, error = JWTTokenService.validate_token(
                str(raw_token), "access"
            )

            if not is_valid:
                raise InvalidToken(error)

            return validated_token

        except TokenError as e:
            raise InvalidToken(
                {
                    "detail": "Given token not valid",
                    "message": str(e),
                }
            )

    def get_user(self, validated_token):
        """
        Attempts to find and return a user using the given validated token.
        """
        try:
            user_id = validated_token["user_id"]
        except KeyError:
            raise InvalidToken("Token contained no recognizable user identification")

        User = get_user_model()
        try:
            user = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            raise InvalidToken("User not found")

        if not user.is_active:
            raise InvalidToken("User is inactive")

        return user
        return user
