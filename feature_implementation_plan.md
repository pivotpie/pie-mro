# Feature Envisioning & Implementation Plan: Pie-MRO v2.0

## 1. Global "Omni-Search" (Google-like Experience)

### Concept
Transform the header search bar into a command center. Instead of just filtering lists, it acts as a global index for the entire MRO ecosystem.

### User Experience
1.  **Input:** User types "A350", "Ahmed", or "B1 License".
2.  **Dropdown:** A `Command` palette appears, grouped by category (Employees, Aircraft, Training, Maintenance).
3.  **Action:** Clicking an item opens a dedicated **Context Modal** (without navigating away from the current page) or deep-links to the specific view.

### Technical Implementation
*   **Component:** Refactor `WorkforceGlobalHeader.tsx`.
*   **Search Engine:** Create a new hook `useOmniSearch`.
    *   **Logic:** Perform parallel `ilike` queries on Supabase tables (`employees`, `aircraft`, `training_sessions`, `maintenance_visits`) or use Supabase Text Search features if enabled.
*   **UI:** Use `cmdkh` (Shadcn Command) for the dropdown UI.
*   **Display:**
    *   Create a `GlobalDetailModal` wrapper.
    *   Reuse `EmployeeDetailPanel` for employees.
    *   Reuse `AircraftDetailsModal` (read-only mode) for aircraft.
    *   Create a new simple `SessionDetailView` for training.

---

## 2. AI-Driven Team Assembly (Smart Scheduling)

### Concept
When scheduling a *new* maintenance visit, instead of manually picking from a list of 100+ mechanics, the system proposes 3 complete "Squads" optimized for compliance and efficiency.

### User Experience
1.  User clicks an empty slot in `AircraftScheduleSection`.
2.  Modal opens showing "Personnel Requirements" (e.g., 1 B1, 1 B2, 2 Mech).
3.  **New Section:** "Suggested Teams".
    *   **Team Alpha (98% Match):** High capability, balanced shifts. Color: Green.
    *   **Team Bravo (85% Match):** Good capability, higher cost/overtime risk. Color: Blue.
    *   **Team Charlie (75% Match):** Minimal viable team. Color: Amber.
4.  **Action:** "Select Team" populates the assignment slots instantly.
5.  **Fallback:** "Manual Selection" button reveals the existing list view.

### Technical Implementation (`AircraftDetailsModal.tsx`)
*   **Algorithm (Client-Side Heuristic):**
    *   Since we don't have a Python backend, we implement a **Weighted Greedy Algorithm** in TypeScript.
    *   **Inputs:** Required Trades (B1, B2, Cat A), Date Range.
    *   **Scoring Weights:**
        *   Authorization Match: 50 pts (Critical)
        *   Availability (Not on Leave): 30 pts (Critical)
        *   Experience (Years): 20 pts
*   **Grouping Logic:**
    1.  Fetch all available employees.
    2.  Filter by Mandatory Qualifications.
    3.  Sort by Score.
    4.  **Bucket Distribution:** Distribute top scorers into Team A, next best into Team B, etc., ensuring trade requirements (e.g., 1 B1 per team) are met first.

---

## 3. Temporal Migration (Time Travel to 2026)

### Concept
Shift the entire application context 8 months forward to simulate "Live" operations in Jan-Feb 2026.

### Implementation Strategy
This requires a two-pronged approach: Database Migration and Code Default Updates.

**A. Database Migration (SQL Script)**
We will execute a SQL script via Supabase SQL Editor to shift dates:
```sql
-- Example Logic
UPDATE maintenance_visits SET 
    date_in = date_in + INTERVAL '8 months',
    date_out = date_out + INTERVAL '8 months';

UPDATE training_sessions SET 
    start_date = start_date + INTERVAL '8 months',
    end_date = end_date + INTERVAL '8 months';

UPDATE employee_roster SET date = date + INTERVAL '8 months';
-- Need to handle date_references lookup table shifts as well
```

**B. Frontend Updates**
*   **`DateContext.tsx`**: Change default state from `new Date()` to `new Date('2026-01-12')` (or similar).
*   **Mock Data:** Update hardcoded JSON files (`mockTrainingSessions`, `mockEmployees` cert dates) in `TrainingManagementSystem.tsx` by adding ~240 days to string dates.

---

## 4. AI Operations Assistant (Chatbot)

### Concept
A floating chat widget that allows natural language querying of the MRO database.
*   *User:* "Who is qualified for B787 engine run-ups?"
*   *Bot:* "Here are 5 employees qualified for B787 GEnx: [List]..."

### Technical Implementation
*   **UI:** A floating widget (bottom-right) using Shadcn `Sheet` or a custom Chat Popover.
*   **Architecture (RAG-Lite):**
    1.  **Context Injection:** On chat open, we fetch a *summarized* JSON of active aircraft status and "Available" employee counts.
    2.  **System Prompt:** "You are an MRO Assistant. You have access to the following current operational data..."
    3.  **Processing:**
        *   **Option A (Real AI):** Use Supabase Edge Functions to call OpenAI/Anthropic API, passing the summarized DB context.
        *   **Option B (Simulated/Keyword):** If no API key is available, use a keyword mapping system (e.g., if input contains "who" and "B1", run the B1 filter logic and display results).
    *   *Recommendation:* We will build the UI and the "Context Fetcher". We can implement a robust "Keyword Matcher" that feels like AI, or plug in an actual API key if provided.

---

## Execution Roadmap

1.  **Phase 1: Date Migration (The Foundation).** We must do this first so all subsequent features work on the correct timeline (2026).
2.  **Phase 2: Global Search.** Build the hook and the Header UI.
3.  **Phase 3: AI Team Suggestions.** Upgrade the `AircraftDetailsModal` with the new grouping algorithm.
4.  **Phase 4: Chatbot.** Build the overlay and the context-retrieval logic.
