"""
Development Email Backend Configuration
This file provides alternative email configurations for testing
"""

# For development/testing: Use console backend to see emails in terminal
DEV_EMAIL_SETTINGS = {
    'EMAIL_BACKEND': 'django.core.mail.backends.console.EmailBackend',
}

# For production: Use SMTP backend
SMTP_EMAIL_SETTINGS = {
    'EMAIL_BACKEND': 'django.core.mail.backends.smtp.EmailBackend',
    'EMAIL_HOST': 'smtp-relay.brevo.com',
    'EMAIL_PORT': 587,
    'EMAIL_USE_TLS': True,
    'EMAIL_USE_SSL': False,
    'EMAIL_HOST_USER': '96396b003@smtp-brevo.com',
    'EMAIL_HOST_PASSWORD': 'AIVn3qD2RLGZJKhU',
    'DEFAULT_FROM_EMAIL': 'chefsync7@gmail.com',
}

# Gmail SMTP alternative (if Brevo doesn't work)
GMAIL_EMAIL_SETTINGS = {
    'EMAIL_BACKEND': 'django.core.mail.backends.smtp.EmailBackend',
    'EMAIL_HOST': 'smtp.gmail.com',
    'EMAIL_PORT': 587,
    'EMAIL_USE_TLS': True,
    'EMAIL_USE_SSL': False,
    'EMAIL_HOST_USER': 'your-gmail@gmail.com',  # Replace with your Gmail
    'EMAIL_HOST_PASSWORD': 'your-app-password',  # Use App Password, not regular password
    'DEFAULT_FROM_EMAIL': 'your-gmail@gmail.com',
}