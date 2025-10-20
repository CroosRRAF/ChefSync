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
from apps.authentication.models import User, JWTToken


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
        Only refresh tokens are stored in database for security
        
        Args:
            user: User instance
            request: Django request object (optional)
            
        Returns:
            Dict containing access_token, refresh_token, and token_info
        """
        # Generate tokens using SimpleJWT
        refresh = RefreshToken.for_user(user)
        access = refresh.access_token
        
        # Add custom claims to access token
        access['user_id'] = user.id  # Use the id property which maps to user_id
        access['email'] = user.email
        access['name'] = user.name
        access['role'] = user.role
        
        # Get client info if request is provided
        client_info = cls.get_client_info(request) if request else {}
        
        # Calculate refresh token expiry time
        refresh_expires_at = timezone.now() + timedelta(days=settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME'].days)
        
        # Store ONLY refresh token in database
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
        
        # Extract JTI from token
        try:
            if token_type == 'access':
                access_token = AccessToken(token)
                jti = access_token.get('jti')
            else:
                refresh_token = RefreshToken(token)
                jti = refresh_token.get('jti')
        except Exception:
            jti = secrets.token_urlsafe(32)  # Generate random JTI if extraction fails
        
        return JWTToken.objects.create(
            user=user,
            token_hash=token_hash,
            token_type=token_type,
            jti=jti,
            expires_at=expires_at,
            ip_address=client_info.get('ip_address'),
            user_agent=client_info.get('user_agent'),
            device_info=client_info.get('device_info')
        )
    
    @classmethod
    def validate_token(cls, token: str, token_type: str = 'access') -> Tuple[bool, Optional[User], Optional[str]]:
        """
        Validate a JWT token
        Access tokens: Stateless validation only
        Refresh tokens: Database validation + usage tracking
        
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
                
                # For access tokens: Only stateless validation
                try:
                    user = User.objects.get(user_id=user_id)
                except User.DoesNotExist:
                    return False, None, "User not found"
                
                # Check if user is active
                if not user.is_active:
                    return False, None, "User account is disabled"
                
                # Access tokens are stateless - no database lookup needed
                return True, user, None
                
            else:  # refresh token
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
                
                # For refresh tokens: Check database record
                token_hash = cls.generate_token_hash(token)
                
                try:
                    token_record = JWTToken.objects.get(
                        token_hash=token_hash,
                        token_type='refresh',
                        user=user
                    )
                except JWTToken.DoesNotExist:
                    return False, None, "Refresh token not found in database"
                
                # Check if refresh token is valid
                if not token_record.is_valid():
                    if token_record.is_expired():
                        return False, None, "Refresh token has expired"
                    elif token_record.is_revoked:
                        return False, None, "Refresh token has been revoked"
                    elif token_record.is_blacklisted:
                        return False, None, "Refresh token has been blacklisted"
                
                # Mark refresh token as used
                token_record.mark_as_used()
                
                return True, user, None
            
        except TokenError as e:
            return False, None, f"Invalid token: {str(e)}"
        except Exception as e:
            return False, None, f"Token validation error: {str(e)}"
    
    @classmethod
    def refresh_access_token(cls, refresh_token: str, request=None) -> Dict[str, Any]:
        """
        Refresh access token using refresh token
        Only refresh tokens are stored in database
        
        Args:
            refresh_token: Refresh token string
            request: Django request object (optional)
            
        Returns:
            Dict containing new access_token
        """
        # Validate refresh token (this checks database)
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
        
        # Access tokens are stateless - no database storage needed
        return {
            'access_token': str(access)
        }
    
    @classmethod
    def revoke_token(cls, token: str, token_type: str):
        """Revoke a specific token by setting is_revoked to True"""
        token_hash = cls.generate_token_hash(token)
        try:
            jwt_token = JWTToken.objects.get(token_hash=token_hash, token_type=token_type)
            jwt_token.is_revoked = True
            jwt_token.save()
        except JWTToken.DoesNotExist:
            pass

    @classmethod
    def rotate_refresh_token(cls, old_refresh_token: str, user: User, request=None) -> Dict[str, Any]:
        """Rotate the refresh token by revoking the old one and issuing a new one"""
        cls.revoke_token(old_refresh_token, 'refresh')
        return cls.create_tokens(user, request)
    
    @classmethod
    def revoke_all_user_tokens(cls, user: User, token_type: str = None) -> int:
        """
        Revoke all tokens for a user
        Only revokes refresh tokens (access tokens are stateless)
        
        Args:
            user: User instance
            token_type: Type of token to revoke (only 'refresh' or None)
            
        Returns:
            Number of tokens revoked
        """
        if token_type and token_type != 'refresh':
            return 0  # Only refresh tokens can be revoked
            
        return JWTToken.revoke_all_user_tokens(user, 'refresh')
    
    @classmethod
    def blacklist_token(cls, token: str, token_type: str = 'refresh') -> bool:
        """
        Blacklist a token
        Only refresh tokens can be blacklisted (access tokens are stateless)
        
        Args:
            token: JWT token string
            token_type: Type of token (only 'refresh' supported)
            
        Returns:
            True if token was blacklisted, False otherwise
        """
        if token_type != 'refresh':
            return False  # Access tokens are stateless, cannot be blacklisted
            
        try:
            token_hash = cls.generate_token_hash(token)
            token_record = JWTToken.objects.get(
                token_hash=token_hash,
                token_type='refresh'
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
        return JWTToken.cleanup_expired_tokens()
    
    @classmethod
    def get_user_active_tokens(cls, user: User, token_type: str = None) -> list:
        """
        Get all active tokens for a user
        Only returns refresh tokens (access tokens are stateless)
        
        Args:
            user: User instance
            token_type: Type of token (only 'refresh' or None)
            
        Returns:
            List of active refresh token records
        """
        queryset = JWTToken.objects.filter(
            user=user,
            token_type='refresh',  # Only refresh tokens are stored
            is_revoked=False,
            is_blacklisted=False,
            expires_at__gt=timezone.now()
        )
        
        return list(queryset.order_by('-issued_at'))
    
    @classmethod
    def get_token_info(cls, token: str, token_type: str = 'refresh') -> Optional[Dict[str, Any]]:
        """
        Get token information from database
        Only works for refresh tokens (access tokens are stateless)
        
        Args:
            token: JWT token string
            token_type: Type of token (only 'refresh' supported)
            
        Returns:
            Token information dict or None if not found
        """
        if token_type != 'refresh':
            return None  # Access tokens are stateless, no database info
            
        try:
            token_hash = cls.generate_token_hash(token)
            token_record = JWTToken.objects.get(
                token_hash=token_hash,
                token_type='refresh'
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
                'last_used_at': token_record.last_used_at,
                'usage_count': token_record.usage_count,
            }
        except JWTToken.DoesNotExist:
            return None
