# Phase 2 Features - User Guide

This guide covers the 4 major features added in Phase 2 of the Pie-MRO platform.

---

## Table of Contents
1. [Global Omni-Search](#1-global-omni-search)
2. [AI Team Assembly](#2-ai-team-assembly)
3. [Temporal Migration to 2026](#3-temporal-migration-to-2026)
4. [AI Operations Assistant](#4-ai-operations-assistant)

---

## 1. Global Omni-Search

### What is it?
A powerful, Google-like search that lets you instantly find employees, aircraft, certifications, and training sessions from anywhere in the application.

### How to Access
**Keyboard Shortcut:**
- **Mac:** `⌘ + G` (Command + G)
- **Windows/Linux:** `Ctrl + G`

**Or Click:**
- Click the search bar in the global header that says "Search employees, aircraft, certifications..."

### How to Use

#### Step 1: Open Search
Press `Cmd+G` (or `Ctrl+G`) or click the search bar. A command dialog will appear.

#### Step 2: Type Your Query
Start typing any of the following:
- **Employee names:** "Ahmed", "Mohammed", "Ali"
- **Employee numbers:** "1234"
- **Aircraft registrations:** "A6-", "G-FVWF"
- **Aircraft types:** "A350", "Boeing 777"
- **Certification codes:** "B1", "B2", "EASA"
- **Training sessions:** "Engine Run", "Hydraulics"

#### Step 3: View Results
Results are grouped by category:
- 👤 **Employees** - Shows name, job title, and employee number
- ✈️ **Aircraft** - Shows registration, name, and aircraft type
- 🏆 **Certifications** - Shows certification code and description
- 📚 **Training Sessions** - Shows session name, code, and start date

#### Step 4: Select a Result
Click on any result to:
- **Employee:** Opens employee detail panel on the right
- **Aircraft:** Opens aircraft details modal (shows team, requirements, schedule)
- **Certification:** Opens certification detail panel
- **Training Session:** Logs to console (full integration coming soon)

### Search Features
- **Real-time search** - Results appear as you type (300ms debounce)
- **Multi-source** - Searches 4 different data sources simultaneously
- **Smart matching** - Case-insensitive, partial text matching
- **Limited results** - Shows top 5 matches per category to prevent overload

### Example Searches

| Search Query | What You'll Find |
|--------------|------------------|
| `Ahmed` | All employees named Ahmed |
| `B1` | Employees with B1 certification, B1 cert codes |
| `A350` | A350 aircraft, employees certified for A350 |
| `1234` | Employee with E-number 1234 |
| `G-FVWF` | Aircraft with registration G-FVWF |
| `Engine` | Training sessions related to engines |

### Tips
- The search bar shows the keyboard shortcut badge (`⌘G`) for quick reference
- Press `Esc` to close the search dialog
- Search is available on all pages where the global header is visible

---

## 2. AI Team Assembly

### What is it?
An intelligent system that suggests optimal teams for aircraft maintenance based on employee qualifications, availability, and experience.

### Where to Find It
1. Navigate to the **Aircraft Schedule** section in Admin Workforce page
2. Click on any aircraft card with status **"Scheduled"**
3. The Aircraft Details Modal will open
4. Look for the **"✨ AI Suggested Teams"** section with a purple sparkle icon

### How It Works

#### Scoring Algorithm
The AI evaluates each employee using a weighted scoring system:

| Criteria | Points | What It Checks |
|----------|--------|----------------|
| **Authorization Match** | 50 pts | Employee has authorization for this aircraft type/model |
| **Availability** | 30 pts | Employee is not on leave, sick, or in training |
| **Experience** | 20 pts | Relevant job title (Technician, Engineer, Mechanic, Inspector) |

**Total Possible Score:** 100 points

#### Team Suggestions

The AI generates 3 team options:

##### Team Alpha (High Performance) - ~98% Match
- **Composition:** Top 6 highest-scoring employees
- **Best For:** Critical maintenance, tight deadlines, complex aircraft
- **Color:** Green border
- **Quality:** All members score 70+ points

##### Team Bravo (Standard) - ~85% Match
- **Composition:** Next 6 highest-scoring employees
- **Best For:** Routine maintenance, standard checks
- **Color:** Blue border
- **Quality:** Mix of senior and intermediate staff

##### Team Charlie (Training) - ~79% Match
- **Composition:** 2 senior employees + 4 junior employees
- **Best For:** Training opportunities, mentorship, less critical tasks
- **Color:** Amber border
- **Quality:** Balanced mix for skill development

### Using AI Suggested Teams

#### Step 1: Open Aircraft Details
Click on a **Scheduled** aircraft from the Aircraft Schedule section.

#### Step 2: Review Suggestions
You'll see 3 team cards at the top of the modal, each showing:
- Team name and performance level
- Match percentage (e.g., "98% Match")
- Number of members
- Trade breakdown (e.g., "3 B1 • 2 B2")
- Avatar previews of first 5 members

#### Step 3: Select a Team
Click the **"Select Team"** button on your preferred team card.

#### Step 4: Automatic Assignment
The system will:
1. ✅ Assign all team members to the aircraft
2. ✅ Create core and support assignments for the entire maintenance period
3. ✅ Update aircraft status from "Scheduled" to "In Progress"
4. ✅ Show success notification
5. ✅ Clear the AI suggestions (since aircraft is no longer scheduled)
6. ✅ Move assigned employees to the "Currently Assigned Team" section

### Manual Team Building

If AI suggestions don't meet your needs, you can still manually build teams:

#### Option 1: Search and Filter
Use the enhanced search bar to filter employees:
- **Search examples:**
  - `B1, A350, Trent` - Finds B1-certified employees qualified for A350 with Trent engine experience
  - `B2, 777` - Finds B2 technicians for Boeing 777
  - `available` - Shows only available employees

#### Option 2: Bulk Selection
1. Use checkboxes to select multiple employees
2. Click **"Assign Selected (X)"** button to assign them all at once

#### Option 3: Individual Assignment
Click the **"+"** button next to any employee to add them individually.

### Understanding Employee Match Scores

Employees in the Available Employees table are color-coded:

| Color | Score Range | Meaning |
|-------|-------------|---------|
| 🟢 **Green** | 70-100 pts | Excellent match - highly qualified |
| 🟡 **Amber** | 30-69 pts | Acceptable match - meets basic requirements |
| ⚪ **White** | 0-29 pts | Poor match - missing key qualifications |

### Team Assignment Details

When you assign a team, the system:
- Creates `employee_cores` records linking employees to aircraft registration
- Creates `employee_supports` records for each day of the maintenance period
- Updates the aircraft from date_in to date_out
- Handles core_codes and support_codes table updates automatically

### Tips
- **AI suggestions only appear for "Scheduled" aircraft** - Completed and In Progress aircraft show historical teams
- **Review trade breakdown** - Ensure you have the right mix (B1, B2, Structural, etc.)
- **Check member avatars** - Hover to see employee names
- **Match percentages are comparative** - A 79% match is still a qualified team
- **Teams disappear after selection** - This prevents duplicate assignments

---

## 3. Temporal Migration to 2026

### What Changed?
The entire application has been migrated to operate with a reference date of **January 12, 2026** instead of the previous May 2025 timeframe.

### Why This Change?
- **Realistic simulation** - Allows testing with "current" data in 2026
- **Future planning** - Demonstrates the platform with forward-looking schedules
- **Demo consistency** - All dates align with a consistent temporal context

### What's Affected

#### Frontend (Automatic)
- **Default Date:** Application loads with January 12, 2026 as "today"
- **Date Picker:** Shows Jan 12, 2026 with a blue "Set" badge
- **All Displays:** Maintenance visits, training sessions, and schedules show 2026 dates

#### Database (Manual Migration Required)

⚠️ **You must run the database migration** to shift historical data to 2026.

**Tables Updated (8 total):**
1. `maintenance_visits` - Aircraft maintenance schedules
2. `training_sessions` - Training program dates
3. `employee_authorizations` - License issue and expiry dates
4. `certifications` - Certification issue and expiry dates
5. `attendance` - Historical attendance records
6. `employee_supports` - Daily support assignments
7. `employee_cores` - Daily core assignments
8. `personnel_requirements` - Workforce demand by date

**Migration Amount:** All dates shifted forward by **8 months** (May 2025 → Jan 2026)

### How to Run the Migration

#### Step 1: Access Supabase Dashboard
1. Go to https://supabase.com/dashboard
2. Navigate to your project: `kwjxauwfoplmsenhfezm`
3. Click on **SQL Editor** in the left sidebar

#### Step 2: Execute Migration
1. Click **"New Query"**
2. Open the file: `supabase/migrations/20260119000000_shift_dates_to_2026_safe.sql`

   **Important:** Use the **_safe.sql** version, not the original migration file. The safe version handles unique constraints properly.

3. Copy the entire contents
4. Paste into the SQL Editor
5. Click **"Run"** or press `Cmd+Enter`

#### Step 3: Verify Success
You should see:
```
Success. No rows returned
COMMIT
```

This means the transaction completed successfully.

#### Step 4: Check Results
Run this query to verify:
```sql
SELECT date_in, date_out
FROM maintenance_visits
ORDER BY date_in DESC
LIMIT 5;
```

You should see dates in 2026.

### Using the Date System

#### Changing the Current Date
1. Click the **calendar icon** in the global header
2. Current date shows as: `Jan 12, 2026` with a blue "Set" badge
3. Click to open the date picker modal
4. Select any date you want to simulate
5. Click **"Set Date"** to apply
6. The entire application updates to show data relative to your selected date

#### Resetting to "Today"
1. Open the date picker
2. Click **"Reset to Today"** button
3. This sets the date back to January 12, 2026 (the demo "today")

#### Date Indicator
- **Blue "Set" Badge:** Date has been manually changed
- **No Badge:** Using default date (Jan 12, 2026)

### Impact on Features

**Global Omni-Search:**
- Training session start dates show 2026

**AI Team Assembly:**
- Personnel requirements calculated for 2026 dates
- Availability checks use 2026 roster data

**Aircraft Schedule:**
- All maintenance visits display in 2026 timeline
- 60-day calendar window shows Jan-Mar 2026

**Employee Calendar:**
- Roster assignments aligned to 2026 calendar
- Availability and leave dates in 2026

### How the Safe Migration Works

The safe migration uses a **temporary table strategy** to avoid unique constraint violations:

**For tables with unique constraints (employee_supports, employee_cores):**
1. Creates a temporary table with shifted dates
2. Deletes all records from the original table
3. Inserts the shifted data back from the temp table
4. Resets ID sequences to maintain continuity
5. Drops the temporary table

**For tables without date constraints:**
- Uses simple `UPDATE` statements with `+ INTERVAL '8 months'`

This approach ensures no conflicts occur during the migration.

### Rolling Back (If Needed)

If you need to revert to 2025 dates:

1. Open Supabase SQL Editor
2. Load the file: `ROLLBACK_20260119000000_shift_dates_to_2025.sql`
3. **Warning:** This will shift ALL dates back by 8 months
4. Only run if you're certain you want to revert
5. The rollback uses the same safe temporary table approach

### Tips
- **Migration is reversible** - Use the rollback script if needed
- **Transaction safety** - Migration wrapped in BEGIN/COMMIT for rollback on error
- **Backup recommended** - Consider backing up your database before running
- **Date references skipped** - Calendar lookup table already has future dates
- **Roster assignments preserved** - These use date_references IDs, not direct dates
- **Safe for production** - Temporary table approach prevents data loss

---

## 4. AI Operations Assistant

### What is it?
An intelligent chatbot that answers questions about aircraft status, employee availability, certifications, and maintenance operations using real-time database queries.

### How to Access

#### Opening the Chatbot
Look for the **purple bot icon** (🤖) in the **bottom-right corner** of any page in the Workforce Admin area.

Click the icon to open the chat window.

#### Closing the Chatbot
Click the **X button** in the top-right corner of the chat window.

### How to Use

#### Step 1: Open Chat
Click the purple bot icon. The chat window slides in from the bottom with a welcome message:
> "Hello! I'm your MRO Assistant. Ask me about aircraft status, employee availability, or certifications."

#### Step 2: Ask Questions
Type your question in the text box at the bottom and press Enter or click the send button.

### Supported Queries

#### 1. Aircraft Status Queries

**What to Ask:**
- "Which aircraft are grounded?"
- "Show me aircraft in maintenance"
- "Any planes under maintenance?"

**What You Get:**
- List of aircraft currently in maintenance (not completed)
- Aircraft registration numbers
- Check type (e.g., "A-Check", "C-Check")
- Count of total aircraft in maintenance

**Example Response:**
> "There are 3 aircraft currently in maintenance: G-FVWF (C-Check), A6-ABC (A-Check), A6-XYZ (B-Check)."

#### 2. Employee Availability Queries

**What to Ask:**
- "Who is available?"
- "Show me available mechanics"
- "Which engineers are free?"

**What You Get:**
- General availability statistics
- Reference to check Employee Calendar for details
- Current shift availability percentage

**Example Response:**
> "I can check live availability in the Employee Calendar. Generally, we have 85% workforce availability for the current shift."

#### 3. Certification Queries

**What to Ask:**
- "Are there any expiring licenses?"
- "Show me license expiry"
- "Which certifications expire soon?"

**What You Get:**
- Information about checking the Certification Portal
- Future feature preview

**Example Response:**
> "You can check expiring licenses in the Certification Portal. Would you like me to open that for you? (Feature coming soon)"

### Chat Features

#### Visual Design
- **Header:** Purple gradient with MRO Assistant title and sparkle icon
- **Messages:**
  - Your messages: Blue background on the right
  - Bot messages: Gray background on the left
- **Typing Indicator:** Three bouncing dots when bot is "thinking"
- **Auto-scroll:** Always shows the latest message

#### Message Flow
1. You send a message → appears on right in blue
2. Bot shows typing indicator (3 bouncing dots)
3. Bot responds after ~1 second → appears on left in gray

#### Dark Mode Support
The chatbot automatically adapts to your theme:
- **Light Mode:** White background, gray bot messages
- **Dark Mode:** Dark gray background, darker bot messages

### Technical Details

#### How It Works (Current Implementation)
1. **Keyword Matching** - Identifies query type from your message
2. **Database Query** - Fetches live data from Supabase
3. **Response Generation** - Formats data into natural language

#### Data Sources
- `maintenance_visits` table - Aircraft status
- `roster_assignments` table - Employee availability
- `employee_authorizations` table - License expiry dates

### Future Enhancements (Roadmap)

The chatbot is designed to support full LLM integration:

#### Coming Soon:
- ✅ Natural language understanding (OpenAI/Anthropic API)
- ✅ Complex multi-step queries
- ✅ Context-aware conversations
- ✅ Opening relevant panels/modals from chat
- ✅ Scheduling suggestions
- ✅ Compliance reminders

#### Upgrading to Real AI

For developers: To integrate a real LLM, update the `processQuery` function in `src/components/workforce/AIChatbot.tsx`:

```typescript
const processQuery = async (query: string): Promise<string> => {
  // Fetch operational context
  const context = await fetchOperationalContext();

  // Call LLM API (OpenAI example)
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'You are an MRO operations assistant...' },
        { role: 'user', content: query }
      ]
    })
  });

  const data = await response.json();
  return data.choices[0].message.content;
};
```

### Tips
- **Be specific** - "Which aircraft are grounded?" works better than "aircraft?"
- **Current implementation is keyword-based** - Exact phrasing matters for now
- **Check spelling** - "mechanic" vs "mechanics" may give different results
- **Try variations** - If one query doesn't work, rephrase it
- **Case insensitive** - "GROUNDED" and "grounded" work the same

### Limitations (Current Version)
- Keyword-based matching only (no true NLP yet)
- Limited query types (3 categories: aircraft, availability, certifications)
- Cannot perform actions (read-only queries)
- No conversation memory (each query is independent)

### Best Practices
1. **Start simple** - Ask about one thing at a time
2. **Use supported keywords** - "grounded", "available", "expiring", "license"
3. **Reference the prompts** - Use queries similar to the examples above
4. **Check linked features** - Bot may direct you to Calendar or Portal for details

---

## Quick Reference Card

### Keyboard Shortcuts
| Action | Mac | Windows/Linux |
|--------|-----|---------------|
| Open Global Search | `⌘ + G` | `Ctrl + G` |
| Close Dialog/Modal | `Esc` | `Esc` |

### Feature Access Points
| Feature | How to Access |
|---------|---------------|
| **Omni-Search** | Press `Cmd+G` or click search bar in header |
| **AI Team Assembly** | Click scheduled aircraft → View "AI Suggested Teams" |
| **Date Changer** | Click calendar icon in header |
| **AI Chatbot** | Click purple bot icon in bottom-right corner |

### Status Indicators
| Color/Badge | Meaning |
|-------------|---------|
| 🟢 Green highlight | High match score (70-100 pts) |
| 🟡 Amber highlight | Medium match score (30-69 pts) |
| 🔵 Blue "Set" badge | Date manually changed from default |
| 🟣 Purple sparkle | AI-powered feature |

---

## Troubleshooting

### Global Omni-Search
**Problem:** Search not opening
- **Solution:** Make sure you're on the Workforce Admin page
- Check that global header is visible

**Problem:** No results found
- **Solution:** Try broader search terms (e.g., "A6" instead of full registration)
- Check spelling
- Database may be empty for that category

### AI Team Assembly
**Problem:** No AI suggestions shown
- **Solution:** Feature only works for aircraft with status "Scheduled"
- Check that aircraft has a valid start/end date
- Ensure you have employees in the database

**Problem:** Teams seem poorly matched
- **Solution:** Check employee authorizations and certifications
- Verify employee availability status (not on leave)
- Review match score breakdown in Available Employees table

### Temporal Migration
**Problem:** Still seeing 2025 dates
- **Solution:** Run the database migration SQL
- Refresh your browser
- Check DateContext is set to Jan 12, 2026

**Problem:** Migration failed with "duplicate key value violates unique constraint"
- **Error:** `ERROR: 23505: duplicate key value violates unique constraint "employee_supports_employee_support_date_unique"`
- **Cause:** The original migration file tries to update dates in-place, which conflicts with unique constraints
- **Solution:** Use the **safe migration file** instead: `20260119000000_shift_dates_to_2026_safe.sql`
- This version uses temporary tables to avoid constraint violations

**Problem:** Migration failed with other error
- **Solution:** Check Supabase logs for specific error
- Ensure you're connected to the correct project
- Verify table names match your schema
- If migration partially completed, use the rollback script: `ROLLBACK_20260119000000_shift_dates_to_2025.sql`

### AI Chatbot
**Problem:** Bot not responding
- **Solution:** Check browser console for errors
- Verify Supabase connection
- Try refreshing the page

**Problem:** Wrong or generic answers
- **Solution:** Use specific keywords from supported queries
- Rephrase your question
- Remember current version is keyword-based, not true AI

---

## Support & Feedback

For issues or feature requests:
1. Check this documentation first
2. Review the Phase 2 implementation guide
3. Contact your system administrator
4. Submit bug reports to the development team

---

**Last Updated:** January 2026
**Version:** Phase 2.0
**Platform:** Pie-MRO Resource Planning & Compliance
