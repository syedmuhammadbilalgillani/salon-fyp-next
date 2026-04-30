# AI-Powered Smart Salon Management System
## Complete Step-by-Step Development Guide (AI-Assisted)

> **How to use this guide:** Each section contains ready-to-paste prompts for your AI coding assistant (Cursor, Claude, Copilot, etc.). Follow the steps in order. Never skip a phase.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router) + TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Backend | Next.js API Routes / Server Actions |
| Database | PostgreSQL (Neon) |
| ORM | Drizzle ORM |
| Auth | NextAuth.js v5 |
| File Upload | Cloudinary |
| AI Images | Replicate API (SDXL / img2img) |
| Deployment | Vercel |

---

## Phase 1 — Project Scaffolding

### Step 1.1 — Initialize Next.js Project

Run this in terminal:
```bash
npx create-next-app@latest smart-salon --typescript --tailwind --eslint --app --src-dir
cd smart-salon
```

### Step 1.2 — Install All Dependencies

```bash
# Database
npm install drizzle-orm drizzle-kit @neondatabase/serverless dotenv

# Auth
npm install next-auth@beta @auth/drizzle-adapter

# UI
npx shadcn@latest init
npx shadcn@latest add button input label card table badge dialog sheet select textarea form toast avatar skeleton tabs

# File Upload
npm install uploadthing @uploadthing/react

# AI
npm install replicate

# Utilities
npm install bcryptjs zod react-hook-form @hookform/resolvers date-fns lucide-react
npm install -D @types/bcryptjs
```

### Step 1.3 — Folder Structure Prompt

Paste this prompt to your AI assistant:

```
Create this exact folder structure for a Next.js 14 App Router project:

src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── layout.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   ├── dashboard/page.tsx
│   │   ├── clients/
│   │   │   ├── page.tsx
│   │   │   ├── new/page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── bookings/
│   │   │   ├── page.tsx
│   │   │   ├── new/page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── employees/
│   │   │   ├── page.tsx
│   │   │   ├── new/page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── ai-studio/
│   │   │   └── [bookingId]/page.tsx
│   │   └── work-history/page.tsx
│   └── api/
│       ├── auth/[...nextauth]/route.ts
│       ├── clients/route.ts
│       ├── bookings/route.ts
│       ├── employees/route.ts
│       └── ai/generate/route.ts
├── components/
│   ├── ui/           (shadcn components)
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   └── DashboardShell.tsx
│   ├── clients/
│   ├── bookings/
│   ├── employees/
│   └── ai-studio/
├── lib/
│   ├── db/
│   │   ├── index.ts
│   │   └── schema.ts
│   ├── auth.ts
│   ├── validations.ts
│   └── utils.ts
└── types/
    └── index.ts

Create placeholder files with basic exports for each.
```

---

## Phase 2 — Database Setup

### Step 2.1 — Schema File

Paste this prompt:

```
Create src/lib/db/schema.ts with the following complete Drizzle ORM schema.
Copy it exactly as provided:

[PASTE THE ENTIRE schema.ts content from your project document here]

After pasting the schema, also create src/lib/db/index.ts with:
- Neon serverless PostgreSQL connection
- Drizzle instance export
- Read DATABASE_URL from process.env
```

**src/lib/db/index.ts** — paste to AI:
```
Create src/lib/db/index.ts:

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });
export type DB = typeof db;
```

### Step 2.2 — Drizzle Config

```
Create drizzle.config.ts in project root:

import type { Config } from "drizzle-kit";

export default {
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} satisfies Config;

Also add these scripts to package.json:
"db:generate": "drizzle-kit generate",
"db:migrate": "drizzle-kit migrate",
"db:studio": "drizzle-kit studio"
```

### Step 2.3 — Environment Variables

Create `.env.local`:
```env
DATABASE_URL=your_neon_postgres_url
AUTH_SECRET=your_random_secret_32_chars
UPLOADTHING_SECRET=your_uploadthing_secret
UPLOADTHING_APP_ID=your_uploadthing_app_id
REPLICATE_API_TOKEN=your_replicate_token
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Step 2.4 — Seed Initial Data

```
Create src/lib/db/seed.ts that:
1. Creates one salon record (name: "Glamour Studio", email: "admin@glamour.com")
2. Creates one salon_admin user with:
   - email: admin@salon.com
   - password: Admin@123 (bcrypt hashed)
   - role: salon_admin
3. Creates 3 sample employees:
   - Hira Baig | makeup_artist | Bridal Makeup
   - Sana Khan | hair_stylist | Bridal Hair
   - Zara Ali | stylist | Bridal Styling
4. Creates 2 sample services:
   - Bridal Makeup Package | Rs. 15000 | 180 min
   - Hair Styling Package | Rs. 8000 | 120 min

Use drizzle db instance. Export a main() function and call it at bottom.
Add script to package.json: "db:seed": "tsx src/lib/db/seed.ts"
```

Run migrations:
```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

---

## Phase 3 — Authentication

### Step 3.1 — Auth Config

```
Create src/lib/auth.ts using NextAuth v5 with:
- Credentials provider (email + password login)
- Use drizzle adapter with our db instance
- On login: find user by email in users table, verify bcrypt password
- Session includes: userId, salonId, role, fullName
- JWT strategy
- Custom pages: signIn: "/login"
- Callbacks: jwt and session to include salonId and role
```

### Step 3.2 — Login Page

```
Create src/app/(auth)/login/page.tsx:
- Beautiful centered login form
- Salon logo/name at top: "Glamour Studio"
- Email and Password fields using react-hook-form + zod
- Validate: email format, password min 6 chars
- On submit: call signIn("credentials", { email, password })
- Show loading state on button
- Show error toast on wrong credentials
- Redirect to /dashboard on success
- Use shadcn Card, Input, Button, Label components
- Tailwind styling — soft pink/rose color theme
```

### Step 3.3 — Auth Middleware

```
Create src/middleware.ts:
- Protect all routes under /dashboard/* 
- Redirect unauthenticated users to /login
- Redirect authenticated users away from /login to /dashboard
- Use NextAuth auth() function
```

---

## Phase 4 — Dashboard Layout

### Step 4.1 — Sidebar Component

```
Create src/components/layout/Sidebar.tsx:
- Fixed left sidebar, 240px wide
- Salon name at top with scissors icon
- Navigation links:
  - Dashboard (LayoutDashboard icon) → /dashboard
  - Clients (Users icon) → /dashboard/clients
  - Bookings (Calendar icon) → /dashboard/bookings
  - Employees (UserCheck icon) → /dashboard/employees
  - AI Studio (Sparkles icon) → /dashboard/bookings (access via booking)
  - Work History (ClipboardList icon) → /dashboard/work-history
- Active link highlighted with rose/pink color
- Logout button at bottom
- Use lucide-react icons
- Use Next.js Link for navigation
- Use usePathname to detect active route
```

### Step 4.2 — Dashboard Layout

```
Create src/app/(dashboard)/layout.tsx:
- Sidebar on left (fixed, 240px)
- Main content area with padding
- Header bar at top showing: page title + logged in user name + avatar
- Wrap with SessionProvider
- If not authenticated, redirect to /login
```

### Step 4.3 — Dashboard Home Page

```
Create src/app/(dashboard)/dashboard/page.tsx:
Server component that fetches and shows:

4 stat cards:
- Total Clients (count from clients table)
- Today's Bookings (bookings where date = today)
- Active Employees (employees where status = active)
- AI Looks Generated (count from ai_generated_looks)

Use Card component from shadcn. Each card has:
- Icon, title, number value, subtle description
- Rose/pink accent color theme

Below stats: 2 sections side by side:
1. Recent Bookings (last 5) — table with client name, event, date, status badge
2. Recent Clients (last 5) — list with name, phone, wedding date

All data fetched server-side using db queries filtered by salonId from session.
```

---

## Phase 5 — Client Management

### Step 5.1 — Client List Page

```
Create src/app/(dashboard)/clients/page.tsx as a server component:
- Page title "Clients" with "+ Add Client" button (links to /clients/new)
- Search bar (client-side filtering by name/phone)
- Table columns: Name, Phone, Email, Wedding Date, Event Type, Actions
- Actions: View (eye icon), Edit (pencil icon)
- Show total client count
- Empty state with illustration when no clients
- Fetch all clients for current salonId ordered by createdAt desc
- Wrap table in ClientsTable client component for search interactivity
```

### Step 5.2 — Add Client Form

```
Create src/app/(dashboard)/clients/new/page.tsx:

Form with these fields using react-hook-form + zod:
- Full Name* (required)
- Phone Number* (required, Pakistani format validation)
- Email (optional)
- Wedding Date (date picker)
- Skin Tone (select: Fair, Medium, Dusky, Dark)
- Skin Undertone (select: Warm, Cool, Neutral)
- Face Shape (select: Oval, Round, Square, Heart, Diamond)
- Event Type (select: mehndi, barat, valima, engagement, other)
- Makeup Style Preference (text input)
- Hairstyle Preference (text input)
- Additional Notes (textarea)

On submit: POST to /api/clients
On success: redirect to /clients/[newId] with success toast
Show cancel button that goes back to /clients
```

### Step 5.3 — Client Detail Page

```
Create src/app/(dashboard)/clients/[id]/page.tsx:
Server component showing complete client profile.

Layout has 3 sections:

1. Profile Card (top):
   - Client name, phone, email, wedding date
   - Skin tone, undertone, face shape badges
   - Edit button

2. Tabs section:
   Tab 1 — "Bookings": list of all bookings for this client
     - Each booking shows: date, event type, status badge, assigned employees, actions
     - "+ New Booking" button that pre-fills clientId
   
   Tab 2 — "AI Looks": grid of all generated look images
     - Group by booking/session
     - Show final selected look with green "Selected" badge
   
   Tab 3 — "Styling History": timeline of work logs
     - Each entry: date, employee name, work type, description

Fetch all data server-side by clientId.
```

### Step 5.4 — Clients API Route

```
Create src/app/api/clients/route.ts:

GET handler:
- Get salonId from session
- Query all clients for that salon
- Support ?search= query param for filtering by name/phone
- Return JSON array

POST handler:
- Validate request body with zod schema
- Get salonId and userId from session  
- Insert new client into clients table
- Return created client with 201 status

Create src/app/api/clients/[id]/route.ts:
GET — fetch single client with all related data
PATCH — update client fields
DELETE — soft delete (set isActive = false)
```

---

## Phase 6 — Booking Management

### Step 6.1 — Bookings List Page

```
Create src/app/(dashboard)/bookings/page.tsx:

- Header with title "Bookings" and "+ New Booking" button
- Filter tabs: All | Pending | Confirmed | In Progress | Completed | Cancelled
- Bookings table columns:
  - Client Name + phone (small)
  - Event Type (colored badge: mehndi=yellow, barat=red, valima=green)
  - Booking Date & Time
  - Assigned Employees (avatar group, max 3 shown)
  - Status (badge with color)
  - Final Look (icon: check if selected, clock if pending)
  - Actions: View, Edit
- Fetch bookings with client name and employee names joined
- Filter by salonId and optional status filter
```

### Step 6.2 — New Booking Form

```
Create src/app/(dashboard)/bookings/new/page.tsx:

Multi-step form (3 steps shown as progress bar):

Step 1 — Client Selection:
- Search existing client by name/phone (async search with debounce)
- Show matching clients as dropdown cards
- Select a client — show their profile summary
- Or click "Create New Client" to open inline mini form

Step 2 — Booking Details:
- Event Type (select: mehndi, barat, valima, engagement, other)
- Booking Date (date picker)
- Booking Time (time picker)
- Services (multi-select checkboxes from services list, show price)
- Total Amount (auto-calculated)
- Advance Paid (number input)
- Notes (textarea)

Step 3 — Employee Assignment:
- Show list of active employees grouped by role
- Multi-select employees with their role (makeup, hair, styling, consultation)
- Must assign at least one employee
- Show employee card: name, role, specialization

On submit: POST to /api/bookings
On success: redirect to /bookings/[newId] with toast
Show Previous/Next/Submit buttons for each step
```

### Step 6.3 — Booking Detail Page

```
Create src/app/(dashboard)/bookings/[id]/page.tsx:

Layout:
Top bar: Booking ID, Status badge, Edit Status dropdown button

Left column (60%):
- Client info card (name, phone, wedding date, face details)
- Assigned Employees cards (name, role, specialization)
- Services list with prices, total amount, advance paid

Right column (40%):
- AI Studio card:
  - If no AI session: "Start AI Look Generation" button → goes to /ai-studio/[bookingId]  
  - If session exists: show session status
  - If looks generated: show thumbnail grid with "View All Looks" button
  - If final look selected: show final look image prominently with green "Final Look Selected" badge

Bottom: Work History timeline for this booking

Status update dropdown: pending → confirmed → in_progress → completed → cancelled
Each status change updates booking and creates a work log entry.
```

### Step 6.4 — Bookings API Route

```
Create src/app/api/bookings/route.ts:

POST handler — create booking:
1. Validate body with zod
2. Insert into bookings table
3. Insert booking_services records for each selected service
4. Insert booking_employees records for each assigned employee
5. Insert employee_work_logs for each employee (workType: "booking_assigned")
6. Return created booking with 201

GET handler — list bookings:
- Filter by salonId
- Join with clients (get name, phone)
- Join with bookingEmployees and employees
- Support ?status= filter
- Order by bookingDate desc

Create src/app/api/bookings/[id]/route.ts:
GET — full booking details with all joins
PATCH — update status, notes, amounts
```

---

## Phase 7 — Employee Management

### Step 7.1 — Employees List Page

```
Create src/app/(dashboard)/employees/page.tsx:

- Header with "+ Add Employee" button
- Employee cards grid (not table) — each card shows:
  - Avatar with initials (colored by role)
  - Name, Role badge, Specialization
  - Experience years
  - Total bookings count (from bookingEmployees)
  - Active/Inactive status toggle
  - Edit and View History buttons
- Filter by role (All, Makeup Artist, Hair Stylist, Stylist, Receptionist)
- Sort by name / bookings count
```

### Step 7.2 — Add/Edit Employee Form

```
Create src/app/(dashboard)/employees/new/page.tsx:

Form fields:
- Full Name* (required)
- Phone (required)
- Email (optional)
- Role* (select from userRoleEnum — show human readable labels)
- Specialization (text, e.g., "Bridal Makeup, Airbrush")
- Experience Years (number, min 0)
- Status (Active / Inactive toggle)
- Notes (textarea)

Submit: POST /api/employees
Success: redirect to /employees with toast "Employee added successfully"
```

### Step 7.3 — Employee Work History Page

```
Create src/app/(dashboard)/employees/[id]/page.tsx:

Profile header: name, role, specialization, experience, status

Tabs:
1. "Work History": 
   - Timeline list from employee_work_logs
   - Each entry: client name, booking date, event type, work description
   - Show final look thumbnail if exists for that booking
   - Total work count badge

2. "Assigned Bookings":
   - Table of all bookings this employee is assigned to
   - Columns: Client, Event Type, Date, Status, Final Look Status

3. "Performance":
   - Total bookings completed
   - Most common event type
   - Clients served count (unique)
```

### Step 7.4 — Employees API Route

```
Create src/app/api/employees/route.ts:
GET — list all employees for salonId with booking counts
POST — create new employee record

Create src/app/api/employees/[id]/route.ts:
GET — single employee with work history
PATCH — update employee details
```

---

## Phase 8 — AI Look Generation Studio

> This is the core feature. Build carefully.

### Step 8.1 — AI Studio Page Layout

```
Create src/app/(dashboard)/ai-studio/[bookingId]/page.tsx as a client component.

Layout (3 column when looks are generated, 1 column before):

Left Panel — Input (35%):
- Client photo section:
  - Upload zone (drag & drop or click to upload using uploadthing)
  - Preview uploaded image
  - Capture from webcam button (optional, show later)
- Event type display (from booking, read-only)
- Styling Preferences form:
  - Makeup Style (select: Traditional, Contemporary, Smokey, Natural Glow, Dewy)
  - Hairstyle (select: Bun, Open Curls, Braided, Half Up, Updo)
  - Color Theme (select: Red & Gold, Pastel Pink, Emerald Green, Royal Blue, Ivory)
  - Dupatta Style (select: Draped, Pinned, Open)
  - Additional notes (textarea, max 200 chars)
- "Generate Looks" button (disabled until image uploaded)
- Show token/generation count warning

Right Panel — Generated Looks (65%):
- Loading skeleton (4 cards) while generating
- Grid of generated look cards (2x2):
  - Look image (full height card)
  - Title and description
  - Action buttons: Shortlist (heart), Reject (x)
  - Status badge
- If no looks yet: empty illustration with "Upload a photo to generate AI bridal looks"

Bottom bar (when looks exist):
- "Selected Look" preview (if one is marked final)
- "Save Final Look" button
```

### Step 8.2 — AI Generation API Route

```
Create src/app/api/ai/generate/route.ts:

POST handler:
1. Get bookingId, clientId, preferences, imageUrl from body
2. Get client details (skinTone, faceShape) from db
3. Build a detailed prompt string like:
   "Generate a beautiful bridal look for a woman with [faceShape] face shape 
   and [skinTone] skin tone. Event: [eventType]. Makeup style: [makeupStyle]. 
   Hairstyle: [hairstyle]. Color theme: [colorTheme]. 
   Pakistani/South Asian bridal aesthetic. 
   Professional photography style, soft lighting, detailed makeup visible."
4. Create ai_look_sessions record with status "processing"
5. Call Replicate API — use model: "stability-ai/sdxl" 
   with init_image (for img2img if possible) or text-to-image
6. For each generated image URL returned:
   - Insert into ai_generated_looks table
7. Update session status to "completed"
8. Return session id and array of generated looks

Use this Replicate call pattern:
const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });
const output = await replicate.run("stability-ai/sdxl:...", {
  input: { prompt, num_outputs: 4, ... }
});
```

### Step 8.3 — Look Selection & Save Final Look

```
Create src/app/api/ai/looks/[lookId]/select/route.ts:

POST handler — mark a look as selected/shortlisted:
1. Get lookId, bookingId, status from body (status: shortlisted | selected | rejected)
2. If status is "selected" (final):
   a. Set all other looks for this booking to status "generated" (deselect)
   b. Insert/update look_selections with isFinal: true
   c. Update booking.finalLookStatus to "selected"
   d. Update the ai_generated_looks record status
   e. Create employee_work_log entry: "Final bridal look selected"
3. Return updated look

Create src/components/ai-studio/LookCard.tsx client component:
- Shows generated look image
- Shortlist button (heart toggle, yellow when active)
- Reject button (gray x)
- "Mark as Final" button (green, shows when shortlisted)
- Status badge overlay on image
- Image zoom on hover
- onClick handlers call the select API
```

### Step 8.4 — Final Look Display

```
Create src/components/ai-studio/FinalLookDisplay.tsx:
Shows when a booking has a final look selected:
- Large image display
- Look title and description
- Event type and date
- Employee who selected it
- Regenerate button (creates new AI session)
- Download button for the image

This component is used in:
- Booking detail page (right column)
- Client profile AI Looks tab
- Work history entries
```

---

## Phase 9 — Work History Module

### Step 9.1 — Global Work History Page

```
Create src/app/(dashboard)/work-history/page.tsx:

- Page title "Work History"
- Filter bar: by Employee (select), by Date Range (date pickers), by Event Type
- Table with columns:
  - Date
  - Client Name
  - Event Type (badge)
  - Employee Name + Role
  - Work Type
  - Final Look (thumbnail if exists, dash if not)
  - Description
- Paginate: 20 rows per page
- Export button (CSV download of filtered results)

Fetch from employee_work_logs joined with clients, employees, bookings
```

---

## Phase 10 — Validation Schemas

```
Create src/lib/validations.ts with Zod schemas for:

1. clientSchema — all client form fields with proper validations
2. bookingSchema — booking form with min 1 service, min 1 employee
3. employeeSchema — employee form fields
4. aiSessionSchema — preferences for AI generation
5. loginSchema — email + password

Export all schemas. Import in forms and API routes.
Example:

export const clientSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().regex(/^(\+92|0)[0-9]{10}$/, "Enter valid Pakistani phone number"),
  email: z.string().email().optional().or(z.literal("")),
  weddingDate: z.date().optional(),
  skinTone: z.string().optional(),
  // ... rest of fields
});
```

---

## Phase 11 — Types File

```
Create src/types/index.ts with TypeScript types:
- Infer DB types from drizzle schema using InferSelectModel
- Create joined types:
  - ClientWithBookings
  - BookingWithClient (includes client name, phone)
  - BookingWithDetails (includes client + employees + services)
  - EmployeeWithStats (includes booking count)
  - AISessionWithLooks (includes array of generated looks)
  - WorkLogWithDetails (includes client + employee + booking info)
- Auth session type extension for NextAuth

Example:
import { InferSelectModel } from "drizzle-orm";
import { clients, bookings, employees } from "@/lib/db/schema";

export type Client = InferSelectModel<typeof clients>;
export type Booking = InferSelectModel<typeof bookings>;
export type Employee = InferSelectModel<typeof employees>;

export type BookingWithClient = Booking & {
  client: Pick<Client, "fullName" | "phone" | "email">;
};
```

---

## Phase 12 — UI Polish & Shared Components

### Step 12.1 — Status Badges

```
Create src/components/ui/StatusBadge.tsx:
A reusable component that renders colored badges:

bookingStatus colors:
- pending: yellow
- confirmed: blue
- in_progress: purple
- completed: green
- cancelled: red/muted

eventType colors:
- mehndi: yellow-600
- barat: red-600
- valima: green-600
- engagement: pink-600
- other: gray-600

lookStatus colors:
- generated: gray
- shortlisted: yellow
- selected: green
- rejected: red

Usage: <StatusBadge type="booking" value="confirmed" />
```

### Step 12.2 — Empty States

```
Create src/components/ui/EmptyState.tsx:
Props: icon, title, description, actionLabel, actionHref
Shows centered content when lists are empty.
Use lucide icons. Soft gray styling.
```

### Step 12.3 — Loading Skeletons

```
Create these skeleton components using shadcn Skeleton:
- ClientCardSkeleton
- BookingRowSkeleton  
- EmployeeCardSkeleton
- LookCardSkeleton (square image placeholder)
- StatCardSkeleton
```

---

## Phase 13 — File Upload Setup

```
Create src/app/api/uploadthing/core.ts:

import { createUploadthing } from "uploadthing/next";

const f = createUploadthing();

export const ourFileRouter = {
  clientImageUploader: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(async ({ req }) => {
      // verify auth
      return { uploadedBy: "staff" };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return { url: file.url };
    }),
};

Create src/app/api/uploadthing/route.ts using createRouteHandler.

Create src/components/ai-studio/ImageUploader.tsx:
- Uses useUploadThing hook from @uploadthing/react
- Drag and drop zone
- Progress bar during upload
- Preview image after upload
- Remove button
- Returns imageUrl via onUploadComplete callback
```

---

## Phase 14 — Final Integration Checklist

Go through each item and verify:

```
□ Login works with seeded admin credentials (admin@salon.com / Admin@123)
□ Dashboard stats show correct counts from database
□ Can create a new client with all fields
□ Can search existing clients
□ Can create a new booking and assign employees + services
□ Booking detail page shows all related data
□ Can add new employee and see them in employee list
□ Can upload image in AI Studio
□ AI generation creates session + looks in database
□ Can shortlist, reject, and finalize a look
□ Final look appears in booking detail and client profile
□ Work history records are created on booking creation and look finalization
□ Work history page shows filterable logs
□ Employee work history tab shows correct bookings
□ All forms show proper validation errors
□ Loading states show during data fetches
□ Empty states show when no data exists
□ Status badges show correct colors
□ Session expires redirect to login
□ salonId isolation — data from one salon never leaks to another
```

---

## Phase 15 — Deployment

### Step 15.1 — Pre-deploy

```bash
npm run build     # Fix all TypeScript errors
npm run db:generate
npm run db:migrate  # Run on production DB
npm run db:seed     # Seed production DB once
```

### Step 15.2 — Vercel Deploy

```
Deploy on Vercel:
1. Push code to GitHub
2. Connect repo to Vercel
3. Add all environment variables from .env.local
4. Set Framework Preset: Next.js
5. Deploy

After deploy: 
- Test login at /login
- Verify all API routes work
- Check Uploadthing file uploads work
- Test Replicate AI generation
```

---

## Common Prompts Cheatsheet

Use these anytime you're stuck:

**Debugging DB query:**
```
I have this Drizzle ORM schema: [paste schema]
Write a query that fetches [what you need] with [these joins], 
filtered by salonId = [value], ordered by [field].
```

**Fixing TypeScript error:**
```
I'm getting this TypeScript error: [paste error]
Here is my code: [paste code]
Here is my schema type: [paste type]
Fix the type error without changing the logic.
```

**Adding a new form field:**
```
I have this existing form: [paste form]
Add a new field "[fieldName]" of type [text/select/date].
Update the zod schema, the form JSX, and the API route handler to include this field.
```

**Creating a new API route:**
```
Create a Next.js 14 App Router API route at /api/[path]/route.ts that:
- Requires authentication (use getServerSession)
- Gets salonId from session
- [Describe what the route should do]
- Returns proper HTTP status codes
- Uses Drizzle ORM with this schema: [paste relevant schema parts]
```

---

## Project Completion Summary

| Module | Pages | API Routes |
|---|---|---|
| Auth | Login | /api/auth |
| Dashboard | 1 | — |
| Clients | List, New, Detail | /api/clients, /api/clients/[id] |
| Bookings | List, New, Detail | /api/bookings, /api/bookings/[id] |
| Employees | List, New, Detail | /api/employees, /api/employees/[id] |
| AI Studio | Studio Page | /api/ai/generate, /api/ai/looks/[id]/select |
| Work History | List | — |
| File Upload | — | /api/uploadthing |

**Total: ~15 pages, ~10 API route files**

---

*Guide Version 1.0 — Smart Salon AI Management System*
*Follow phases in order. Each phase builds on the previous one.*