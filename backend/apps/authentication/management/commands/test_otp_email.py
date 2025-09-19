"""
Django management command to test and manage OTP emails
Usage: python manage.py test_otp_email your@email.com
"""
from django.core.management.base import BaseCommand
from django.conf import settings
from apps.authentication.services.email_service import EmailService
from apps.authentication.models import EmailOTP
from django.utils import timezone


class Command(BaseCommand):
    help = 'Test OTP email sending and show generated OTPs for debugging'

    def add_arguments(self, parser):
        parser.add_argument('email', type=str, help='Email address to send OTP to')
        parser.add_argument(
            '--purpose',
            type=str,
            default='registration',
            choices=['registration', 'password_reset'],
            help='Purpose of the OTP'
        )
        parser.add_argument(
            '--show-recent',
            action='store_true',
            help='Show recent OTPs for this email'
        )
        parser.add_argument(
            '--cleanup',
            action='store_true',
            help='Clean up expired OTPs'
        )

    def handle(self, *args, **options):
        email = options['email']
        purpose = options['purpose']

        self.stdout.write(
            self.style.SUCCESS(f'Testing OTP email for: {email}')
        )

        # Show recent OTPs first
        if options['show_recent']:
            self.show_recent_otps(email)

        # Clean up expired OTPs
        if options['cleanup']:
            self.cleanup_expired_otps()

        # Send new OTP
        self.stdout.write('\nSending new OTP...')
        
        try:
            result = EmailService.send_otp(email, purpose, 'Test User')
            
            if result['success']:
                self.stdout.write(
                    self.style.SUCCESS(f'✅ {result["message"]}')
                )
                
                # Show the generated OTP for debugging
                latest_otp = EmailOTP.objects.filter(
                    email=email, 
                    purpose=purpose
                ).order_by('-created_at').first()
                
                if latest_otp:
                    self.stdout.write(
                        self.style.WARNING(
                            f'\n🔍 DEBUG INFO:\n'
                            f'   OTP: {latest_otp.otp}\n'
                            f'   Created: {latest_otp.created_at}\n'
                            f'   Expires: {latest_otp.expires_at}\n'
                            f'   Valid: {latest_otp.is_valid()}\n'
                        )
                    )
                
                self.stdout.write(
                    '\n📧 Email should be sent. If not received:\n'
                    '   1. Check your spam/junk folder\n'
                    '   2. Check email server logs\n'
                    '   3. Verify email address is correct\n'
                    '   4. Try with a different email provider\n'
                )
                
            else:
                self.stdout.write(
                    self.style.ERROR(f'❌ Failed: {result["message"]}')
                )
                
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'❌ Exception occurred: {e}')
            )

    def show_recent_otps(self, email):
        """Show recent OTPs for debugging"""
        self.stdout.write('\n📋 Recent OTPs:')
        
        recent_otps = EmailOTP.objects.filter(email=email).order_by('-created_at')[:5]
        
        if recent_otps:
            for otp in recent_otps:
                status = '✅ Valid' if otp.is_valid() else '❌ Invalid/Used/Expired'
                self.stdout.write(
                    f'   {otp.otp} | {otp.purpose} | {otp.created_at.strftime("%Y-%m-%d %H:%M")} | {status}'
                )
        else:
            self.stdout.write('   No recent OTPs found')

    def cleanup_expired_otps(self):
        """Clean up expired OTPs"""
        expired_count = EmailOTP.objects.filter(
            expires_at__lt=timezone.now()
        ).delete()[0]
        
        self.stdout.write(
            self.style.WARNING(f'🧹 Cleaned up {expired_count} expired OTPs')
        )