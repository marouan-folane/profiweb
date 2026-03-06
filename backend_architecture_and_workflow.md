# Profiweb Backend Architecture & Department Workflow (Full Reference)

This document is a comprehensive guide to the Profiweb backend system. It covers architecture, directory structure, data models, departmental workflow logic, and detailed API endpoint descriptions.

---

## 1. System Overview
- **Core Stack**: Node.js, Express.js, MongoDB (Mongoose).
- **Communication**: RESTful JSON API.
- **Authentication**: JWT-based session management (`Authorization: Bearer <token>`).
- **Pattern**: Controller-Service-Model architecture.
    - **Controllers (`api/controllers/`)**: Parse requests, handle HTTP responses.
    - **Services (`api/services/`)**: Central business logic, workflow gates, and complex DB operations.
    - **Routes (`api/routes/`)**: Define endpoint paths and map them to controllers.
    - **Models (`api/models/`)**: Mongoose schemas and database structure.

---

## 2. Departmental Roles & Responsibilities

| Role Code | Department | Key Responsibilities |
| :--- | :--- | :--- |
| `superadmin` | Administration | Global management, template control, audit logs. |
| `d.i` | Information | Initial data gathering, completing the project questionnaire. |
| `d.c` | Content | Writing content, SEO optimization, content checklist validation. |
| `d.it` | IT Setup | WP hosting, technical config, site setup checklist, design template management. |
| `d.in` | Integration | Merging content/design into the live site, integration checklist. |
| `d.d` | Design | Visual UI/UX, brand identity, design checklist validation. |
| `c.m` | Control Manager | Final quality review, confirming project as "Finished". |
| `d.s` | Sales | Client onboarding, project creation. |

---

## 3. Workflow Logic & Departmental Gates

Projects progress through sequential "gates". If a prerequisite is not met, the API returns a `403 Forbidden` error.

### Phase 1: Information Gathering
- **Action**: `d.i` fills questionnaires.
- **Gate**: Phase 1 ends when `infoStatus` is set to `completed`.
- **Logic**: Unlocks access for Content, IT, and Design.

### Phase 2: Production (Parallel)
- **Content (`d.c`)**: Must finish checklist and submit structured content.
- **IT (`d.it`)**: Must validate hosting setup. Validating IT setup notifies Design.
- **Design (`d.d`)**:
    - **Pre-requisite**: Access is blocked until `infoStatus === 'completed'`.
    - **Visibility**: WordPress login details are hidden from `d.d` until `itStatus !== 'pending'` AND `contentStatus === 'completed'`.
- **Integration (`d.in`)**:
    - **Gate**: integration cannot be completed until `contentStatus === 'completed'`.

### Phase 3: Quality Control
- **Logic**: Only active when **BOTH** IT integration and Design workflow are marked `completed`.
- **Action**: `c.m` performs final review.

---

## 4. API Reference: Project Workflows

All paths are relative to the project base API URL (usually `http://localhost:5000/api/v1/projects`).

### 🛠 General Project Management
| Method | Path | Controller Method | Description |
| :--- | :--- | :--- | :--- |
| GET | `/` | `getAllProjects` | List all projects (filtered by role). |
| POST | `/` | `createProject` | Create a new project (Sales only). |
| GET | `/:id` | `getProjectById` | Get full project details. |
| PATCH | `/:id` | `updateProject` | Update basic project settings. |

### 📝 Questionnaire (Info Dept)
| Method | Path | Controller Method | Description |
| :--- | :--- | :--- | :--- |
| GET | `/:id/questions` | `getQuestionsByProject` | Fetch all dynamic questions/answers. |
| PATCH | `/:id/questions` | `createOrUpdateQuestions`| Save answers to questionnaires. |
| PATCH | `/:id/complete-info-questionnaire` | `completeInfoQuestionnaire` | **GATE**: Mark Info phase as finished. |

### ✍️ Content Department (`d.c`)
| Method | Path | Controller Method | Description |
| :--- | :--- | :--- | :--- |
| PATCH | `/:id/save-content-draft` | `saveContentDraft` | Persist content draft. |
| PATCH | `/:id/submit-content` | `submitContent` | Mark content as ready for integration. |
| PATCH | `/:id/validate-content-checklist`| `validateContentChecklist`| Lock the content checklist. |
| PATCH | `/:id/complete-content-workflow` | `completeContentWorkflow` | **GATE**: Mark Content phase as finished. |

### 🎨 Design Department (`d.d`)
| Method | Path | Controller Method | Description |
| :--- | :--- | :--- | :--- |
| PATCH | `/:id/validate-design-checklist` | `validateDesignChecklist` | Lock the design checklist. |
| PATCH | `/:id/complete-design-workflow` | `completeDesignWorkflow` | **GATE**: Mark Design phase as finished. |

### 🖥 IT & Integration (`d.it` / `d.in`)
| Method | Path | Controller Method | Description |
| :--- | :--- | :--- | :--- |
| PATCH | `/:id/validate-it-setup-checklist`| `validateITSetupChecklist`| Lock the IT setup checklist. |
| PATCH | `/:id/complete-integration` | `completeITIntegration` | **GATE**: Mark Integration as finished. |

### ✅ Quality Control (`c.m`)
| Method | Path | Controller Method | Description |
| :--- | :--- | :--- | :--- |
| GET | `/:id/control-checklist` | `getControlChecklist` | Fetch the final QC checklist. |
| PATCH | `/:id/confirm-finished` | `confirmProjectFinished` | **GATE**: Move project to "Finished" status. |

---

## 5. Key Database Models

### Project Model (`api/models/project.model.js`)
Master state machine for every project.
- `infoStatus`: `pending` → `completed`
- `contentStatus`: `pending` → `checklist_validated` → `completed`
- `designStatus`: `pending` → `checklist_validated` → `completed`
- `itStatus`: `pending` → `setup_validated` → `integration_completed`
- `isContentReady`: Boolean, set by Content dept.

### Question Model (`api/models/question.model.js`)
Dynamic form instances for each project.
- `questionKey`: Unique internal ID (e.g. `businessAddress`).
- `answer`: Current stored value.
- `translations`: Multi-language help text (En, Fr, Ar, De).
- `isVisible`: Admin visibility toggle.

### Template Model (`api/models/template.model.js`)
Global design blueprints used by departments.
- `title`: Unique template name.
- `shortDesc`: Summary for list views.
- `structure`: Instruction or block-based design logic.
- `colors`: Associated brand palette.
- `createdBy`: Reference to the creator.

---

## 6. Logic Location Map
If you need to change how the logic works:
- **RBAC Logic**: `api/services/projectWorkflowService.js` (Method: `verifyProjectAccess`).
- **Dynamic Field Sync**: `api/services/questionService.js`.
- **Global Question Templates**: `api/services/questionTemplateService.js`.
- **Automatic PDF Generation**: `api/services/projectPDFService.js`.

---

## 7. Template Management Workflow
Templates (Designs) can be managed by both Admins and the IT Setup department (`d.it`).
- **Create/Edit**: Allowed for `superadmin`, `admin`, `manager`, and `d.it`.
- **Delete**: Restricted to `superadmin` and `admin` only. IT department cannot purge templates.
