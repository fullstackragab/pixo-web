# Admin Companies API - Backend Requirements

## Endpoint

```
GET /admin/companies
```

## Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `page` | number | Yes | Page number (1-indexed) |
| `pageSize` | number | Yes | Number of items per page (default: 20) |
| `search` | string | No | Search query for company name or email |
| `tier` | number | No | Filter by subscription tier: `0` = Free, `1` = Starter, `2` = Pro |

## Expected Response Format

```json
{
  "items": [
    {
      "id": "string",
      "userId": "string",
      "companyName": "string",
      "email": "string",
      "industry": "string | null",
      "companySize": "string | null",
      "website": "string | null",
      "subscriptionTier": 0,
      "subscriptionExpiresAt": "2024-12-31T00:00:00Z | null",
      "messagesRemaining": 10,
      "shortlistsCount": 5,
      "savedCandidatesCount": 25,
      "createdAt": "2024-01-01T00:00:00Z",
      "lastActiveAt": "2024-01-15T00:00:00Z"
    }
  ],
  "totalCount": 100,
  "page": 1,
  "pageSize": 20,
  "totalPages": 5
}
```

## Field Descriptions

### Company Object

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique company identifier |
| `userId` | string | Associated user ID |
| `companyName` | string | Name of the company |
| `email` | string | Company contact email |
| `industry` | string \| null | Industry category |
| `companySize` | string \| null | Size range (e.g., "1-10", "11-50") |
| `website` | string \| null | Company website URL |
| `subscriptionTier` | number | Enum value: `0` = Free, `1` = Starter, `2` = Pro |
| `subscriptionExpiresAt` | string \| null | ISO 8601 date string or null |
| `messagesRemaining` | number | Number of messages left in quota |
| `shortlistsCount` | number | Total number of shortlists created |
| `savedCandidatesCount` | number | Total number of saved candidates |
| `createdAt` | string | ISO 8601 date string when company was created |
| `lastActiveAt` | string | ISO 8601 date string of last activity |

### Pagination Object

| Field | Type | Description |
|-------|------|-------------|
| `totalCount` | number | Total number of companies matching the query |
| `page` | number | Current page number |
| `pageSize` | number | Number of items per page |
| `totalPages` | number | Total number of pages |

## Subscription Tier Enum

```
0 = Free
1 = Starter
2 = Pro
```

## Example Request

```
GET /admin/companies?page=1&pageSize=20&search=acme&tier=1
```

## Example Response

```json
{
  "items": [
    {
      "id": "comp_abc123",
      "userId": "user_xyz789",
      "companyName": "Acme Corporation",
      "email": "hr@acme.com",
      "industry": "Technology",
      "companySize": "51-200",
      "website": "https://acme.com",
      "subscriptionTier": 1,
      "subscriptionExpiresAt": "2025-06-30T23:59:59Z",
      "messagesRemaining": 45,
      "shortlistsCount": 12,
      "savedCandidatesCount": 89,
      "createdAt": "2024-03-15T10:30:00Z",
      "lastActiveAt": "2024-12-20T14:22:00Z"
    }
  ],
  "totalCount": 1,
  "page": 1,
  "pageSize": 20,
  "totalPages": 1
}
```

---

## Additional Endpoint: Update Messages

```
PUT /admin/companies/{companyId}/messages
```

### Request Body

```json
{
  "messagesRemaining": 100
}
```

### Response

```json
{
  "success": true
}
```

---

## Notes for Backend

1. The `subscriptionTier` must be returned as a **number** (0, 1, or 2), not a string
2. All date fields should be in **ISO 8601 format**
3. The response must be wrapped - the frontend expects `res.data.items` and `res.data.totalCount`
4. Null values are acceptable for optional fields (`industry`, `companySize`, `website`, `subscriptionExpiresAt`)
5. Counts (`shortlistsCount`, `savedCandidatesCount`) should be computed server-side
