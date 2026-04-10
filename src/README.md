# Frontend Source Structure

## Quick Reference

### 🎯 Where to find what?

| What | Where |
| --- | --- |
| Authentication | `features/auth/` |
| Admin Panel | `features/admin/` |
| Student Dashboard | `features/student/` |
| Courses & Results | `features/academics/` |
| Payments & Loans | `features/finances/` |
| Hostel System | `features/hostel/` |
| Shared Components | `components/` |
| Page Layouts | `layouts/` |
| Landing Pages | `pages/` |
| API Configuration | `api/` |
| Type Definitions | `types.ts` |
| Constants | `constants.ts` |
| Firebase Config | `firebase.ts` |

## ✨ Features

### Authentication (`features/auth/`)

- Student login/signup (`Auth.tsx`)
- Admin authentication (`AdminAuth.tsx`)

### Admin Dashboard (`features/admin/`)

- Application management
- Student records
- Course configuration
- Financial management
- Treasury settings

### Student Portal (`features/student/`)

- Main student dashboard
- Course information
- Clearance requests

### Academics (`features/academics/`)

- Admission applications (`AdmissionForm.tsx`)
- Course registration (`CourseRegistration.tsx`)
- Grade results viewing (`Results.tsx`)

### Finances (`features/finances/`)

- Payment portal (`PaymentPortal.tsx`)
- Remita payment integration (`RemitaPayment.tsx`)
- Loan applications (`LoanApplicationForm.tsx`)

### Hostel (`features/hostel/`)

- Hostel allocation and booking

### Reusable (`components/`)

- Biometric camera capture (`CameraCapture.tsx`)

## 🚀 Quick Start

### To add a new component to a feature

```bash
# 1. Create component in feature folder
# 2. Add to feature's index.ts barrel export
# 3. Import in App.tsx or other components

# Example: Adding a new student feature component
# Create: src/features/student/NewComponent.tsx
# Update: src/features/student/index.ts
# Import: import { NewComponent } from '@/features/student'
```

### To add a completely new feature

```bash
# 1. Create folder: src/features/newFeature/
# 2. Add components: Component1.tsx, Component2.tsx
# 3. Create: index.ts with barrel exports
# 4. Update: src/features/index.ts
# 5. Import in App.tsx or use with other features
```

### Common Imports

```typescript
// Feature components
import { Auth, AdminAuth } from '@/features/auth';
import { AdminDashboard } from '@/features/admin';

// Shared resources
import api from '@/api/axios';
import { UserProfile } from '@/types';
import { FACULTIES } from '@/constants';
import { db } from '@/firebase';

// React & external
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
```

## 📋 Checklist for New Features

- [ ] Create feature folder in `src/features/`
- [ ] Create component files
- [ ] Create `index.ts` with barrel exports
- [ ] Update `src/features/index.ts`
- [ ] Add imports to `App.tsx`
- [ ] Verify import paths are correct
- [ ] Test routing and data flow
- [ ] Update STRUCTURE.md if needed

## 🔗 Related Files

- **Main app**: `App.tsx`
- **Entry point**: `main.tsx`
- **Styles**: `index.css` + Tailwind CSS
- **Config**: `vite.config.ts`, `tsconfig.json`

---

**For detailed documentation**, see [STRUCTURE.md](../STRUCTURE.md)
