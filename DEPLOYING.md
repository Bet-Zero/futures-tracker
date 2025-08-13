# Deploying to Vercel

## Required environment variables

- `DISCORD_PUBLIC_KEY`
- `PUBLIC_BASE_URL`

## Interactions endpoint

Deploy the interactions handler at:

```
https://<your-domain>/api/interactions
```

## Test routes

```
GET /api/snap?url=data:text/html,<h1>ok</h1>
GET /api/snap?url=https%3A%2F%2Fexample.com
```

## Runtime logs

On Vercel, open the Runtime Logs tab and filter by:

- `path:/api/interactions`
- `path:/api/snap`
