# Privacy Policy for CashRunway

**Effective Date:** September 16, 2026  
**Last Updated:** September 16, 2026  

CashRunway ("we", "us", or "our") values your privacy. This Privacy Policy explains how CashRunway collects, uses, and safeguards your information when you use our mobile application.

---

## 1. Overview & Core Philosophy

CashRunway is designed as an offline-first personal runway and cashflow tracking application. 
- Your primary financial transaction records, runway calculations, and budgets are stored **locally on your device** via SQLite.
- We do **not** run external analytics trackers, ad trackers, or sell your personal data to any third party.

---

## 2. Information We Collect and Process

### A. Local Financial Data
Any income, expense, category, runway calculation, or note entered into CashRunway is stored in your device's local database. We do not transmit or store this data on private third-party servers.

### B. Google User Data (Google Sign-In & Google Drive)
When you choose to sign in with Google, we access certain Google services strictly to provide cloud backup and sync capabilities:

1. **Google Account Profile:**
   - **Data Accessed:** Your basic Google profile information (name, email address, profile picture URL, and Google user ID).
   - **Purpose:** To authenticate your session, display your active profile in the app, and associate your backups.

2. **Google Drive Application Data (`https://www.googleapis.com/auth/drive.appdata`):**
   - **Data Accessed:** CashRunway requests access only to the dedicated **Google Drive Application Data folder** (`drive.appdata`).
   - **Purpose:** To save and restore your CashRunway database backup files.
   - **Scope Limitation:** CashRunway **cannot** read, access, modify, or delete any of your personal files, documents, photos, or spreadsheets stored in Google Drive. Access is strictly sandboxed to CashRunway's own hidden application folder.

---

## 3. Google API Services User Data Policy Compliance

CashRunway's use and transfer to any other app of information received from Google APIs will adhere to the [Google API Services User Data Policy](https://developers.google.com/terms/api-services-user-data-policy), including the **Limited Use** requirements.

Specifically:
- We only request scopes necessary to provide backup functionality (`drive.appdata`).
- We do not use Google user data for serving advertisements.
- We do not allow humans to read your data unless required for security investigations, compliance with applicable law, or with your explicit consent.

---

## 4. Data Storage and Security

- **Local Storage:** All local databases and secure tokens (such as OAuth tokens) are stored using device-level secure storage (`expo-sqlite` and `expo-secure-store`).
- **Cloud Storage:** Any backups exported to Google Drive reside entirely within your own personal Google Drive account under your control.

---

## 5. User Rights & Data Deletion

You retain full control over your data:
- **Local Data Deletion:** You can delete transaction records or clear app storage at any time via the application settings or device settings.
- **Revoking Google Access:** You can disconnect your Google account inside CashRunway anytime. You may also revoke CashRunway's access to your Google account at [Google Account Permissions](https://myaccount.google.com/permissions).
- **Deleting Google Drive Backups:** You can manage and delete stored backup files directly inside the application or via Google Drive settings.

---

## 6. Children's Privacy

CashRunway is not directed to children under the age of 13. We do not knowingly collect personal information from children under 13.

---

## 7. Changes to This Privacy Policy

We may update our Privacy Policy periodically. We will notify you of any changes by updating the "Last Updated" date at the top of this document.

---

## 8. Contact Information

If you have questions or concerns about this Privacy Policy or how your data is handled, please contact us by opening an issue on our GitHub repository:

- **Repository:** [https://github.com/prmnaa30/cashrunway](https://github.com/prmnaa30/cashrunway)
- **Issues:** [https://github.com/prmnaa30/cashrunway/issues](https://github.com/prmnaa30/cashrunway/issues)
