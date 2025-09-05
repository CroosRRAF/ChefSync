# Forgot Password with OTP Implementation

## Overview
Implemented a complete forgot password flow using OTP (One-Time Password) verification instead of email links.

## Flow Description

### Step 1: Email Entry
- User enters their email address
- System validates if the email exists in the database
- If email doesn't exist: Shows error "No account found with this email address"
- If email exists: Sends 6-digit OTP to the email

### Step 2: OTP Verification + Password Reset
- User enters the 6-digit OTP code
- User enters new password and confirms it
- System verifies OTP and updates password
- User is redirected to login page

## Backend Changes

### New API Endpoints
1. `POST /api/auth/password/reset/request/` - Send OTP for password reset
2. `POST /api/auth/password/reset/confirm/` - Verify OTP and reset password

### Backend Features
- **Email Validation**: Checks if user exists before sending OTP
- **OTP Verification**: Uses EmailService.verify_otp() for password_reset purpose
- **Password Validation**: Django's built-in password validation
- **Error Handling**: Specific error messages for different scenarios

### Request/Response Format

#### Send OTP Request
```json
POST /api/auth/password/reset/request/
{
  "email": "user@example.com"
}
```

#### Send OTP Response
```json
// Success
{
  "message": "Password reset code sent to your email"
}

// Email not found
{
  "error": "No account found with this email address"
}
```

#### Reset Password Request
```json
POST /api/auth/password/reset/confirm/
{
  "email": "user@example.com",
  "otp": "123456",
  "new_password": "newPassword123",
  "confirm_password": "newPassword123"
}
```

#### Reset Password Response
```json
// Success
{
  "message": "Password reset successful"
}

// OTP Invalid
{
  "error": "Invalid verification code"
}

// Passwords don't match
{
  "error": "Passwords don't match"
}
```

## Frontend Changes

### New Component Structure
- **Step 1**: Email form with validation
- **Step 2**: OTP + Password form with validation
- **Timer**: 10-minute countdown for OTP expiry
- **Resend**: Ability to resend OTP after timer expires

### User Experience Features
- **Real-time Validation**: Form validation using react-hook-form + zod
- **Password Visibility Toggle**: Eye icons to show/hide passwords
- **Timer Display**: Shows remaining time for OTP validity
- **Error Messages**: Specific error messages from backend
- **Success Feedback**: Toast notifications for user feedback
- **Auto-redirect**: Redirects to login page after successful password reset

### Form Validation
- **Email**: Must be valid email format
- **OTP**: Must be exactly 6 digits
- **Password**: Minimum 8 characters
- **Confirm Password**: Must match new password

## Error Handling

### Backend Errors
1. **Email not found**: "No account found with this email address"
2. **Invalid OTP**: "Invalid verification code"
3. **Expired OTP**: "Verification code has expired"
4. **Used OTP**: "This verification code has already been used"
5. **Password mismatch**: "Passwords don't match"
6. **Weak password**: Django password validation messages

### Frontend Error Display
- Toast notifications for user-friendly feedback
- Form field errors below inputs
- Network error handling for connectivity issues

## Security Features

### OTP Security
- **Time-limited**: 10-minute expiry
- **Single-use**: OTP becomes invalid after successful use
- **Purpose-specific**: OTP is tied to 'password_reset' purpose
- **Email-specific**: OTP is tied to specific email address

### Password Security
- Django's built-in password validation
- Password confirmation requirement
- Secure password hashing

## Testing Scenarios

### Happy Path
1. Enter existing email → OTP sent
2. Enter correct OTP + valid password → Password reset successful
3. Login with new password → Success

### Error Scenarios
1. **Non-existent email**: Error message displayed
2. **Invalid OTP**: Error message, can retry
3. **Expired OTP**: Can request new OTP
4. **Weak password**: Password validation errors
5. **Password mismatch**: Validation error
6. **Network issues**: Connection error messages

## Usage Instructions

### For Users
1. Go to forgot password page
2. Enter your email address
3. Check email for 6-digit code
4. Enter code and new password
5. Confirm password and submit
6. Login with new password

### For Developers
- Frontend: http://localhost:8081/auth/forgot-password
- Backend endpoints ready for testing
- OTP emails sent via configured email service
- All error cases handled with appropriate messages

## Files Modified

### Backend
- `backend/apps/authentication/views.py` - Updated password reset endpoints
- `backend/apps/authentication/urls.py` - Updated URL patterns
- Uses existing `EmailService` and `EmailOTP` models

### Frontend
- `frontend/src/pages/auth/ForgotPassword.tsx` - Complete rewrite
- `frontend/src/services/authService.ts` - Updated API endpoint URL

## Future Enhancements
- Rate limiting for OTP requests
- Account lockout after multiple failed attempts
- SMS OTP as alternative to email
- Progress indicator for multi-step process
- Remember email across sessions
