# Backend Enum Migration Instructions

## Summary

The frontend has been updated to handle both numeric and string enum values for flexibility. However, for consistency and clarity, the backend should return **string values** for all enums.

## Affected Enums

### 1. SubscriptionTier
**Current numeric values:**
- `0` = Free
- `1` = Starter
- `2` = Pro

**Expected string values:**
- `"free"`
- `"starter"`
- `"pro"`

**Affected endpoints:**
- `GET /admin/companies`
- `GET /companies/profile`

---

### 2. Availability
**Current numeric values:**
- `0` = Open
- `1` = NotNow
- `2` = Passive

**Expected string values:**
- `"open"`
- `"notnow"` or `"not_now"`
- `"passive"`

**Affected endpoints:**
- `GET /admin/candidates`
- `GET /admin/shortlists/:id` (candidates array)

---

### 3. SeniorityLevel
**Current numeric values:**
- `0` = Junior
- `1` = Mid
- `2` = Senior
- `3` = Lead
- `4` = Principal

**Expected string values:**
- `"junior"`
- `"mid"`
- `"senior"`
- `"lead"`
- `"principal"`

**Affected endpoints:**
- `GET /admin/candidates`
- `GET /admin/shortlists`
- `GET /admin/shortlists/:id`

---

### 4. ShortlistStatus
**Current numeric values:**
- `0` = Pending
- `1` = Processing
- `2` = Completed
- `3` = Cancelled

**Expected string values:**
- `"pending"`
- `"processing"`
- `"completed"`
- `"cancelled"`

**Affected endpoints:**
- `GET /admin/shortlists`
- `GET /admin/shortlists/:id`
- `PUT /admin/shortlists/:id/status`

---

## Implementation Notes

### Option 1: Serialize enums as strings (Recommended)
Configure the JSON serializer to output enum values as lowercase strings.

For .NET/C#:
```csharp
services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter(JsonNamingPolicy.CamelCase));
    });
```

### Option 2: Use DTOs with string properties
Create response DTOs that map enum values to strings explicitly.

---

## Frontend Compatibility

The frontend now includes normalization functions that handle both numeric and string values:

```typescript
// Example: normalizeAvailability handles both
normalizeAvailability(0)        // returns "open"
normalizeAvailability("Open")   // returns "open"
normalizeAvailability("open")   // returns "open"
```

This means the frontend will work correctly during the migration period while both formats may be returned.

---

## Testing Checklist

After backend changes, verify these admin pages:

- [ ] `/admin/companies` - Subscription tier badges display correctly
- [ ] `/admin/candidates` - Availability and seniority display correctly
- [ ] `/admin/shortlists` - Status badges and seniority labels display correctly
- [ ] `/admin/shortlists/:id` - Candidate availability and seniority display correctly

---

## Priority

This is a **low priority** cleanup task. The frontend normalizers ensure everything works with either format. However, migrating to strings improves:

1. API readability
2. Debugging experience
3. API documentation clarity
4. Client integration simplicity
