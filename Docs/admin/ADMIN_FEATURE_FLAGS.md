# Admin Feature Flag Guide

The revamped admin experience is gated behind environment-driven feature flags so other roles remain unaffected while development is in progress. All flags default to `False` in `.env.example` and can be enabled per environment.

## Backend Flags (Django)

Set these in `backend/.env`:

| Variable                   | Purpose                                                  |
| -------------------------- | -------------------------------------------------------- |
| `ADMIN_FEATURES_V2`        | Master switch for new admin-only pages and APIs.         |
| `ADMIN_NOTIFICATIONS_V2`   | Enables the upgraded notification feed and bell menu.    |
| `ADMIN_ORDERS_TIMELINE`    | Exposes the end-to-end order timeline views.             |
| `ADMIN_COMMS_SENTIMENT`    | Enables sentiment analysis in communications management. |
| `ADMIN_MAPS_V1`            | Renders map-driven dashboards (requires map API key).    |
| `ADMIN_EXPORTS_AI_REPORTS` | Unlocks CSV exports and AI-assisted reports.             |

### Usage

```bash
# backend/.env
ADMIN_FEATURES_V2=True
ADMIN_NOTIFICATIONS_V2=True
ADMIN_MAPS_V1=False  # Keep disabled until map API keys are configured
```

Access the resolved flags in Django via `settings.ADMIN_FEATURE_FLAGS`.

## Frontend Flags (Vite)

Set matching variables in `frontend/.env` with the `VITE_` prefix. Vite exposes any `VITE_` prefixed variable to the client.

| Variable                        | Purpose                                                   |
| ------------------------------- | --------------------------------------------------------- |
| `VITE_ADMIN_FEATURES_V2`        | Synchronizes the master admin UI toggle with the backend. |
| `VITE_ADMIN_NOTIFICATIONS_V2`   | Enables the upgraded notification UI.                     |
| `VITE_ADMIN_ORDERS_TIMELINE`    | Shows order timeline components.                          |
| `VITE_ADMIN_COMMS_SENTIMENT`    | Displays sentiment scores and analyzer widgets.           |
| `VITE_ADMIN_MAPS_V1`            | Enables map components (requires provider key).           |
| `VITE_ADMIN_EXPORTS_AI_REPORTS` | Unlocks export/report interfaces.                         |

### Usage

```bash
# frontend/.env
VITE_ADMIN_FEATURES_V2=true
VITE_ADMIN_NOTIFICATIONS_V2=true
VITE_ADMIN_MAPS_V1=false
```

Restart the Vite dev server after changing the frontend `.env` file.

## Recommended Flow

1. Enable `ADMIN_FEATURES_V2` and `VITE_ADMIN_FEATURES_V2` together to opt into the new experience.
2. Gradually toggle sub-features (`*_NOTIFICATIONS_V2`, `*_ORDERS_TIMELINE`, etc.) when their corresponding phases are completed.
3. Keep sensitive features (maps, AI exports) disabled until credentials and audits are in place.
4. Document flag states per environment (local, staging, production) in the deployment checklist.
