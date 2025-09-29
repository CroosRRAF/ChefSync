# Admin Management Revamp – Phase-by-Phase Plan

Purpose: Upgrade only the Admin backend/frontend in ChefSync-Dev to match the required workflow (approvals, documents, notifications, orders oversight, communications with sentiment, maps, food management, exports/analytics, AI reports) without breaking other users.

Guiding principles

- Non-breaking: additive DB migrations, backward-compatible APIs, feature-flag new UI.
- Reuse: prefer stable logic from Dev; selectively port proven pieces from Admin/01/02.
- Observable: tests for each phase; visible metrics (counts, statuses) on dashboard.
- Secure: least-privilege permissions, audit trails for sensitive actions, PII care.
- Backend-first: complete database/models/services and automated tests before touching the frontend in every phase; only ship UI once backend acceptance checks are green.

Assumptions

- Roles: customer (auto-approved), cook/chef and delivery agent (approval required), admin.
- Email & Cloudinary configured via environment variables.
- Map provider key provided later (Google/Mapbox). We’ll stub UI until key is set.

Execution cadence: Treat every phase as **backend-first**—finish model/schema changes, API endpoints, signals, and automated tests, validate with `manage.py test`, and only then unblock the corresponding frontend feature flag work. Frontend tasks listed later in a phase assume the backend checklist is complete and green.

---

## Phase 0 — Baseline and Safety Net

- Create feature branch: feature/admin-revamp (from ChefSync-Dev).
- Run backend and frontend tests; snapshot baseline failures (if any).
- Add feature flags (server + client) for admin-only features (e.g., ADMIN_FEATURES_V2).
- Document how to enable/disable flags per environment.

Acceptance checks

- Full test suite runs; no regressions outside admin scope.
- Flags default to “off” for risky UI.

---

## Phase 1 — Role-Based Registration & Approval Model

Goal: Gate registration by role; store approval lifecycle.

- Add fields to User: approval_status [pending|approved|rejected], approval_notes, approved_by, approved_at.
- Registration flow: customer => auto-approved; cook/agent => pending and must upload docs.
- Management command to seed DocumentType requirements per role.

Acceptance checks

- test_approval.py and test_pending_approvals.py (or equivalents) pass.
- New users with role cook/agent appear in pending queue; customers do not.

---

## Phase 2 — Documents & Cloudinary Proxy

Goal: Capture and review verification documents safely.

- Models: DocumentType, UserDocument (with cloudinary_public_id, content_type, size, visibility rules).
- Upload API (multipart) and validations (type/size/required per role).
- Secure proxy endpoint for admin to view/download files (no direct Cloudinary URL leaks).
- Post-approval visibility: admin can still view documents.

Acceptance checks

- test_cloudinary.py passes; document upload + proxy download validated.
- Admin can preview/download a pending user’s docs.

---

## Phase 3 — Admin Approvals API & UI

Goal: Approve/Reject with notes and email.

- API: list pending; approve/reject endpoints with notes; returns updated status.
- Email: templated approval/rejection with admin message.
- Frontend: Unified Approvals page with details panel and doc preview, confirm modal.

Acceptance checks

- test_pending_approvals.py and test_approval.py pass end-to-end.
- Email rendered with user name, role, and admin notes.

---

## Phase 4 — Notifications Framework (Backend + Bell UI)

Goal: Actionable notifications for admin.

- Model: Notification {type, actor, subject_id, payload, channel, read_at}.
- Triggers: new pending approval; chef-created food; bulk collaboration; delivery pickup/status; communications status changes.
- API: list (unread/all), mark-as-read, deep-link payloads.
- UI: bell with counter, dropdown, click-through to detail pages.

Acceptance checks

- Notifications appear in real time after key events (at least via poll).
- test_admin_api.py or dedicated notification tests pass.

---

## Phase 5 — Orders Oversight & Collaboration Surface

Goal: Full order timeline visibility + collaboration requests.

- API: Admin order detail with timeline: placed → cook prep → agent delivery; revenue; pickup/drop geodata.
- API/UI: Bulk collaboration requests list + status, requester/recipient, linked order(s).
- UI: Orders table + detail drawer/timeline.

Acceptance checks

- test_bulk_orders.py, test_collaboration_api.py, and order lifecycle tests pass.
- Admin can see collaboration request lifecycle and outcomes.

---

## Phase 6 — Delivery Tracking Visibility

Goal: Track delivery agent actions.

- Expose agent status (assigned, picked up, in transit, delivered) to admin.
- UI: Delivery status badges and last-known location (if available), link to map route.

Acceptance checks

- test_complete_pickup_feature.py, test_pickup_location.py pass for admin reads.
- Live status changes reflect in admin list/detail within polling interval.

---

## Phase 7 — Communications Management + Sentiment

Goal: Handle feedback/complaints with workflow and insights.

- Model/statuses: filed → investigation → replied (with notes and attachments optional).
- Admin actions: set status; choose notify via email or in-app.
- Sentiment analyzer (lightweight) to score content; surface in dashboard and detail view.

Acceptance checks

- Communications tests (create, transition, notify) pass; sentiment values stored/exposed.
- User receives chosen notification channel.

---

## Phase 8 — Food Management (Admin + Chef Submissions)

Goal: Admin CRUD for food, categories, cuisines; monitor chef-created items.

- API/UI: Create/edit/delete food items; required vs optional fields validation.
- Chef-created item triggers notification to admin; admin can review.

Acceptance checks

- test_food_creation.py passes with admin and chef flows.
- Chef submission produces a notification and appears in admin list.

---

## Phase 9 — Maps & Geo Dashboards

Goal: Spatial context for operations.

- API: chef/customer locations and order routes snapshot.
- Frontend: Map views for distribution and per-order route; provider-agnostic adapter (Google/Mapbox).
- Delivery fee overlays by proximity (read-only review for now).

Acceptance checks

- Map renders with mock key; switches to live when key present.
- Orders detail links open map route without errors.

---

## Phase 10 — Analytics, Exports, and AI Reports

Goal: Operational insights and exports.

- CSV export endpoints for users/orders with filters; UI to download.
- Charts/graphs on admin dashboard using existing analytics data.
- AI-assisted report generation to txt/markdown/pdf; downloadable artifacts.

Acceptance checks

- CSV exports match filters and schema; basic charts load.
- Report generation returns valid files and is logged/audited.

---

## Phase 10a — AI Assistant Frontend Integration

Goal: Deliver the admin-facing AI assistant UX once backend insights endpoints exist.

Cross-branch findings

- `ChefSync-Dev`, `ChefSync-01`, and `ChefSync-02` share the new admin shell; navigation copy already references “AI summary/insights” but no assistant components or routes are wired up.
- `ChefSync-Admin`’s layout adds descriptions like “Visual reports, AI insights, exports” yet the dashboard falls back to heuristics and there is no conversational surface or AI service client.
- None of the branches expose state management for threaded AI conversations; we must add it alongside feature flags so legacy builds stay stable.

Frontend deliverables

- Create an **AI workspace route** (`/admin/ai-assistant`) rendered by `frontend/src/pages/admin/AIAssistant.tsx` with tabs for “Daily Briefing”, “Chat”, and “Playbooks”. Reuse `Card`, `Tabs`, and `InteractiveChart` primitives for visual parity.
- Introduce a reusable `frontend/src/components/admin/ai/AIAssistantPanel.tsx` that wraps:
  - A summary header fed by the new backend `ai/summary/` endpoint (Phase 10 backend work).
  - A chat thread using a lightweight message store (`useAIAssistantStore` powered by Zustand, colocated in `frontend/src/store/aiAssistantStore.ts`).
  - Quick actions (`frontend/src/components/admin/ai/InsightQuickActions.tsx`) that trigger pre-defined prompts (top dishes, risky orders, staffing alerts).
- Add a dedicated service module (`frontend/src/services/aiAssistantService.ts`) with typed methods: `getDailySummary()`, `sendPrompt()`, `getPlaybook(template)`. Stub responses behind `ADMIN_FEATURES_V2` when backend is unavailable so QA can toggle between mock and live data.
- Surface entry points:
  - Add a sidebar item (“AI Assistant”) in `AdminLayout` gated by a new `ADMIN_AI_ASSISTANT` flag.
  - Provide a floating “Ask ChefSync AI” button on `Dashboard.tsx` (Dev/Admin branches share this file) that opens the panel as a drawer for contextual questions.
- Wire toast/error handling to existing utilities (`useToast`, `ErrorBoundary`) and show skeleton loaders that mirror current analytics cards while waiting on AI responses.
- Add Vitest + React Testing Library coverage for the chat reducer, the panel shell, and service fallbacks (`frontend/src/components/admin/ai/__tests__/AIAssistantPanel.test.tsx`).

Acceptance checks

- Feature flag off ⇒ no new navigation item, no bundle weight regression (>1 MB delta) confirmed via `yarn build --report`.
- Feature flag on with backend mocked ⇒ chat renders seeded conversation, quick actions populate prompts, summaries respect loading/error states.
- Feature flag on with live backend ⇒ requests hit `ai/` endpoints and responses persist in `aiAssistantStore` between route changes.
- Lighthouse interaction-to-next-paint regression under 5% thanks to lazy-loading the AI chunk.

---

## Phase 11 — Permissions, Auditing, Security

Goal: Protect sensitive actions and data.

- Role guards for all admin endpoints; row-level constraints where needed.
- Audit logs for approvals, document views/downloads, comms decisions.
- Rate limits on document downloads; PII masking in logs.

Acceptance checks

- Unauthorized access tests fail correctly; audit entries created for key events.

---

## Phase 12 — Performance & Reliability

Goal: Keep admin fast and stable.

- Pagination and server-side filtering; select_related/prefetch_related.
- Caching (safe lists) and background tasks for email/notifications.
- Error handling with consistent problem responses.

Acceptance checks

- No N+1 on core lists; p95 response within acceptable bound (dev proxy check).

---

## Phase 13 — Data Migrations, Seeding, and Rollout

Goal: Safe changes without downtime.

- Additive migrations with defaults; reversible when possible.
- Idempotent seed commands (DocumentType by role).
- Feature flags rollout: enable per feature after verification.
- Rollback notes for each feature.

Acceptance checks

- Migrations apply cleanly on fresh and existing DBs; seeds can rerun safely.

---

## Phase 14 — Documentation & Runbooks

Goal: Keep admin operable and maintainable.

- Update README/admin docs for new flows and flags.
- API reference for admin endpoints and event hooks.
- Troubleshooting guide for emails, documents, maps, and exports.

---

### Feature Flags (initial set)

- ADMIN_FEATURES_V2
- ADMIN_NOTIFICATIONS_V2
- ADMIN_ORDERS_TIMELINE
- ADMIN_COMMS_SENTIMENT
- ADMIN_MAPS_V1
- ADMIN_EXPORTS_AI_REPORTS

### Event → Notification Matrix (summary)

- User registered as cook/agent → Admin: pending approval.
- Admin approved/rejected → User: email + optional in-app.
- Chef created food item → Admin: review item.
- Bulk collaboration request → Admin: new request; updates on accept/reject.
- Delivery status changes → Admin: pickup/in-transit/delivered.
- Communication status changes → User: investigation/replied via chosen channel.

### Data Model Additions (summary)

- User: approval_status, approval_notes, approved_by, approved_at.
- DocumentType, UserDocument (cloudinary_public_id, content_type, size, visibility).
- Notification: type, actor, subject_id, payload, channel, read_at.
- Communications: status, sentiment_score, admin_notes.

Notes

- If a provider key (maps/email/cloudinary) is missing in dev, features render with graceful placeholders and no crashes.
