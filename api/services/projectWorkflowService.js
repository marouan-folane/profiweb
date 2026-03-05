const Project = require('../models/project.model');
const AppError = require('../utils/AppError');

/**
 * Service to handle project workflow transitions and status updates
 */
class ProjectWorkflowService {
    /**
     * Completes the Info Department phase
     */
    static async completeInfoPhase(project, userId) {
        if (project.infoStatus === "completed") {
            throw new AppError("Questionnaire is already completed", 400);
        }

        project.infoStatus = "completed";
        project.infoCompletedBy = userId;
        project.infoCompletedAt = Date.now();
        project.updatedBy = userId;

        // Update department workflow
        project.activeDepartments = project.activeDepartments.filter(
            (dept) => dept !== "info"
        );

        // Add new departments if they are not already active
        const nextDepartments = ["design", "content", "it"];
        nextDepartments.forEach((dept) => {
            if (!project.activeDepartments.includes(dept)) {
                project.activeDepartments.push(dept);
            }
        });

        const existingCompletedDepartments = project.completedDepartments || [];
        if (!existingCompletedDepartments.includes("info")) {
            project.completedDepartments = [
                ...new Set([...existingCompletedDepartments, "info"]),
            ];
        }

        const saved = await project.save();

        // 🔔 Notify Content, IT, and Design departments
        const NotificationService = require('./notificationService');
        await NotificationService.notifyRoles({
            projectId: project._id,
            targetRoles: ['d.c', 'd.it', 'd.d'],
            message: `Project "${project.title}" is ready for your action. The Information phase has been completed.`,
            type: 'project_handover'
        });

        return saved;
    }

    /**
     * Completes the Content Department phase
     */
    static async completeContentPhase(project, userId) {
        if (project.contentStatus === "completed") {
            throw new AppError("Content workflow is already completed", 400);
        }

        // Prerequisites
        if (project.contentStatus !== "checklist_validated") {
            throw new AppError("Checklist must be validated before completing the content workflow", 400);
        }

        if (!project.isContentReady) {
            throw new AppError("Structured content must be submitted before completing the content workflow", 400);
        }

        project.contentStatus = "completed";
        project.contentCompletedBy = userId;
        project.contentCompletedAt = new Date();
        project.updatedBy = userId;

        // Department workflow 
        project.activeDepartments = project.activeDepartments.filter(
            (dept) => dept !== "content"
        );
        if (!project.completedDepartments.includes("content")) {
            project.completedDepartments.push("content");
        }

        const saved = await project.save();

        // 🔔 Notify Design (design can now start, content gate cleared)
        const NotificationService = require('./notificationService');
        await NotificationService.notifyRoles({
            projectId: project._id,
            targetRoles: ['d.d'],
            message: `Project "${project.title}": Content phase is complete. You can begin the visual design.`,
            type: 'phase_complete'
        });

        return saved;
    }

    /**
     * Completes the Design Department phase
     */
    static async completeDesignPhase(project, userId) {
        if (project.designStatus === "completed") {
            throw new AppError("Design workflow is already completed", 400);
        }

        if (project.designStatus !== "checklist_validated") {
            throw new AppError("Checklist must be validated before completing the design workflow", 400);
        }

        project.designStatus = "completed";
        project.designCompletedBy = userId;
        project.designCompletedAt = new Date();
        project.updatedBy = userId;

        project.activeDepartments = project.activeDepartments.filter(
            (dept) => dept !== "design"
        );
        if (!project.completedDepartments.includes("design")) {
            project.completedDepartments.push("design");
        }

        const saved = await project.save();

        const NotificationService = require('./notificationService');

        // 🔔 Notify IT that design is complete
        await NotificationService.notifyRoles({
            projectId: project._id,
            targetRoles: ['d.it', 'd.in'],
            message: `Design work and checklist for project "${project.title}" are completed. It is ready for IT integration.`,
            type: 'phase_complete'
        });

        // 🔔 Notify Control Manager if IT is also done
        if (project.itStatus === 'integration_completed') {
            // Activate Control Department
            if (!project.activeDepartments.includes("control")) {
                project.activeDepartments.push("control");
            }

            await NotificationService.notifyRoles({
                projectId: project._id,
                targetRoles: ['c.m'],
                message: `Project "${project.title}" is ready for final Quality Control. Both Design and IT phases are complete.`,
                type: 'action_required'
            });
        }

        return saved;
    }

    /**
     * Completes the IT Department phase
     */
    static async completeITPhase(project, userId) {
        if (project.itStatus === "integration_completed") {
            throw new AppError("Integration is already marked as completed", 400);
        }

        if (project.contentStatus !== "completed") {
            throw new AppError("Cannot finalize integration until the Content Department has completed their work.", 403);
        }

        project.itStatus = "integration_completed";
        project.updatedBy = userId;

        // Department workflow
        project.activeDepartments = project.activeDepartments.filter(
            (dept) => dept !== "it"
        );
        if (!project.completedDepartments.includes("it")) {
            project.completedDepartments.push("it");
        }

        const saved = await project.save();

        // 🔔 Notify Control Manager if Design is also done
        const NotificationService = require('./notificationService');
        if (project.designStatus === 'completed') {
            // Activate Control Department
            if (!project.activeDepartments.includes("control")) {
                project.activeDepartments.push("control");
                await project.save(); // Save again with control active
            }

            await NotificationService.notifyRoles({
                projectId: project._id,
                targetRoles: ['c.m'],
                message: `Project "${project.title}" is ready for final Quality Control. Both IT Integration and Design phases are complete.`,
                type: 'action_required'
            });
        }

        return saved;
    }

    /**
     * Validates and locks the content checklist
     */
    static async validateContentChecklist(project, userId) {
        if (project.contentStatus === "checklist_validated" || project.contentStatus === "completed") {
            throw new AppError("Checklist is already validated and locked", 400);
        }

        project.contentStatus = "checklist_validated";
        project.contentChecklistValidatedAt = new Date();
        project.contentChecklistValidatedBy = userId;
        project.updatedBy = userId;
        return await project.save();
    }

    /**
     * Validates and locks the design checklist
     */
    static async validateDesignChecklist(project, userId) {
        if (project.designStatus === "checklist_validated" || project.designStatus === "completed") {
            throw new AppError("Checklist is already validated and locked", 400);
        }

        project.designStatus = "checklist_validated";
        project.designChecklistValidatedAt = new Date();
        project.designChecklistValidatedBy = userId;
        project.updatedBy = userId;
        return await project.save();
    }

    /**
     * Validates and locks the IT setup checklist
     */
    static async validateITChecklist(project, userId) {
        if (project.itStatus === "setup_validated") {
            throw new AppError("IT setup checklist is already validated and locked", 400);
        }

        project.itStatus = "setup_validated";
        project.itSetupValidatedAt = new Date();
        project.itSetupValidatedBy = userId;
        project.updatedBy = userId;

        const saved = await project.save();

        // 🔔 Notify Design that IT setup is finalized
        const NotificationService = require('./notificationService');
        await NotificationService.notifyRoles({
            projectId: project._id,
            targetRoles: ['d.d'],
            message: `IT setup for project "${project.title}" is finalized. You can now access WordPress information.`,
            type: 'info'
        });

        return saved;
    }

    /**
     * Verifies if a user with a specific role can access a project
     * based on departmental logic gates.
     */
    static verifyProjectAccess(project, userRole) {
        const role = userRole ? userRole.toLowerCase() : "";

        // Designers can access after Information phase is completed
        if (role === "d.d") {
            const canAccess = project.infoStatus === "completed";

            if (!canAccess) {
                throw new AppError(
                    "Not authorized to access this project yet. Designers can only access projects after the Information phase is completed.",
                    403
                );
            }
        }

        // Control Managers can only access after Integration and Design are both completed
        if (role === "c.m") {
            const isItDone = project.itStatus === "integration_completed";
            const isDesignDone = project.designStatus === "completed";
            const isControlActive = (project.activeDepartments || []).includes("control") ||
                (project.completedDepartments || []).includes("control");

            if (!isControlActive && (!isItDone || !isDesignDone)) {
                throw new AppError(
                    "Not authorized to access this project yet. Control Managers can only access projects after IT Integration and Design are both completed.",
                    403
                );
            }
        }
    }
}

module.exports = ProjectWorkflowService;
