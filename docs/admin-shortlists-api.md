# Admin Shortlists API - Backend Requirements

## Endpoint: Get Shortlist Detail

```
GET /admin/shortlists/{id}
```

### Current Response Format (from backend)

```json
{
  "data": {
    "id": "guid",
    "companyId": "guid",
    "companyName": "string",
    "roleTitle": "string",
    "techStackRequired": "json string",
    "seniorityRequired": "junior|mid|senior|lead|principal",
    "locationPreference": "string",
    "locationCountry": "string",
    "locationCity": "string",
    "locationTimezone": "string",
    "isRemote": true,
    "additionalNotes": "string",
    "status": "pending|processing|completed|cancelled",
    "pricePaid": 0.00,
    "createdAt": "2024-01-01T00:00:00Z",
    "completedAt": "2024-01-01T00:00:00Z",
    "candidates": [
      {
        "id": "guid",
        "candidateId": "guid",
        "firstName": "string",
        "lastName": "string",
        "email": "string",
        "desiredRole": "string",
        "seniorityEstimate": "senior",
        "rank": 1,
        "matchScore": 85,
        "matchReason": "string",
        "adminApproved": true,
        "isNew": true
      }
    ]
  }
}
```

### Missing Fields (Frontend Expects These)

The frontend can handle these missing fields gracefully, but for full functionality these should be added:

#### For Shortlist Object

| Field | Type | Description |
|-------|------|-------------|
| `remoteAllowed` | boolean | Alternative to `isRemote` (frontend handles both) |
| `previousRequestId` | string \| null | ID of the previous shortlist if this is a follow-up |
| `pricingType` | string | One of: `'new'`, `'follow_up'`, `'free_regen'` |
| `followUpDiscount` | number | Discount percentage for follow-up requests |
| `isFollowUp` | boolean | Whether this is a follow-up to a previous request |
| `newCandidatesCount` | number | Count of new candidates (not in previous requests) |
| `repeatedCandidatesCount` | number | Count of repeated candidates |
| `chain` | array | Array of related shortlists in the chain |

#### Chain Item Object (for versioning/follow-ups)

```json
{
  "id": "guid",
  "roleTitle": "string",
  "createdAt": "2024-01-01T00:00:00Z",
  "candidatesCount": 5
}
```

#### For Candidate Object

| Field | Type | Description |
|-------|------|-------------|
| `skills` | string[] | Array of skill names |
| `availability` | number | Enum: `0` = Open, `1` = NotNow, `2` = Passive |
| `previouslyRecommendedIn` | string \| null | ID of previous shortlist where candidate was recommended |
| `reInclusionReason` | string \| null | Reason for re-including a repeated candidate |
| `statusLabel` | string \| null | Custom label like "New" or "Repeated" |

---

## Endpoint: Update Candidate Rankings

```
PUT /admin/shortlists/{id}/rankings
```

### Request Body

```json
{
  "rankings": [
    {
      "candidateId": "guid",
      "rank": 1,
      "adminApproved": true
    }
  ]
}
```

### Response

```json
{
  "success": true
}
```

---

## Endpoint: Update Shortlist Status

```
PUT /admin/shortlists/{id}/status
```

### Request Body

```json
{
  "status": "processing"
}
```

Valid status values: `"pending"`, `"processing"`, `"completed"`, `"cancelled"`

### Response

```json
{
  "success": true
}
```

---

## Endpoint: Deliver Shortlist

```
POST /admin/shortlists/{id}/deliver
```

Marks the shortlist as completed and notifies the company.

### Request Body

None required.

### Response

```json
{
  "success": true
}
```

---

## Endpoint: Run Matching Algorithm

```
POST /admin/shortlists/{id}/match
```

Runs the matching algorithm to find candidates for this shortlist.

### Request Body

None required.

### Response

```json
{
  "success": true
}
```

After this call, the frontend will reload the shortlist to get the updated candidates.

---

## Notes for Backend

1. **techStackRequired**: Currently returned as a JSON string. The frontend now parses this, but returning it as an actual array would be cleaner.

2. **seniorityRequired/seniorityEstimate**: Currently returned as strings (`"junior"`, `"senior"`, etc.). The frontend now handles both string and numeric formats.

3. **status**: Must be returned as a lowercase string (`"pending"`, `"processing"`, `"completed"`, `"cancelled"`). The frontend normalizes this but prefers lowercase strings.

4. **isRemote vs remoteAllowed**: The frontend checks for both field names. Recommend using `remoteAllowed` for consistency with the interface.

5. **skills array**: Important for displaying candidate skills. If not available, the frontend shows nothing.

6. **availability**: Important for showing availability badge. If not provided, defaults to "Open" (0).

7. **Response wrapping**: The response uses `data` wrapper which is handled correctly by the API client.
