# ProfiWeb Project Management: Departmental Workflow & Notification System

This document outlines the refined departmental access controls and the implementation plan for the real-time notification system.

## 🏢 Departmental Access Matrix

| Department | Role Code | Questionnaire Tab | Folders Tab | Accesses Tab | Control Tab | Default Tab |
|:---|:---:|:---:|:---:|:---:|:---:|:---|
| **Sales** | `d.s` | ✅ Visible | ✅ Visible | ❌ Hidden | ❌ Hidden | Questionnaire |
| **Info** | `d.in` / `d.i` | ✅ Visible | ❌ Hidden | ❌ Hidden | ❌ Hidden | Questionnaire |
| **Content** | `d.c` | ❌ Hidden | ✅ Visible | ✅ Visible | ❌ Hidden | Folders |
| **IT** | `d.it` | ❌ Hidden | ✅ Visible* | ✅ Visible | ❌ Hidden | Accesses |
| **Design** | `d.d` | ❌ Hidden | ✅ Visible | ✅ Visible* | ❌ Hidden | Folders |
| **Control** | `c.m` | ✅ Visible | ✅ Visible | ✅ Visible | ✅ Visible | Control |
| **Admin** | `admin` | ✅ Visible | ✅ Visible | ✅ Visible | ✅ Visible | Questionnaire |

*\*Designers see the Accesses tab in "WordPress Login" mode (simplified view).*
*\*IT Department requires early access to the Folders tab to retrieve the "Structured content json" for integration.*

---

## 🔄 Project Lifecycle & Progression

The project moves through the following gates:

1.  **Phase 0: Intake (Sales)**
    *   Project is created.
    *   Assigned to **Info** department.

2.  **Phase 1: Information Gathering (Info)**
    *   **Goal**: Complete the Questionnaire.
    *   **Trigger**: `infoStatus` -> `completed`.
    *   **Output**: Automated "Generated instructions pdf".
    *   **Notification**: Triggers for **Content**, **IT**, and **Design**.

3.  **Phase 2: Technical Foundation & Content Preparation**
    *   **Content (d.c)**: Generates the "Structured content json".
    *   **IT (d.it)**: **Crucial Step** — Retrieves the JSON from the Folders tab. Uses technical skills (Server setup, API config) to prepare the environment.
    *   **Gating**: Phase 3 (Design) starts once `contentStatus === 'completed'`.

4.  **Phase 3: Visual Creation (Design)**
    *   **Goal**: Complete visual design based on instructions.
    *   **Trigger**: `designStatus` -> `completed`.

5.  **Phase 4: Quality Control & Validation (Control Manager / Q.M)**
    *   **Goal**: Final review of all assets and integration.
    *   **Trigger**: `controlStatus` -> `confirmed`.
    *   **Notification**: Triggers final handover for **IT**.

6.  **Phase 5: Technical Delivery (Product / IT)**
    *   **Goal**: Final production deployment and credentials handover.
    *   **Tab Transition**: The "Accesses" tab is renamed to **"Product"** for the IT department after `controlStatus === 'confirmed'`.
    *   **Skills**: Deployment orchestration, final security audit, and client handover.

---

## 📂 Folder Access & Specifics for IT

The IT Department (`d.it`) has unique visibility requirements:
*   **Path**: `Folders` -> `Structured content json`.
*   **Skill Dependency**: Must be able to parse and integrate the JSON data provided by the Content department before the Design phase is finalized.
*   **Transparency**: IT is the only technical role that bridge the gap between "Content" and "Visuals" through the **Product** tab.

---

## 🔔 Notification System Implementation Plan

We will implement a visual and audible notification system to alert departments when a project is "Ready" for their action.

### 1. Backend: Notification Engine
*   **Model**: `Notification` (`userId`, `projectId`, `message`, `type`, `readStatus`, `createdAt`).
*   **Service**: A central `NotificationService` triggered by status changes in `ProjectService`.
*   **Targeting**: Notifications will be sent to ALL users within the target department role.

### 2. Frontend: Real-time Alerts
*   **Polling/Refetching**: The dashboard will poll for new notifications every 60 seconds.
*   **Toast UI**: Use `sonner` or `react-hot-toast` for persistent alerts.
*   **Audio**: A premium notification sound (e.g., `success.mp3`) will play when a new project lands in a user's department queue.

### 3. Folder Visibility Rules
*   **Dynamic Access**:
    *   `d.it` will have explicit access to "Structured content json" even if the folder is generally hidden.
    *   `d.d` will see "Generated instructions pdf" as soon as it exists.

---

## 🛠️ Next Steps for Implementation

1.  **Backend**: Create the `Notification` model and register hooks in `ProjectService`.
2.  **Frontend**: Update `page.jsx` to restrict tab visibility based on the new matrix.
3.  **Frontend**: Add the notification sound and global listener component.
4.  **Verification**: Test transitions between `d.in` -> `d.c` and `d.c` -> `d.d`.
