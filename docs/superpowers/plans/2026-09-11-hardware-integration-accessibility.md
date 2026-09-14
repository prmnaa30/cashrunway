# OS Hardware Integration & Accessibility Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement Phase 8 of CashRunway: Multi-Reminder Alarm notification system with custom sound and dynamic runway text, Home Screen Quick Actions for fast entry, and comprehensive accessibility polish (monospaced tabular numbers & >= 44pt touch targets).

**Architecture:** A modular native service architecture separating OS hardware interactions into `lib/services/notifications.ts` and `lib/services/quickActions.ts`, synchronized with SQLite database via Drizzle ORM and Zustand store, integrated into Expo Router's root layout, complemented by design system accessibility refinements.

**Tech Stack:** Expo SDK 57, React Native 0.86.3, `expo-notifications`, `expo-quick-actions`, NativeWind v4, Zustand v5, `expo-sqlite`, Drizzle ORM, Vitest.

**Spec:** `docs/superpowers/specs/2026-09-11-hardware-integration-accessibility-design.md`

## Global Constraints

- Platform: Expo SDK 57 (React Native 0.86.3, React 19)
- Execution: Always prefix supported commands with `rtk` via WSL environment routing
- Read versioned docs at `https://docs.expo.dev/versions/v57.0.0/`
- All touch targets must be at least 44pt in width/height (or have `hitSlop` providing >= 44pt area)
- All numeric/currency displays must use `tabular-nums` / `fontVariant: ['tabular-nums']`
- Safe migrations only: never drop columns or corrupt existing SQLite data

---

### Task 1: Native Package Installation & Assets Setup

**Files:**
- Modify: `package.json`
- Modify: `app.json`
- Move: `reminder.wav` -> `assets/sounds/reminder.wav`

**Interfaces:**
- Consumes: `reminder.wav` in root
- Produces: `assets/sounds/reminder.wav`, installed `expo-notifications` and `expo-quick-actions`, configured plugins in `app.json`

- [ ] **Step 1: Install packages via expo**
Run:
```bash
wsl.exe --cd "/home/creez/projects/js/cashrunway" -d Ubuntu -e zsh -ic 'export PATH="$HOME/.local/bin:$PATH"; npx expo install expo-notifications expo-quick-actions'
```
Expected: `package.json` updated with `expo-notifications` and `expo-quick-actions`.

- [ ] **Step 2: Move `reminder.wav` into `assets/sounds/`**
Create `assets/sounds/` directory and move `reminder.wav` into `assets/sounds/reminder.wav`.
Run:
```bash
wsl.exe --cd "/home/creez/projects/js/cashrunway" -d Ubuntu -e zsh -ic 'mkdir -p assets/sounds && mv reminder.wav assets/sounds/reminder.wav'
```

- [ ] **Step 3: Update `app.json` config plugins**
Add `expo-notifications` with sound file and channel config, and `expo-quick-actions` to `plugins` in `app.json`:
```json
[
  "expo-notifications",
  {
    "sounds": ["./assets/sounds/reminder.wav"],
    "defaultChannel": "cashrunway-reminders"
  }
],
"expo-quick-actions"
```

- [ ] **Step 4: Verify installation and test suite**
Run:
```bash
wsl.exe --cd "/home/creez/projects/js/cashrunway" -d Ubuntu -e zsh -ic 'export PATH="$HOME/.local/bin:$PATH"; rtk npm test'
```
Expected: PASS (all 68 existing tests still pass).

- [ ] **Step 5: Commit changes**
```bash
wsl.exe --cd "/home/creez/projects/js/cashrunway" -d Ubuntu -e zsh -ic 'export PATH="$HOME/.local/bin:$PATH"; rtk git add package.json package-lock.json app.json assets/sounds/reminder.wav && rtk git commit -m "chore: install expo-notifications and expo-quick-actions with custom sound"'
```

---

### Task 2: Database Schema & Migration for Reminders

**Files:**
- Modify: `lib/db/schema.ts`
- Modify: `lib/db/types.ts`
- Modify: `lib/db/index.ts`
- Create: `lib/db/__tests__/reminderSettingsDb.test.ts`

**Interfaces:**
- Consumes: SQLite schema and `initDatabase()`
- Produces: `settings.isReminderEnabled`, `settings.reminderTimes` (JSON string), `ReminderItem` interface

- [ ] **Step 1: Write the failing test for reminder settings in SQLite**
Create `lib/db/__tests__/reminderSettingsDb.test.ts`:
```ts
import { describe, it, expect, beforeEach } from 'vitest';
import * as SQLite from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as schema from '../schema';
import { getSettings, updateSettings, initDatabase } from '../index';
import { ReminderItem } from '../types';

describe('Reminder Settings in DB', () => {
  it('should initialize with default reminder settings', async () => {
    const s = await getSettings();
    expect(s).toBeDefined();
    expect(s?.isReminderEnabled).toBe(1);
    expect(s?.reminderTimes).toBeDefined();
    const reminders = JSON.parse(s?.reminderTimes || '[]') as ReminderItem[];
    expect(reminders.length).toBeGreaterThan(0);
    expect(reminders.some(r => r.time === '20:00' && r.isEnabled)).toBe(true);
  });

  it('should update reminder times cleanly', async () => {
    const updatedList: ReminderItem[] = [
      { id: 'rem_1', time: '08:30', label: 'Pagi', isEnabled: true },
      { id: 'rem_2', time: '21:00', label: 'Malam', isEnabled: false },
    ];
    await updateSettings({
      isReminderEnabled: 0,
      reminderTimes: JSON.stringify(updatedList),
    });
    const s = await getSettings();
    expect(s?.isReminderEnabled).toBe(0);
    const parsed = JSON.parse(s?.reminderTimes || '[]');
    expect(parsed).toEqual(updatedList);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**
Run:
```bash
wsl.exe --cd "/home/creez/projects/js/cashrunway" -d Ubuntu -e zsh -ic 'export PATH="$HOME/.local/bin:$PATH"; rtk npm test lib/db/__tests__/reminderSettingsDb.test.ts'
```
Expected: FAIL (missing schema columns / types).

- [ ] **Step 3: Update `schema.ts`, `types.ts`, and `initDatabase` migration**
In `lib/db/types.ts`:
```ts
export interface ReminderItem {
  id: string;
  time: string; // 'HH:mm'
  label: string;
  isEnabled: boolean;
}

export const DEFAULT_REMINDERS: ReminderItem[] = [
  { id: 'rem_morning', time: '09:00', label: 'Pagi (Kesiapan Kas)', isEnabled: false },
  { id: 'rem_lunch', time: '13:00', label: 'Siang (Makan Siang)', isEnabled: false },
  { id: 'rem_evening', time: '20:00', label: 'Malam (Rekap Harian & Sisa Napas)', isEnabled: true },
];

export const DEFAULT_REMINDERS_JSON = JSON.stringify(DEFAULT_REMINDERS);
```

In `lib/db/schema.ts`:
Add to `settings` table definition:
```ts
isReminderEnabled: integer('is_reminder_enabled').notNull().default(1),
reminderTimes: text('reminder_times').notNull().default(DEFAULT_REMINDERS_JSON),
```
And add to `CREATE_TABLES_SQL_STATEMENTS` settings table definition.

In `lib/db/index.ts`:
Add safe migrations:
```ts
try {
  await targetDb.execAsync('ALTER TABLE settings ADD COLUMN is_reminder_enabled INTEGER NOT NULL DEFAULT 1;');
} catch (_) {}
try {
  await targetDb.execAsync(`ALTER TABLE settings ADD COLUMN reminder_times TEXT NOT NULL DEFAULT '${DEFAULT_REMINDERS_JSON}';`);
} catch (_) {}
```

- [ ] **Step 4: Run test to verify it passes**
Run:
```bash
wsl.exe --cd "/home/creez/projects/js/cashrunway" -d Ubuntu -e zsh -ic 'export PATH="$HOME/.local/bin:$PATH"; rtk npm test lib/db/__tests__/reminderSettingsDb.test.ts'
```
Expected: PASS.

- [ ] **Step 5: Commit changes**
```bash
wsl.exe --cd "/home/creez/projects/js/cashrunway" -d Ubuntu -e zsh -ic 'export PATH="$HOME/.local/bin:$PATH"; rtk git add lib/db/ && rtk git commit -m "feat(db): add reminder_times and is_reminder_enabled to settings"'
```

---

### Task 3: Notification Service (`lib/services/notifications.ts`)

**Files:**
- Create: `lib/services/notifications.ts`
- Create: `lib/services/__tests__/notifications.test.ts`

**Interfaces:**
- Consumes: `expo-notifications`, `ReminderItem` from `lib/db/types`
- Produces:
  - `generateReminderMessage(runwayDays: number, time?: string): { title: string; body: string }`
  - `parseTimeString(timeStr: string): { hour: number; minute: number }`
  - `setupNotificationChannelAsync(): Promise<void>`
  - `requestNotificationPermissionsAsync(): Promise<boolean>`
  - `syncScheduledAlarms(reminders: ReminderItem[], isEnabled: boolean, runwayDays: number): Promise<void>`
  - `triggerTestNotification(runwayDays: number): Promise<void>`
  - `setupNotificationResponseListeners(onOpenQuickEntry: () => void): () => void`

- [ ] **Step 1: Write failing unit test for notifications helper**
Create `lib/services/__tests__/notifications.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { generateReminderMessage, parseTimeString } from '../notifications';

describe('Notification Helpers', () => {
  it('should parse HH:mm correctly', () => {
    expect(parseTimeString('20:00')).toEqual({ hour: 20, minute: 0 });
    expect(parseTimeString('09:15')).toEqual({ hour: 9, minute: 15 });
    expect(parseTimeString('invalid')).toEqual({ hour: 20, minute: 0 });
  });

  it('should generate appropriate message for finite runway', () => {
    const msg = generateReminderMessage(42);
    expect(msg.title).toBe('CashRunway');
    expect(msg.body).toContain('42 hari');
  });

  it('should generate warning message for 0 or depleted runway', () => {
    const msg = generateReminderMessage(0);
    expect(msg.title).toBe('CashRunway');
    expect(msg.body).toContain('habis');
  });

  it('should generate healthy message for very long runway', () => {
    const msg = generateReminderMessage(500);
    expect(msg.title).toBe('CashRunway');
    expect(msg.body).toContain('sehat');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**
Run:
```bash
wsl.exe --cd "/home/creez/projects/js/cashrunway" -d Ubuntu -e zsh -ic 'export PATH="$HOME/.local/bin:$PATH"; rtk npm test lib/services/__tests__/notifications.test.ts'
```
Expected: FAIL (module not found).

- [ ] **Step 3: Implement `lib/services/notifications.ts`**
Create `lib/services/notifications.ts` with:
- `generateReminderMessage`
- `parseTimeString`
- `setupNotificationChannelAsync` (Android channel `cashrunway-reminders` with `sound: 'reminder.wav'`)
- `requestNotificationPermissionsAsync`
- `syncScheduledAlarms` (Cancels existing alarms and reschedules active ones with `SchedulableTriggerInputTypes.DAILY` and `sound: 'reminder.wav'`)
- `triggerTestNotification` (1-second delay time interval trigger with sound for testing)
- `setupNotificationResponseListeners` (Handles foreground, background, and cold start clicks via `getLastNotificationResponseAsync` and `addNotificationResponseReceivedListener`)

- [ ] **Step 4: Run unit tests to verify they pass**
Run:
```bash
wsl.exe --cd "/home/creez/projects/js/cashrunway" -d Ubuntu -e zsh -ic 'export PATH="$HOME/.local/bin:$PATH"; rtk npm test lib/services/__tests__/notifications.test.ts'
```
Expected: PASS.

- [ ] **Step 5: Commit changes**
```bash
wsl.exe --cd "/home/creez/projects/js/cashrunway" -d Ubuntu -e zsh -ic 'export PATH="$HOME/.local/bin:$PATH"; rtk git add lib/services/ && rtk git commit -m "feat(notifications): implement notification service and unit tests"'
```

---

### Task 4: Home Screen Quick Actions (`lib/services/quickActions.ts`) & Root Layout Integration

**Files:**
- Create: `lib/services/quickActions.ts`
- Create: `lib/services/__tests__/quickActions.test.ts`
- Modify: `app/_layout.tsx`

**Interfaces:**
- Consumes: `expo-quick-actions`, `useQuickEntryStore`
- Produces: `setupQuickActions()`, registered app shortcuts

- [ ] **Step 1: Write test for quick actions definitions**
Create `lib/services/__tests__/quickActions.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { getQuickActionItems } from '../quickActions';

describe('Quick Actions Items', () => {
  it('should define expense and income quick actions', () => {
    const items = getQuickActionItems();
    expect(items.length).toBe(2);
    expect(items[0].id).toBe('action_expense');
    expect(items[0].params?.mode).toBe('expense');
    expect(items[1].id).toBe('action_income');
    expect(items[1].params?.mode).toBe('income');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**
Run:
```bash
wsl.exe --cd "/home/creez/projects/js/cashrunway" -d Ubuntu -e zsh -ic 'export PATH="$HOME/.local/bin:$PATH"; rtk npm test lib/services/__tests__/quickActions.test.ts'
```
Expected: FAIL.

- [ ] **Step 3: Implement `lib/services/quickActions.ts` and update `app/_layout.tsx`**
Create `lib/services/quickActions.ts` with `getQuickActionItems()` and `setupQuickActions()`.
In `app/_layout.tsx`:
- Call `setupQuickActions()` on mount.
- Listen to quick actions via `useQuickActionCallback` (or `QuickActions.addListener`) to trigger `useQuickEntryStore.getState().open(action.params.mode)`.
- Mount notification response listener via `setupNotificationResponseListeners(() => useQuickEntryStore.getState().open('expense'))`.

- [ ] **Step 4: Run tests to verify they pass**
Run:
```bash
wsl.exe --cd "/home/creez/projects/js/cashrunway" -d Ubuntu -e zsh -ic 'export PATH="$HOME/.local/bin:$PATH"; rtk npm test'
```
Expected: PASS.

- [ ] **Step 5: Commit changes**
```bash
wsl.exe --cd "/home/creez/projects/js/cashrunway" -d Ubuntu -e zsh -ic 'export PATH="$HOME/.local/bin:$PATH"; rtk git add lib/services/ app/_layout.tsx && rtk git commit -m "feat(shortcuts): register quick actions and wire root layout listeners"'
```

---

### Task 5: Zustand Store Synchronization (`store/useSettingStore.ts`)

**Files:**
- Modify: `store/useSettingStore.ts`
- Modify: `store/useFinanceStore.ts` (to trigger notification sync on runway change)
- Create: `store/__tests__/reminderStore.test.ts`

**Interfaces:**
- Consumes: `lib/db`, `lib/services/notifications.ts`
- Produces: `useSettingsStore` actions: `toggleReminderEnabled`, `toggleReminderItem`, `addReminderItem`, `deleteReminderItem`

- [ ] **Step 1: Write unit test for reminder actions in store**
Create `store/__tests__/reminderStore.test.ts`:
```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useSettingsStore } from '../useSettingStore';

describe('useSettingsStore Reminders', () => {
  it('should toggle reminder item correctly', () => {
    const store = useSettingsStore.getState();
    const initialReminders = store.reminders;
    if (initialReminders.length > 0) {
      const target = initialReminders[0];
      const initialStatus = target.isEnabled;
      store.toggleReminderItem(target.id);
      const updated = useSettingsStore.getState().reminders.find(r => r.id === target.id);
      expect(updated?.isEnabled).toBe(!initialStatus);
    }
  });

  it('should add and delete a custom reminder item', () => {
    const store = useSettingsStore.getState();
    const newId = store.addReminderItem('16:45', 'Sore');
    expect(newId).toBeDefined();
    let found = useSettingsStore.getState().reminders.find(r => r.id === newId);
    expect(found?.time).toBe('16:45');
    expect(found?.label).toBe('Sore');
    expect(found?.isEnabled).toBe(true);

    store.deleteReminderItem(newId);
    found = useSettingsStore.getState().reminders.find(r => r.id === newId);
    expect(found).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**
Run:
```bash
wsl.exe --cd "/home/creez/projects/js/cashrunway" -d Ubuntu -e zsh -ic 'export PATH="$HOME/.local/bin:$PATH"; rtk npm test store/__tests__/reminderStore.test.ts'
```
Expected: FAIL.

- [ ] **Step 3: Update `store/useSettingStore.ts` and `store/useFinanceStore.ts`**
Implement the reminder actions in `useSettingsStore`.
Persist to DB with `updateSettings({ isReminderEnabled, reminderTimes })`.
Trigger `syncScheduledAlarms` from `lib/services/notifications.ts`.
In `useFinanceStore.ts`, when transactions or wallet balances update, invoke debounced `syncScheduledAlarms` with the latest `discreteRunway.operationalDays`.

- [ ] **Step 4: Run test to verify it passes**
Run:
```bash
wsl.exe --cd "/home/creez/projects/js/cashrunway" -d Ubuntu -e zsh -ic 'export PATH="$HOME/.local/bin:$PATH"; rtk npm test store/__tests__/reminderStore.test.ts'
```
Expected: PASS.

- [ ] **Step 5: Commit changes**
```bash
wsl.exe --cd "/home/creez/projects/js/cashrunway" -d Ubuntu -e zsh -ic 'export PATH="$HOME/.local/bin:$PATH"; rtk git add store/ && rtk git commit -m "feat(store): add reminder actions and sync with finance store"'
```

---

### Task 6: Settings UI & Alarm Manager Modal

**Files:**
- Create: `components/settings/ReminderManagerModal.tsx`
- Modify: `app/(tabs)/settings.tsx`

**Interfaces:**
- Consumes: `useSettingsStore`, `triggerTestNotification`
- Produces: Visual reminder card in Settings & Alarm Manager modal with add/toggle/delete controls

- [ ] **Step 1: Create `components/settings/ReminderManagerModal.tsx`**
Create clean modal with:
- Centered modal dialog with backdrop
- List of reminders: large bold time (`HH:mm`), label, and `Switch` toggle
- Delete button for custom alarms
- Add reminder form: stepper or input for Hour & Minute, label input, and "Tambah Jam" button
- "Kirim Notifikasi Uji Coba" button with haptic feedback
- Header close button with `hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}` and `min-w-[44px] min-h-[44px]`

- [ ] **Step 2: Update `app/(tabs)/settings.tsx`**
Add "Notifikasi & Pengingat" section:
- Master switch: *"Pengingat Pencatatan Harian"*
- Active alarms summary pill list (e.g. `[09:00] [20:00]`)
- Button *"Kelola Jam Pengingat"* -> opens `ReminderManagerModal`
- Button *"Uji Coba Suara & Notifikasi"* -> calls `triggerTestNotification`

- [ ] **Step 3: Run full test suite**
Run:
```bash
wsl.exe --cd "/home/creez/projects/js/cashrunway" -d Ubuntu -e zsh -ic 'export PATH="$HOME/.local/bin:$PATH"; rtk npm test'
```
Expected: PASS.

- [ ] **Step 4: Commit changes**
```bash
wsl.exe --cd "/home/creez/projects/js/cashrunway" -d Ubuntu -e zsh -ic 'export PATH="$HOME/.local/bin:$PATH"; rtk git add components/settings/ app/(tabs)/settings.tsx && rtk git commit -m "feat(ui): add ReminderManagerModal and settings section"'
```

---

### Task 7: Accessibility Audit & UI Polish (`tabular-nums` & >= 44pt Touch Targets)

**Files:**
- Modify: `components/dashboard/RunwayHeroCard.tsx`
- Modify: `components/dashboard/SafeSpendCard.tsx`
- Modify: `components/dashboard/LiquidityBar.tsx`
- Modify: `components/history/TransactionItem.tsx`
- Modify: `components/wallets/WalletCard.tsx`
- Modify: `components/wallets/VaultCard.tsx`
- Modify: `components/wallets/VaultYieldCard.tsx`
- Modify: `components/entry/AmountDisplay.tsx`
- Modify: `components/entry/CalculatorKeypad.tsx`
- Modify: `components/entry/CategoryPickerModal.tsx`
- Modify: `components/entry/DatePickerModal.tsx`
- Modify: `components/entry/WalletPickerModal.tsx`
- Modify: `components/entry/FeePickerModal.tsx`
- Modify: `components/entry/NoteInputModal.tsx`
- Modify: `components/wallets/WalletActionMenuModal.tsx`
- Modify: `components/wallets/AdjustBalanceModal.tsx`
- Modify: `components/wallets/DeleteWalletModal.tsx`
- Modify: `components/history/DeleteTransactionModal.tsx`
- Modify: `components/settings/CurrencyPickerModal.tsx`
- Modify: `components/settings/PaydayPickerModal.tsx`
- Modify: `components/settings/DangerConfirmModal.tsx`

**Interfaces:**
- Consumes: Existing UI components
- Produces: Consistent monospaced tabular numbers and guaranteed >= 44pt touchable areas across the app

- [ ] **Step 1: Add `tabular-nums` / `fontVariant: ['tabular-nums']` to numeric components**
Update all monetary amounts and number counters to include `tabular-nums` (NativeWind class `tabular-nums` and/or `style={{ fontVariant: ['tabular-nums'] }}`) in:
- `RunwayHeroCard.tsx`: days count & total balance
- `SafeSpendCard.tsx`: safe allowance & remaining spend
- `LiquidityBar.tsx`: active cash & vault totals
- `TransactionItem.tsx`: transaction amount & transfer fee
- `WalletCard.tsx`: wallet balance
- `VaultCard.tsx` & `VaultYieldCard.tsx`: vault balance, yield projections, and interest rate
- `AmountDisplay.tsx` & `CalculatorKeypad.tsx`: calculator numbers

- [ ] **Step 2: Enforce >= 44pt touch targets on all modals and interactive elements**
Add `hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}` and `min-w-[44px] min-h-[44px]` to:
- Modal close buttons (`X`) in all sub-picker and confirmation modals
- Pill filters, category badges, and quick action chips (ensure `min-h-[44px]`)
- Segmented control buttons in Wallets and ModeSelector

- [ ] **Step 3: Run full test suite to ensure no regressions**
Run:
```bash
wsl.exe --cd "/home/creez/projects/js/cashrunway" -d Ubuntu -e zsh -ic 'export PATH="$HOME/.local/bin:$PATH"; rtk npm test'
```
Expected: PASS (all tests pass).

- [ ] **Step 4: Commit changes**
```bash
wsl.exe --cd "/home/creez/projects/js/cashrunway" -d Ubuntu -e zsh -ic 'export PATH="$HOME/.local/bin:$PATH"; rtk git add components/ && rtk git commit -m "style(a11y): apply tabular-nums and >= 44pt touch targets across all UI elements"'
```

---

### Task 8: Final Verification & Implementation Plan Doc Update

**Files:**
- Modify: `docs/IMPLEMENTATION_PLAN.md`

- [ ] **Step 1: Run complete vitest test suite**
Run:
```bash
wsl.exe --cd "/home/creez/projects/js/cashrunway" -d Ubuntu -e zsh -ic 'export PATH="$HOME/.local/bin:$PATH"; rtk npm test'
```
Expected: 100% tests pass.

- [ ] **Step 2: Update `docs/IMPLEMENTATION_PLAN.md`**
Mark Phase 8 as completed:
- `expo-notifications`: Multi-reminder alarm system with custom audio `reminder.wav` & dynamic runway text.
- `expo-quick-actions`: Home Screen app shortcuts for Expense & Income.
- Accessibility audit: `tabular-nums` formatting and >= 44pt touch targets.

- [ ] **Step 3: Commit final plan documentation**
```bash
wsl.exe --cd "/home/creez/projects/js/cashrunway" -d Ubuntu -e zsh -ic 'export PATH="$HOME/.local/bin:$PATH"; rtk git add docs/IMPLEMENTATION_PLAN.md && rtk git commit -m "docs: mark Phase 8 as completed in IMPLEMENTATION_PLAN.md"'
```
