# Campus Reel — Video CRUD App

A simple web app that consumes the GFG Round 1 Video API
(`https://video-api-r1.onrender.com/api`). Built with plain HTML, CSS,
and vanilla JavaScript — no framework, no build step, 3 files total.

## Features (mapped to Task 2 requirements)

- **Authentication** — register and log in; access token stored in
  `localStorage` and attached as a Bearer token on every request.
- **College-email enforcement** — registration is blocked client-side
  unless the email ends in `@rbunagpur.in`, with an inline error message.
- **Video CRUD**
  - Create: upload a video with title, description, video file, thumbnail
  - Read: browse all videos on the dashboard, view one video in detail
  - Update: edit title, description, and thumbnail (owner only)
  - Delete: remove a video with a confirm step (owner only)
- **Playback** — the video plays directly on the page with the native
  HTML5 `<video>` element.
- **Loading states** — buttons show a "Loading… / Uploading… / Saving…"
  state and disable themselves while a request is in flight; a friendly
  message appears if the (Render-hosted) API is slow to wake up.
- **Routing** — hash-based routing (`#/login`, `#/dashboard`,
  `#/video/:id`, `#/edit/:id`, `#/upload`) with a route guard that
  redirects to login if you're not authenticated.
- Fully responsive layout.

## Project structure

```
task2-video-app/
├── index.html   # single HTML shell — all pages render into #app
├── style.css    # all styling
├── app.js       # routing + API calls + all page logic
└── README.md
```

## How it works

`app.js` has one shared `apiRequest(path, method, body)` function that
every page calls. It attaches the auth token automatically, parses the
JSON response, and throws a readable error on failure. Each "page" is
just a function (`renderLogin`, `renderDashboard`, etc.) that sets
`app.innerHTML` and wires up its own form — routing is done by
listening to `hashchange` and switching on the route name.

## Setup

No build tools needed.

1. Open `index.html` directly in a browser, **or** serve the folder:
   ```bash
   npx serve .
   ```
2. Register with an `@rbunagpur.in` email.

> The API is hosted on Render's free tier and may take a few seconds to
> wake up on the first request — the app shows a friendly message if a
> request fails to connect, just try again.

## API endpoints used

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/users/register` | Create account |
| POST | `/users/login` | Log in |
| GET | `/videos` | List videos |
| GET | `/videos/:id` | Get one video |
| POST | `/videos` | Upload a video |
| PATCH | `/videos/:id` | Update a video |
| DELETE | `/videos/:id` | Delete a video |

## Note on rate limits

Video uploads are capped at 10/hour per the task instructions — this
app does not attempt to bypass that; it just surfaces the API's error
message if you hit the limit.

## Screenshots

_Add screenshots of the login, dashboard, video detail, and upload
pages here before submitting._
