# ASocial API Documentation

Base URL: `https://YOUR_DOMAIN`

> All admin endpoints require authentication with an `ADMIN` role session cookie.

---

## Authentication

### `POST /api/auth/callback/credentials`

Login with email and password.

**Request:**
```
Content-Type: application/x-www-form-urlencoded

csrfToken=TOKEN&email=admin@asocial.app&password=admin123
```

**Response:** `302` redirect with session cookie

### `GET /api/auth/session`

Get current session info.

**Response:**
```json
{
  "user": {
    "id": "clm...",
    "name": "Ken Dao",
    "email": "admin@asocial.app",
    "role": "ADMIN",
    "isActive": true
  },
  "expires": "2026-03-17T19:14:50.818Z"
}
```

### `GET /api/auth/csrf`

Get CSRF token for form submissions.

### `GET /api/auth/providers`

List available auth providers.

---

## Admin: API Integrations

### `GET /api/admin/integrations`

List all API integrations with masked keys.

**Response:**
```json
[
  {
    "id": "clm...",
    "category": "AI",
    "provider": "openai",
    "name": "OpenAI",
    "baseUrl": "https://api.openai.com/v1",
    "config": {
      "defaultTextModel": "gpt-4o",
      "defaultImageModel": "dall-e-3"
    },
    "isActive": true,
    "isDefault": true,
    "status": "ACTIVE",
    "lastTestedAt": "2026-02-15T19:00:00Z",
    "usageCount": 0,
    "rateLimitPerSec": null,
    "hasApiKey": true,
    "apiKeyMasked": "sk-p••••••••••••••••cX4a"
  }
]
```

### `PUT /api/admin/integrations`

Update an integration's API key, status, or default models.

**Request:**
```json
{
  "id": "clm...",
  "apiKey": "sk-proj-abc123...",
  "isActive": true,
  "defaultTextModel": "gpt-4o",
  "defaultImageModel": "dall-e-3",
  "defaultVideoModel": "sora"
}
```

**Fields (all optional except `id`):**
| Field | Type | Description |
|-------|------|-------------|
| `id` | string | **Required.** Integration ID |
| `apiKey` | string | New API key (encrypted before storage) |
| `isActive` | boolean | Enable/disable integration |
| `config` | object | Custom configuration JSON |
| `defaultTextModel` | string | Default model for text/chat |
| `defaultImageModel` | string | Default model for image generation |
| `defaultVideoModel` | string | Default model for video generation |

**Response:** Updated integration object (same format as GET)

---

### `POST /api/admin/integrations/test`

Test connection for an integration.

**Request:**
```json
{ "id": "clm..." }
```

**Response:**
```json
{
  "success": true,
  "message": "OpenAI connected — 42 models available"
}
```

**Supported providers:** `vbout`, `openai`, `gemini`, `runware`

---

### `POST /api/admin/integrations/models`

Fetch available AI models for a provider. Models are categorized by type: `text`, `image`, `video`.

**Request:**
```json
{ "id": "clm..." }
```

**Response:**
```json
{
  "models": [
    {
      "id": "gpt-4o",
      "name": "gpt-4o",
      "type": "text",
      "description": "by openai"
    },
    {
      "id": "dall-e-3",
      "name": "dall-e-3",
      "type": "image",
      "description": "by openai"
    },
    {
      "id": "sora",
      "name": "sora",
      "type": "video",
      "description": "by openai"
    }
  ]
}
```

**Model types:**
| Type | Description | Providers |
|------|-------------|-----------|
| `text` | Chat/completion models | OpenAI (GPT-4o, o1, o3), Gemini (2.5 Flash/Pro) |
| `image` | Image generation | OpenAI (DALL-E 3), Gemini (Imagen), Runware (FLUX, SDXL) |
| `video` | Video generation | OpenAI (Sora), Runware (Kling, Minimax Hailuo) |

---

## Supported Integrations

| Category | Provider | Features |
|----------|----------|----------|
| **Social** | VBOUT | Social media posting, scheduling, analytics |
| **AI** | OpenAI | Text (GPT-4o, o1, o3), Image (DALL-E 3), Video (Sora) |
| **AI** | Gemini | Text (2.5 Flash/Pro), Image (Imagen 3) |
| **AI** | Runware | Image (FLUX, SDXL, Juggernaut), Video (Kling, Hailuo) |
| **Storage** | Google Drive | Media file storage |
| **Email** | SMTP | System notifications, password reset |
