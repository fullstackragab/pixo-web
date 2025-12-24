# Admin Support API - Backend Requirements

## Current Response Format (from backend)

```json
{
  "success": true,
  "data": [
    {
      "id": "17827bf2-7619-41c7-84ec-936551feef48",
      "subject": "Technical Problem",
      "userType": "anonymous",
      "status": "new",
      "createdAt": "2025-12-24T19:09:27.180116"
    }
  ],
  "message": null,
  "errors": null
}
```

## Required Response Format (for frontend)

The frontend expects a paginated response structure:

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "17827bf2-7619-41c7-84ec-936551feef48",
        "subject": "Technical Problem",
        "userType": "anonymous",
        "status": "new",
        "createdAt": "2025-12-24T19:09:27.180116"
      }
    ],
    "totalCount": 2,
    "page": 1,
    "pageSize": 20,
    "totalPages": 1
  }
}
```

## Changes Required

### 1. List Endpoint: `GET /api/admin/support/messages`

**Query Parameters:**
- `page` (int, default: 1)
- `pageSize` (int, default: 20)

**Response:** Wrap the array in a paginated object:

```json
{
  "success": true,
  "data": {
    "items": [...],           // Array of messages
    "totalCount": 100,        // Total number of messages in database
    "page": 1,                // Current page
    "pageSize": 20,           // Items per page
    "totalPages": 5           // Total pages (totalCount / pageSize)
  }
}
```

### 2. Detail Endpoint: `GET /api/admin/support/messages/{id}`

**Response:** Single message object:

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "userId": "uuid or null",
    "userType": "candidate" | "company" | "admin" | "anonymous",
    "userEmail": "user@example.com or null",
    "contactEmail": "contact@example.com or null",
    "subject": "Technical Problem",
    "message": "Full message content here...",
    "status": "new" | "read" | "replied",
    "createdAt": "2025-12-24T19:09:27.180116"
  }
}
```

### 3. Update Status Endpoint: `PUT /api/admin/support/messages/{id}/status`

**Request Body:**
```json
{
  "status": "read"
}
```

**Valid status values:** `"new"`, `"read"`, `"replied"`

**Response:**
```json
{
  "success": true,
  "data": null
}
```

## Field Mappings

| Field | Type | Description |
|-------|------|-------------|
| `id` | string (UUID) | Unique message identifier |
| `userId` | string (UUID) or null | User ID if logged in |
| `userType` | string | `"candidate"`, `"company"`, `"admin"`, or `"anonymous"` |
| `userEmail` | string or null | User's account email (if logged in) |
| `contactEmail` | string or null | Optional reply email provided in form |
| `subject` | string | Message subject |
| `message` | string | Full message content |
| `status` | string | `"new"`, `"read"`, or `"replied"` |
| `createdAt` | string (ISO 8601) | Creation timestamp |

## Notes

- The frontend handles string-based `status` and `userType` values
- Messages should be returned in descending order by `createdAt` (newest first)
- The `userType` field should reflect the user's type at the time of submission, or `"anonymous"` for guests
