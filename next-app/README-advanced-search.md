# SEO-first Next.js App (Listing + City + Type + Property)

This `next-app` now reads inventory from the existing backend API routes
(`api/index.js` + Express app), then renders server-side SEO pages:

- `/` home landing page
- `/listing`
- `/city/[city]`
- `/type/[type]`
- `/property/[slug]`
- dynamic `sitemap.xml` + `robots.txt`

Required environment variables:

```bash
NEXT_PUBLIC_SITE_URL=https://your-domain.com
INTERNAL_API_BASE_URL=https://your-domain.com
```

For local development, point `INTERNAL_API_BASE_URL` to your backend base URL
(for example `http://localhost:3000` if using Vercel API adapter).
