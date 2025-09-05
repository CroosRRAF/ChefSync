"""
JWT Token Service for secure token management
"""
import hashlib
import secrets
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, Tuple
from django.utils import timezone
from django.conf import settings
from rest_framework_simplejwt.tokens import RefreshToken, AccessToken
from rest_framework_simplejwt.exceptions import TokenError, InvalidToken
from apps.authentication.models import User
# from apps.authentication.models import JWTToken  # Commented out as JWTToken model doesn't exist


class JWTTokenService:
    """
    Service class for managing JWT tokens with database storage
    """
    
    @staticmethod
    def generate_token_hash(token: str) -> str:
        """Generate SHA-256 hash of the token"""
        return hashlib.sha256(token.encode('utf-8')).hexdigest()
    
    @staticmethod
    def get_client_info(request) -> Dict[str, Any]:
        """Extract client information from request"""
        return {
            'ip_address': request.META.get('REMOTE_ADDR'),
            'user_agent': request.META.get('HTTP_USER_AGENT', ''),
            'device_info': request.META.get('HTTP_USER_AGENT', '')[:255]  # Truncate for database
        }
    
    @classmethod
    def create_tokens(cls, user: User, request=None) -> Dict[str, Any]:
        """
        Create access and refresh tokens for a user
        
        Args:
            user: User instance
            request: Django request object (optional)
            
        Returns:
            Dict containing access_token, refresh_token, and token_info
        """
        # Generate tokens using SimpleJWT
        refresh = RefreshToken.for_user(user)
        access = refresh.access_token
        
        # Add custom claims
        access['user_id'] = user.user_id
        access['email'] = user.email
        access['name'] = user.name
        access['role'] = user.role
        
        # Get client info if request is provided
        client_info = cls.get_client_info(request) if request else {}
        
        # Calculate expiry times
        access_expires_at = timezone.now() + timedelta(minutes=settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME'].total_seconds() / 60)
        refresh_expires_at = timezone.now() + timedelta(days=settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME'].days)
        
        # Store tokens in database
        access_token_record = cls._store_token(
            user=user,
            token=str(access),
            token_type='access',
            expires_at=access_expires_at,
            client_info=client_info
        )
        
        refresh_token_record = cls._store_token(
            user=user,
            token=str(refresh),
            token_type='refresh',
            expires_at=refresh_expires_at,
            client_info=client_info
        )
        
        return {
            'access_token': str(access),
            'refresh_token': str(refresh),
            'access_token_info': {
                'id': access_token_record.id,
                'issued_at': access_token_record.issued_at,
                'expires_at': access_token_record.expires_at,
            },
            'refresh_token_info': {
                'id': refresh_token_record.id,
                'issued_at': refresh_token_record.issued_at,
                'expires_at': refresh_token_record.expires_at,
            }
        }
    
    @classmethod
    def _store_token(cls, user: User, token: str, token_type: str, 
                    expires_at: datetime, client_info: Dict[str, Any]) -> JWTToken:
        """Store token in database"""
        token_hash = cls.generate_token_hash(token)
        
        return JWTToken.objects.create(
            user=user,
            token_hash=token_hash,
            token_type=token_type,
            expires_at=expires_at,
            ip_address=client_info.get('ip_address'),
            user_agent=client_info.get('user_agent'),
            device_info=client_info.get('device_info')
        )
    
    @classmethod
    def validate_token(cls, token: str, token_type: str = 'access') -> Tuple[bool, Optional[User], Optional[str]]:
        """
        Validate a JWT token
        
        Args:
            token: JWT token string
            token_type: Type of token ('access' or 'refresh')
            
        Returns:
            Tuple of (is_valid, user, error_message)
        """
        try:
            # First validate with SimpleJWT
            if token_type == 'access':
                access_token = AccessToken(token)
                user_id = access_token['user_id']
            else:
                refresh_token = RefreshToken(token)
                user_id = refresh_token['user_id']
            
            # Get user
            try:
                user = User.objects.get(user_id=user_id)
            except User.DoesNotExist:
                return False, None, "User not found"
            
            # Check if user is active
            if not user.is_active:
                return False, None, "User account is disabled"
            
            # Check database token record
            token_hash = cls.generate_token_hash(token)
            try:
                token_record = JWTToken.objects.get(
                    token_hash=token_hash,
                    token_type=token_type,
                    user=user
                )
            except JWTToken.DoesNotExist:
                return False, None, "Token not found in database"
            
            # Check if token is valid
            if not token_record.is_valid():
                if token_record.is_expired():
                    return False, None, "Token has expired"
                elif token_record.is_revoked:
                    return False, None, "Token has been revoked"
                elif token_record.is_blacklisted:
                    return False, None, "Token has been blacklisted"
            
            return True, user, None
            
        except TokenError as e:
            return False, None, f"Invalid token: {str(e)}"
        except Exception as e:
            return False, None, f"Token validation error: {str(e)}"
    
    @classmethod
    def refresh_access_token(cls, refresh_token: str, request=None) -> Dict[str, Any]:
        """
        Refresh access token using refresh token
        
        Args:
            refresh_token: Refresh token string
            request: Django request object (optional)
            
        Returns:
            Dict containing new access_token and token_info
        """
        # Validate refresh token
        is_valid, user, error = cls.validate_token(refresh_token, 'refresh')
        if not is_valid:
            raise InvalidToken(error)
        
        # Generate new access token
        refresh = RefreshToken(refresh_token)
        access = refresh.access_token
        
        # Add custom claims
        access['user_id'] = user.user_id
        access['email'] = user.email
        access['name'] = user.name
        access['role'] = user.role
        
        # Get client info if request is provided
        client_info = cls.get_client_info(request) if request else {}
        
        # Calculate expiry time
        access_expires_at = timezone.now() + timedelta(minutes=settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME'].total_seconds() / 60)
        
        # Store new access token in database
        access_token_record = cls._store_token(
            user=user,
            token=str(access),
            token_type='access',
            expires_at=access_expires_at,
            client_info=client_info
        )
        
        return {
            'access_token': str(access),
            'access_token_info': {
                'id': access_token_record.id,
                'issued_at': access_token_record.issued_at,
                'expires_at': access_token_record.expires_at,
            }
        }
    
    @classmethod
    def revoke_token(cls, token: str, token_type: str = 'access') -> bool:
        """
        Revoke a token
        
        Args:
            token: JWT token string
            token_type: Type of token ('access' or 'refresh')
            
        Returns:
            True if token was revoked, False otherwise
        """
        try:
            token_hash = cls.generate_token_hash(token)
            token_record = JWTToken.objects.get(
                token_hash=token_hash,
                token_type=token_type
            )
            token_record.revoke()
            return True
        except JWTToken.DoesNotExist:
            return False
    
    @classmethod
    def revoke_all_user_tokens(cls, user: User, token_type: str = None) -> int:
        """
        Revoke all tokens for a user
        
        Args:
            user: User instance
            token_type: Type of token to revoke (None for all types)
            
        Returns:
            Number of tokens revoked
        """
        queryset = JWTToken.objects.filter(user=user, is_revoked=False)
        if token_type:
            queryset = queryset.filter(token_type=token_type)
        
        count = queryset.count()
        queryset.update(is_revoked=True)
        return count
    
    @classmethod
    def blacklist_token(cls, token: str, token_type: str = 'access') -> bool:
        """
        Blacklist a token
        
        Args:
            token: JWT token string
            token_type: Type of token ('access' or 'refresh')
            
        Returns:
            True if token was blacklisted, False otherwise
        """
        try:
            token_hash = cls.generate_token_hash(token)
            token_record = JWTToken.objects.get(
                token_hash=token_hash,
                token_type=token_type
            )
            token_record.blacklist()
            return True
        except JWTToken.DoesNotExist:
            return False
    
    @classmethod
    def cleanup_expired_tokens(cls) -> int:
        """
        Clean up expired tokens from database
        
        Returns:
            Number of tokens cleaned up
        """
        expired_tokens = JWTToken.objects.filter(expires_at__lt=timezone.now())
        count = expired_tokens.count()
        expired_tokens.delete()
        return count
    
    @classmethod
    def get_user_active_tokens(cls, user: User, token_type: str = None) -> list:
        """
        Get all active tokens for a user
        
        Args:
            user: User instance
            token_type: Type of token (None for all types)
            
        Returns:
            List of active token records
        """
        queryset = JWTToken.objects.filter(
            user=user,
            is_revoked=False,
            is_blacklisted=False,
            expires_at__gt=timezone.now()
        )
        if token_type:
            queryset = queryset.filter(token_type=token_type)
        
        return list(queryset.order_by('-issued_at'))
    
    @classmethod
    def get_token_info(cls, token: str, token_type: str = 'access') -> Optional[Dict[str, Any]]:
        """
        Get token information from database
        
        Args:
            token: JWT token string
            token_type: Type of token ('access' or 'refresh')
            
        Returns:
            Token information dict or None if not found
        """
        try:
            token_hash = cls.generate_token_hash(token)
            token_record = JWTToken.objects.get(
                token_hash=token_hash,
                token_type=token_type
            )
            
            return {
                'id': token_record.id,
                'user_id': token_record.user.user_id,
                'user_email': token_record.user.email,
                'token_type': token_record.token_type,
                'issued_at': token_record.issued_at,
                'expires_at': token_record.expires_at,
                'is_revoked': token_record.is_revoked,
                'is_blacklisted': token_record.is_blacklisted,
                'is_expired': token_record.is_expired(),
                'is_valid': token_record.is_valid(),
                'ip_address': token_record.ip_address,
                'device_info': token_record.device_info,
            }
        except JWTToken.DoesNotExist:
            return None
