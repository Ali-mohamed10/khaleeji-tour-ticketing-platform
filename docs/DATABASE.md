# Database Schema & Migrations

Khaleeji Tour uses **Supabase PostgreSQL** with Row-Level Security (RLS) and atomic PL/pgSQL RPCs. All schema changes are tracked sequentially in `book-ticket/src/lib/migrations/` (`001_profiles.sql` through `036_performance_indexes_and_thumbnails.sql`).

## Core Tables

| Table | Purpose |
| :--- | :--- |
| `profiles` | Extended user profiles linked to `auth.users` with RBAC `role` (`customer`, `admin`, `editor`, `gate_staff`) |
| `events` | Event metadata (`title_en`, `title_ar`, `slug`, `description_en`, `description_ar`, `venue_en`, `venue_ar`, `cover_image_url`, `thumbnail_url`, `status`) |
| `seat_maps` | SVG seat map definitions and venue metadata |
| `tables` | Individual tables belonging to a seat map (`table_code`, `svg_element_id`, `category`, `capacity`, `price`, `booked_seats`, `status`) |
| `bookings` | Reservation & payment records (`status`: `PENDING`, `PAID`, `CANCELLED`, `REFUNDED`, `EXPIRED`, `stripe_checkout_session_id`, `expires_at`) |
| `booking_items` | Line items linking `bookings` to `tables` and seat counts |
| `payments` | Stripe payment intent records and idempotency tracking |
| `tickets` | Issued digital tickets (`ticket_code`, `qr_code_data`, `is_used`, `used_at`) |
| `coupons` | Event/global percentage discount codes (`code`, `discount_percent`, `max_uses`, `used_count`) |
| `event_videos` | Promotional video metadata linked to events |
| `event_registrations` | Press conference / free event registrations with QR check-in tracking |

## Consistency & Security

- **Atomic Seat Locking**: `create_table_reservation` locks target table rows inside a database transaction (`FOR UPDATE`) to prevent double booking under concurrent requests.
- **Expiration**: `expire_stale_reservations` releases unpaid `PENDING` bookings after their 15-minute hold window expires and recalculates `tables.booked_seats`.
- **RLS**: Public users can read published events and table availability; users can only view their own bookings and tickets; administrative mutations require `admin` / `editor` / `gate_staff` roles or server-side `service_role` execution.
