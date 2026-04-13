# Codebase Cleanup Inventory

## File Inventory

### Folder: `app`

- **File**: `app/layout.tsx`
  - **Type**: Layout
  - **Purpose**: Global or nested layout for Next.js routes.
  - **Used In**: None
  - **Status**: Actively used
  - **Lines**: 62
  - **Dependency Notes**: Imported by 0 file(s).

- **File**: `app/page.tsx`
  - **Type**: Page
  - **Purpose**: Entry point for a Next.js route.
  - **Used In**: None
  - **Status**: Actively used
  - **Lines**: 59
  - **Dependency Notes**: Imported by 0 file(s).

### Folder: `app/books`

- **File**: `app/books/page.tsx`
  - **Type**: Page
  - **Purpose**: Entry point for a Next.js route.
  - **Used In**: None
  - **Status**: Actively used
  - **Lines**: 154
  - **Dependency Notes**: Imported by 0 file(s).

### Folder: `app/businesses`

- **File**: `app/businesses/page.tsx`
  - **Type**: Page
  - **Purpose**: Entry point for a Next.js route.
  - **Used In**: None
  - **Status**: Actively used
  - **Lines**: 58
  - **Dependency Notes**: Imported by 0 file(s).

### Folder: `app/finances`

- **File**: `app/finances/page.tsx`
  - **Type**: Page
  - **Purpose**: Entry point for a Next.js route.
  - **Used In**: None
  - **Status**: Actively used
  - **Lines**: 74
  - **Dependency Notes**: Imported by 0 file(s).

### Folder: `app/goals`

- **File**: `app/goals/page.tsx`
  - **Type**: Page
  - **Purpose**: Entry point for a Next.js route.
  - **Used In**: None
  - **Status**: Actively used
  - **Lines**: 33
  - **Dependency Notes**: Imported by 0 file(s).

### Folder: `app/habits`

- **File**: `app/habits/page.tsx`
  - **Type**: Page
  - **Purpose**: Entry point for a Next.js route.
  - **Used In**: None
  - **Status**: Actively used
  - **Lines**: 31
  - **Dependency Notes**: Imported by 0 file(s).

### Folder: `app/pantry`

- **File**: `app/pantry/page.tsx`
  - **Type**: Page
  - **Purpose**: Entry point for a Next.js route.
  - **Used In**: None
  - **Status**: Actively used
  - **Lines**: 186
  - **Dependency Notes**: Imported by 0 file(s).

### Folder: `app/wardrobe`

- **File**: `app/wardrobe/page.tsx`
  - **Type**: Page
  - **Purpose**: Entry point for a Next.js route.
  - **Used In**: None
  - **Status**: Actively used
  - **Lines**: 361
  - **Dependency Notes**: Imported by 0 file(s).

### Folder: `components`

- **File**: `components/AIAssistant.tsx`
  - **Type**: Feature Component
  - **Purpose**: Specific domain logic and UI.
  - **Used In**: 
    - `app/layout.tsx`
  - **Status**: Actively used
  - **Lines**: 1277
  - **Dependency Notes**: Imported by 1 file(s).

- **File**: `components/AuthGuard.tsx`
  - **Type**: Feature Component
  - **Purpose**: Specific domain logic and UI.
  - **Used In**: 
    - `app/layout.tsx`
  - **Status**: Actively used
  - **Lines**: 76
  - **Dependency Notes**: Imported by 1 file(s).

- **File**: `components/DataLoader.tsx`
  - **Type**: Feature Component
  - **Purpose**: Specific domain logic and UI.
  - **Used In**: 
    - `app/layout.tsx`
    - `components/SyncManager.tsx`
  - **Status**: Actively used
  - **Lines**: 119
  - **Dependency Notes**: Imported by 2 file(s).

- **File**: `components/FloatingNavbar.tsx`
  - **Type**: Feature Component
  - **Purpose**: Specific domain logic and UI.
  - **Used In**: 
    - `app/layout.tsx`
  - **Status**: Actively used
  - **Lines**: 132
  - **Dependency Notes**: Imported by 1 file(s).

- **File**: `components/LoginPage.tsx`
  - **Type**: Feature Component
  - **Purpose**: Specific domain logic and UI.
  - **Used In**: 
    - `components/AuthGuard.tsx`
  - **Status**: Actively used
  - **Lines**: 123
  - **Dependency Notes**: Imported by 1 file(s).

- **File**: `components/NavigationBar.tsx`
  - **Type**: Feature Component
  - **Purpose**: Specific domain logic and UI.
  - **Used In**: 
    - `app/layout.tsx`
  - **Status**: Actively used
  - **Lines**: 94
  - **Dependency Notes**: Imported by 1 file(s).

- **File**: `components/Providers.tsx`
  - **Type**: Feature Component
  - **Purpose**: Specific domain logic and UI.
  - **Used In**: 
    - `app/layout.tsx`
  - **Status**: Actively used
  - **Lines**: 83
  - **Dependency Notes**: Imported by 1 file(s).

- **File**: `components/SyncManager.tsx`
  - **Type**: Feature Component
  - **Purpose**: Specific domain logic and UI.
  - **Used In**: 
    - `app/layout.tsx`
  - **Status**: Actively used
  - **Lines**: 17
  - **Dependency Notes**: Imported by 1 file(s).

- **File**: `components/SyncStatus.tsx`
  - **Type**: Feature Component
  - **Purpose**: Specific domain logic and UI.
  - **Used In**: 
    - `components/NavigationBar.tsx`
  - **Status**: Actively used
  - **Lines**: 81
  - **Dependency Notes**: Imported by 1 file(s).

- **File**: `components/ThemeProvider.tsx`
  - **Type**: Feature Component
  - **Purpose**: Specific domain logic and UI.
  - **Used In**: 
    - `components/Providers.tsx`
  - **Status**: Actively used
  - **Lines**: 12
  - **Dependency Notes**: Imported by 1 file(s).

- **File**: `components/ThemeToggle.tsx`
  - **Type**: Feature Component
  - **Purpose**: Specific domain logic and UI.
  - **Used In**: 
    - `app/layout.tsx`
  - **Status**: Actively used
  - **Lines**: 50
  - **Dependency Notes**: Imported by 1 file(s).

### Folder: `components/books`

- **File**: `components/books/BookModal.tsx`
  - **Type**: Modal Component
  - **Purpose**: Displays a pop-up modal interface.
  - **Used In**: 
    - `components/books/ReadingQueue.tsx`
  - **Status**: Actively used
  - **Lines**: 105
  - **Dependency Notes**: Imported by 1 file(s).

- **File**: `components/books/CompletedBookModal.tsx`
  - **Type**: Modal Component
  - **Purpose**: Displays a pop-up modal interface.
  - **Used In**: 
    - `app/books/page.tsx`
    - `components/books/CompletedBooks.tsx`
  - **Status**: Actively used
  - **Lines**: 117
  - **Dependency Notes**: Imported by 2 file(s).

- **File**: `components/books/CompletedBooks.tsx`
  - **Type**: Feature Component
  - **Purpose**: Specific domain logic and UI.
  - **Used In**: 
    - `app/books/page.tsx`
  - **Status**: Actively used
  - **Lines**: 393
  - **Dependency Notes**: Imported by 1 file(s).

- **File**: `components/books/ReadingQueue.tsx`
  - **Type**: Feature Component
  - **Purpose**: Specific domain logic and UI.
  - **Used In**: 
    - `app/books/page.tsx`
  - **Status**: Actively used
  - **Lines**: 286
  - **Dependency Notes**: Imported by 1 file(s).

- **File**: `components/books/YearlyReadingLog.tsx`
  - **Type**: Feature Component
  - **Purpose**: Specific domain logic and UI.
  - **Used In**: 
    - `app/books/page.tsx`
  - **Status**: Actively used
  - **Lines**: 691
  - **Dependency Notes**: Imported by 1 file(s).

### Folder: `components/businesses`

- **File**: `components/businesses/BusinessChannelsSection.tsx`
  - **Type**: Feature Component
  - **Purpose**: Specific domain logic and UI.
  - **Used In**: 
    - `app/businesses/page.tsx`
  - **Status**: Actively used
  - **Lines**: 612
  - **Dependency Notes**: Imported by 1 file(s).

- **File**: `components/businesses/ContentQueue.tsx`
  - **Type**: Feature Component
  - **Purpose**: Specific domain logic and UI.
  - **Used In**: 
    - `app/businesses/page.tsx`
  - **Status**: Actively used
  - **Lines**: 250
  - **Dependency Notes**: Imported by 1 file(s).

- **File**: `components/businesses/Insights.tsx`
  - **Type**: Feature Component
  - **Purpose**: Specific domain logic and UI.
  - **Used In**: 
    - `app/businesses/page.tsx`
  - **Status**: Actively used
  - **Lines**: 196
  - **Dependency Notes**: Imported by 1 file(s).

- **File**: `components/businesses/TodayActions.tsx`
  - **Type**: Feature Component
  - **Purpose**: Specific domain logic and UI.
  - **Used In**: 
    - `app/businesses/page.tsx`
  - **Status**: Actively used
  - **Lines**: 156
  - **Dependency Notes**: Imported by 1 file(s).

### Folder: `components/finances`

- **File**: `components/finances/AssetsSection.tsx`
  - **Type**: Feature Component
  - **Purpose**: Specific domain logic and UI.
  - **Used In**: 
    - `app/finances/page.tsx`
  - **Status**: Actively used
  - **Lines**: 480
  - **Dependency Notes**: Imported by 1 file(s).

- **File**: `components/finances/EmergencyFundSection.tsx`
  - **Type**: Feature Component
  - **Purpose**: Specific domain logic and UI.
  - **Used In**: 
    - `app/finances/page.tsx`
  - **Status**: Actively used
  - **Lines**: 336
  - **Dependency Notes**: Imported by 1 file(s).

- **File**: `components/finances/ExpenseMetrics.tsx`
  - **Type**: Feature Component
  - **Purpose**: Specific domain logic and UI.
  - **Used In**: 
    - `components/finances/ExpenseSection.tsx`
  - **Status**: Actively used
  - **Lines**: 161
  - **Dependency Notes**: Imported by 1 file(s).

- **File**: `components/finances/ExpenseSection.tsx`
  - **Type**: Feature Component
  - **Purpose**: Specific domain logic and UI.
  - **Used In**: 
    - `app/finances/page.tsx`
  - **Status**: Actively used
  - **Lines**: 632
  - **Dependency Notes**: Imported by 1 file(s).

- **File**: `components/finances/FinanceOverview.tsx`
  - **Type**: Feature Component
  - **Purpose**: Specific domain logic and UI.
  - **Used In**: 
    - `app/finances/page.tsx`
  - **Status**: Actively used
  - **Lines**: 294
  - **Dependency Notes**: Imported by 1 file(s).

- **File**: `components/finances/IncomeMetrics.tsx`
  - **Type**: Feature Component
  - **Purpose**: Specific domain logic and UI.
  - **Used In**: 
    - `components/finances/IncomeSection.tsx`
  - **Status**: Actively used
  - **Lines**: 133
  - **Dependency Notes**: Imported by 1 file(s).

- **File**: `components/finances/IncomeSection.tsx`
  - **Type**: Feature Component
  - **Purpose**: Specific domain logic and UI.
  - **Used In**: 
    - `app/finances/page.tsx`
  - **Status**: Actively used
  - **Lines**: 442
  - **Dependency Notes**: Imported by 1 file(s).

- **File**: `components/finances/LiabilitiesSection.tsx`
  - **Type**: Feature Component
  - **Purpose**: Specific domain logic and UI.
  - **Used In**: 
    - `app/finances/page.tsx`
  - **Status**: Actively used
  - **Lines**: 601
  - **Dependency Notes**: Imported by 1 file(s).

- **File**: `components/finances/SavingsTargets.tsx`
  - **Type**: Feature Component
  - **Purpose**: Specific domain logic and UI.
  - **Used In**: 
    - `app/finances/page.tsx`
  - **Status**: Actively used
  - **Lines**: 514
  - **Dependency Notes**: Imported by 1 file(s).

### Folder: `components/pantry`

- **File**: `components/pantry/GroceryPlan.tsx`
  - **Type**: Feature Component
  - **Purpose**: Specific domain logic and UI.
  - **Used In**: 
    - `app/pantry/page.tsx`
  - **Status**: Actively used
  - **Lines**: 593
  - **Dependency Notes**: Imported by 1 file(s).

- **File**: `components/pantry/InventoryTracker.tsx`
  - **Type**: Feature Component
  - **Purpose**: Specific domain logic and UI.
  - **Used In**: 
    - `app/pantry/page.tsx`
  - **Status**: Actively used
  - **Lines**: 219
  - **Dependency Notes**: Imported by 1 file(s).

- **File**: `components/pantry/PantryCalendar.tsx`
  - **Type**: Feature Component
  - **Purpose**: Specific domain logic and UI.
  - **Used In**: 
    - `app/pantry/page.tsx`
  - **Status**: Actively used
  - **Lines**: 266
  - **Dependency Notes**: Imported by 1 file(s).

- **File**: `components/pantry/PantryEntryModal.tsx`
  - **Type**: Modal Component
  - **Purpose**: Displays a pop-up modal interface.
  - **Used In**: 
    - `components/pantry/PantryCalendar.tsx`
  - **Status**: Actively used
  - **Lines**: 426
  - **Dependency Notes**: Imported by 1 file(s).

- **File**: `components/pantry/PriceIntelligence.tsx`
  - **Type**: Feature Component
  - **Purpose**: Specific domain logic and UI.
  - **Used In**: 
    - `app/pantry/page.tsx`
  - **Status**: Actively used
  - **Lines**: 415
  - **Dependency Notes**: Imported by 1 file(s).

- **File**: `components/pantry/SmartInsights.tsx`
  - **Type**: Feature Component
  - **Purpose**: Specific domain logic and UI.
  - **Used In**: 
    - `app/pantry/page.tsx`
  - **Status**: Actively used
  - **Lines**: 275
  - **Dependency Notes**: Imported by 1 file(s).

### Folder: `components/ui`

- **File**: `components/ui/DynamicForm.tsx`
  - **Type**: UI Component
  - **Purpose**: Reusable presentation element.
  - **Used In**: 
    - `components/books/BookModal.tsx`
    - `components/books/CompletedBookModal.tsx`
    - `components/books/YearlyReadingLog.tsx`
    - `components/businesses/BusinessChannelsSection.tsx`
    - `components/finances/AssetsSection.tsx`
    - `components/finances/EmergencyFundSection.tsx`
    - `components/finances/ExpenseSection.tsx`
    - `components/finances/IncomeSection.tsx`
    - `components/finances/LiabilitiesSection.tsx`
    - `components/finances/SavingsTargets.tsx`
    - `components/pantry/GroceryPlan.tsx`
    - `components/wardrobe/WardrobeFormModal.tsx`
    - `components/widgets/Habits.tsx`
    - `components/widgets/ProjectModal.tsx`
  - **Status**: Actively used
  - **Lines**: 70
  - **Dependency Notes**: Imported by 14 file(s). High impact if removed.

- **File**: `components/ui/FormField.tsx`
  - **Type**: UI Component
  - **Purpose**: Reusable presentation element.
  - **Used In**: 
    - `components/finances/ExpenseSection.tsx`
    - `components/finances/IncomeSection.tsx`
    - `components/ui/DynamicForm.tsx`
  - **Status**: Actively used
  - **Lines**: 174
  - **Dependency Notes**: Imported by 3 file(s).

- **File**: `components/ui/FormSection.tsx`
  - **Type**: UI Component
  - **Purpose**: Reusable presentation element.
  - **Used In**: 
    - `components/pantry/PantryEntryModal.tsx`
    - `components/ui/DynamicForm.tsx`
    - `components/ui/Modal.tsx`
  - **Status**: Actively used
  - **Lines**: 51
  - **Dependency Notes**: Imported by 3 file(s).

- **File**: `components/ui/Modal.tsx`
  - **Type**: Modal Component
  - **Purpose**: Displays a pop-up modal interface.
  - **Used In**: 
    - `components/books/BookModal.tsx`
    - `components/books/CompletedBookModal.tsx`
    - `components/books/YearlyReadingLog.tsx`
    - `components/businesses/BusinessChannelsSection.tsx`
    - `components/finances/AssetsSection.tsx`
    - `components/finances/EmergencyFundSection.tsx`
    - `components/finances/ExpenseSection.tsx`
    - `components/finances/IncomeSection.tsx`
    - `components/finances/LiabilitiesSection.tsx`
    - `components/finances/SavingsTargets.tsx`
    - `components/pantry/GroceryPlan.tsx`
    - `components/pantry/PantryCalendar.tsx`
    - `components/pantry/PantryEntryModal.tsx`
    - `components/pantry/PriceIntelligence.tsx`
    - `components/wardrobe/WardrobeFormModal.tsx`
    - `components/widgets/Habits.tsx`
    - `components/widgets/ProjectModal.tsx`
  - **Status**: Actively used
  - **Lines**: 136
  - **Dependency Notes**: Imported by 17 file(s). High impact if removed.

- **File**: `components/ui/MultiSelectDropdown.tsx`
  - **Type**: UI Component
  - **Purpose**: Reusable presentation element.
  - **Used In**: 
    - `components/finances/ExpenseSection.tsx`
    - `components/finances/FinanceOverview.tsx`
    - `components/finances/IncomeSection.tsx`
  - **Status**: Actively used
  - **Lines**: 80
  - **Dependency Notes**: Imported by 3 file(s).

### Folder: `components/wardrobe`

- **File**: `components/wardrobe/WardrobeFormModal.tsx`
  - **Type**: Modal Component
  - **Purpose**: Displays a pop-up modal interface.
  - **Used In**: 
    - `app/wardrobe/page.tsx`
  - **Status**: Actively used
  - **Lines**: 155
  - **Dependency Notes**: Imported by 1 file(s).

### Folder: `components/widgets`

- **File**: `components/widgets/Editor.tsx`
  - **Type**: Feature Component
  - **Purpose**: Specific domain logic and UI.
  - **Used In**: 
    - `components/widgets/OneNoteAdvanced.tsx`
    - `components/widgets/OneNoteJournal.tsx`
  - **Status**: Actively used
  - **Lines**: 149
  - **Dependency Notes**: Imported by 2 file(s).

- **File**: `components/widgets/GanttView.tsx`
  - **Type**: Feature Component
  - **Purpose**: Specific domain logic and UI.
  - **Used In**: 
    - `components/widgets/Goals.tsx`
  - **Status**: Actively used
  - **Lines**: 325
  - **Dependency Notes**: Imported by 1 file(s).

- **File**: `components/widgets/Goals.tsx`
  - **Type**: Feature Component
  - **Purpose**: Specific domain logic and UI.
  - **Used In**: 
    - `app/goals/page.tsx`
  - **Status**: Actively used
  - **Lines**: 302
  - **Dependency Notes**: Imported by 1 file(s).

- **File**: `components/widgets/GoalsSummary.tsx`
  - **Type**: Feature Component
  - **Purpose**: Specific domain logic and UI.
  - **Used In**: 
    - `app/page.tsx`
  - **Status**: Actively used
  - **Lines**: 219
  - **Dependency Notes**: Imported by 1 file(s).

- **File**: `components/widgets/Habits.tsx`
  - **Type**: Feature Component
  - **Purpose**: Specific domain logic and UI.
  - **Used In**: 
    - `app/habits/page.tsx`
  - **Status**: Actively used
  - **Lines**: 555
  - **Dependency Notes**: Imported by 1 file(s).

- **File**: `components/widgets/HabitsOverview.tsx`
  - **Type**: Feature Component
  - **Purpose**: Specific domain logic and UI.
  - **Used In**: 
    - `app/page.tsx`
  - **Status**: Actively used
  - **Lines**: 361
  - **Dependency Notes**: Imported by 1 file(s).

- **File**: `components/widgets/OneNoteAdvanced.tsx`
  - **Type**: Feature Component
  - **Purpose**: Specific domain logic and UI.
  - **Used In**: None
  - **Status**: Possibly unused (no imports found)
  - **Lines**: 512
  - **Dependency Notes**: Safe to remove if not implicitly loaded.

- **File**: `components/widgets/OneNoteJournal.tsx`
  - **Type**: Feature Component
  - **Purpose**: Specific domain logic and UI.
  - **Used In**: 
    - `app/page.tsx`
  - **Status**: Actively used
  - **Lines**: 234
  - **Dependency Notes**: Imported by 1 file(s).

- **File**: `components/widgets/ProjectModal.tsx`
  - **Type**: Modal Component
  - **Purpose**: Displays a pop-up modal interface.
  - **Used In**: 
    - `components/DataLoader.tsx`
    - `components/widgets/GanttView.tsx`
    - `components/widgets/Goals.tsx`
    - `components/widgets/TasksCalendar.tsx`
  - **Status**: Actively used
  - **Lines**: 352
  - **Dependency Notes**: Imported by 4 file(s).

- **File**: `components/widgets/Quotes.tsx`
  - **Type**: Feature Component
  - **Purpose**: Specific domain logic and UI.
  - **Used In**: 
    - `app/page.tsx`
  - **Status**: Actively used
  - **Lines**: 173
  - **Dependency Notes**: Imported by 1 file(s).

- **File**: `components/widgets/TasksCalendar.tsx`
  - **Type**: Feature Component
  - **Purpose**: Specific domain logic and UI.
  - **Used In**: 
    - `app/page.tsx`
  - **Status**: Actively used
  - **Lines**: 309
  - **Dependency Notes**: Imported by 1 file(s).

### Folder: `context`

- **File**: `context/SyncContext.tsx`
  - **Type**: Context Provider
  - **Purpose**: Global state management context.
  - **Used In**: 
    - `app/wardrobe/page.tsx`
    - `components/NavigationBar.tsx`
    - `components/Providers.tsx`
    - `components/SyncManager.tsx`
  - **Status**: Actively used
  - **Lines**: 31
  - **Dependency Notes**: Imported by 4 file(s).

### Folder: `hooks`

- **File**: `hooks/useSync.ts`
  - **Type**: Hook
  - **Purpose**: Reusable React state/lifecycle logic.
  - **Used In**: 
    - `context/SyncContext.tsx`
  - **Status**: Actively used
  - **Lines**: 288
  - **Dependency Notes**: Imported by 1 file(s).

- **File**: `hooks/useWardrobe.ts`
  - **Type**: Hook
  - **Purpose**: Reusable React state/lifecycle logic.
  - **Used In**: 
    - `app/wardrobe/page.tsx`
  - **Status**: Actively used
  - **Lines**: 93
  - **Dependency Notes**: Imported by 1 file(s).

### Folder: `lib`

- **File**: `lib/ai.ts`
  - **Type**: Utility/Library
  - **Purpose**: Helper functions, constants, or API wrappers.
  - **Used In**: 
    - `components/AIAssistant.tsx`
  - **Status**: Actively used
  - **Lines**: 597
  - **Dependency Notes**: Imported by 1 file(s).

- **File**: `lib/constants.ts`
  - **Type**: Utility/Library
  - **Purpose**: Helper functions, constants, or API wrappers.
  - **Used In**: 
    - `components/finances/ExpenseMetrics.tsx`
    - `components/finances/ExpenseSection.tsx`
    - `components/finances/FinanceOverview.tsx`
    - `components/finances/IncomeMetrics.tsx`
    - `components/finances/IncomeSection.tsx`
  - **Status**: Actively used
  - **Lines**: 3
  - **Dependency Notes**: Imported by 5 file(s).

- **File**: `lib/finances.ts`
  - **Type**: Utility/Library
  - **Purpose**: Helper functions, constants, or API wrappers.
  - **Used In**: 
    - `components/AIAssistant.tsx`
    - `components/finances/AssetsSection.tsx`
    - `components/finances/ExpenseSection.tsx`
    - `components/finances/FinanceOverview.tsx`
    - `components/finances/IncomeMetrics.tsx`
    - `components/finances/IncomeSection.tsx`
    - `components/finances/LiabilitiesSection.tsx`
    - `components/finances/SavingsTargets.tsx`
    - `components/pantry/PantryEntryModal.tsx`
  - **Status**: Actively used
  - **Lines**: 243
  - **Dependency Notes**: Imported by 9 file(s). High impact if removed.

- **File**: `lib/keys.ts`
  - **Type**: Utility/Library
  - **Purpose**: Helper functions, constants, or API wrappers.
  - **Used In**: 
    - `app/books/page.tsx`
    - `app/pantry/page.tsx`
    - `components/AIAssistant.tsx`
    - `components/books/CompletedBooks.tsx`
    - `components/books/ReadingQueue.tsx`
    - `components/books/YearlyReadingLog.tsx`
    - `components/businesses/BusinessChannelsSection.tsx`
    - `components/businesses/ContentQueue.tsx`
    - `components/businesses/Insights.tsx`
    - `components/businesses/TodayActions.tsx`
    - `components/DataLoader.tsx`
    - `components/finances/AssetsSection.tsx`
    - `components/finances/EmergencyFundSection.tsx`
    - `components/finances/ExpenseSection.tsx`
    - `components/finances/FinanceOverview.tsx`
    - `components/finances/IncomeSection.tsx`
    - `components/finances/LiabilitiesSection.tsx`
    - `components/finances/SavingsTargets.tsx`
    - `components/pantry/GroceryPlan.tsx`
    - `components/pantry/InventoryTracker.tsx`
    - `components/pantry/PantryEntryModal.tsx`
    - `components/widgets/Goals.tsx`
    - `components/widgets/GoalsSummary.tsx`
    - `components/widgets/Habits.tsx`
    - `components/widgets/HabitsOverview.tsx`
    - `components/widgets/Quotes.tsx`
    - `components/widgets/TasksCalendar.tsx`
    - `hooks/useSync.ts`
    - `hooks/useWardrobe.ts`
    - `lib/finances.ts`
    - `lib/storage.ts`
  - **Status**: Actively used
  - **Lines**: 6
  - **Dependency Notes**: Imported by 31 file(s). High impact if removed.

- **File**: `lib/msalConfig.ts`
  - **Type**: Utility/Library
  - **Purpose**: Helper functions, constants, or API wrappers.
  - **Used In**: 
    - `components/Providers.tsx`
    - `components/widgets/OneNoteAdvanced.tsx`
    - `components/widgets/OneNoteJournal.tsx`
    - `lib/onenote.ts`
  - **Status**: Actively used
  - **Lines**: 48
  - **Dependency Notes**: Imported by 4 file(s).

- **File**: `lib/onenote.ts`
  - **Type**: Utility/Library
  - **Purpose**: Helper functions, constants, or API wrappers.
  - **Used In**: 
    - `components/widgets/OneNoteAdvanced.tsx`
    - `components/widgets/OneNoteJournal.tsx`
  - **Status**: Actively used
  - **Lines**: 208
  - **Dependency Notes**: Imported by 2 file(s).

- **File**: `lib/storage.ts`
  - **Type**: Utility/Library
  - **Purpose**: Helper functions, constants, or API wrappers.
  - **Used In**: 
    - `app/books/page.tsx`
    - `app/pantry/page.tsx`
    - `components/AIAssistant.tsx`
    - `components/books/CompletedBooks.tsx`
    - `components/books/ReadingQueue.tsx`
    - `components/books/YearlyReadingLog.tsx`
    - `components/businesses/BusinessChannelsSection.tsx`
    - `components/businesses/ContentQueue.tsx`
    - `components/businesses/TodayActions.tsx`
    - `components/DataLoader.tsx`
    - `components/finances/AssetsSection.tsx`
    - `components/finances/EmergencyFundSection.tsx`
    - `components/finances/ExpenseSection.tsx`
    - `components/finances/IncomeSection.tsx`
    - `components/finances/LiabilitiesSection.tsx`
    - `components/finances/SavingsTargets.tsx`
    - `components/pantry/GroceryPlan.tsx`
    - `components/pantry/PantryEntryModal.tsx`
    - `components/widgets/Goals.tsx`
    - `components/widgets/Habits.tsx`
    - `components/widgets/Quotes.tsx`
    - `components/widgets/TasksCalendar.tsx`
    - `lib/finances.ts`
  - **Status**: Actively used
  - **Lines**: 27
  - **Dependency Notes**: Imported by 23 file(s). High impact if removed.

- **File**: `lib/supabase.ts`
  - **Type**: Utility/Library
  - **Purpose**: Helper functions, constants, or API wrappers.
  - **Used In**: 
    - `components/AuthGuard.tsx`
    - `components/LoginPage.tsx`
    - `components/NavigationBar.tsx`
    - `hooks/useSync.ts`
  - **Status**: Actively used
  - **Lines**: 12
  - **Dependency Notes**: Imported by 4 file(s).

- **File**: `lib/sync-keys.ts`
  - **Type**: Utility/Library
  - **Purpose**: Helper functions, constants, or API wrappers.
  - **Used In**: 
    - `app/pantry/page.tsx`
    - `components/businesses/BusinessChannelsSection.tsx`
    - `components/businesses/ContentQueue.tsx`
    - `components/businesses/Insights.tsx`
    - `components/businesses/TodayActions.tsx`
    - `components/finances/AssetsSection.tsx`
    - `components/finances/EmergencyFundSection.tsx`
    - `components/finances/ExpenseSection.tsx`
    - `components/finances/FinanceOverview.tsx`
    - `components/finances/IncomeSection.tsx`
    - `components/finances/LiabilitiesSection.tsx`
    - `components/finances/SavingsTargets.tsx`
    - `components/pantry/GroceryPlan.tsx`
    - `components/pantry/InventoryTracker.tsx`
    - `components/pantry/PantryEntryModal.tsx`
    - `hooks/useSync.ts`
    - `hooks/useWardrobe.ts`
    - `lib/finances.ts`
  - **Status**: Actively used
  - **Lines**: 57
  - **Dependency Notes**: Imported by 18 file(s). High impact if removed.

### Folder: `types`

- **File**: `types/books.ts`
  - **Type**: Type Definition
  - **Purpose**: TypeScript interfaces and types.
  - **Used In**: 
    - `app/books/page.tsx`
    - `components/books/BookModal.tsx`
    - `components/books/CompletedBookModal.tsx`
    - `components/books/CompletedBooks.tsx`
    - `components/books/ReadingQueue.tsx`
    - `components/books/YearlyReadingLog.tsx`
  - **Status**: Actively used
  - **Lines**: 62
  - **Dependency Notes**: Imported by 6 file(s). High impact if removed.

- **File**: `types/business.ts`
  - **Type**: Type Definition
  - **Purpose**: TypeScript interfaces and types.
  - **Used In**: 
    - `components/businesses/BusinessChannelsSection.tsx`
    - `components/businesses/ContentQueue.tsx`
    - `components/businesses/Insights.tsx`
    - `components/businesses/TodayActions.tsx`
    - `components/DataLoader.tsx`
  - **Status**: Actively used
  - **Lines**: 37
  - **Dependency Notes**: Imported by 5 file(s).

- **File**: `types/finance.ts`
  - **Type**: Type Definition
  - **Purpose**: TypeScript interfaces and types.
  - **Used In**: 
    - `app/pantry/page.tsx`
    - `components/finances/ExpenseMetrics.tsx`
    - `components/finances/ExpenseSection.tsx`
    - `components/finances/IncomeSection.tsx`
    - `components/pantry/GroceryPlan.tsx`
    - `components/pantry/InventoryTracker.tsx`
    - `components/pantry/PantryCalendar.tsx`
    - `components/pantry/PantryEntryModal.tsx`
    - `components/pantry/PriceIntelligence.tsx`
    - `components/pantry/SmartInsights.tsx`
    - `lib/finances.ts`
  - **Status**: Actively used
  - **Lines**: 133
  - **Dependency Notes**: Imported by 11 file(s). High impact if removed.

- **File**: `types/wardrobe.ts`
  - **Type**: Type Definition
  - **Purpose**: TypeScript interfaces and types.
  - **Used In**: 
    - `app/wardrobe/page.tsx`
    - `components/wardrobe/WardrobeFormModal.tsx`
    - `hooks/useWardrobe.ts`
  - **Status**: Actively used
  - **Lines**: 117
  - **Dependency Notes**: Imported by 3 file(s).

## Analysis Summary

### Unused Components
- `components/widgets/OneNoteAdvanced.tsx`

### Unused Utilities / Functions / Hooks
- None detected.

### Large or Complex Files (Potential for Refactoring)
- `app/wardrobe/page.tsx (361 lines)`
- `components/AIAssistant.tsx (1277 lines)`
- `components/books/CompletedBooks.tsx (393 lines)`
- `components/books/YearlyReadingLog.tsx (691 lines)`
- `components/businesses/BusinessChannelsSection.tsx (612 lines)`
- `components/finances/AssetsSection.tsx (480 lines)`
- `components/finances/EmergencyFundSection.tsx (336 lines)`
- `components/finances/ExpenseSection.tsx (632 lines)`
- `components/finances/IncomeSection.tsx (442 lines)`
- `components/finances/LiabilitiesSection.tsx (601 lines)`
- `components/finances/SavingsTargets.tsx (514 lines)`
- `components/pantry/GroceryPlan.tsx (593 lines)`
- `components/pantry/PantryEntryModal.tsx (426 lines)`
- `components/pantry/PriceIntelligence.tsx (415 lines)`
- `components/widgets/GanttView.tsx (325 lines)`
- `components/widgets/Goals.tsx (302 lines)`
- `components/widgets/Habits.tsx (555 lines)`
- `components/widgets/HabitsOverview.tsx (361 lines)`
- `components/widgets/OneNoteAdvanced.tsx (512 lines)`
- `components/widgets/ProjectModal.tsx (352 lines)`
- `components/widgets/TasksCalendar.tsx (309 lines)`
- `lib/ai.ts (597 lines)`

### Duplicate Modals or Forms Candidates
- `components/books/BookModal.tsx`
- `components/books/CompletedBookModal.tsx`
- `components/pantry/PantryEntryModal.tsx`
- `components/ui/Modal.tsx`
- `components/wardrobe/WardrobeFormModal.tsx`
- `components/widgets/ProjectModal.tsx`

*Note: Review these modals to see if they can be consolidated down into a reusable generic modal component.*

