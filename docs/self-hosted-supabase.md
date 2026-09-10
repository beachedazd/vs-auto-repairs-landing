# VS Auto website backend on self-hosted Supabase

The public HTML and assets continue to use the existing Netlify website. Square webhook processing now targets the VS Auto Repairs self-hosted Supabase project; Supabase is the backend, not a replacement static-page host.

- Website: https://vs-auto-repairs-carrum-downs.netlify.app
- Existing Square notification path: `/hooks/square` (kept stable by a small Netlify forwarding function).
- Backend: https://170.64.164.253:8451/functions/v1/vsauto-square-webhook
- Project manager: https://170.64.164.253/projects/b4cd9a880ca5
- Source: `supabase/functions/vsauto-square-webhook/`.
- Receipt schema: `supabase/migrations/202609100001_square_webhook.sql`.

The forwarding function preserves the exact raw body and Square signature header. The backend validates HMAC using the original registered notification URL, then durably claims the event before doing a plate lookup. Replayed completed events skip processing. Provider/storage failures return 503 so Square can retry rather than silently losing the event. Receipt rows contain event metadata and status, not customer payloads. They are inaccessible to anonymous/authenticated database roles.

The existing behaviour remains: a `vehicle-rego` customer custom-attribute event looks up the vehicle and writes the `vehicle` summary attribute in Square. This legacy summary is independent of the workshop OMS's customer-to-many-vehicles model. No vehicle/customer transfer is inferred from it.

The runtime's JWT check is bypassed only for this named webhook, which requires a valid Square signature. Other functions retain the original JWT check. Database and connection credentials stay server-side.

Deployment uses the existing managed project's function volume and a project-only Compose override. The secrets file `.vsauto-functions.env` resides on the server with restricted permissions. The old main function source is backed up there as `main-before-vsauto-webhook.ts`. The original Netlify webhook source was backed up outside this public site's publish directory.

Verify an unsigned request is rejected, a signed inert migration event reaches the backend, and an identical event is acknowledged without reprocessing. Real customer attribute changes/PlateAPI calls were not used for migration acceptance. The automated mapping and provider-failure tests use mock providers.

For rollback, restore the previous Netlify function and its original secret settings from the private backup, then publish that reviewed version. Do not roll back workshop database state or modify another Supabase project's stack to revert this website proxy.

The published proxy was verified end-to-end: HTTP 403 for an invalid signature, HTTP 200 for a signed inert event, and an idempotent acknowledgement on replay. The landing-page HTML checksum matched the existing source. Provider variables were removed from the Netlify site after successful backend verification; the active proxy needs no provider secrets.
