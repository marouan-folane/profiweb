# 🛣️ Hello Website - Site Routes & Pages

This document provides a comprehensive list of all accessible pages in the "Hello Website" application, including their browser paths and the physical location of the files in the project.

> [!IMPORTANT]  
> All routes are prefixed with a language code (e.g., `/en/dashboard`, `/fr/clients`). In the table below, **`[lang]`** represents the current language (e.g., `en`, `fr`, `ar`).

---

## 🔐 Authentication & Access
These pages are accessible without being logged in (except for Lock Screen).

| Page Name | Browser Path | File System Path |
| :--- | :--- | :--- |
| **Login** | `/[lang]/auth/login` | `app/app/[lang]/auth/login/page.jsx` |
| **Register** | `/[lang]/auth/register` | `app/app/[lang]/auth/register/page.jsx` |
| **Forgot Password** | `/[lang]/auth/forgot` | `app/app/[lang]/auth/forgot/page.jsx` |
| **Verify Account** | `/[lang]/auth/verify` | `app/app/[lang]/auth/verify/page.jsx` |
| **New Password** | `/[lang]/auth/create-password` | `app/app/[lang]/auth/create-password/page.jsx` |
| **Lock Screen** | `/[lang]/auth/lock` | `app/app/[lang]/auth/lock/page.jsx` |

---

## 📊 Core Admin Pages
These pages form the main workspace and are organized within the `(dashboard)` route group.

### 🤖 AI Studio (Formerly Templates)
| Page | Description | Browser Path | File System Path |
| :--- | :--- | :--- | :--- |
| **Global AI** | Main AI control center | `/[lang]/templates/global-interactions` | `.../templates/global-interactions/page.jsx` |
| **Template List** | List of all prompt templates | `/[lang]/templates/list` | `.../templates/list/page.jsx` |
| **Create Template**| Create a new prompt | `/[lang]/templates/new` | `.../templates/new/page.jsx` |
| **Template Detail**| View/Edit specific template | `/[lang]/templates/[id]` | `.../templates/[id]/page.jsx` |

### 👥 User Management
| Page | Description | Browser Path | File System Path |
| :--- | :--- | :--- | :--- |
| **User List** | All registered users | `/[lang]/users` | `.../users/page.jsx` |
| **Create User** | Add a new colleague | `/[lang]/users/new` | `.../users/new/page.jsx` |
| **User Profile** | Personal settings | `/[lang]/user-profile` | `.../user-profile/page.jsx` |
| **Role Permissions**| Manage access levels | `/[lang]/rolses` | `.../rolses/page.jsx` |

### 📁 Project Management
| Page | Description | Browser Path | File System Path |
| :--- | :--- | :--- | :--- |
| **Project List** | View all active projects | `/[lang]/projects` | `.../projects/page.jsx` |
| **Create Project** | Start a new project | `/[lang]/projects/new` | `.../projects/new/page.jsx` |
| **Project Board** | Detailed project view | `/[lang]/projects/[id]` | `.../projects/[id]/page.jsx` |

### 🤝 Client Management
| Page | Description | Browser Path | File System Path |
| :--- | :--- | :--- | :--- |
| **Client List** | List of all clients | `/[lang]/clients` | `.../clients/page.jsx` |

---

## 🛠️ System Pages
| Page | Browser Path | File System Path |
| :--- | :--- | :--- |
| **Main Dashboard** | `/[lang]/dashboard` | `app/app/[lang]/(dashboard)/dashboard/page.jsx` |
| **404 Not Found** | Automatic | `app/app/[lang]/not-found.js` |
| **Error Screen** | `/[lang]/error-page` | `app/app/[lang]/error-page/page.jsx` |

---

## 💡 Technical Reference
The project uses the **Next.js App Router** structure:
- **Folders with `page.jsx`**: Create a public route.
- **`(dashboard)`**: A folder in parentheses is a "Route Group." It is ignored in the URL but used to wrap pages with the same layout (sidebar, header, etc.).
- **Dynamic Segments**: Folders like `[id]` mean the URL will have a variable, like `/projects/123`.
