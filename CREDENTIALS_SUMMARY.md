# 🔐 Admin Access & Credentials

This file contains the essential access details for the School Portal administration.

## 🚀 Admin Entry Points
- **Direct Login URL:** `http://localhost:3000/#/lukke-core-admin-002`
- **Secret Admin Path:** `/lukke-core-admin-002`
- **Backend Django Admin:** `http://localhost:8000/admin/`

## 🔑 Security Keys
- **Administrative Registry Key:** `LUKKE-ADMIN-26`
- **Purpose:** Required when registering a new admin account via the frontend portal.

## 👤 Default Admin Account
- **Username / Email:** `admin_user@example.com`
- **Password:** `AdminPassword123!`
- **Role:** `admin`

## 🛠️ Maintenance Commands
If you ever lose access, run these in the `backend/` directory:
```bash
# Activate Environment
..\venv\Scripts\activate

# Reset/Create Admin
python manage.py createsuperuser
```

---
**⚠️ WARNING:** Keep this file private and never commit it to public version control (GitHub/GitLab).
