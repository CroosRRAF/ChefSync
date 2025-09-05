"""
Custom JWT Authentication for ChefSync
"""
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.tokens import AccessToken
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
        messages = []
        for AuthToken in self.get_auth_token_classes():
            try:
                # Validate token with SimpleJWT first
                validated_token = AuthToken(raw_token)
                
                # Additional validation against database
                is_valid, user, error = JWTTokenService.validate_token(
                    str(validated_token), 
                    'access'
                )
                
                if not is_valid:
                    raise InvalidToken(error)
                
                return validated_token
                
            except TokenError as e:
                messages.append({'token_class': AuthToken.__name__,
                               'token_type': AuthToken.token_type,
                               'message': e.args[0]})

        raise InvalidToken({
            'detail': 'Given token not valid for any token type',
            'messages': messages,
        })
    
    def get_user(self, validated_token):
        """
        Attempts to find and return a user using the given validated token.
        """
        try:
            user_id = validated_token[self.get_user_id_claim()]
        except KeyError:
            raise InvalidToken('Token contained no recognizable user identification')

        try:
            user = self.get_user_model().objects.get(**{self.get_user_id_field(): user_id})
        except self.get_user_model().DoesNotExist:
            raise InvalidToken('User not found')

        if not user.is_active:
            raise InvalidToken('User is inactive')

        return user
