# 🚀 AI Chatbot Document Upload & Action Feature - Vision Document

## 📋 Executive Summary

Transform the AI chatbot from a **read-only query tool** into a **full operational assistant** that can:
- Upload and extract data from CSV files and images
- Intelligently parse and validate maintenance visits, schedules, and certificates
- Suggest actionable database operations
- Execute approved changes directly to the system

---

## 🎯 Core Capabilities

### 1. **Multi-Format Document Upload**
- **CSV Files**: Maintenance visits, employee schedules, certifications
- **Images (JPG/PNG/PDF)**: Certificates, work orders, inspection reports
- **Drag & Drop**: Intuitive file upload interface within chat

### 2. **Intelligent Data Extraction**
- **CSV Parsing**: Automatic column mapping to database schema
- **OCR (Image)**: GPT-5 Vision API extracts text from certificates, forms, documents
- **Data Validation**: AI validates against existing data structures
- **Smart Matching**: Automatically matches to employees, aircraft, authorization types

### 3. **Action Preview & Confirmation**
- **Structured Preview**: Extracted data displayed in clean, editable cards
- **Suggested Actions**: AI recommends operations (Create, Update, Bulk Insert)
- **Edit Before Commit**: User can modify extracted data before execution
- **Conflict Detection**: Warns about duplicates or data conflicts

### 4. **Direct Database Operations**
- **One-Click Execution**: Approve and execute database changes
- **Transaction Safety**: Rollback on errors
- **Audit Trail**: Log all automated changes with user attribution
- **Real-time Feedback**: Success/error messages with details

---

## 🎨 User Experience Flow

### **Example Flow A: Upload Maintenance Visit CSV**

```
┌─────────────────────────────────────────────────────┐
│ 🤖 MRO AI Assistant                            [X]  │
├─────────────────────────────────────────────────────┤
│                                                     │
│ USER: [Clicks attachment icon 📎]                  │
│       Uploads: maintenance_visits_jan2026.csv      │
│                                                     │
│ ┌─────────────────────────────────────────────┐   │
│ │ 📄 maintenance_visits_jan2026.csv           │   │
│ │ 3 rows • 1.2 KB                             │   │
│ └─────────────────────────────────────────────┘   │
│                                                     │
│ BOT: ✅ I've extracted 3 maintenance visits        │
│      from your CSV. Here's what I found:           │
│                                                     │
│ ╔═══════════════════════════════════════════════╗ │
│ ║ 🔧 MAINTENANCE VISIT #1                       ║ │
│ ╠═══════════════════════════════════════════════╣ │
│ ║ Aircraft: G-FVWF (A320)                       ║ │
│ ║ Visit Number: MV-2026-025                     ║ │
│ ║ Check Type: C-Check                           ║ │
│ ║ Date In: 2026-01-20                           ║ │
│ ║ Date Out: 2026-02-15                          ║ │
│ ║ Status: In Progress                           ║ │
│ ║ Hangar: Hangar 2                              ║ │
│ ╠═══════════════════════════════════════════════╣ │
│ ║ ⚠️ Note: Similar visit already exists         ║ │
│ ║    MV-2026-024 for G-FVWF (Jan 15 - Feb 10)  ║ │
│ ╠═══════════════════════════════════════════════╣ │
│ ║  [✏️ Edit]  [✅ Create Visit]  [❌ Skip]     ║ │
│ ╚═══════════════════════════════════════════════╝ │
│                                                     │
│ ╔═══════════════════════════════════════════════╗ │
│ ║ 🔧 MAINTENANCE VISIT #2                       ║ │
│ ╠═══════════════════════════════════════════════╣ │
│ ║ Aircraft: A6-XYZ (B777)                       ║ │
│ ║ Visit Number: MV-2026-026                     ║ │
│ ║ Check Type: A-Check                           ║ │
│ ║ Date In: 2026-01-22                           ║ │
│ ║ Date Out: 2026-01-28                          ║ │
│ ║ Status: Scheduled                             ║ │
│ ║ Hangar: Hangar 1                              ║ │
│ ╠═══════════════════════════════════════════════╣ │
│ ║ ✅ Ready to create (no conflicts)             ║ │
│ ╠═══════════════════════════════════════════════╣ │
│ ║  [✏️ Edit]  [✅ Create Visit]  [❌ Skip]     ║ │
│ ╚═══════════════════════════════════════════════╝ │
│                                                     │
│      [🚀 Create All Valid Visits (2/3)]            │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**After clicking "Create All":**

```
│ BOT: ✅ Successfully created 2 maintenance visits!  │
│                                                     │
│      • MV-2026-026 for A6-XYZ (A-Check)            │
│      • MV-2026-027 for N123AB (B-Check)            │
│                                                     │
│      ⏭️ Skipped 1 visit due to conflict            │
│                                                     │
│      📊 Updated statistics:                         │
│      - Total active visits: 8 → 10                 │
│      - Hangar 1 utilization: 75% → 85%             │
```

---

### **Example Flow B: Upload Certificate Image (OCR)**

```
┌─────────────────────────────────────────────────────┐
│ 🤖 MRO AI Assistant                            [X]  │
├─────────────────────────────────────────────────────┤
│                                                     │
│ USER: [Uploads photo of EASA certificate]          │
│                                                     │
│ ┌─────────────────────────────────────────────┐   │
│ │ 📸 easa_cert_john_doe.jpg                   │   │
│ │ [Image preview]                             │   │
│ └─────────────────────────────────────────────┘   │
│                                                     │
│ BOT: 📄 I've scanned the certificate.              │
│      Here's what I extracted:                      │
│                                                     │
│ ╔═══════════════════════════════════════════════╗ │
│ ║ 📜 EASA PART-66 CERTIFICATE                   ║ │
│ ╠═══════════════════════════════════════════════╣ │
│ ║ Employee: John Doe (E-12345)                  ║ │
│ ║ Certificate Type: EASA Part-66 Category B1.1  ║ │
│ ║ Certificate Number: UK.145.01234              ║ │
│ ║ Aircraft Type: A320 Family                    ║ │
│ ║ Issued Date: 2024-03-15                       ║ │
│ ║ Expiry Date: 2027-03-15                       ║ │
│ ║ Issuing Authority: UK CAA                     ║ │
│ ╠═══════════════════════════════════════════════╣ │
│ ║ 🔍 System Check:                              ║ │
│ ║ ✅ Employee found: John Doe (E-12345)         ║ │
│ ║ ✅ Aircraft model matched: A320               ║ │
│ ║ ⚠️ Existing auth expires in 5 days            ║ │
│ ║    (Current cert: UK.145.00999, exp 01/27/26) ║ │
│ ╠═══════════════════════════════════════════════╣ │
│ ║ 💡 Suggested Action:                          ║ │
│ ║ Update existing authorization with new cert   ║ │
│ ╠═══════════════════════════════════════════════╣ │
│ ║ [✏️ Edit Data]  [🔄 Update Auth]  [➕ New]   ║ │
│ ╚═══════════════════════════════════════════════╝ │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**After clicking "Update Auth":**

```
│ BOT: ✅ Authorization updated successfully!         │
│                                                     │
│      Updated record for John Doe (E-12345):        │
│      • EASA cert: UK.145.00999 → UK.145.01234      │
│      • Expiry: 01/27/26 → 03/15/27                 │
│      • Status: ⚠️ Expiring soon → ✅ Valid         │
│                                                     │
│      📧 Notification sent to John Doe              │
```

---

### **Example Flow C: Bulk Employee Schedule Upload**

```
┌─────────────────────────────────────────────────────┐
│ 🤖 MRO AI Assistant                            [X]  │
├─────────────────────────────────────────────────────┤
│                                                     │
│ USER: [Uploads] team_schedule_week4.csv            │
│                                                     │
│ BOT: 📅 Found employee schedule for Week 4         │
│      (Jan 22-28, 2026) with 45 assignments         │
│                                                     │
│ ╔═══════════════════════════════════════════════╗ │
│ ║ 📊 SCHEDULE SUMMARY                           ║ │
│ ╠═══════════════════════════════════════════════╣ │
│ ║ Date Range: Jan 22 - Jan 28, 2026            ║ │
│ ║ Employees: 45                                 ║ │
│ ║ Total Assignments: 315 (45 emp × 7 days)     ║ │
│ ║                                               ║ │
│ ║ Breakdown by Support Code:                   ║ │
│ ║ • AV (Available): 210 assignments             ║ │
│ ║ • L (Leave): 35 assignments                   ║ │
│ ║ • TR (Training): 28 assignments               ║ │
│ ║ • MV (Maintenance Visit): 42 assignments      ║ │
│ ╠═══════════════════════════════════════════════╣ │
│ ║ ⚠️ Conflicts Detected:                        ║ │
│ ║ • 3 employees already have assignments for    ║ │
│ ║   Jan 22 (will be overwritten)                ║ │
│ ╠═══════════════════════════════════════════════╣ │
│ ║ 📋 Sample Assignments:                        ║ │
│ ║ Jan 22: John Doe (E-12345) → MV-2026-025     ║ │
│ ║ Jan 22: Jane Smith (E-12346) → Available     ║ │
│ ║ Jan 22: Bob Wilson (E-12347) → Training      ║ │
│ ║ ... (312 more)                                ║ │
│ ╠═══════════════════════════════════════════════╣ │
│ ║ [📝 View All]  [✏️ Edit]  [⚠️ Overwrite]     ║ │
│ ║                           [➕ Merge New Only] ║ │
│ ╚═══════════════════════════════════════════════╝ │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## 🏗️ Technical Architecture

### **1. File Upload Component**

```typescript
// New component: DocumentUploader.tsx
interface UploadedDocument {
  id: string;
  file: File;
  type: 'csv' | 'image' | 'pdf';
  status: 'uploading' | 'processing' | 'extracted' | 'error';
  extractedData?: ExtractedData;
}

interface ExtractedData {
  documentType: 'maintenance_visit' | 'employee_schedule' | 'certificate' | 'unknown';
  entities: ExtractedEntity[];
  confidence: number;
  warnings: string[];
}

interface ExtractedEntity {
  id: string;
  type: string;
  fields: Record<string, any>;
  validation: ValidationResult;
  suggestedAction: 'create' | 'update' | 'skip';
  conflicts?: string[];
}
```

### **2. Processing Pipeline**

```
Upload File
    ↓
┌───────────────────┐
│ File Type Router  │
└───────────────────┘
    ↓           ↓
CSV Parser    Image OCR
    ↓           ↓
    └─────┬─────┘
          ↓
┌───────────────────────┐
│ GPT-5-nano Analysis   │
│ - Identify doc type   │
│ - Extract entities    │
│ - Validate fields     │
│ - Suggest actions     │
└───────────────────────┘
          ↓
┌───────────────────────┐
│ Database Validation   │
│ - Check duplicates    │
│ - Verify foreign keys │
│ - Find conflicts      │
└───────────────────────┘
          ↓
┌───────────────────────┐
│ Action Preview UI     │
│ - Show extracted data │
│ - Display conflicts   │
│ - Editable cards      │
│ - Action buttons      │
└───────────────────────┘
          ↓
┌───────────────────────┐
│ Execute Actions       │
│ - Begin transaction   │
│ - Insert/Update DB    │
│ - Rollback on error   │
│ - Log audit trail     │
└───────────────────────┘
```

### **3. AI Integration Points**

#### **A. CSV Analysis** (GPT-5-nano)
```typescript
const prompt = `
Analyze this CSV data and determine:
1. Document type (maintenance_visit, employee_schedule, certificate, etc.)
2. Map columns to database fields
3. Extract individual entities
4. Validate data integrity
5. Suggest appropriate actions

CSV Headers: ${headers}
Sample Rows: ${sampleRows}
Database Schema: ${relevantSchema}
`;
```

#### **B. Image OCR** (GPT-5 Vision API)
```typescript
const visionPrompt = `
Extract all text and structured data from this certificate/document.
Focus on:
- Employee name and ID
- Certificate type and number
- Aircraft/authorization type
- Issue and expiry dates
- Issuing authority

Return as structured JSON.
`;

const completion = await openai.chat.completions.create({
  model: 'gpt-5-nano-2025-08-07',
  messages: [
    {
      role: 'user',
      content: [
        { type: 'text', text: visionPrompt },
        { type: 'image_url', image_url: { url: imageDataUrl } }
      ]
    }
  ]
});
```

#### **C. Action Suggestion** (GPT-5-nano)
```typescript
const actionPrompt = `
Given this extracted data and existing database state:

Extracted Entity:
${JSON.stringify(entity)}

Existing Records:
${JSON.stringify(existingRecords)}

Determine:
1. Should we CREATE new, UPDATE existing, or SKIP?
2. What conflicts exist?
3. What validation warnings should we show?
4. Generate user-friendly action description
`;
```

### **4. Database Operations**

```typescript
// New file: documentActions.ts

interface DocumentAction {
  type: 'create' | 'update' | 'bulk_insert';
  table: string;
  data: any;
  validation: ValidationResult;
}

export async function executeDocumentAction(action: DocumentAction) {
  try {
    // Start transaction
    const { data, error } = await supabase.rpc('begin_transaction');

    switch (action.type) {
      case 'create':
        return await createNewRecord(action);
      case 'update':
        return await updateExistingRecord(action);
      case 'bulk_insert':
        return await bulkInsertRecords(action);
    }

    // Commit transaction
    await supabase.rpc('commit_transaction');

    // Log audit trail
    await logAuditTrail({
      action: action.type,
      table: action.table,
      recordCount: Array.isArray(action.data) ? action.data.length : 1,
      timestamp: new Date(),
      userId: currentUser.id
    });

    return { success: true, data };
  } catch (error) {
    // Rollback on error
    await supabase.rpc('rollback_transaction');
    return { success: false, error };
  }
}
```

### **5. UI Components**

#### **A. File Upload Zone**
```tsx
<div className="flex items-center gap-2 p-2 border-t">
  {/* Attachment Button */}
  <Button
    variant="ghost"
    size="icon"
    onClick={() => fileInputRef.current?.click()}
    className="text-purple-600"
  >
    <Paperclip className="h-5 w-5" />
  </Button>

  <input
    ref={fileInputRef}
    type="file"
    accept=".csv,.jpg,.jpeg,.png,.pdf"
    onChange={handleFileUpload}
    className="hidden"
  />

  {/* Chat Input */}
  <Input
    placeholder="Ask anything or upload a document..."
    value={input}
    onChange={(e) => setInput(e.target.value)}
  />

  <Button type="submit">
    <Send className="h-4 w-4" />
  </Button>
</div>
```

#### **B. Extracted Entity Card**
```tsx
<Card className="my-2 border-2 border-purple-200">
  <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50">
    <CardTitle className="text-sm flex items-center gap-2">
      <FileText className="h-4 w-4" />
      {entity.type.toUpperCase()} #{index + 1}
    </CardTitle>
  </CardHeader>

  <CardContent className="p-4">
    {/* Display extracted fields */}
    {Object.entries(entity.fields).map(([key, value]) => (
      <div key={key} className="flex justify-between py-1">
        <span className="text-gray-600">{formatFieldName(key)}:</span>
        <span className="font-medium">{value}</span>
      </div>
    ))}

    {/* Warnings */}
    {entity.conflicts?.length > 0 && (
      <Alert variant="warning" className="mt-2">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Conflicts Detected</AlertTitle>
        <AlertDescription>
          {entity.conflicts.map(c => <div key={c}>• {c}</div>)}
        </AlertDescription>
      </Alert>
    )}
  </CardContent>

  <CardFooter className="flex gap-2 bg-gray-50 p-3">
    <Button
      variant="outline"
      size="sm"
      onClick={() => handleEdit(entity)}
    >
      <Edit className="h-3 w-3 mr-1" />
      Edit
    </Button>

    <Button
      variant="default"
      size="sm"
      onClick={() => handleAction(entity)}
      className="bg-green-600 hover:bg-green-700"
    >
      <Check className="h-3 w-3 mr-1" />
      {entity.suggestedAction === 'create' ? 'Create' : 'Update'}
    </Button>

    <Button
      variant="ghost"
      size="sm"
      onClick={() => handleSkip(entity)}
    >
      <X className="h-3 w-3 mr-1" />
      Skip
    </Button>
  </CardFooter>
</Card>
```

#### **C. Bulk Action Bar**
```tsx
{extractedEntities.length > 1 && (
  <div className="sticky bottom-0 p-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-b-lg">
    <div className="flex items-center justify-between">
      <div>
        <div className="font-semibold">
          {validEntities.length} of {extractedEntities.length} ready
        </div>
        <div className="text-sm opacity-90">
          {conflictCount} conflicts • {warningCount} warnings
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          variant="secondary"
          onClick={handleEditAll}
        >
          Edit All
        </Button>
        <Button
          variant="default"
          onClick={handleExecuteAll}
          className="bg-white text-purple-600 hover:bg-gray-100"
        >
          <Zap className="h-4 w-4 mr-2" />
          Execute All ({validEntities.length})
        </Button>
      </div>
    </div>
  </div>
)}
```

---

## 📊 Supported Document Types

### **1. Maintenance Visit CSV**
**Expected Columns:**
```csv
Aircraft Registration, Visit Number, Check Type, Date In, Date Out, Status, Hangar, Remarks
G-FVWF, MV-2026-025, C-Check, 2026-01-20, 2026-02-15, In Progress, Hangar 2, Heavy maintenance
```

**Actions:**
- ✅ Create new maintenance visit
- 🔄 Update existing visit
- 📋 Bulk import multiple visits

### **2. Employee Schedule CSV**
**Expected Columns:**
```csv
Employee ID, Employee Name, Date, Support Code, Assignment (Visit Number or Notes)
E-12345, John Doe, 2026-01-22, MV, MV-2026-025
E-12346, Jane Smith, 2026-01-22, AV, Available for assignment
```

**Actions:**
- ✅ Create employee support assignments
- 🔄 Update/overwrite existing assignments
- 📋 Bulk schedule import (week/month)

### **3. Certificate Image (OCR)**
**Supported Formats:**
- EASA Part-66 certificates
- FAA certifications
- GCAA authorizations
- Manufacturer training certificates

**Extracted Fields:**
- Employee name/ID
- Certificate type and number
- Aircraft/authorization type
- Issue and expiry dates
- Issuing authority

**Actions:**
- ✅ Create new authorization
- 🔄 Update existing authorization
- 📋 Extend expiry date

### **4. Aircraft Registration CSV**
**Expected Columns:**
```csv
Registration, Aircraft Code, Aircraft Name, Model, Serial Number, Customer
G-FVWF, AC-001, Boeing 777-300ER, B777, SN-12345, British Airways
```

**Actions:**
- ✅ Add new aircraft to fleet
- 🔄 Update aircraft details

---

## 🔒 Security & Validation

### **Data Validation Rules**

```typescript
interface ValidationRule {
  field: string;
  type: 'required' | 'format' | 'reference' | 'range';
  validator: (value: any) => ValidationResult;
  errorMessage: string;
}

const maintenanceVisitRules: ValidationRule[] = [
  {
    field: 'aircraft_registration',
    type: 'reference',
    validator: async (reg) => await aircraftExists(reg),
    errorMessage: 'Aircraft not found in system'
  },
  {
    field: 'date_in',
    type: 'range',
    validator: (date) => isValidDate(date) && !isFutureDate(date, 90),
    errorMessage: 'Date must be within 90 days'
  },
  {
    field: 'visit_number',
    type: 'format',
    validator: (num) => /^MV-\d{4}-\d{3}$/.test(num),
    errorMessage: 'Invalid visit number format (expected: MV-YYYY-###)'
  }
];
```

### **Conflict Detection**

```typescript
interface ConflictCheck {
  type: 'duplicate' | 'overlap' | 'invalid_reference';
  severity: 'error' | 'warning' | 'info';
  message: string;
  resolution?: string;
}

async function checkMaintenanceVisitConflicts(visit: MaintenanceVisit) {
  const conflicts: ConflictCheck[] = [];

  // Check for duplicate visit number
  const existing = await supabase
    .from('maintenance_visits')
    .select('id')
    .eq('visit_number', visit.visit_number)
    .single();

  if (existing.data) {
    conflicts.push({
      type: 'duplicate',
      severity: 'error',
      message: `Visit number ${visit.visit_number} already exists`,
      resolution: 'Use a different visit number or update existing visit'
    });
  }

  // Check for overlapping visits for same aircraft
  const overlapping = await supabase
    .from('maintenance_visits')
    .select('*')
    .eq('aircraft_id', visit.aircraft_id)
    .or(`and(date_in.lte.${visit.date_out},date_out.gte.${visit.date_in})`);

  if (overlapping.data?.length > 0) {
    conflicts.push({
      type: 'overlap',
      severity: 'warning',
      message: `Aircraft has overlapping visit: ${overlapping.data[0].visit_number}`,
      resolution: 'Verify dates or create sequential visit'
    });
  }

  return conflicts;
}
```

### **Permission & Audit**

```typescript
interface AuditLog {
  id: string;
  timestamp: Date;
  userId: string;
  userName: string;
  action: 'document_upload' | 'create' | 'update' | 'bulk_insert';
  table: string;
  recordCount: number;
  documentType: string;
  fileName: string;
  extractedData: any;
  executedChanges: any;
  conflicts: ConflictCheck[];
  status: 'success' | 'partial' | 'failed';
}

// Log every document action
await supabase.from('audit_logs').insert({
  timestamp: new Date(),
  userId: user.id,
  userName: user.name,
  action: 'document_upload',
  table: 'maintenance_visits',
  recordCount: 3,
  documentType: 'maintenance_visit_csv',
  fileName: 'maintenance_visits_jan2026.csv',
  extractedData: extractedEntities,
  executedChanges: executedActions,
  status: 'success'
});
```

---

## 🎯 Success Metrics

### **User Experience**
- ⏱️ **Time Savings**: Reduce manual data entry from 15 min/visit → 30 sec/batch
- 🎯 **Accuracy**: 95%+ correct field extraction from documents
- ✅ **Success Rate**: 90%+ of uploads result in successful database operations

### **System Performance**
- 📄 **CSV Processing**: < 2 seconds for files up to 1000 rows
- 🖼️ **Image OCR**: < 5 seconds per certificate image
- 💾 **Database Ops**: < 1 second per record creation/update

### **Business Impact**
- 📈 **Adoption**: 80% of maintenance visits created via upload
- 🔄 **Updates**: 3× faster certificate renewal process
- 📊 **Data Quality**: Fewer manual entry errors

---

## 🚀 Implementation Roadmap

### **Phase 1: Foundation (Week 1-2)**
- ✅ File upload UI component
- ✅ CSV parsing (maintenance visits only)
- ✅ Basic entity extraction with GPT-5-nano
- ✅ Simple create action (no conflict detection)

### **Phase 2: Intelligence (Week 3-4)**
- ✅ Image OCR with GPT-5 Vision API
- ✅ Advanced conflict detection
- ✅ Edit before commit functionality
- ✅ Support for employee schedules

### **Phase 3: Polish (Week 5-6)**
- ✅ Bulk actions (create all, update all)
- ✅ Certificate upload support
- ✅ Audit trail logging
- ✅ Error recovery and rollback

### **Phase 4: Enhancement (Week 7-8)**
- ✅ Real-time validation as you type
- ✅ Template library (pre-defined CSV formats)
- ✅ Export functionality (reverse: DB → CSV)
- ✅ Advanced filtering and search in extracted data

---

## 💡 Future Enhancements

### **Advanced AI Features**
- 🤖 **Smart Suggestions**: AI recommends optimal hangars, teams based on workload
- 📊 **Predictive Analysis**: "This schedule will cause 85% hangar utilization"
- 🔍 **Anomaly Detection**: Warn about unusual patterns in uploaded data

### **Additional Document Types**
- 📋 Work orders and inspection reports
- 📄 Supplier invoices for parts tracking
- 📧 Email parsing for maintenance requests

### **Integration**
- 📨 Email attachment processing (forward docs to system)
- 📱 Mobile app for on-site photo uploads
- 🔗 API for third-party system integration

---

## 📝 Technical Dependencies

### **New NPM Packages**
```json
{
  "papaparse": "^5.4.1",           // CSV parsing
  "react-dropzone": "^14.2.3",      // Drag-drop file upload
  "tesseract.js": "^5.0.0",         // Fallback OCR (if Vision API unavailable)
  "zod": "^3.22.4",                 // Schema validation
  "react-hook-form": "^7.49.3"      // Edit forms
}
```

### **OpenAI API Updates**
- Enable GPT-5 Vision API for image processing
- Increase token limits for document analysis (up to 8000 tokens)

### **Database Changes**
```sql
-- New audit log table
CREATE TABLE audit_logs (
  id BIGSERIAL PRIMARY KEY,
  timestamp TIMESTAMP DEFAULT NOW(),
  user_id TEXT,
  user_name TEXT,
  action TEXT,
  table_name TEXT,
  record_count INT,
  document_type TEXT,
  file_name TEXT,
  extracted_data JSONB,
  executed_changes JSONB,
  conflicts JSONB,
  status TEXT
);

-- Index for querying audit logs
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
```

---

## 🎬 Demo Scenarios

### **Scenario 1: Monthly Schedule Upload**
**Input:** CSV with 800 employee assignments for February 2026
**Process:**
1. Upload file → 2s processing
2. AI extracts 800 assignments
3. Detects 15 conflicts (employees on leave)
4. Shows preview with warnings
5. User confirms → 3s bulk insert
6. Success: 785 created, 15 skipped

**Time Saved:** 6 hours manual entry → 3 minutes automated

### **Scenario 2: New Aircraft Onboarding**
**Input:** PDF with aircraft registration documents
**Process:**
1. Upload multi-page PDF
2. Vision API extracts registration, model, serial number
3. AI matches to existing aircraft models
4. Creates new aircraft record
5. Suggests creating initial maintenance schedule

**Time Saved:** 30 minutes data entry → 2 minutes automated

### **Scenario 3: Certificate Renewal Batch**
**Input:** 20 photos of renewed EASA certificates
**Process:**
1. Batch upload 20 images
2. OCR extracts all certificate data in parallel
3. AI matches to employee records
4. Shows 20 cards with update actions
5. User reviews and confirms all
6. Updates 20 authorization records

**Time Saved:** 2 hours manual processing → 10 minutes automated

---

## ✅ Summary

This document upload feature transforms the AI chatbot from a **passive information tool** into an **active operational assistant**. It bridges the gap between external documents and the system database, enabling:

- ⚡ **Rapid Data Entry**: Upload entire schedules in seconds
- 🎯 **High Accuracy**: AI-powered extraction reduces errors
- 🔒 **Safe Operations**: Validation and conflict detection prevent mistakes
- 📊 **Complete Visibility**: Preview all changes before execution
- 🔍 **Full Audit Trail**: Track every automated action

**Next Step:** Review this vision and prioritize features for Phase 1 implementation.

---

**Document Version:** 1.0
**Created:** January 22, 2026
**Author:** AI Architecture Team
**Status:** 📋 Awaiting Review & Approval
