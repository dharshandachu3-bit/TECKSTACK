# WorkFlowOS Security Specification & Test Protocol

## 1. Data Invariants
1. **User Identity Boundary**: A user can only access, create, or update resources located directly under their own `/users/{userId}/` document tree (`request.auth.uid == userId`).
2. **Profile Integrity**: A user cannot self-assign an `ADMIN` role or spoof roles upon account creation. Role escalation attempts must be denied.
3. **Immutability of IDs & Timestamps**: The `id`, `userId`, and `createdAt` properties are immutable once written. `updatedAt` must be bound to the server timestamp `request.time`.
4. **Subcollection Relational Guarantee (The Master Gate)**: All workflows, automations, candidates, executions, activity events, and settings belong to the authenticated parent `/users/{userId}`.
5. **No Blanket Reads**: No unauthenticated or cross-user reads are permitted.
6. **Path Variable Hardening**: All path variables ({userId}, {workflowId}, etc.) must conform to `isValidId()` regex and length bounds.

## 2. The "Dirty Dozen" Malicious Payloads

1. **Payload 1 (Ghost Field Injection / Shadow Update)**:
Attempting to inject `isAdmin: true` into a workflow document during update.
```json
{ "id": "wf_1", "userId": "user_123", "name": "Hack Workflow", "isAdmin": true }
```
*Expected: PERMISSION_DENIED*

2. **Payload 2 (Cross-User Write / Identity Spoofing)**:
User `attacker_456` attempting to write to `/users/victim_123/workflows/wf_1`.
```json
{ "id": "wf_1", "userId": "victim_123", "name": "Steal Account" }
```
*Expected: PERMISSION_DENIED*

3. **Payload 3 (ID Poisoning Attack)**:
Document ID exceeding size bounds or containing invalid path traversal characters like `../../hack`.
*Expected: PERMISSION_DENIED*

4. **Payload 4 (Unverified Email Role Claim)**:
User claiming admin status with `email_verified: false`.
*Expected: PERMISSION_DENIED*

5. **Payload 5 (Immutable Field Mutation)**:
Attempting to change `userId` or `createdAt` on an existing workflow.
```json
{ "userId": "new_user", "createdAt": "2020-01-01T00:00:00Z" }
```
*Expected: PERMISSION_DENIED*

6. **Payload 6 (Terminal State Transition Bypass)**:
Modifying an execution that has reached terminal status `SUCCESS` or `FAILED`.
```json
{ "status": "RUNNING" }
```
*Expected: PERMISSION_DENIED*

7. **Payload 7 (Unbounded String / Denial of Wallet)**:
Submitting a `name` field containing a 2MB payload string.
*Expected: PERMISSION_DENIED*

8. **Payload 8 (Client Clock Tampering)**:
Setting `createdAt` to a spoofed timestamp instead of `request.time`.
```json
{ "createdAt": "1999-12-31T23:59:59Z" }
```
*Expected: PERMISSION_DENIED*

9. **Payload 9 (Unauthorized PII Exposure)**:
Unauthenticated user attempting to query `/users/{userId}`.
*Expected: PERMISSION_DENIED*

10. **Payload 10 (Type Poisoning on Numeric Fields)**:
Sending a boolean or string into `version` or `frequency`.
```json
{ "version": "v1.0-corrupted" }
```
*Expected: PERMISSION_DENIED*

11. **Payload 11 (Blanket Collection Scraping)**:
Issuing a list query without scoping to authenticated user path.
*Expected: PERMISSION_DENIED*

12. **Payload 12 (Self-Assigned Admin Role on User Profile)**:
New user creating profile with `role: "ADMIN"`.
```json
{ "id": "user_123", "email": "test@example.com", "role": "ADMIN" }
```
*Expected: PERMISSION_DENIED*
