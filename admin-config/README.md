# Admin Configuration Directory

This directory contains configuration files for the ChefSync Admin Management System.

## Files

### `admin-settings.json`
Main configuration file for admin dashboard settings, navigation, and UI preferences.

**Key Settings:**
- Dashboard configuration (refresh intervals, widgets)
- Navigation settings (collapsed state, menu items)
- Feature flags for different admin modules
- UI preferences (theme, sidebar, descriptions)
- Notification settings
- Search configuration
- System monitoring settings

### `system-config.yaml`
System-wide configuration for the admin management system.

**Key Sections:**
- System information (name, version, environment)
- Feature toggles
- Security settings (session timeout, login attempts, password policy)
- API configuration (rate limiting, caching)
- Database settings (connection pool, query optimization)
- Monitoring configuration (health checks, metrics, alerts)
- Logging settings (level, format, retention)

### `admin.env`
Environment variables for admin-specific features.

**Key Variables:**
- Feature flags for different admin modules
- Dashboard and notification settings
- Search and monitoring configuration
- Security and performance settings
- Backup and maintenance mode settings
- API and database configuration
- Logging and audit settings

## Usage

1. **Development**: Use the default settings for local development
2. **Production**: Modify settings according to your production requirements
3. **Feature Flags**: Enable/disable specific admin features using the feature flags
4. **Customization**: Adjust UI preferences, refresh intervals, and other settings as needed

## Feature Flags

The following feature flags control different admin modules:

- `ADMIN_FEATURES_V2`: Enable enhanced admin features
- `ADMIN_NOTIFICATIONS_V2`: Enable advanced notification system
- `ADMIN_ORDERS_TIMELINE`: Enable order timeline view
- `ADMIN_COMMS_SENTIMENT`: Enable sentiment analysis for communications
- `ADMIN_MAPS_V1`: Enable map integration (requires API key)
- `ADMIN_EXPORTS_AI_REPORTS`: Enable AI-powered report generation

## Security

- All configuration files should be kept secure
- Environment variables should not be committed to version control
- Use strong passwords and secure session timeouts
- Enable audit logging for sensitive operations

## Monitoring

The system includes comprehensive monitoring capabilities:

- Health checks for system components
- Performance metrics collection
- Alert system for critical issues
- Audit logging for admin actions
- System resource monitoring

## Backup

- Automated backup system for admin data
- Configurable backup schedules and retention
- Backup compression and encryption options
- Recovery procedures for data restoration

## Support

For questions or issues with admin configuration, please refer to the main project documentation or contact the development team.