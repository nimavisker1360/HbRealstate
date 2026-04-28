# Video Lead Engine

This integration adds a modular video-qualified lead flow for `hbrealstate.com`.

## What was added

- Backend video collection model: `backend/models/videoModel.js`
- Backend video event collection model: `backend/models/videoEventModel.js`
- Vidmox adapter service: `backend/services/videoProvider.js`
- Video recommendation enrichment: `backend/services/videoRecommendationService.js`
- Video lead scoring utility: `backend/utils/leadScoring.js`
- Video API controller and routes:
  - `backend/controllers/videoController.js`
  - `backend/routes/videoRoute.js`
- Reusable frontend player: `frontend/src/components/video/SmartPropertyVideo.jsx`
- Frontend tracking helpers: `frontend/src/utils/videoLeadTracking.js`
- AI assistant video-card rendering in:
  - `frontend/src/components/aiSalesAgent/RecommendationCards.jsx`
  - `frontend/src/components/aiSalesAgent/ChatWindow.jsx`
  - `frontend/src/hooks/useAISalesAgent.js`
- Admin video UI: `frontend/src/components/admin/VideoManagement.jsx`

## API routes

### Public

- `GET /api/videos/property/:propertyId`
- `GET /api/videos/project/:projectId`
- `POST /api/video-events`
- `POST /api/videos/webhook`

### Admin

- `POST /api/videos/create-upload`
- `GET /api/videos/admin/all`
- `PATCH /api/videos/:videoId`

Admin routes require the existing Auth0 JWT and `requireAdminUser` middleware.

## Environment variables

Add these to the backend environment:

```env
VIDMOX_API_KEY=
VIDMOX_WEBHOOK_SECRET=
VIDMOX_BASE_URL=
VIDMOX_ACCOUNT_ID=
```

Optional exchange-rate envs already used by the AI layer are also reused for score context:

```env
ASSISTANT_TRY_PER_USD=36
ASSISTANT_USD_PER_EUR=1.08
ASSISTANT_USD_PER_GBP=1.27
```

## Vidmox adapter behavior

The adapter is intentionally isolated behind `backend/services/videoProvider.js`.

- If Vidmox config is missing, `create-upload` still creates a video record.
- Manual playback URLs can be saved immediately from the admin UI.
- Webhook verification currently supports:
  - direct secret header matching
  - an HMAC placeholder fallback

TODO:

- Confirm the official Vidmox upload-session endpoint.
- Confirm the official webhook signature algorithm.
- Replace placeholder request/verification logic with the documented contract.

## Assistant behavior

The mounted site assistant now uses the newer AI sales agent widget in `frontend/src/components/Layout.jsx`.

Video-enabled recommendation cards now support:

- inline playback
- play and progress event tracking
- single-fire milestones at 25, 50, 75, 90, completed
- contextual CTA after 60%+ watch progress
- WhatsApp CTA tracking with attribution preserved in the event payload and message body
- Similar Properties CTA that re-opens the AI assistant with a seeded follow-up prompt

## Lead scoring

`backend/utils/leadScoring.js` scores video engagement with:

- `progress_25 = +5`
- `progress_50 = +15`
- `progress_75 = +25`
- `progress_90 = +40`
- `completed = +50`
- `cta_clicked = +60`
- `2+ videos on same property/project = +30`
- `price > 400000 + citizenship intent = +30`
- `installment property + installment intent = +25`

Score buckets:

- `0-30` cold
- `31-70` warm
- `71+` hot

## Admin workflow

1. Open Admin Panel.
2. Go to the `Videos` section.
3. Choose `Property` or `Project`.
4. Select the target entity.
5. Enter title, language, hero toggle, and optional manual playback URL.
6. Optionally select a source video file to keep upload metadata attached.
7. Save or patch the playback URL when the video is ready.

## Notes

- Existing property/project pages were left intact.
- Existing lead attribution capture was reused rather than replaced.
- The video system is collection-based over the app's current raw MongoDB helper, so it fits the existing backend without forcing a persistence migration.
