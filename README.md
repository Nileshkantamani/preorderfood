# PreOrderFood – Project Overview

Restaurant pre-order platform with 3 roles: **Customer**, **Restaurant**, and **Admin**.

This document describes the **complete module & page breakdown** for both backend and frontend, and maps directly to the implementation.

---

## 🎯 Backend Modules

### 1. Models (Database Tables)

Folder: `backend/app/models/` (implemented via core `models.py` and this package)

- **`user.py` (conceptual)**  
  Base user data (implemented in `models.py` as `User`):
  - `id`
  - `email`
  - `password_hash`
  - `role` (`customer | restaurant | admin`)
  - `created_at`

- **`customer.py` (conceptual)**  
  Customer profile (implemented in `models.py` as `Customer`):
  - `id` (FK → `users.id`)
  - `name`
  - `phone`

- **`restaurant.py` (conceptual)**  
  Restaurant details (implemented in `models.py` as `Restaurant`):
  - `id` (FK → `users.id`)
  - `restaurant_name`
  - `business_phone`
  - `state`
  - `city`
  - `address`
  - `pincode`
  - `opening_time`
  - `closing_time`
  - `menu` (JSON; categories + items)
  - `status` (`PENDING | APPROVED | REJECTED`)
  - `created_at`

- **`order.py` (conceptual)**  
  Orders table (implemented in `models.py` as `Order`):
  - `id`
  - `customer_id` (FK → `customers.id`)
  - `restaurant_id` (FK → `restaurants.id`)
  - `arrival_time`
  - `number_of_people`
  - `items` (JSON: `[{item_name, quantity, price}]`)
  - `total_amount`
  - `status` (`PENDING | ACCEPTED | REJECTED | COMPLETED`)
  - `payment_status` (`PENDING | COMPLETED`)
  - `created_at`

> Note: The conceptual split into `user.py`, `customer.py`, etc. is grouped into a single `models.py` for simplicity, re-exported via `app/models/__init__.py`.

---

### 2. Schemas (Pydantic Request/Response)

Folder: `backend/app/schemas/` (implemented in core `schemas.py` and re-exported).

- **`auth.py` (conceptual)**
  - `LoginRequest`
  - `CustomerRegisterRequest`
  - `RestaurantRegisterRequest`
  - `Token` / `TokenResponse`

- **`customer.py` (conceptual)**
  - `CustomerProfile`
  - `CustomerUpdate`

- **`restaurant.py` (conceptual)**
  - `RestaurantProfileResponse`
  - `RestaurantUpdate` (future)
  - `RestaurantMenuCategory`, `RestaurantMenuItem`, `MenuSchema` (menu JSON)

- **`order.py` (conceptual)**
  - `OrderItem`
  - `CreateOrderRequest`
  - `OrderResponse`

- **`admin.py` (conceptual)**
  - `PendingRestaurant` / `PendingRestaurantResponse`
  - `ApprovalRequest` (not strictly required because approve/reject use path params)

---

### 3. Routes (API Endpoints)

Folder: `backend/app/routes/`

- **`auth.py`**
  - `POST /auth/register/customer`
  - `POST /auth/register/restaurant`
  - `POST /auth/login`

- **`customer.py`**
  - `GET /restaurants` – list approved restaurants
  - `GET /menu/{id}` – get menu JSON for restaurant
  - `POST /order` – create order
  - `POST /payment` – mock payment
  - `GET /customer/orders` – customer order history
  - `GET /customer/profile` – (can be added if needed)

- **`restaurant.py`**
  - `GET /restaurant/orders` – all orders for restaurant
  - `POST /restaurant/order/{id}/accept`
  - `POST /restaurant/order/{id}/reject`
  - `GET /restaurant/profile`

- **`admin.py`**
  - `GET /admin/pending-restaurants`
  - `POST /admin/approve/{id}`
  - `POST /admin/reject/{id}`

---

### 4. Utils (Helper Functions)

Folder: `backend/app/utils/`

- **`auth.py`**
  - `hash_password()` – bcrypt hashing
  - `verify_password()` – bcrypt verification
  - `create_access_token()` – JWT issue (24h expiry)
  - `get_current_user()` – parse JWT and load user
  - `require_role(role)` – role-based guard
  - `get_current_admin`, `get_current_customer`, `get_current_restaurant`

- **`dependencies.py` (conceptual)**
  - `get_db()` – provided in `database.py` and used as dependency.

- **`validators.py` (future)**
  - `validate_phone()`
  - `validate_pincode()`
  - `validate_menu()`

These can be implemented as needed to centralize validation logic.

---

## 🎯 Frontend Modules

### 1. Components (Reusable UI)

Folder: `frontend/src/components/`

- **`Navbar.jsx`** – Global navigation bar (used on every page).  
  Shows app name on the left; auth links on the right; role-based links when logged in.

- **`Footer.jsx` (planned)** – Footer for public pages with links: About, Contact, Privacy.

- **`Button.jsx` (planned)** – Standardized button styles.

- **`Input.jsx` (planned)** – Standardized input field styles.

- **`Card.jsx` (planned)** – Generic card container.

- **`Modal.jsx` (planned)** – Modal / dialog component.

- **`MenuBuilder.jsx` (partially implemented in `RestaurantRegisterPage`)** –  
  Dynamic category + items builder used for restaurant registration.

- **`MenuDisplay.jsx` (planned)** – Menu for customer ordering with checkboxes and quantity controls.

- **`OrderCard.jsx` (planned)** – Compact order summary component for lists.

- **`RestaurantCard.jsx` (planned)** – Restaurant tile in the customer dashboard grid.

- **`Loader.jsx` (planned)** – Loading spinner / skeleton component.

- **`Toast.jsx` (planned)** – Notification/toast component for success/error messages.

- **`ProtectedRoute.jsx` (planned)** – Route guard wrapper to enforce role-based access.

---

### 2. Pages

Folder: `frontend/src/pages/`

#### Public Pages (No Login Required)

- **`HomePage.jsx`** – Landing page with hero and features.
- **`LoginPage.jsx`** – Universal login (auto-redirects based on role).
- **`RegisterPage.jsx`** – Role selection page.
- **`CustomerRegisterPage.jsx`** – Customer registration form.
- **`RestaurantRegisterPage.jsx`** – Restaurant registration with 2-step form + inline menu builder.

#### Customer Pages (Role: customer)

- **`CustomerDashboard.jsx` (planned)** → Route: `/customer/home`  
  Browse approved restaurants, search, and filter.

- **`RestaurantDetail.jsx` (planned)** → Route: `/customer/restaurant/:id`  
  Restaurant info + menu + order form.

- **`CustomerOrders.jsx` (planned)** → Route: `/customer/orders`  
  Order history with status/date filters.

- **`CustomerProfile.jsx` (planned)** → Route: `/customer/profile`  
  Profile edit, stats, and history.

- **`PaymentPage.jsx` (planned)** → Route: `/customer/payment/:orderId`  
  Payment interface (mock / future gateway).

- **`CustomerOrderDetail.jsx` (planned)** → Route: `/customer/order/:id`  
  Detailed order view.

#### Restaurant Pages (Role: restaurant)

- **`RestaurantPending.jsx` (planned)** → Route: `/restaurant/pending`  
  Pending approval screen.

- **`RestaurantDashboard.jsx` (planned)** → Route: `/restaurant/dashboard`  
  Incoming orders + order history tabs.

- **`RestaurantOrders.jsx` (planned)** → Route: `/restaurant/orders`  
  Full order history page.

- **`RestaurantProfile.jsx` (planned)** → Route: `/restaurant/profile`  
  Restaurant details, stats, and menu editing.

- **`RestaurantOrderDetail.jsx` (planned)** → Route: `/restaurant/order/:id`  
  Single order detail view with accept/reject.

#### Admin Pages (Role: admin)

- **`AdminLogin.jsx` (planned)** → Route: `/admin/login`  
  Admin-specific login (reuses backend `/auth/login`).

- **`AdminDashboard.jsx` (planned)** → Route: `/admin/dashboard`  
  Tabs: Pending | Approved | Rejected restaurants.

- **`RestaurantDetailAdmin.jsx` (planned)** → Route: `/admin/restaurant/:id`  
  Full restaurant details + menu for approval decision.

---

### 3. Utils (Helper Functions)

Folder: `frontend/src/utils/`

- **`api.js`** – Axios instance with base URL from `VITE_API_URL` and JWT Authorization header.

- **`auth.js` (planned)**  
  - `saveToken()`
  - `getToken()`
  - `removeToken()`
  - `getUserRole()`

- **`formatters.js` (planned)**  
  - `formatCurrency()`
  - `formatDate()`
  - `formatTime()`

- **`validators.js` (planned)**  
  - `validateEmail()`
  - `validatePhone()`
  - `validatePassword()`

---

### 4. Context (State Management)

Folder: `frontend/src/context/` (to be created)

- **`AuthContext.jsx` (planned)**  
  Holds user auth state, login/logout functions, role info.

- **`CartContext.jsx` (optional, planned)**  
  Holds cart state during customer ordering.

---

## 📄 Complete Page List by Role

### 👤 Customer Role – 6 Pages

1. `/customer/home` – **CustomerDashboard**  
   Browse approved restaurants.

2. `/customer/restaurant/:id` – **RestaurantDetail**  
   View restaurant info and menu, place order.

3. `/customer/orders` – **CustomerOrders**  
   View orders and filter by status/date.

4. `/customer/profile` – **CustomerProfile**  
   View/edit profile, stats, history.

5. `/customer/payment/:orderId` – **PaymentPage**  
   Payment for order.

6. `/customer/order/:id` – **CustomerOrderDetail**  
   Detailed view of a specific order.

---

### 🍴 Restaurant Role – 5 Pages

1. `/restaurant/pending` – **RestaurantPending**  
   Waiting for admin approval.

2. `/restaurant/dashboard` – **RestaurantDashboard**  
   Incoming orders & history tabs.

3. `/restaurant/orders` – **RestaurantOrders**  
   All orders with filters and revenue summary.

4. `/restaurant/profile` – **RestaurantProfile**  
   Edit details, view stats, edit menu.

5. `/restaurant/order/:id` – **RestaurantOrderDetail**  
   Single order detail with accept/reject.

---

### 👨‍💼 Admin Role – 3 Pages

1. `/admin/login` – **AdminLogin**  
   Admin login page.

2. `/admin/dashboard` – **AdminDashboard**  
   Pending/approved/rejected restaurants.

3. `/admin/restaurant/:id` – **RestaurantDetailAdmin**  
   Full restaurant view for approval.

---

### 🌐 Public Pages – 3 Pages

1. `/` – **HomePage**  
   Landing page with hero + feature cards + footer.

2. `/login` – **LoginPage**  
   Universal login.

3. `/register` – **RegisterPage**  
   Role selection page.

Additional public registration pages:
- `/register/customer` – **CustomerRegisterPage**
- `/register/restaurant` – **RestaurantRegisterPage**

---

## 🔐 Route Protection Summary

**Public Routes (no auth required):**
- `/`
- `/login`
- `/register`
- `/register/customer`
- `/register/restaurant`
- `/admin/login`

**Customer-only Routes:**
- `/customer/home`
- `/customer/restaurant/:id`
- `/customer/orders`
- `/customer/profile`
- `/customer/payment/:orderId`
- `/customer/order/:id`

**Restaurant-only Routes:**
- `/restaurant/pending`
- `/restaurant/dashboard`
- `/restaurant/orders`
- `/restaurant/profile`
- `/restaurant/order/:id`

**Admin-only Routes:**
- `/admin/dashboard`
- `/admin/restaurant/:id`

All protected routes will be enforced via JWT and role checks in the backend, and by `ProtectedRoute` + `AuthContext` on the frontend.

---

## ✅ Navbar on Every Page

All 17 page types are designed to include the global `Navbar` component:

- Homepage
- Login
- Register
- Register Customer
- Register Restaurant
- Customer Dashboard
- Restaurant Detail (customer)
- Customer Orders
- Customer Profile
- Payment
- Customer Order Detail
- Restaurant Pending
- Restaurant Dashboard
- Restaurant Orders
- Restaurant Profile
- Admin Login
- Admin Dashboard
- Restaurant Detail Admin

Total: **17/17 pages** with navbar.
