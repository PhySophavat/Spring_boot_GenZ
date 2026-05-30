# FlexPay Frontend

This is a minimal Vite + React frontend for the FlexPay backend.

Run locally:

```bat
cd D:\project\flex-pay\flex-pay\frontend
npm install
npm run dev
```

The dev server runs on http://localhost:5173 and proxies `/api/*` to the backend at http://localhost:8082.

The app fetches `/api/` which maps to the backend root (`/`) through the proxy.
