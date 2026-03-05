const Project = require('../models/project.model');
const ControlChecklistItem = require('../models/controlChecklist.model');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

// ── Predefined checklist sections / items ───────────────────────────────────
const CONTROL_CHECKLIST_SECTIONS = [
    {
        id: 'general_review',
        title: 'General Project Review',
        items: [
            { id: 'project_requirements_met', label: 'All project requirements have been met' },
            { id: 'deliverables_complete', label: 'All deliverables are complete and delivered' },
            { id: 'client_info_verified', label: 'Client information and contacts verified' },
        ]
    },
    {
        id: 'content_review',
        title: 'Content & Design Review',
        items: [
            { id: 'content_approved', label: 'Content has been reviewed and approved' },
            { id: 'design_approved', label: 'Design work reviewed and approved' },
            { id: 'website_live', label: 'Website is live and accessible' },
        ]
    },
    {
        id: 'technical_review',
        title: 'Technical Review',
        items: [
            { id: 'it_setup_verified', label: 'IT setup and access credentials verified' },
            { id: 'integrations_tested', label: 'All integrations tested and functional' },
            { id: 'performance_checked', label: 'Performance and loading speed acceptable' },
        ]
    },
    {
        id: 'final_approval',
        title: 'Final Sign-off',
        items: [
            { id: 'client_sign_off', label: 'Client has signed off on the final product' },
            { id: 'documentation_complete', label: 'Project documentation is complete' },
            { id: 'handover_complete', label: 'Project handover process completed' },
        ]
    }
];

// ── GET /projects/:id/control-checklist ──────────────────────────────────────
const getControlChecklist = catchAsync(async (req, res, next) => {
    const { id: projectId } = req.params;
    const userRole = req.user.role;

    // Only c.m and superadmin can access
    if (!['c.m', 'superadmin'].includes(userRole)) {
        return next(new AppError('You are not authorized to access the control checklist.', 403));
    }

    const project = await Project.findById(projectId).select('title controlStatus designStatus itStatus');
    if (!project) return next(new AppError('Project not found', 404));

    // Secondary check for c.m role
    if (userRole === 'c.m' && (project.itStatus !== 'integration_completed' || project.designStatus !== 'completed')) {
        return next(new AppError('The control checklist is not yet available. Both IT integration and Design must be completed first.', 403));
    }

    // Fetch saved items
    const savedItems = await ControlChecklistItem.find({ projectId })
        .populate('completedBy', 'firstName lastName role');

    // Merge saved state into the static section/item structure
    const sections = CONTROL_CHECKLIST_SECTIONS.map(section => ({
        ...section,
        items: section.items.map(item => {
            const saved = savedItems.find(s => s.itemId === item.id);
            return {
                ...item,
                checked: saved?.checked ?? false,
                completedBy: saved?.completedBy ?? null,
                completedAt: saved?.completedAt ?? null,
            };
        })
    }));

    res.status(200).json({
        status: 'success',
        data: {
            sections,
            controlStatus: project.controlStatus,
            totalItems: savedItems.length,
        }
    });
});

// ── PATCH /projects/:id/control-checklist/toggle ─────────────────────────────
const toggleControlChecklistItem = catchAsync(async (req, res, next) => {
    const { id: projectId } = req.params;
    const { itemId, sectionId, label, checked } = req.body;
    const userRole = req.user.role;

    if (userRole !== 'c.m') {
        return next(new AppError('Only Control Managers can update the control checklist.', 403));
    }

    const project = await Project.findById(projectId).select('controlStatus');
    if (!project) return next(new AppError('Project not found', 404));

    if (project.controlStatus === 'confirmed') {
        return next(new AppError('This project has already been confirmed. The checklist is locked.', 400));
    }

    // Upsert the checklist item
    const updatedItem = await ControlChecklistItem.findOneAndUpdate(
        { itemId, projectId },
        {
            itemId,
            sectionId,
            label,
            checked: !!checked,
            projectId,
            completedBy: checked ? req.user.id : null,
            completedAt: checked ? new Date() : null,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(200).json({
        status: 'success',
        data: { item: updatedItem }
    });
});

// ── PATCH /projects/:id/confirm-finished ─────────────────────────────────────
const confirmProjectFinished = catchAsync(async (req, res, next) => {
    const { id: projectId } = req.params;
    const userRole = req.user.role;

    if (userRole !== 'c.m') {
        return next(new AppError('Only Control Managers can confirm project completion.', 403));
    }

    const project = await Project.findById(projectId);
    if (!project) return next(new AppError('Project not found', 404));

    if (project.controlStatus === 'confirmed') {
        return next(new AppError('Project has already been confirmed as finished.', 400));
    }

    // Validate ALL checklist items are checked
    const savedItems = await ControlChecklistItem.find({ projectId });
    const totalExpected = CONTROL_CHECKLIST_SECTIONS.reduce((sum, s) => sum + s.items.length, 0);
    const checkedCount = savedItems.filter(i => i.checked).length;

    if (checkedCount < totalExpected) {
        return next(new AppError(
            `All checklist items must be completed before confirming. (${checkedCount}/${totalExpected} done)`,
            400
        ));
    }

    // Confirm the project
    project.controlStatus = 'confirmed';
    project.controlConfirmedAt = new Date();
    project.controlConfirmedBy = req.user.id;
    await project.save({ validateBeforeSave: false });

    // 🔔 Notify IT department — time for final Product delivery
    try {
        const NotificationService = require('../services/notificationService');
        await NotificationService.notifyRoles({
            projectId: project._id,
            targetRoles: ['d.it'],
            message: `Project "${project.title}" has been confirmed by Quality Control. Please proceed with final production deployment (Product tab).`,
            type: 'action_required'
        });
    } catch (err) {
        console.error('[Notification] Failed to notify IT after confirmation:', err.message);
    }

    res.status(200).json({
        status: 'success',
        message: 'Project has been confirmed as finished.',
        data: { project }
    });
});

module.exports = {
    getControlChecklist,
    toggleControlChecklistItem,
    confirmProjectFinished,
    CONTROL_CHECKLIST_SECTIONS,
};
