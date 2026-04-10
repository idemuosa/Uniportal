# School Portal Project Structure

## 📁 Frontend Architecture (src/)

This is a feature-based modular structure optimized for scalability and maintainability.

### Directory Overview

```bash
src/
├── features/                    # Feature modules (feature-based architecture)
│   ├── auth/                   # Authentication feature
│   │   ├── Auth.tsx           # Student login/signup
│   │   ├── AdminAuth.tsx       # Admin login
│   │   └── index.ts           # Barrel export
│   │
│   ├── admin/                  # Admin management feature
│   │   ├── AdminDashboard.tsx # Admin dashboard
│   │   └── index.ts           # Barrel export
│   │
│   ├── student/                # Student portal feature
│   │   ├── StudentPortal.tsx  # Main student dashboard
│   │   ├── ClearanceForm.tsx  # Clearance processing
│   │   └── index.ts           # Barrel export
│   │
│   ├── academics/              # Academic management feature
│   │   ├── CourseRegistration.tsx # Course enrollment
│   │   ├── AdmissionForm.tsx     # Admission application
│   │   ├── Results.tsx           # Grade results
│   │   └── index.ts             # Barrel export
│   │
│   ├── finances/               # Financial management feature
│   │   ├── PaymentPortal.tsx    # Payment interface
│   │   ├── RemitaPayment.tsx    # Remita integration
│   │   ├── LoanApplicationForm.tsx # Student loans
│   │   └── index.ts             # Barrel export
│   │
│   ├── hostel/                 # Hostel management feature
│   │   ├── HostelAllocation.tsx # Hostel booking
│   │   └── index.ts            # Barrel export
│   │
│   └── index.ts                # Main features barrel export
│
├── components/                 # Reusable UI components
│   ├── CameraCapture.tsx      # Biometric capture component
│   └── index.ts               # Barrel export
│
├── layouts/                    # Layout wrappers
│   ├── Layout.tsx             # Main app layout
│   └── index.ts               # Barrel export
│
├── pages/                      # Page-level components
│   ├── Home.tsx               # Landing page
│   └── index.ts               # Barrel export
│
├── api/                        # API client configuration
│   └── axios.ts               # Axios instance & interceptors
│
├── hooks/                      # Custom React hooks (future)
│   └── README.md              # Hook documentation
│
├── utils/                      # Utility functions (future)
│   └── README.md              # Utilities documentation
│
├── types/                      # TypeScript type definitions
│   └── (auto-generated)       # From types.ts
│
├── constants/                  # App constants
│   └── (auto-generated)       # From constants.ts
│
├── App.tsx                     # Root component
├── main.tsx                    # Entry point
├── index.css                   # Global styles
└── ...config files
```

## 🎯 Feature-Based Architecture Benefits

### Why Features Over Components?

1. **Scalability** - Easy to add new features without cluttering root structure
2. **Isolation** - Each feature is self-contained with related components
3. **Parallel Development** - Teams can work on different features independently
4. **Code Reusability** - Shared utilities, hooks, and components
5. **Maintenance** - Changes to one feature don't affect others

### Feature Organization

Each feature folder contains:

- **Components** - Feature-specific React components
- **Types** - Feature-specific TypeScript interfaces (in shared types.ts)
- **API calls** - Feature data fetching (in components via api/axios)
- **index.ts** - Clean barrel exports for easy imports

## 📝 Importing Best Practices

### ✅ Good: Using barrel exports

```typescript
import { Auth, AdminAuth } from '@/features/auth';
import { CourseRegistration } from '@/features/academics';
import { Layout } from '@/layouts';
```

### ❌ Avoid: Deep relative imports

```typescript
import Auth from '../features/auth/Auth';
import CourseRegistration from '../features/academics/CourseRegistration';
```

### Path Resolution

- All imports use relative paths with appropriate depth (`../../` for 2 levels up)
- Root imports available for top-level features (api, types, constants)

## 🔧 Adding New Features

### Steps to create a new feature

1. Create feature folder: `src/features/featureName/`
2. Create feature components:

```bash
src/features/featureName/
├── Component1.tsx
├── Component2.tsx
└── index.ts
```

1. Add barrel export in `index.ts`:

```typescript
export { default as Component1 } from './Component1';
export { default as Component2 } from './Component2';
```

1. Import in App.tsx:

```typescript
import { Component1 } from '@/features/featureName';
```

## 🔄 Migration Notes

### Moved from `components/` folder

- ✅ `Auth.tsx` → `features/auth/Auth.tsx`
- ✅ `AdminAuth.tsx` → `features/auth/AdminAuth.tsx`
- ✅ `AdminDashboard.tsx` → `features/admin/AdminDashboard.tsx`
- ✅ `StudentPortal.tsx` → `features/student/StudentPortal.tsx`
- ✅ `ClearanceForm.tsx` → `features/student/ClearanceForm.tsx`
- ✅ `CourseRegistration.tsx` → `features/academics/CourseRegistration.tsx`
- ✅ `AdmissionForm.tsx` → `features/academics/AdmissionForm.tsx`
- ✅ `Results.tsx` → `features/academics/Results.tsx`
- ✅ `PaymentPortal.tsx` → `features/finances/PaymentPortal.tsx`
- ✅ `RemitaPayment.tsx` → `features/finances/RemitaPayment.tsx`
- ✅ `LoanApplicationForm.tsx` → `features/finances/LoanApplicationForm.tsx`
- ✅ `HostelAllocation.tsx` → `features/hostel/HostelAllocation.tsx`
- ✅ `Layout.tsx` → `layouts/Layout.tsx`
- ✅ `Home.tsx` → `pages/Home.tsx`
- ✅ `CameraCapture.tsx` → `components/CameraCapture.tsx` (stays)

### Import Paths Updated

- All feature components now use `../../` for shared resources (api, types, constants, firebase)
- App.tsx imports updated to new feature locations
- Barrel exports (index.ts) created for cleaner imports

```typescript
// Before
import Auth from '../components/Auth';

// After
import { Auth } from '@/features/auth';
```

## 📚 Shared Resources

### Types (`types.ts`)

Central location for all TypeScript interfaces:

```typescript
export interface UserProfile { ... }
export interface Course { ... }
export interface Payment { ... }
```

### Constants (`constants.ts`)

Centralized configuration:

```typescript
export const FACULTIES = [...]
export const DEPARTMENTS = [...]
export const SCHOOL_FEES = {...}
```

### API (`api/axios.ts`)

Configured Axios instance with interceptors:

```typescript
import api from '@/api/axios';
const response = await api.get('/accounts/user/');
```

### Firebase (`firebase.ts`)

Firebase initialization:

```typescript
import { db, auth, storage } from '@/firebase';
```

## 🚀 Development Guidelines

### File Naming

- **Components**: PascalCase (e.g., `StudentPortal.tsx`)
- **Utilities**: camelCase (e.g., `validateEmail.ts`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_FILE_SIZE`)

### Import Organization

1. React & external packages
2. Local absolute imports (@/ paths)
3. Relative imports (for same-feature imports)
4. Type imports (`import type { ... }`)

### Component Templates

Each component should follow:

```typescript
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { UserProfile } from '../../types';
import { toast } from 'sonner';

interface ComponentProps {
  user: UserProfile;
}

export default function ComponentName({ user }: ComponentProps) {
  // Component logic
  return (// JSX);
}
```

## 🔄 Migration Notes

### Moved from `components/` folder

- ✅ `Auth.tsx` → `features/auth/Auth.tsx`
- ✅ `AdminAuth.tsx` → `features/auth/AdminAuth.tsx`
- ✅ `AdminDashboard.tsx` → `features/admin/AdminDashboard.tsx`
- ✅ `StudentPortal.tsx` → `features/student/StudentPortal.tsx`
- ✅ `ClearanceForm.tsx` → `features/student/ClearanceForm.tsx`
- ✅ `CourseRegistration.tsx` → `features/academics/CourseRegistration.tsx`
- ✅ `AdmissionForm.tsx` → `features/academics/AdmissionForm.tsx`
- ✅ `Results.tsx` → `features/academics/Results.tsx`
- ✅ `PaymentPortal.tsx` → `features/finances/PaymentPortal.tsx`
- ✅ `RemitaPayment.tsx` → `features/finances/RemitaPayment.tsx`
- ✅ `LoanApplicationForm.tsx` → `features/finances/LoanApplicationForm.tsx`
- ✅ `HostelAllocation.tsx` → `features/hostel/HostelAllocation.tsx`
- ✅ `Layout.tsx` → `layouts/Layout.tsx`
- ✅ `Home.tsx` → `pages/Home.tsx`
- ✅ `CameraCapture.tsx` → `components/CameraCapture.tsx` (stays)

### Import Paths Updated
- All feature components now use `../../` for shared resources (api, types, constants, firebase)
- App.tsx imports updated to new feature locations
- Barrel exports (index.ts) created for cleaner imports

## 📦 Backend Structure

```
backend/
├── config/              # Django settings
│   ├── settings.py
│   ├── urls.py
│   ├── wsgi.py
│   └── asgi.py
├── apps/                # Django apps
│   ├── academics/       # Course & results management
│   ├── accounts/        # User authentication
│   ├── finances/        # Payments & loans
│   └── portal/          # Main portal features
├── core/                # Shared utilities
├── manage.py
└── db.sqlite3
```

## 🧪 Next Steps

- [ ] Add custom hooks in `hooks/` folder
- [ ] Create utility functions in `utils/` folder
- [ ] Add error boundary components
- [ ] Add context providers for global state
- [ ] Set up path aliases in `tsconfig.json` (@/ paths)
- [ ] Add tests folder structure

---

**Last Updated**: April 2026
**Structure**: Feature-based modular architecture
**Style**: TypeScript + React 19 + Tailwind CSS
