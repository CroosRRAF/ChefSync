## Google Authentication Fix Summary

- Restored removed user contact fields (phone number, gender, address) via migration `0011_restore_user_contact_fields`.
- Ensured Django migrations run successfully (`manage.py migrate`).
- Confirmed Google OAuth login completes end-to-end after schema fix.
- Updated frontend customer service API paths to use `/api/auth/` routes, eliminating 404s when fetching profiles post-login.
- Seeded default cook and delivery-agent document types with migration `0012_seed_default_document_types`, so document uploads work on any fresh clone.
- Normalized document type data in `SimpleDocumentUpload` to handle both string and array formats from the API.
