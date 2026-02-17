import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Icon } from '@iconify/react';

const ActionButtons = ({ project, onDeactivate, onActivate, onDeletePermanently, isProcessing }) => {
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);
  const [showActivateDialog, setShowActivateDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const projectId = project.id || project._id;
  const projectTitle = project.title || 'Untitled Project';

  const handleDeactivateClick = () => {
    setIsMenuOpen(false);
    setShowDeactivateDialog(true);
  };

  const handleActivateClick = () => {
    setIsMenuOpen(false);
    setShowActivateDialog(true);
  };

  const handleDeleteClick = () => {
    setIsMenuOpen(false);
    setShowDeleteDialog(true);
  };

  const handleViewClick = () => {
    setIsMenuOpen(false);
    window.location.href = `/projects/${projectId}`;
  };

  const confirmDeactivate = () => {
    onDeactivate(projectId);
    setShowDeactivateDialog(false);
  };

  const confirmActivate = () => {
    onActivate(projectId);
    setShowActivateDialog(false);
  };

  const confirmDelete = () => {
    onDeletePermanently(projectId);
    setShowDeleteDialog(false);
  };

  return (
    <>
      <div className="flex items-center justify-end gap-2">
        {/* View Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleViewClick}
          disabled={isProcessing}
          className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600"
          title="View Project"
        >
          <Icon icon="heroicons:eye" className="h-4 w-4" />
        </Button>

        {/* Dropdown Menu for More Actions */}
        <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              disabled={isProcessing}
              className="h-8 w-8 p-0 data-[state=open]:bg-accent"
              title="More Actions"
            >
              <Icon icon="heroicons:ellipsis-vertical" className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {project.isActive ? (
              <DropdownMenuItem 
                onClick={handleDeactivateClick} 
                className="cursor-pointer text-amber-600 focus:text-amber-600 focus:bg-amber-50"
              >
                <Icon icon="heroicons:archive-box" className="mr-2 h-4 w-4" />
                Archive Project
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem 
                onClick={handleActivateClick} 
                className="cursor-pointer text-green-600 focus:text-green-600 focus:bg-green-50"
              >
                <Icon icon="heroicons:archive-box-arrow-up" className="mr-2 h-4 w-4" />
                Restore Project
              </DropdownMenuItem>
            )}

            <DropdownMenuSeparator />

            <DropdownMenuItem 
              onClick={handleDeleteClick} 
              className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
            >
              <Icon icon="heroicons:trash" className="mr-2 h-4 w-4" />
              Delete Permanently
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Deactivate Confirmation Dialog */}
      <AlertDialog open={showDeactivateDialog} onOpenChange={setShowDeactivateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to archive <span className="font-semibold text-foreground">{projectTitle}</span>?
              <br /><br />
              This will:
              <ul className="list-disc list-inside mt-2 text-sm text-muted-foreground">
                <li>Prevent users from accessing this project</li>
                <li>Hide the project from active listings</li>
                <li>Keep all project data for future reference</li>
                <li>Can be restored later if needed</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeactivate}
              disabled={isProcessing}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {isProcessing ? 'Archiving...' : 'Yes, Archive Project'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Activate Confirmation Dialog */}
      <AlertDialog open={showActivateDialog} onOpenChange={setShowActivateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to restore <span className="font-semibold text-foreground">{projectTitle}</span>?
              <br /><br />
              This will:
              <ul className="list-disc list-inside mt-2 text-sm text-muted-foreground">
                <li>Make the project accessible to users</li>
                <li>Show the project in active listings</li>
                <li>Allow team members to work on it</li>
                <li>Can be archived again if needed</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmActivate}
              disabled={isProcessing}
              className="bg-green-600 hover:bg-green-700"
            >
              {isProcessing ? 'Restoring...' : 'Yes, Restore Project'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Permanently Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600">⚠️ Delete Project Permanently</AlertDialogTitle>
            <AlertDialogDescription>
              <div className="space-y-2">
                <p className="font-medium text-foreground">
                  Are you absolutely sure you want to delete <span className="font-semibold">{projectTitle}</span>?
                </p>
                <p className="text-sm">
                  This action <span className="font-bold text-red-600">cannot be undone</span>. This will permanently:
                </p>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  <li>Delete all project data from the database</li>
                  <li>Remove all associated files and documents</li>
                  <li>Delete all tasks, milestones, and discussions</li>
                  <li>Remove all client information related to this project</li>
                  <li>Delete all financial records for this project</li>
                </ul>
                <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded">
                  <p className="text-sm font-medium text-red-800 flex items-center">
                    <Icon icon="heroicons:exclamation-triangle" className="h-4 w-4 mr-2" />
                    This is a destructive action that cannot be reversed!
                  </p>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              disabled={isProcessing}
              className="bg-red-600 hover:bg-red-700"
            >
              {isProcessing ? 'Deleting...' : 'Yes, Delete Permanently'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ActionButtons;