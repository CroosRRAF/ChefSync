"""
Referral service for managing referral tokens and tracking using JWT tokens
"""
from django.db import transaction
from django.utils import timezone
from datetime import timedelta
from apps.authentication.models import User, JWTToken
import logging

logger = logging.getLogger(__name__)


class ReferralService:
    """Service for managing referral system"""
    
    @staticmethod
    def validate_referral_token(token):
        """
        Validate a referral token
        
        Args:
            token (str): Referral token to validate
            
        Returns:
            dict: {'valid': bool, 'token_obj': JWTToken or None, 'message': str}
        """
        try:
            if not token:
                return {'valid': False, 'token_obj': None, 'message': 'No referral token provided'}
            
            # Validate using JWTToken model
            validation_result = JWTToken.validate_referral_token(token)
            
            if not validation_result['valid']:
                return {
                    'valid': False, 
                    'token_obj': None, 
                    'message': 'Invalid or expired referral token'
                }
            
            return {
                'valid': True, 
                'token_obj': validation_result['token'], 
                'message': 'Valid referral token',
                'referrer': validation_result['referrer'],
                'rewards': validation_result['rewards']
            }
            
        except Exception as e:
            logger.error(f"Error validating referral token: {e}")
            return {'valid': False, 'token_obj': None, 'message': 'Error validating referral token'}
    
    @staticmethod
    def use_referral_token(token, user):
        """
        Use a referral token for a user
        
        Args:
            token (str): Referral token to use
            user (User): User who is using the token
            
        Returns:
            dict: {'success': bool, 'message': str, 'rewards': dict}
        """
        try:
            # Validate the token first
            validation_result = ReferralService.validate_referral_token(token)
            if not validation_result['valid']:
                return {
                    'success': False, 
                    'message': validation_result['message'],
                    'rewards': None
                }
            
            referral_token = validation_result['token_obj']
            
            # Check if user already has a referrer
            if user.referred_by:
                return {
                    'success': False,
                    'message': 'User already has a referrer',
                    'rewards': None
                }
            
            # Use the token
            with transaction.atomic():
                success = referral_token.use_for_referral(user)
                
                if success:
                    rewards = {
                        'referrer_reward': float(referral_token.referrer_reward),
                        'referee_reward': float(referral_token.referee_reward)
                    }
                    
                    logger.info(f"Referral token {token} used successfully by user {user.email}")
                    
                    return {
                        'success': True,
                        'message': 'Referral token used successfully',
                        'rewards': rewards,
                        'referrer': referral_token.user
                    }
                else:
                    return {
                        'success': False,
                        'message': 'Failed to use referral token',
                        'rewards': None
                    }
                    
        except Exception as e:
            logger.error(f"Error using referral token: {e}")
            return {
                'success': False,
                'message': 'Error using referral token',
                'rewards': None
            }
    
    @staticmethod
    def create_referral_token(user, expires_days=30, max_uses=1, referrer_reward=0, referee_reward=0, campaign_name=None):
        """
        Create a new referral token for a user
        
        Args:
            user (User): User creating the referral token
            expires_days (int): Days until token expires
            max_uses (int): Maximum number of uses
            referrer_reward (float): Reward for referrer
            referee_reward (float): Reward for referee
            campaign_name (str): Name of the campaign
            
        Returns:
            dict: {'success': bool, 'token': str or None, 'message': str}
        """
        try:
            referral_token, token_string = JWTToken.create_referral_token(
                referrer=user,
                expires_days=expires_days,
                max_uses=max_uses,
                referrer_reward=referrer_reward,
                referee_reward=referee_reward,
                campaign_name=campaign_name
            )
            
            logger.info(f"Referral token created for user {user.email}: {token_string}")
            
            return {
                'success': True,
                'token': token_string,
                'message': 'Referral token created successfully',
                'expires_at': referral_token.expires_at,
                'max_uses': referral_token.max_uses
            }
            
        except Exception as e:
            logger.error(f"Error creating referral token: {e}")
            return {
                'success': False,
                'token': None,
                'message': 'Error creating referral token'
            }
    
    @staticmethod
    def get_user_referral_stats(user):
        """
        Get referral statistics for a user
        
        Args:
            user (User): User to get stats for
            
        Returns:
            dict: Referral statistics
        """
        try:
            return user.get_referral_stats()
        except Exception as e:
            logger.error(f"Error getting referral stats: {e}")
            return {
                'total_referrals': 0,
                'successful_referrals': 0,
                'pending_referrals': 0,
                'rewards_earned': 0.0,
                'rewards_available': 0.0,
                'rewards_used': 0.0
            }
    
    @staticmethod
    def get_user_referral_tokens(user):
        """
        Get referral tokens for a user
        
        Args:
            user (User): User to get tokens for
            
        Returns:
            QuerySet: Referral tokens
        """
        try:
            return JWTToken.get_user_referral_tokens(user)
        except Exception as e:
            logger.error(f"Error getting referral tokens: {e}")
            return JWTToken.objects.none()
    
    @staticmethod
    def cleanup_expired_tokens():
        """
        Clean up expired referral tokens
        
        Returns:
            int: Number of tokens cleaned up
        """
        try:
            return JWTToken.cleanup_expired_tokens()
        except Exception as e:
            logger.error(f"Error cleaning up expired tokens: {e}")
            return 0
    
    @staticmethod
    def generate_referral_code(user):
        """
        Generate or get referral code for user
        
        Args:
            user (User): User to generate code for
            
        Returns:
            str: Referral code
        """
        try:
            return user.get_referral_code()
        except Exception as e:
            logger.error(f"Error generating referral code: {e}")
            return None
    
    @staticmethod
    def get_referral_url(user):
        """
        Get referral URL for user
        
        Args:
            user (User): User to get URL for
            
        Returns:
            str: Referral URL
        """
        try:
            return user.get_referral_url()
        except Exception as e:
            logger.error(f"Error getting referral URL: {e}")
            return None
