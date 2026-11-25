# WasteNet – API Reference

> Generated during Phase 0 audit. Base URL: `http://localhost:5000`  
> Auth: `Authorization: Bearer <JWT>` header. Token expires in 7 days.

---

## Auth Routes  `/api/auth`

Rate-limited: 10 requests / 15 min per IP.

### `POST /api/auth/register`
Create a new citizen account. Always creates role = `citizen`.

**Auth:** None

**Request body (JSON)**
| Field    | Type   | Required | Notes             |
|----------|--------|----------|-------------------|
| name     | string | ✓        |                   |
| email    | string | ✓        | Must be unique    |
| password | string | ✓        | Stored as bcrypt  |

**Response 201**
```json
{
  "token": "<jwt>",
  "user": { "id": "<ObjectId>", "name": "string", "role": "citizen" }
}
```

**Error responses:** `400` name/email/password missing · email already registered  
`500` server error

---

### `POST /api/auth/login`
**Auth:** None

**Request body (JSON)**
| Field    | Type   | Required |
|----------|--------|----------|
| email    | string | ✓        |
| password | string | ✓        |

**Response 200**
```json
{
  "token": "<jwt>",
  "user": { "id": "<ObjectId>", "name": "string", "role": "citizen|admin" }
}
```

**Error responses:** `400` wrong credentials · `500` server error

---

## Complaint Routes  `/api/complaints`

General rate-limit: 100 requests / 15 min per IP.

### `GET /api/complaints/public`
List complaints publicly (no auth). Supports pagination and filtering.

**Auth:** None

**Query params**
| Param    | Type   | Notes                                      |
|----------|--------|--------------------------------------------|
| status   | string | `pending` \| `in-progress` \| `resolved`   |
| category | string | see valid categories below                 |
| search   | string | regex match on description or address      |
| page     | int    | default 1                                  |
| limit    | int    | default 10, max 50                         |

**Response 200**
```json
{
  "complaints": [ <Complaint> ],
  "total": 42,
  "page": 1,
  "pages": 5,
  "resolved": 18
}
```

---

### `GET /api/complaints/mine`
Current citizen's complaints, sorted newest first.

**Auth:** Citizen or Admin

**Response 200** – array of `<Complaint>` (no user population)

---

### `GET /api/complaints`
All complaints. Supports no filtering (returns all, newest first).

**Auth:** Admin only

**Response 200** – array of `<Complaint>` with `user: { name, email }` populated

> ⚠️ **Bug note:** AdminDashboard.jsx sends query params (`status`, `category`, `search`, `page`, `limit`) to this endpoint, but the route ignores all of them and always returns every complaint unpaginated. The frontend tries to handle both shapes (`Array` and `{complaints, total}`).

---

### `POST /api/complaints`
Submit a new complaint. Requires a photo (multipart/form-data).

**Auth:** Citizen or Admin

**Request body (multipart/form-data)**
| Field       | Type   | Required | Notes                                              |
|-------------|--------|----------|----------------------------------------------------|
| photo       | file   | ✓        | max 5 MB; uploaded to Supabase Storage             |
| description | string | ✓        | 10–500 characters                                  |
| lat         | number | ✓        |                                                    |
| lng         | number | ✓        |                                                    |
| category    | string | ✓        | one of the 6 valid categories                      |
| priority    | string |          | `low` \| `medium` \| `high`; default `medium`     |
| address     | string |          | reverse-geocoded on the frontend via Nominatim     |

**Valid categories:** `overflowing bin` · `illegal dumping` · `plastic waste` · `e-waste` · `hazardous` · `other`

**Response 201** – full `<Complaint>` document

---

### `GET /api/complaints/:id`
Get a single complaint's full detail including `statusHistory`.

**Auth:** Owner citizen OR Admin

**Response 200** – `<Complaint>` with `user: { name }` populated  
**Error responses:** `403` not authorized · `404` not found

---

### `PUT /api/complaints/:id/status`
Change a complaint's status and append to `statusHistory`.

**Auth:** Admin only

**Request body (JSON)**
| Field  | Type   | Required | Notes                                      |
|--------|--------|----------|--------------------------------------------|
| status | string | ✓        | `pending` \| `in-progress` \| `resolved`  |
| note   | string |          | Optional admin note                        |

**Response 200** – updated `<Complaint>` with `user: { name }` populated  
**Side-effect:** Sets `resolvedAt` timestamp when status becomes `resolved`.

---

### `DELETE /api/complaints/:id`
Delete a complaint.

**Auth:** Citizen (own, only if `pending`) OR Admin (any)

**Response 200** – `{ "message": "Complaint deleted" }`  
**Error responses:** `400` citizen trying to delete non-pending · `403` wrong user · `404` not found

---

## Facility Routes  `/api/facilities`

### `GET /api/facilities`
List all recycling facilities.

**Auth:** None

**Response 200** – array of `<Facility>`
```json
[
  {
    "_id": "<ObjectId>",
    "name": "Sample Recycling Centre",
    "type": "recycling centre",
    "lat": 18.5204,
    "lng": 73.8567,
    "contact": "0000000000"
  }
]
```

**Valid types:** `recycling centre` · `scrap shop` · `waste-to-energy plant`

---

### `POST /api/facilities`
Add a new facility.

**Auth:** Admin only

**Request body (JSON)**
| Field   | Type   | Required |
|---------|--------|----------|
| name    | string | ✓        |
| type    | string | ✓        |
| lat     | number | ✓        |
| lng     | number | ✓        |
| contact | string |          |

**Response 201** – `<Facility>`

> ⚠️ **Missing:** No `PUT /api/facilities/:id` (edit) or `DELETE /api/facilities/:id` (delete) endpoints exist. Phase 2 will add them.

---

## Admin Routes  `/api/admin`

### `GET /api/admin/stats`
Aggregated statistics for the admin dashboard.

**Auth:** Admin only

**Response 200**
```json
{
  "byStatus": {
    "pending": 12,
    "in-progress": 5,
    "resolved": 25
  },
  "byCategory": {
    "overflowing bin": 8,
    "illegal dumping": 7,
    "plastic waste": 6,
    "e-waste": 4,
    "hazardous": 3,
    "other": 14
  },
  "complaintsPerDay": [
    { "date": "2026-10-10", "count": 3 }
  ],
  "avgResolutionHours": 36.5
}
```

> `avgResolutionHours` is `null` if no complaints are resolved yet.

---

## Data Schemas

### `<Complaint>`
| Field          | Type            | Notes                                       |
|----------------|-----------------|---------------------------------------------|
| _id            | ObjectId        |                                             |
| user           | ObjectId → User | populated as `{ name }` or `{ name, email }` depending on endpoint |
| description    | string          | 10–500 chars                                |
| photoUrl       | string          | Supabase public URL                         |
| lat            | number          |                                             |
| lng            | number          |                                             |
| status         | string          | `pending` \| `in-progress` \| `resolved`   |
| category       | string          | one of 6 valid values                       |
| priority       | string          | `low` \| `medium` \| `high`                |
| address        | string          | optional                                    |
| statusHistory  | array           | `[{ status, note, changedAt }]`             |
| resolvedAt     | Date            | set when status = resolved                  |
| createdAt      | Date            | Mongoose timestamp                          |
| updatedAt      | Date            | Mongoose timestamp                          |

### `<Facility>`
| Field   | Type     | Notes                                                   |
|---------|----------|---------------------------------------------------------|
| _id     | ObjectId |                                                         |
| name    | string   |                                                         |
| type    | string   | `recycling centre` \| `scrap shop` \| `waste-to-energy plant` |
| lat     | number   |                                                         |
| lng     | number   |                                                         |
| contact | string   | optional                                                |

### `<User>`
| Field     | Type     | Notes                        |
|-----------|----------|------------------------------|
| _id       | ObjectId |                              |
| name      | string   |                              |
| email     | string   | unique                       |
| password  | string   | bcrypt hash, never returned  |
| role      | string   | `citizen` \| `admin`         |
| createdAt | Date     |                              |
| updatedAt | Date     |                              |

---

## Known Bugs / Gaps (Phase 0 findings)

1. **`GET /api/complaints` ignores all query params.** Admin dashboard sends `page`, `limit`, `status`, `category`, `search` but the backend returns all complaints. The frontend silently handles both response shapes.
2. **No edit/delete for facilities.** Phase 2 adds `PUT /api/facilities/:id` and `DELETE /api/facilities/:id`.
3. **No user profile endpoints.** No `GET /api/auth/me`, `PUT /api/auth/profile`, or `PUT /api/auth/password`. Phase 2 will add these.
4. **No notifications model or endpoints.** Phase 2 adds a `Notification` model and endpoints.
5. **Supabase URL in .env is the REST API URL**, not the project URL. `@supabase/supabase-js` `createClient` expects `https://<project>.supabase.co` (no `/rest/v1/` suffix). This may already be working only by coincidence with certain SDK versions — worth verifying.
