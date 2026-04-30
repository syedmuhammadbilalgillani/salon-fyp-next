# AI-Powered Smart Salon Management System
## Complete Step-by-Step Development Guide — Version 2.0

> **How to use this guide:** Each section contains ready-to-paste prompts for your AI coding assistant (Cursor, Claude, Copilot, etc.). Follow the steps in order. Never skip a phase.

> **What changed in v2:** AI workflow is now corrected — client image goes to an **external AI model** (e.g. a Python/FastAPI service or third-party API), that model returns generated look images, client selects from them, and the selected look is saved to the booking record.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router) + TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Backend | Next.js API Routes / Server Actions |
| Database | PostgreSQL (Neon / Supabase) |
| ORM | Drizzle ORM |
| Auth | NextAuth.js v5 |
| File Storage | Uploadthing (for storing client image + returned look images) |
| **External AI Model** | **Your external API endpoint (receives image → returns look images)** |
| Deployment | Vercel |

---

## ✅ Corrected AI Workflow (Read This First)

This is the exact flow the system follows for AI look generation:

```
1. Staff opens AI Studio for a specific booking
       ↓
2. Staff captures client photo via:
   - OPTION A: Device camera (realtime capture)
   - OPTION B: Gallery / file upload
       ↓
3. Captured image is uploaded to Uploadthing → get imageUrl
       ↓
4. Staff fills preferences (event type, makeup style, hairstyle, etc.)
       ↓
5. Staff clicks "Generate Looks"
       ↓
6. Our Next.js API route sends to EXTERNAL AI MODEL:
   - clientImageUrl
   - preferences (event type, makeup, hair, color theme, etc.)
   - client details (skin tone, face shape)
       ↓
7. External AI Model processes and returns:
   - Array of generated look image URLs (typically 3–5 images)
       ↓
8. We store returned image URLs in ai_generated_looks table
       ↓
9. Generated looks displayed in a grid on screen
       ↓
10. Client + stylist review looks together
        ↓
11. Client selects/shortlists favorite looks
        ↓
12. ONE final look is marked as "Selected"
        ↓
13. Final look is saved to:
    - ai_generated_looks (status = "selected")
    - look_selections table (isFinal = true)
    - bookings.finalLookStatus updated to "selected"
    - employee_work_logs entry created
        ↓
14. Final look visible in:
    - Booking detail page
    - Client profile page
    - Work history
```

---

## Phase 1 — Project Scaffolding

### Step 1.1 — Initialize Next.js Project

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

# UI Components
npx shadcn@latest init
npx shadcn@latest add button input label card table badge dialog sheet select textarea form toast avatar skeleton tabs progress separator

# File Upload (for client photo + storing AI returned images)
npm install uploadthing @uploadthing/react

# Camera access
npm install react-webcam
npm install -D @types/react-webcam

# Utilities
npm install bcryptjs zod react-hook-form @hookform/resolvers date-fns lucide-react axios
npm install -D @types/bcryptjs
```

### Step 1.3 — Folder Structure

Paste this prompt to your AI assistant:

```
Create this exact folder structure for a Next.js 14 App Router project:

root/
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
│       ├── clients/[id]/route.ts
│       ├── bookings/route.ts
│       ├── bookings/[id]/route.ts
│       ├── employees/route.ts
│       ├── employees/[id]/route.ts
│       ├── uploadthing/core.ts
│       ├── uploadthing/route.ts
│       ├── ai/
│       │   ├── generate/route.ts         ← sends to external AI, stores results
│       │   └── looks/
│       │       └── [lookId]/
│       │           └── select/route.ts  ← marks look as selected/final
├── components/
│   ├── ui/
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   └── DashboardShell.tsx
│   ├── clients/
│   │   ├── ClientsTable.tsx
│   │   └── ClientForm.tsx
│   ├── bookings/
│   │   ├── BookingsTable.tsx
│   │   ├── NewBookingForm.tsx
│   │   └── BookingDetail.tsx
│   ├── employees/
│   │   ├── EmployeeCard.tsx
│   │   └── EmployeeForm.tsx
│   └── ai-studio/
│       ├── CameraCapture.tsx       ← webcam realtime capture
│       ├── GalleryUpload.tsx       ← file picker upload
│       ├── ImageSourceSelector.tsx ← choose camera OR gallery
│       ├── PreferencesForm.tsx     ← event type, makeup, hair, etc
│       ├── GeneratedLooksGrid.tsx  ← display AI returned images
│       ├── LookCard.tsx            ← single look with select actions
│       └── FinalLookDisplay.tsx    ← shows confirmed final look
├── lib/
│   ├── db/
│   │   ├── index.ts
│   │   └── schema.ts
│   ├── auth.ts
│   ├── validations.ts
│   ├── external-ai.ts   ← helper to call your external AI model
│   └── utils.ts
└── types/
    └── index.ts

Create placeholder files with basic exports for each.
```

---


### Step 2.3 — Environment Variables

Create `.env.local`:
```env
DATABASE_URL=your_neon_postgres_url
AUTH_SECRET=your_random_secret_32_chars

# Uploadthing — for storing client images and AI-returned look images
UPLOADTHING_SECRET=your_uploadthing_secret
UPLOADTHING_APP_ID=your_uploadthing_app_id

# External AI Model endpoint — the API that receives image and returns looks
EXTERNAL_AI_API_URL=https://your-ai-model-api.com/generate
EXTERNAL_AI_API_KEY=your_external_ai_api_key

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Step 2.4 — Seed Data

```
Create src/lib/db/seed.ts:
1. Salon: "Shall be", admin@glamour.com
2. Admin user: admin@salon.com / Admin@123 (bcrypt hashed), role: salon_admin
3. Employees:
   - Hira Baig | makeup_artist | Bridal Makeup
   - Sana Khan | hair_stylist | Bridal Hair  
   - Zara Ali | stylist | Bridal Styling
4. Services:
   - Bridal Makeup Package | Rs.15000 | 180 min
   - Hair Styling Package | Rs.8000 | 120 min
```

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

---

## Phase 3 — Authentication

### Step 3.1 — Auth Config

```
Create src/lib/auth.ts using NextAuth v5:
- Credentials provider (email + password)
- Drizzle adapter
- Verify bcrypt password against users table
- JWT session includes: userId, salonId, role, fullName
- signIn page: "/login"
```

### Step 3.2 — Login Page

```
Create src/app/(auth)/login/page.tsx:
- Centered card with salon name "Shall be" and scissors icon at top
- Email + Password fields using react-hook-form + zod
- Loading button state on submit
- Error toast on wrong credentials
- Redirect to /dashboard on success
- Rose/pink color theme using Tailwind + shadcn
```

### Step 3.3 — Middleware

```
Create src/middleware.ts:
- Protect /dashboard/* — redirect to /login if not authenticated
- Redirect /login → /dashboard if already authenticated
```

---

## Phase 4 — Dashboard Layout

### Step 4.1 — Sidebar

```
Create src/components/layout/Sidebar.tsx:
- 240px fixed left sidebar
- Logo + salon name at top
- Nav links with lucide icons:
  - Dashboard → /dashboard (LayoutDashboard)
  - Clients → /dashboard/clients (Users)
  - Bookings → /dashboard/bookings (Calendar)
  - Employees → /dashboard/employees (UserCheck)
  - Work History → /dashboard/work-history (ClipboardList)
- "AI Studio" is NOT a direct nav link — it is accessed from within a Booking
- Active link: rose-600 background highlight
- Logout button at bottom
```

### Step 4.2 — Dashboard Layout

```
Create src/app/(dashboard)/layout.tsx:
- Sidebar (fixed left 240px) + main content area
- Header: page title on left, user avatar + name on right
- Wrap with SessionProvider
```

### Step 4.3 — Dashboard Stats Page

```
Create src/app/(dashboard)/dashboard/page.tsx (server component):

4 stat cards:
- Total Clients
- Today's Bookings
- Active Employees
- Total AI Looks Generated

Below: Recent Bookings table (last 5) + Recent Clients list (last 5)
All data filtered by salonId from session.
```

---

## Phase 5 — Client Management

### Step 5.1 — Clients List

```
Create src/app/(dashboard)/clients/page.tsx (server component):
- "+ Add Client" button → /clients/new
- ClientsTable (client component) with search by name/phone
- Columns: Name, Phone, Email, Wedding Date, Actions (View, Edit)
- Fetch all clients for salonId, ordered by createdAt desc
```

### Step 5.2 — Add Client Form

```
Create src/app/(dashboard)/clients/new/page.tsx:

Fields (react-hook-form + zod):
- Full Name* 
- Phone Number* (Pakistani format: +92 or 0 + 10 digits)
- Email (optional)
- Wedding Date (date picker)
- Skin Tone (select: Fair, Medium, Dusky, Dark)
- Skin Undertone (select: Warm, Cool, Neutral)
- Face Shape (select: Oval, Round, Square, Heart, Diamond)
- Makeup Style Preference (text)
- Hairstyle Preference (text)
- Additional Notes (textarea)

Submit → POST /api/clients → redirect to /clients/[id]
```

### Step 5.3 — Client Detail Page

```
Create src/app/(dashboard)/clients/[id]/page.tsx (server component):

Profile header card: name, phone, email, wedding date, skin/face details, Edit button

3 tabs:
1. Bookings — list of all bookings with: date, event type, status badge, assigned employees
   "+ New Booking" button pre-fills clientId
2. AI Looks — grid of all generated looks grouped by booking
   Final selected look shown with green "Final Selected" badge and larger size
3. Styling History — timeline from employee_work_logs
```

### Step 5.4 — Clients API

```
Create src/app/api/clients/route.ts:
GET: list clients (filter by salonId, optional ?search=)
POST: create client (validate with zod, insert, return 201)

Create src/app/api/clients/[id]/route.ts:
GET: single client with bookings, looks, work logs
PATCH: update client fields
DELETE: soft delete (isActive = false)
```

---

## Phase 6 — Booking Management

### Step 6.1 — Bookings List

```
Create src/app/(dashboard)/bookings/page.tsx:
- Filter tabs: All | Pending | Confirmed | In Progress | Completed | Cancelled
- Table: Client Name, Event Type (colored badge), Date/Time, 
  Assigned Employees (avatar stack), Status, Final Look status icon, Actions
- Each row: View button → /bookings/[id]
```

### Step 6.2 — New Booking — Multi-Step Form

```
Create src/app/(dashboard)/bookings/new/page.tsx as a client component.
Show a 3-step progress bar at top.

STEP 1 — Client Selection:
- Search input with debounce — calls GET /api/clients?search=
- Results shown as dropdown cards (name, phone, wedding date)
- Click to select — show selected client summary card
- "Create New Client" button opens a dialog with a mini inline client form

STEP 2 — Booking Details:
- Event Type (select: mehndi, barat, valima, engagement, other)
- Appointment Date (date picker)
- Appointment Time (time picker — show as select: 9AM to 8PM in 30min slots)
- Services (checkbox list — fetch from services table — show name + price)
- Total Amount (auto-calculated from selected services)
- Advance Paid (number input — must be ≤ total amount)
- Notes (textarea)

STEP 3 — Employee Assignment:
- Show active employees grouped by role
- Each employee shown as a card: name, role badge, specialization
- Multi-select with assignment role (makeup / hair / styling / consultation)
- At least 1 employee required to proceed

On final submit:
POST /api/bookings → on success redirect to /bookings/[newId]
Show Previous / Next / Submit buttons
```

### Step 6.3 — Booking Detail Page

```
Create src/app/(dashboard)/bookings/[id]/page.tsx (server component):

Top bar: Booking #{id short} | Event badge | Status dropdown to change status | Date

Left column (60%):
- Client card: name, phone, email, wedding date, skin tone, face shape
- Assigned Employees: cards showing name, role, specialization
- Services list: name, price. Subtotal, advance paid, balance due

Right column (40%):
- "AI Studio" card — this is how AI Studio is accessed
  State A (no session yet):
    Show: "No AI looks generated yet"
    Button: "Open AI Studio" → navigates to /ai-studio/[bookingId]
  
  State B (session in progress):
    Show: spinner + "AI is generating looks..."
  
  State C (looks generated, none selected):
    Show: grid of 4 thumbnail images
    Button: "View & Select Look" → navigates to /ai-studio/[bookingId]
  
  State D (final look selected):
    Show: final look image (large)
    Green badge: "✓ Final Look Selected"
    Look title and description
    Button: "Change Look" → navigates to /ai-studio/[bookingId]

Bottom section:
- Work History Timeline for this booking (from employee_work_logs)

Status change dropdown: updates booking status + creates work log entry
```

### Step 6.4 — Bookings API

```
Create src/app/api/bookings/route.ts:

POST — create booking:
1. Validate with zod
2. Insert into bookings table
3. Insert booking_services (one row per selected service)
4. Insert booking_employees (one row per assigned employee + their role)
5. Insert employee_work_logs for each employee (workType: "booking_assigned")
6. Return 201 with created booking

GET — list bookings:
- Filter by salonId
- Join clients (name, phone)
- Join booking_employees + employees
- Optional ?status= filter
- Order by bookingDate desc

Create src/app/api/bookings/[id]/route.ts:
GET — full booking details with all related data
PATCH — update status / notes / amounts, create work log on status change
```

---

## Phase 7 — Employee Management

### Step 7.1 — Employees List

```
Create src/app/(dashboard)/employees/page.tsx:
- "+ Add Employee" button
- Card grid layout (not table)
- Each card: avatar initials, name, role badge, specialization, 
  experience years, total bookings count, active/inactive toggle, Edit button
- Filter buttons by role: All | Makeup | Hair | Styling | Receptionist
```

### Step 7.2 — Employee Form

```
Create src/app/(dashboard)/employees/new/page.tsx:
Fields: Full Name*, Phone*, Email, Role* (select), Specialization, 
Experience Years, Status toggle, Notes
POST /api/employees → redirect to /employees
```

### Step 7.3 — Employee Detail + Work History

```
Create src/app/(dashboard)/employees/[id]/page.tsx:
Profile header card with all details.

Tabs:
1. Work History — timeline from employee_work_logs
   Each entry: client name, event type, booking date, work description,
   final look thumbnail (if exists for that booking)
2. Assigned Bookings — table of all bookings this employee is assigned to
3. Stats — total completed, unique clients served, most common event type
```

---

## Phase 8 — AI Look Generation Studio ⭐

> This is the most important module. Build carefully and test each sub-step.

---

### Step 8.1 — External AI Model Helper

```
Create src/lib/external-ai.ts:

This file handles communication with your external AI model API.

export interface AIGenerateRequest {
  clientImageUrl: string;
  eventType: string;
  preferences: {
    makeupStyle: string;
    hairstyle: string;
    colorTheme: string;
    dupattaStyle: string;
    additionalNotes?: string;
  };
  clientDetails: {
    skinTone?: string;
    skinUndertone?: string;
    faceShape?: string;
  };
}

export interface AIGenerateResponse {
  success: boolean;
  generatedImageUrls: string[];   // array of image URLs returned by external model
  error?: string;
}

export async function callExternalAIModel(
  payload: AIGenerateRequest
): Promise<AIGenerateResponse> {
  const response = await fetch(process.env.EXTERNAL_AI_API_URL!, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.EXTERNAL_AI_API_KEY}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    return { success: false, generatedImageUrls: [], error: "AI model request failed" };
  }

  const data = await response.json();

  // IMPORTANT: Adjust this based on your external AI model's actual response shape.
  // Common patterns:
  // data.images → array of URLs
  // data.results → array of { url: string }
  // data.output → array of URL strings
  // Update the line below to match YOUR external AI model's response format:
  
  const urls: string[] = data.images ?? data.results?.map((r: any) => r.url) ?? data.output ?? [];

  return { success: true, generatedImageUrls: urls };
}

NOTE: If your external AI model returns base64 image strings instead of URLs,
extend this function to upload each base64 image to Uploadthing and return 
the resulting hosted URLs instead.
```

---

### Step 8.2 — AI Generation API Route

```
Create src/app/api/ai/generate/route.ts:

POST handler — full flow:

1. Get from request body:
   { bookingId, clientImageUrl, preferences }

2. Get auth session — extract salonId, userId

3. Fetch booking from DB (verify it belongs to salonId)

4. Fetch client details from DB using booking.clientId
   (get skinTone, skinUndertone, faceShape)

5. Create ai_look_sessions record:
   {
     salonId, bookingId, clientId,
     inputImageUrl: clientImageUrl,
     eventType: booking.eventType,
     preferences,
     status: "processing"
   }

6. Call callExternalAIModel() from src/lib/external-ai.ts with:
   {
     clientImageUrl,
     eventType: booking.eventType,
     preferences,
     clientDetails: { skinTone, skinUndertone, faceShape }
   }

7. If AI call fails:
   - Update session status to "failed" with errorMessage
   - Return 500 with error

8. If AI call succeeds and generatedImageUrls array is returned:
   - For each URL in generatedImageUrls:
     Insert into ai_generated_looks:
     {
       aiSessionId: session.id,
       imageUrl: url,
       title: "Bridal Look " + (index + 1),
       status: "generated"
     }
   - Update ai_look_sessions status to "completed", set completedAt = now()

9. Return 200 with:
   {
     sessionId: session.id,
     looks: [ array of inserted ai_generated_looks records ]
   }
```

---

### Step 8.3 — File Upload Setup (For Client Image)

```
Create src/app/api/uploadthing/core.ts:

import { createUploadthing, type FileRouter } from "uploadthing/next";

const f = createUploadthing();

export const ourFileRouter = {
  // Used to upload client photo (gallery or captured from camera)
  clientPhotoUploader: f({ 
    image: { maxFileSize: "8MB", maxFileCount: 1 } 
  })
    .middleware(async ({ req }) => {
      // verify session here
      return { uploadedBy: "staff" };
    })
    .onUploadComplete(async ({ file }) => {
      return { url: file.url };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;

Create src/app/api/uploadthing/route.ts using createRouteHandler.
```

---

### Step 8.4 — Camera Capture Component

```
Create src/components/ai-studio/CameraCapture.tsx as a client component:

Props:
- onCapture: (imageDataUrl: string) => void
- onClose: () => void

Uses react-webcam library.

UI:
- Full modal overlay with dark background
- Webcam video preview (640x480, mirrored)
- Camera controls bar at bottom:
  - "Capture" button (large circular white button in center)
  - "Flip Camera" button (front/back toggle using facingMode)
  - "Cancel" button (closes modal)

On capture:
- Call webcamRef.current.getScreenshot() → returns base64 image string
- Show preview of captured image with:
  - "Use This Photo" button → converts base64 to File → upload to Uploadthing → onCapture(uploadedUrl)
  - "Retake" button → go back to live camera view

Handle errors:
- Camera permission denied → show friendly error message with icon
- No camera device → show message to use gallery instead

Import Webcam from 'react-webcam'
Use useRef for webcam ref
Use useState for: isCaptured, capturedImage, facingMode ('user' | 'environment')
```

---

### Step 8.5 — Gallery Upload Component

```
Create src/components/ai-studio/GalleryUpload.tsx as a client component:

Props:
- onUploadComplete: (imageUrl: string) => void

Uses useUploadThing hook from @uploadthing/react with "clientPhotoUploader" endpoint.

UI:
- Large dashed border upload zone (min-height: 250px)
- Center content:
  - Upload cloud icon (lucide: UploadCloud)
  - "Click to select photo" text
  - "or drag and drop" subtitle
  - "JPG, PNG up to 8MB" hint
- Hidden <input type="file" accept="image/*"> triggered by zone click
- On file selected:
  - Show image preview (Object URL)
  - Show upload progress bar (0–100%)
  - Auto-start upload via startUpload()
- On upload complete:
  - Show success checkmark
  - Call onUploadComplete(fileUrl)
- Error state: show error message with retry button
- Remove button (X) to clear and re-select

Use useState for: selectedFile, previewUrl, uploadProgress, isUploading, error
```

---

### Step 8.6 — Image Source Selector Component

```
Create src/components/ai-studio/ImageSourceSelector.tsx as a client component:

Props:
- onImageReady: (imageUrl: string) => void

This component is the entry point for Step 1 of AI Studio.
It presents the two options to the user.

UI:
- Section title: "Step 1 — Add Client Photo"
- Two large option cards side by side:

  Card 1 — Camera:
  - Camera icon (lucide: Camera)
  - Title: "Use Camera"
  - Subtitle: "Capture photo in real time"
  - On click: set activeMode = "camera" → show CameraCapture component as modal

  Card 2 — Gallery:
  - Image icon (lucide: ImagePlus)  
  - Title: "Upload from Gallery"
  - Subtitle: "Select from device storage"
  - On click: set activeMode = "gallery" → show GalleryUpload component below

When an image URL is received from either source:
- Hide both cards
- Show a "Photo Added" confirmation section:
  - Preview thumbnail of the uploaded image (150x150, rounded)
  - Client name text
  - Green checkmark badge
  - "Change Photo" button to reset and pick again
- Call onImageReady(imageUrl)

State: activeMode ("camera" | "gallery" | null), uploadedImageUrl
```

---

### Step 8.7 — Preferences Form Component

```
Create src/components/ai-studio/PreferencesForm.tsx as a client component:

Props:
- eventType: string (read-only, from booking — display as badge only)
- onSubmit: (preferences: PreferencesData) => void
- isLoading: boolean

UI:
- Section title: "Step 2 — Style Preferences"
- Event Type shown as a read-only colored badge (passed from booking, cannot change)
- Form fields (react-hook-form + zod):
  
  Makeup Style (select, required):
    Options: Traditional Bridal, Contemporary Glam, Smokey & Dramatic, 
             Natural Glow, Dewy & Fresh, Airbrush

  Hairstyle (select, required):
    Options: Classic Bun, Open Curls, Side Swept, Half Up Half Down, 
             Braided Updo, Straight Blow Dry

  Color Theme (select, required):
    Options: Red & Gold, Pastel Pink, Emerald & Gold, Royal Blue & Silver, 
             Ivory & Champagne, Coral & Peach

  Dupatta Style (select):
    Options: Draped over head, Pinned on one side, Open (held), No dupatta

  Additional Notes (textarea, max 300 chars):
    Placeholder: "Any specific requests, references, or preferences..."

- Character counter shown for notes field
- "Generate Looks" submit button (full width, rose/pink color)
  - Disabled until all required fields are filled
  - Shows spinner + "Generating..." when isLoading = true
```

---

### Step 8.8 — Generated Looks Grid Component

```
Create src/components/ai-studio/GeneratedLooksGrid.tsx as a client component:

Props:
- looks: AIGeneratedLook[]
- onSelect: (lookId: string, status: "shortlisted" | "selected" | "rejected") => void
- finalSelectedLookId: string | null

UI:
- Section title: "Step 3 — Select a Look"
- Subtitle: "Review AI-generated looks. Shortlist favorites, then mark one as final."

Renders a 2x2 grid (or 3-column if more than 4 looks) of LookCard components.

Loading skeleton state (before looks arrive):
  Show 4 skeleton cards with pulse animation. Each skeleton:
  - Square gray placeholder (aspect-ratio: 3/4)
  - Two gray bars below (simulating title + buttons)

Empty state (if looks array is empty after loading):
  Show message: "No looks were generated. Please try again."
  Show "Retry" button
```

---

### Step 8.9 — Look Card Component

```
Create src/components/ai-studio/LookCard.tsx as a client component:

Props:
- look: AIGeneratedLook
- isFinal: boolean
- onShortlist: () => void
- onReject: () => void
- onSelectAsFinal: () => void

UI:
- Card with portrait-ratio image (aspect-ratio: 3/4)
- Image fills card completely (object-fit: cover)
- Bottom gradient overlay on image for readability
- Look title shown on image (bottom-left, white text)

Status indicator (top-right badge on image):
  - generated: no badge
  - shortlisted: yellow badge "♥ Shortlisted"
  - selected: green badge "✓ Final"
  - rejected: gray badge "Rejected"

If isFinal = true:
  - Add green ring border to entire card
  - Show "FINAL LOOK" ribbon at top-left corner

Action buttons row below image:
  If status = "generated":
    - "♥ Shortlist" button (outline, yellow)
    - "✗ Skip" button (outline, gray)
  
  If status = "shortlisted":
    - "✓ Select as Final" button (solid green, full width)
    - "✗ Remove" button (text button, small, gray)
  
  If status = "rejected":
    - "↺ Restore" button (text button, small)
  
  If status = "selected" (final):
    - "✓ Final Look Selected" (disabled green button, full width)
    - "Change Selection" button (text, small, gray)

Image click → open in fullscreen dialog for close-up view
```

---

### Step 8.10 — AI Studio Page (Main Orchestrator)

```
Create src/app/(dashboard)/ai-studio/[bookingId]/page.tsx as a client component:

This page orchestrates all AI studio steps in sequence.

On mount:
- Fetch booking details (client name, event type, assigned employees, existing AI sessions)
- If a completed AI session with looks exists → skip to Step 3 (show existing looks)
- If final look already selected → show FinalLookDisplay with option to regenerate

State variables:
- step: 1 | 2 | 3 (current step)
- clientImageUrl: string | null
- preferences: PreferencesData | null
- isGenerating: boolean
- generatedLooks: AIGeneratedLook[]
- sessionId: string | null
- finalLookId: string | null
- error: string | null

LAYOUT:
Top section:
  - Back button → /bookings/[bookingId]
  - Title: "AI Look Studio"
  - Client name + event type badge
  - Step indicator (3 steps as horizontal progress bar):
    Step 1: "Client Photo" 
    Step 2: "Preferences"
    Step 3: "Select Look"

Content area changes based on step:

--- STEP 1 ---
Render <ImageSourceSelector onImageReady={(url) => { setClientImageUrl(url); setStep(2) }} />

--- STEP 2 ---
Show client photo thumbnail (small, top-left, with "Change" button)
Render <PreferencesForm 
  eventType={booking.eventType}
  isLoading={isGenerating}
  onSubmit={handleGenerate}
/>

handleGenerate function:
  1. setIsGenerating(true)
  2. POST /api/ai/generate with { bookingId, clientImageUrl, preferences }
  3. On success: setGeneratedLooks(response.looks), setSessionId(response.sessionId), setStep(3)
  4. On error: setError(errorMessage)
  5. setIsGenerating(false)

--- STEP 3 ---
Show client photo thumbnail + preferences summary (small, collapsible)

Render <GeneratedLooksGrid
  looks={generatedLooks}
  onSelect={handleLookSelect}
  finalSelectedLookId={finalLookId}
/>

"Regenerate" button at bottom → goes back to Step 2

handleLookSelect function:
  1. Call POST /api/ai/looks/[lookId]/select with { bookingId, status }
  2. If status = "selected": setFinalLookId(lookId), update look in generatedLooks array
  3. If status = "shortlisted" or "rejected": update look status in generatedLooks array

When finalLookId is set (final look selected):
  Show confirmation banner at top:
  "✓ Final look has been saved to this booking"
  Button: "Return to Booking" → /bookings/[bookingId]

Error state: show error alert with "Try Again" button
```

---

### Step 8.11 — Look Selection API Route

```
Create src/app/api/ai/looks/[lookId]/select/route.ts:

POST handler:
1. Get from body: { bookingId, status } 
   (status: "shortlisted" | "selected" | "rejected" | "generated")
2. Get auth session — verify salonId

3. Fetch the ai_generated_looks record — verify it belongs to this booking via its session

4. Update ai_generated_looks.status = status

5. If status = "selected" (FINAL LOOK):
   a. Set all OTHER looks in this booking's sessions to status = "generated"
      (deselect any previously selected look)
   b. Delete any existing look_selections where bookingId = bookingId AND isFinal = true
   c. Insert into look_selections:
      {
        salonId, bookingId, clientId,
        generatedLookId: lookId,
        selectedByEmployeeId: (employee linked to current user),
        status: "selected",
        isFinal: true,
        selectedAt: now()
      }
   d. Update bookings.finalLookStatus = "selected"
   e. Insert into employee_work_logs:
      {
        salonId, bookingId, clientId, employeeId,
        workType: "final_look_selected",
        description: "Final bridal look selected for " + eventType + " event"
      }

6. Return 200 with updated look record
```

---

### Step 8.12 — Final Look Display Component

```
Create src/components/ai-studio/FinalLookDisplay.tsx:

Props:
- look: AIGeneratedLook
- booking: BookingWithClient
- selectedBy: string (employee name)
- onRegenerate: () => void

UI:
- Green header bar: "✓ Final Look Selected"
- Large look image (max-height: 500px, centered, rounded corners, shadow)
- Info below image:
  - Look title (heading)
  - Event: [eventType badge]
  - Booking date
  - Selected by: [employee name] at [selectedAt time]
- Two action buttons:
  - "Download Look Image" → downloads image file
  - "Regenerate Looks" → calls onRegenerate (resets to Step 1 of AI Studio)
    (shows confirmation dialog first: "This will start a new AI session. Continue?")

Used in:
- Booking detail page right column (State D)
- Client profile AI Looks tab for finalized bookings
```

---

## Phase 9 — Work History Module

### Step 9.1 — Work History Page

```
Create src/app/(dashboard)/work-history/page.tsx (server component):

Filters (query params based):
- Employee (select dropdown — list all employees)
- Date Range (from/to date pickers)
- Event Type (select)
- Work Type (select: booking_assigned, final_look_selected, status_changed)

Table columns:
- Date & Time
- Client Name (link to /clients/[id])
- Event Type (badge)
- Employee Name + Role
- Work Type (badge)
- Description
- Final Look (small thumbnail image if workType = final_look_selected, else dash)

Pagination: 20 per page with prev/next
Export CSV button: downloads filtered results

Fetch from employee_work_logs JOIN clients JOIN employees JOIN bookings
Filter by salonId
```

---

## Phase 10 — Validation Schemas

```
Create src/lib/validations.ts with all Zod schemas:

loginSchema:
- email: valid email format
- password: min 6 chars

clientSchema:
- fullName: min 2 chars required
- phone: regex /^(\+92|0)[0-9]{10}$/ required
- email: optional valid email
- weddingDate: optional date
- skinTone / skinUndertone / faceShape: optional strings
- preferences: optional object

bookingSchema:
- clientId: valid UUID required
- eventType: one of enum values
- bookingDate: future date required
- serviceIds: array min 1 UUID
- employeeAssignments: array min 1 of { employeeId, assignmentRole }
- totalAmount: positive number
- advancePaid: non-negative number ≤ totalAmount
- notes: optional string

employeeSchema:
- name: min 2 chars required
- phone: required
- email: optional
- role: one of userRoleEnum values
- specialization: optional
- experienceYears: 0–50 integer
- status: "active" | "inactive"

aiPreferencesSchema:
- makeupStyle: required string
- hairstyle: required string
- colorTheme: required string
- dupattaStyle: optional string
- additionalNotes: optional max 300 chars
```

---

## Phase 11 — TypeScript Types

```
Create src/types/index.ts:

import { InferSelectModel } from "drizzle-orm";
import { clients, bookings, employees, aiGeneratedLooks, 
         aiLookSessions, lookSelections, employeeWorkLogs } from "@/lib/db/schema";

// Base types
export type Client = InferSelectModel<typeof clients>;
export type Booking = InferSelectModel<typeof bookings>;
export type Employee = InferSelectModel<typeof employees>;
export type AIGeneratedLook = InferSelectModel<typeof aiGeneratedLooks>;
export type AILookSession = InferSelectModel<typeof aiLookSessions>;
export type LookSelection = InferSelectModel<typeof lookSelections>;
export type WorkLog = InferSelectModel<typeof employeeWorkLogs>;

// Joined / extended types
export type BookingWithClient = Booking & {
  client: Pick<Client, "fullName" | "phone" | "email" | "weddingDate">;
};

export type BookingWithDetails = Booking & {
  client: Client;
  employees: Array<Employee & { assignmentRole: string }>;
  services: Array<{ id: string; name: string; price: string }>;
  finalLook?: AIGeneratedLook | null;
};

export type EmployeeWithStats = Employee & {
  totalBookings: number;
  uniqueClientsServed: number;
};

export type AISessionWithLooks = AILookSession & {
  looks: AIGeneratedLook[];
};

export type WorkLogWithDetails = WorkLog & {
  client: Pick<Client, "fullName">;
  employee: Pick<Employee, "name" | "role">;
  booking: Pick<Booking, "eventType" | "bookingDate">;
  finalLookImageUrl?: string | null;
};

export type PreferencesData = {
  makeupStyle: string;
  hairstyle: string;
  colorTheme: string;
  dupattaStyle: string;
  additionalNotes?: string;
};

// NextAuth session extension
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      salonId: string;
      role: string;
      fullName: string;
      email: string;
    };
  }
}
```

---

## Phase 12 — Shared UI Components

### Step 12.1 — Status Badge

```
Create src/components/ui/StatusBadge.tsx:
Props: type ("booking" | "event" | "look" | "employee"), value: string

Color map:
bookingStatus: pending=yellow, confirmed=blue, in_progress=purple, 
               completed=green, cancelled=red
eventType: mehndi=amber, barat=red, valima=green, engagement=pink, other=gray
lookStatus: generated=gray, shortlisted=yellow, selected=green, rejected=slate
employeeStatus: active=green, inactive=gray
```

### Step 12.2 — Empty State

```
Create src/components/ui/EmptyState.tsx:
Props: icon (lucide component), title, description, actionLabel?, actionHref?
Centered layout, gray tones, icon above text, optional action button.
```

### Step 12.3 — Loading Skeletons

```
Create skeleton components using shadcn Skeleton:
- StatCardSkeleton (4 in a row)
- ClientRowSkeleton 
- BookingRowSkeleton
- EmployeeCardSkeleton
- LookCardSkeleton (portrait ratio with 2 bars below)
```

### Step 12.4 — Confirmation Dialog

```
Create src/components/ui/ConfirmDialog.tsx:
Props: open, title, description, confirmLabel, confirmVariant, onConfirm, onCancel
Used for: delete actions, regenerate AI, status changes
Uses shadcn AlertDialog
```

---

## Phase 13 — Final Integration Checklist

Work through these in order before deployment:

```
AUTH
□ Login works with admin@salon.com / Admin@123
□ Wrong credentials shows error toast
□ Unauthenticated /dashboard redirect → /login
□ Session includes salonId and role

DASHBOARD
□ Stats show correct counts from DB
□ Recent bookings and clients appear

CLIENTS
□ Create new client with all fields
□ Phone validation works (Pakistani format)
□ Client list search by name/phone works
□ Client detail shows bookings, AI looks, work history tabs

BOOKINGS
□ New booking 3-step form completes successfully
□ Client search works in step 1
□ Services auto-calculate total amount
□ Employee assignment saves correctly
□ Booking detail shows all related data
□ Status change dropdown updates and creates work log

EMPLOYEES
□ Add employee saves correctly
□ Employee list shows role filter
□ Employee work history tab shows correct entries

AI STUDIO (most important)
□ Camera option opens webcam successfully
□ Camera capture → preview → "Use This Photo" → uploads → imageUrl received
□ Gallery upload → drag/drop or click → progress bar → imageUrl received
□ "Change Photo" resets and allows re-selection
□ Preferences form validates required fields
□ "Generate Looks" button POSTs to /api/ai/generate
□ ai_look_sessions record created with status "processing"
□ External AI model called with correct payload
□ Returned image URLs saved in ai_generated_looks table
□ Session status updated to "completed"
□ Generated looks grid shows all returned images
□ Shortlist / reject updates look status in DB and UI
□ "Select as Final" marks one look as final
□ All other looks deselected when new final selected
□ look_selections record created with isFinal = true
□ booking.finalLookStatus updated to "selected"
□ employee_work_log created for look selection
□ Final look appears in booking detail right column
□ Final look appears in client profile AI Looks tab
□ "Return to Booking" button works after selection
□ Regenerate clears session and goes back to Step 1

WORK HISTORY
□ Work logs created on: booking creation, status change, look selection
□ Work history page filter by employee works
□ Work history page filter by date range works
□ Final look thumbnails appear in work log rows

GENERAL
□ All error states show friendly messages
□ All loading states show skeletons or spinners
□ All empty states show with icon and message
□ salonId isolation — no cross-salon data leakage
```

---

## Phase 14 — Deployment

### Step 14.1 — Pre-deploy Build

```bash
npm run build          # Fix all TypeScript/ESLint errors first
npm run db:generate
npm run db:migrate     # Run against production DB
npm run db:seed        # Seed once on production
```

### Step 14.2 — Vercel

```
1. Push to GitHub
2. Import repo in Vercel
3. Add all env vars (DATABASE_URL, AUTH_SECRET, UPLOADTHING_*, EXTERNAL_AI_API_URL, EXTERNAL_AI_API_KEY)
4. Framework: Next.js (auto-detected)
5. Deploy
6. Test: /login → dashboard → create booking → open AI Studio → full flow
```

---

## Common AI Prompts Cheatsheet

**External AI model integration problem:**
```
My external AI API returns this response shape: [paste actual response JSON]
Update src/lib/external-ai.ts to correctly extract the image URLs from this response.
The current extraction line is: data.images ?? data.results?.map(...) ?? data.output
```

**Camera not working:**
```
My CameraCapture.tsx using react-webcam shows a black screen / permission error.
Here is my component: [paste code]
Fix camera access issues including: permission handling, HTTPS requirement in dev, 
mobile vs desktop facing mode.
```

**Upload then generate flow broken:**
```
The flow is: image upload to Uploadthing → get URL → POST to /api/ai/generate.
I'm getting this error: [paste error]
Here is my AI Studio page state management: [paste code]
Fix the async flow so imageUrl is definitely set before generate is called.
```

**Drizzle join query:**
```
Write a Drizzle ORM query that fetches a booking by id with:
- client (fullName, phone, email, weddingDate, skinTone, faceShape)
- assigned employees (name, role, specialization, assignmentRole)
- services (name, priceAtBooking)
- latest AI session with all generated looks
- look_selections where isFinal = true

Schema: [paste relevant schema parts]
```

---

## Summary

| Module | Pages | API Routes |
|---|---|---|
| Auth | Login | /api/auth |
| Dashboard | 1 | — |
| Clients | List, New, Detail | /api/clients, /api/clients/[id] |
| Bookings | List, New, Detail | /api/bookings, /api/bookings/[id] |
| Employees | List, New, Detail | /api/employees, /api/employees/[id] |
| AI Studio | Studio Page | /api/ai/generate, /api/ai/looks/[id]/select |
| Work History | 1 | — |
| File Upload | — | /api/uploadthing |

**Total: ~16 pages, ~10 API routes, ~15 components**

---

*Guide Version 2.0 — Smart Salon AI Management System*  
*Key change: External AI model integration + Camera/Gallery dual input + Booking-linked look selection*