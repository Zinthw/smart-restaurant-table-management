# Smart Restaurant - Menu Management API

Base URL: `http://localhost:4000/api`
Auth Header: `Authorization: Bearer <ADMIN_TOKEN>` (Required for all Admin routes)

---

## 1. Menu Categories (Admin)

### List Categories

- **Endpoint:** `GET /admin/menu/categories`
- **Description:** Get all categories (excluding soft-deleted ones). Sorted by `sort_order` then `created_at`.

### Create Category

- **Endpoint:** `POST /admin/menu/categories`
- **Body:**
  ```json
  {
    "name": "Appetizers",
    "description": "Starters and snacks",
    "image_url": "http://...",
    "status": "active", // Optional: "active" | "inactive"
    "sort_order": 1 // Optional: integer >= 0
  }
  ```

### Update Category

- **Endpoint:** `PUT /admin/menu/categories/:id`
- **Body:** Same as Create.

### Update Status Only

- **Endpoint:** `PATCH /admin/menu/categories/:id/status`
- **Body:**
  ```json
  {
    "status": "inactive"
  }
  ```

### Delete Category (Soft Delete)

- **Endpoint:** `DELETE /admin/menu/categories/:id`

---

## 2. Menu Items (Admin)

### List Items

- **Endpoint:** `GET /admin/menu/items`
- **Query Params:**
  - `q`: Search by name (e.g., `?q=Pizza`)
  - `categoryId`: Filter by category (e.g., `?categoryId=...`)
  - `status`: Filter by status (e.g., `?status=available`)
  - `page`: Page number (default 1)
  - `limit`: Items per page (default 10)
  - `sort_by`: `price`, `name`, or `created_at`
  - `order`: `asc` or `desc`

### Get Item Detail

- **Endpoint:** `GET /admin/menu/items/:id`
- **Response:** Returns item details including `category_name`.

### Create Item

- **Endpoint:** `POST /admin/menu/items`
- **Body:**
  ```json
  {
    "category_id": "uuid-...",
    "name": "Seafood Pizza",
    "description": "Shrimp, squid, and cheese",
    "price": 150000,
    "status": "available" // "available" | "sold_out" | "hidden"
  }
  ```

### Update Item

- **Endpoint:** `PUT /admin/menu/items/:id`
- **Body:** Same as Create.

### Delete Item (Soft Delete)

- **Endpoint:** `DELETE /admin/menu/items/:id`

---

## 3. Item Photos (Admin)

### Upload Photos

- **Endpoint:** `POST /admin/menu/items/:id/photos`
- **Content-Type:** `multipart/form-data`
- **Body:**
  - `photos`: Select multiple files (jpg, png, webp). max 5MB.

### Set Primary Photo

- **Endpoint:** `PATCH /admin/menu/items/:id/photos/:photoId/primary`
- **Description:** Sets this photo as the main image for the item.

### Delete Photo

- **Endpoint:** `DELETE /admin/menu/items/:id/photos/:photoId`

---

## 4. Modifiers (Admin)

### List Modifier Groups

- **Endpoint:** `GET /admin/menu/modifier-groups`

### Create Modifier Group

- **Endpoint:** `POST /admin/menu/modifier-groups`
- **Body:**
  ```json
  {
    "name": "Sugar Level",
    "selection_type": "single", // "single" | "multiple"
    "required": true, // true | false
    "min_selection": 1, // Required if multiple
    "max_selection": 1
  }
  ```

### Update Modifier Group

- **Endpoint:** `PUT /admin/menu/modifier-groups/:id`
- **Body:** Same as Create.

### List Options in Group

- **Endpoint:** `GET /admin/menu/modifier-groups/:id/options`

### Create Option

- **Endpoint:** `POST /admin/menu/modifier-groups/:id/options`
- **Body:**
  ```json
  {
    "name": "50% Sugar",
    "price_adjustment": 0 // Amount to add to base price (>= 0)
  }
  ```

### Update Option

- **Endpoint:** `PUT /admin/menu/modifier-options/:id`
- **Body:**
  ```json
  {
    "name": "Extra Cheese",
    "price_adjustment": 15000,
    "status": "active"
  }
  ```

### Attach Groups to Item

- **Endpoint:** `POST /admin/menu/items/:id/modifier-groups`
- **Body:**
  ```json
  {
    "groupIds": ["uuid-group-1", "uuid-group-2"]
  }
  ```

---

## 5. Public Menu (Guest - No Auth)

### Get Digital Menu

- **Endpoint:** `GET /menu`
- **Query Params:**
  - `q`: Search items.
  - `categoryId`: Filter by category.
  - `chefRecommended`: `true` to filter recommended items.
  - `sort`: `price` | `created_at`.
  - `page`: Page number.
- **Response Structure:**
  ```json
  {
    "data": [
      {
        "id": "cat-uuid",
        "name": "Beverages",
        "items": [
          {
            "id": "item-uuid",
            "name": "Coca Cola",
            "price": "15000.00",
            "primary_photo": "/uploads/123.jpg",
            "modifiers": [
              {
                 "id": "group-uuid",
                 "name": "Ice Level",
                 "options": [...]
              }
            ]
          }
        ]
      }
    ],
    "pagination": { "page": 1, "limit": 100 }
  }
  ```
