# Admin Configuration Directory

This directory contains all configuration files for the ChefSync Kitchen admin system.

## 📁 Files Overview

### `.env.admin`
Admin-specific environment variables and settings.
- Dashboard configuration
- Notification settings
- Security parameters
- Feature flags
- Performance settings

### `admin-settings.json`
Admin dashboard UI and functionality configuration.
- Dashboard widget settings
- Navigation structure
- User permissions
- UI preferences
- Data management settings

### `system-config.yaml`
System-wide configuration for the entire ChefSync platform.
- System information
- Feature flags
- Security configuration
- Database settings
- Cache configuration
- Email settings
- File storage
- Logging configuration
- Monitoring settings
- API configuration
- Business logic rules

### `backup-config.json`
Backup and recovery configuration.
- Backup schedules
- Retention policies
- Compression and encryption
- Destination settings
- Verification settings
- Monitoring and notifications

## 🔧 Usage

### Environment Variables
Copy `.env.admin` to your backend directory and load it in your Django settings:

```python
# In settings.py
from decouple import Config, RepositoryEnv

admin_config = Config(RepositoryEnv(BASE_DIR / 'admin-config' / '.env.admin'))

# Use admin config
ADMIN_DASHBOARD_REFRESH_INTERVAL = admin_config('ADMIN_DASHBOARD_REFRESH_INTERVAL', default=30000, cast=int)
```

### Admin Settings
Load admin settings in your frontend:

```typescript
// In your admin service
import adminSettings from '../admin-config/admin-settings.json';

const getDashboardConfig = () => {
  return adminSettings.dashboard;
};
```

### System Configuration
Load system config in your backend:

```python
# In settings.py
import yaml

with open('admin-config/system-config.yaml', 'r') as file:
    system_config = yaml.safe_load(file)

# Use system config
FEATURES = system_config['features']
SECURITY_SETTINGS = system_config['security']
```

## 🚀 Quick Setup

1. **Copy configuration files to appropriate locations:**
   ```bash
   # Backend
   cp admin-config/.env.admin backend/.env.admin
   cp admin-config/system-config.yaml backend/config/
   
   # Frontend
   cp admin-config/admin-settings.json frontend/src/config/
   ```

2. **Update environment variables:**
   - Edit `.env.admin` with your specific settings
   - Update database credentials in `system-config.yaml`
   - Configure email settings
   - Set up backup destinations

3. **Load configurations in your application:**
   - Backend: Update Django settings to load admin config
   - Frontend: Import admin settings in your admin components

## 📋 Configuration Categories

### Dashboard Settings
- Refresh intervals
- Widget configuration
- Default views
- Auto-refresh settings

### Navigation Settings
- Menu structure
- Permission-based visibility
- Icon configuration
- Sub-menu organization

### Security Settings
- Session timeouts
- Login attempt limits
- Password policies
- CORS configuration

### Performance Settings
- Cache configuration
- Pagination sizes
- Bulk operation limits
- API rate limits

### Monitoring Settings
- Health check endpoints
- Metrics collection
- Performance thresholds
- Alert configurations

## 🔒 Security Notes

- Never commit sensitive configuration files to version control
- Use environment variables for secrets
- Regularly rotate encryption keys
- Monitor configuration changes
- Implement access controls for configuration management

## 📊 Monitoring

The configuration files support comprehensive monitoring:
- System health checks
- Performance metrics
- Security event logging
- Backup status monitoring
- User activity tracking

## 🛠️ Maintenance

- Regularly review and update configurations
- Test configuration changes in development first
- Document any custom configurations
- Keep backup copies of working configurations
- Monitor configuration impact on system performance

## 📞 Support

For configuration-related issues:
1. Check the configuration file syntax
2. Verify environment variable loading
3. Test configuration changes in isolation
4. Review system logs for configuration errors
5. Consult the main system documentation

---

**Note**: Always test configuration changes in a development environment before applying them to production.
