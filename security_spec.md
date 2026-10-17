# Security Specification: Resonate Origin System (ResOS)

## 1. Data Invariants
- Each user can only read and write their own User profile (`users/{userId}` where `request.auth.uid == userId`).
- Subcollections (`bioCharts`, `sessions`, `biometricLogs`, `dailyInsights`) inherit ownership from `userId` and require `request.auth.uid == userId`.
- In `therapistClients/{clientId}`, only the assigned therapist (`request.auth.uid == resource.data.therapistId` or `request.resource.data.therapistId`) can read, create, update, or delete the record.
- All IDs must be string and <= 128 chars matching `^[a-zA-Z0-9_\\-]+$`.
- Document sizes, string lengths, and numeric ranges are strictly bounded to prevent Denial of Wallet attacks.
- System catch-all rule denies any unmatched document paths: `match /{document=**} { allow read, write: if false; }`.

## 2. The Dirty Dozen Payloads & Test Scenarios
1. **Unauthenticated Read on User Document**: Attack payload with null auth -> PERMISSION_DENIED.
2. **Cross-User Profile Hijack**: User A writes to `users/{userB}` -> PERMISSION_DENIED.
3. **Ghost Field Injection in BioChart**: User attempts adding arbitrary executable script in `bioCharts` -> PERMISSION_DENIED.
4. **Oversized String in BioChart Neural Links**: User sends >10000 char payload -> PERMISSION_DENIED.
5. **Path ID Poisoning**: Document ID with invalid characters (e.g. `../../root`) -> PERMISSION_DENIED.
6. **Negative or Absurd Frequency Hz**: Frequency of `-500Hz` or `100000000Hz` -> PERMISSION_DENIED.
7. **Negative Duration in Healing Session**: Session with negative duration -> PERMISSION_DENIED.
8. **Client Spoofing Therapist Record**: Non-therapist user altering client treatment plan -> PERMISSION_DENIED.
9. **Blanket Query Scraping**: Querying all users' biometric logs without user match -> PERMISSION_DENIED.
10. **Tampering with Immutable Timestamps/UserIds**: Changing `userId` during an update operation -> PERMISSION_DENIED.
11. **Spoofed Email / Fake Identity Token**: Attempting write without verified auth -> PERMISSION_DENIED.
12. **Modifying Terminal Records**: Mutating a locked/archived treatment plan -> PERMISSION_DENIED.
