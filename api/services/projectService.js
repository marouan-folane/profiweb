const Project = require('../models/project.model');
const Client = require('../models/client.model');
const mongoose = require('mongoose');
const AppError = require('../utils/AppError');

/**
 * Service to handle core project operations (CRUD, indexing, stats)
 */
class ProjectService {
    /**
     * Creates a new project and handles client linking
     */
    static async createProject(data, userId) {
        const {
            title,
            description,
            clientId,
            category,
            startDate,
            endDate,
            budget,
            cost,
            priority,
            tags,
            note,
        } = data;

        // 1. Validations
        if (!title || !description || !clientId || !category || !startDate || !endDate || !budget) {
            throw new AppError("Please provide all required fields", 400);
        }

        if (!mongoose.Types.ObjectId.isValid(clientId)) {
            throw new AppError("Invalid client id", 400);
        }

        const numericBudget = Number(budget);
        if (!Number.isFinite(numericBudget) || numericBudget < 0) {
            throw new AppError("Budget must be a positive number", 400);
        }

        const client = await Client.findById(clientId);
        if (!client) {
            throw new AppError("Client not found", 404);
        }

        // 2. Date Processing
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
            throw new AppError("Invalid start or end date", 400);
        }
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        if (start >= end) {
            throw new AppError("End date must be after start date", 400);
        }

        // 3. Normalization
        const allowedPriorities = new Set(["standard", "express", "24-hours"]);
        const normalizedPriority = String(priority || "standard").trim();
        const safePriority = allowedPriorities.has(normalizedPriority) ? normalizedPriority : "standard";

        // 4. Persistence
        const project = await Project.create({
            title,
            description,
            client: {
                name: client.name,
                id: client._id,
                contactPerson: client.contactPerson,
            },
            category,
            status: "planning",
            priority: safePriority,
            startDate: start,
            endDate: end,
            budget: numericBudget,
            currency: "MAD",
            projectManager: userId,
            progress: 0,
            cost: cost || {
                estimated: numericBudget,
                actual: 0,
                expenses: [],
            },
            createdBy: userId,
            isActive: true,
            tags,
            note,
            activeDepartments: ["info"],
            completedDepartments: ["sales"],
            infoStatus: "pending",
        });

        // 5. Client Sync
        await Client.findByIdAndUpdate(clientId, {
            $push: { projects: project._id },
        });

        const NotificationService = require('./notificationService');
        await NotificationService.notifyRoles({
            projectId: project._id,
            targetRoles: ['d.i', 'd.inf'],
            message: `New project "${project.title}" has been created by Sales.`,
            type: 'project_handover'
        });

        return project;
    }

    /**
     * Retrieves a project by ID with full population
     */
    static async getProjectById(id) {
        const project = await Project.findById(id)
            .select("-__v")
            .populate({
                path: "projectManager",
                select: "name email role avatar",
            })
            .populate({
                path: "client.id",
                select: "name email company phone address contactPerson",
            })
            .populate({
                path: "documents",
            });

        if (!project) {
            throw new AppError("Project not found", 404);
        }

        return project;
    }

    /**
     * Updates basic project information
     */
    static async updateProject(id, data, userId) {
        const project = await Project.findById(id);
        if (!project) throw new AppError("Project not found", 404);

        const QUESTIONNAIRE_FIELDS = [
            "title", "description", "shortDescription", "client", "category",
            "tags", "selectedTemplateId", "templateName", "questionsStatus", "clientId"
        ];

        const isQuestionnaireUpdate = QUESTIONNAIRE_FIELDS.some(f => data[f] !== undefined);

        // Check lock status
        if (project.infoStatus === "completed" && isQuestionnaireUpdate) {
            throw new AppError("Questionnaire is locked and cannot be modified.", 403);
        }

        // Handle Client Swap
        if (data.clientId && data.clientId !== project.client.id.toString()) {
            const newClient = await Client.findById(data.clientId);
            if (!newClient) throw new AppError("Client not found", 404);

            await Client.findByIdAndUpdate(project.client.id, { $pull: { projects: project._id } });
            await Client.findByIdAndUpdate(data.clientId, { $push: { projects: project._id } });

            project.client = {
                name: newClient.name,
                id: newClient._id,
                contactPerson: newClient.contactPerson
            };
        }

        // Map fields
        Object.keys(data).forEach(key => {
            if (key === 'clientId') return;
            // Map selectedTemplateId to selectedTemplate for schema compatibility
            if (key === 'selectedTemplateId') {
                project.selectedTemplate = data[key];
                return;
            }
            if (data[key] !== undefined) project[key] = data[key];
        });

        project.updatedBy = userId;
        return await project.save();
    }

    /**
     * Archives a project
     */
    static async archiveProject(id, userId) {
        const project = await Project.findById(id);
        if (!project) throw new AppError("Project not found", 404);
        if (project.status === "archived") throw new AppError("Project is already archived", 400);

        project.status = "archived";
        project.updatedBy = userId;
        return await project.save();
    }

    /**
     * Restores an archived project
     */
    static async restoreProject(id, status = "planning", userId) {
        const project = await Project.findOne({ _id: id, status: "archived" });
        if (!project) throw new AppError("Project not found or not archived", 404);

        project.status = status;
        project.isActive = true;
        project.updatedAt = Date.now();
        project.updatedBy = userId;
        return await project.save();
    }

    /**
     * Soft deletes a project
     */
    static async deleteProject(id) {
        const project = await Project.findByIdAndUpdate(
            id,
            { isDeleted: true, isActive: false },
            { new: true }
        );
        if (!project) throw new AppError("Project not found", 404);
        return project;
    }

    /**
     * List projects with filters, pagination, and RBAC visibility logic
     */
    static async listProjects(options) {
        const {
            query = {},
            page = 1,
            limit = 10,
            sortBy = "createdAt",
            sortOrder = "desc",
            userRole
        } = options;

        const sort = {};
        sort[sortBy] = sortOrder === "desc" ? -1 : 1;

        // 1. Fetch Projects
        let projects = await Project.find(query)
            .populate("projectManager", "name email")
            .populate("client.id", "name company")
            .sort(sort)
            .limit(limit * 1)
            .skip((page - 1) * limit);

        // 2. Apply RBAC Filtering
        projects = projects.filter((project) => {
            const role = userRole ? userRole.toLowerCase() : "";
            if (['superadmin', 'admin', 'manager'].includes(role)) return true;

            const { activeDepartments = [], completedDepartments = [] } = project;
            const roleToDepartmentMap = {
                "d.s": "sales",
                "d.i": "info",
                "d.inf": "info",
                "d.c": "content",
                "d.d": "design",
                "d.it": "it",
                "d.in": "integration",
                "c.m": "control"
            };

            const userDepartment = roleToDepartmentMap[role];

            // Designers can see projects once information is completed
            if (role === "d.d" && project.infoStatus === "completed") {
                return true;
            }

            // Control Managers see projects once both design and IT workflows are completed
            if (role === "c.m") {
                return (project.designStatus === "completed" && project.itStatus === "integration_completed") ||
                    activeDepartments.includes("control") ||
                    completedDepartments.includes("control");
            }

            if (!userDepartment) return true;

            return activeDepartments.includes(userDepartment) || completedDepartments.includes(userDepartment);
        });

        const total = await Project.countDocuments(query);

        // 3. Stats
        const stats = await Project.aggregate([
            { $match: query },
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 },
                    totalBudget: { $sum: "$budget" },
                },
            },
        ]);

        return {
            projects,
            pagination: {
                currentPage: page * 1,
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                itemsPerPage: limit * 1,
            },
            stats
        };
    }
}

module.exports = ProjectService;
