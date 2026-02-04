# NoteNest – Role-Based Access Control (RBAC) Proposal

## 1. Overview
This document proposes the Role-Based Access Control (RBAC) system for NoteNest. The goal is to define clear permissions for **Admin**, **Editor**, and **Viewer** roles within a **Workspace** context. This ensures security, clarity, and effective collaboration.

---

## 2. Role Definitions

Roles are assigned **per workspace**. A user can be an Admin in one workspace and a Viewer in another.

### 🟢 **Admin**
**Description:** The manager or owner of the workspace. Has full control over content and users.
**Primary Goal:** Manage the team and maintain workspace usage.

### 🟡 **Editor**
**Description:** A content creator and collaborator.
**Primary Goal:** Contribute knowledge, write notes, and update documentation.
**Limitations:** Cannot manage other users or dangerous workspace settings.

### 🔵 **Viewer**
**Description:** A read-only consumer of information.
**Primary Goal:** Read, search, and learn from the knowledge base.
**Limitations:** Strictly read-only access.

---

## 3. Permissions Matrix

The following table defines the exact capabilities of each role.

| Category | Action | 🟢 Admin | 🟡 Editor | 🔵 Viewer |
| :--- | :--- | :---: | :---: | :---: |
| **Content** | **View Notes** | ✅ | ✅ | ✅ |
| | **Create Notes** | ✅ | ✅ | ❌ |
| | **Edit Notes** | ✅ | ✅ | ❌ |
| | **Delete Notes** | ✅ | ✅ (Own) / ❌ (Others) | ❌ |
| | **Restore Deleted Notes** | ✅ | ❌ | ❌ |
| **Users** | **Invite Members** | ✅ | ❌ | ❌ |
| | **Remove Members** | ✅ | ❌ | ❌ |
| | **Change Member Roles** | ✅ | ❌ | ❌ |
| **Workspace** | **Update Settings** | ✅ | ❌ | ❌ |
| | **Delete Workspace** | ✅ | ❌ | ❌ |

> **Note on Deletion:** Editors can delete notes they created (Authorship), but only Admins can delete notes created by others. This prevents accidental data loss.

---

## 4. Use Cases

### Scenario A: Team Onboarding
1. **Admin** creates a new Workspace "Engineering Team".
2. **Admin** invites Alice (Engineering Manager) as an **Admin**.
3. **Admin** invites Bob (Developer) as an **Editor**.
4. **Bob** logs in, sees "Engineering Team", and creates a "Setup Guide".

### Scenario B: Collaboration
1. **Bob (Editor)** drafts a note "API Documentation".
2. **Charlie (Viewer)** reads the note to understand the API.
3. **Charlie** notices a typo but **cannot edit** it. He messages Bob.
4. **Bob** updates the note.

### Scenario C: Moderation
1. **Bob (Editor)** accidentally posts sensitive keys in a note.
2. **Alice (Admin)** sees this and immediately **deletes the note**.
3. **Bob** cannot undo this action if permanent, but **Alice** can restore it if it was a soft delete.

---

## 5. Edge Cases & Constraints

### 🛑 The "Last Admin" Problem
**Rule:** A Workspace MUST have at least one Admin.
- If an **Admin** tries to leave the workspace or downgrade their role to Editor/Viewer, the system must check if there is another Admin.
- If they are the **only** Admin, the action is **blocked**. They must promote someone else first.

### 🔄 Role Updates
- If a user's role is updated (e.g., Editor → Viewer) while they are active, the change should take effect **immediately** on their next action (backend validation) or after a page refresh.

### 🚫 Self-Deletion
- A user can remove themselves from a workspace, UNLESS they are the last Admin (see "Last Admin" problem).

---

## 6. Implementation Guidelines

### Database Schema (Conceptual)
In the `WorkspaceMember` collection/table:
```json
{
  "userId": "user_123",
  "workspaceId": "ws_456",
  "role": "admin" // enum: ['admin', 'editor', 'viewer']
}
```

### Backend Middleware
Middleware should enforce permissions on every protected route.
```typescript
// Example Middleware Usage
app.post("/notes", requireRole("editor"), createNoteHandler);
app.delete("/notes/:id", requireRole("admin"), deleteNoteHandler);
```

### Frontend UI
- **Hide Buttons:** If the user is a Viewer, hide "Edit" and "Delete" buttons.
- **Disable Inputs:** deeply make forms read-only.
- **Visual Indicators:** Show a "Read Only" badge for Viewers.

---

## 7. Future Considerations
- **"Owner" Role:** Distinct from Admin, capable of billing management (if paid features exist).
- **Custom Roles:** Allowing granular permission selection (e.g., "Can Create but NOT Delete").
- **Private Notes:** Notes allowed only for specific users within a workspace.

---
**Status:** 📝 Draft Proposal
**Authors:** Contributors
