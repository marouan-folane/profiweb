"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getTemplates, deleteTemplate } from "@/config/functions/template";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Plus,
  RefreshCw,
  Trash2,
  Layout,
  Calendar,
  ChevronRight,
  AlertCircle,
  Loader2,
  Search,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";

const TemplateListPage = () => {
  const queryClient = useQueryClient();
  const [deleting, setDeleting] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { data: session } = useSession();
  const userRole = session?.user?.role;
  const canDelete = ["superadmin", "admin"].includes(userRole);

  // Fetch templates using React Query
  const {
    data: templatesRes = {},
    isLoading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: ['templates'],
    queryFn: getTemplates,
    retry: 2,
    refetchOnWindowFocus: false,
  });

  // Get templates array from response
  const templates = templatesRes?.data?.templates || templatesRes?.templates || [];

  // Filter templates based on search term
  const filteredTemplates = templates.filter(template =>
    template?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template?.shortDesc?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle refresh with spinner
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
    toast.success("Templates refreshed");
  };

  // Delete template mutation
  const deleteMutation = useMutation({
    mutationFn: deleteTemplate,
    onMutate: async (id) => {
      setDeleting(id);
      await queryClient.cancelQueries({ queryKey: ['templates'] });
      const previousTemplates = queryClient.getQueryData(['templates']);

      queryClient.setQueryData(['templates'], (old) => {
        const oldData = old?.data?.templates || old?.templates || old || [];
        const filtered = Array.isArray(oldData) ? oldData.filter(template => template._id !== id) : [];

        if (old?.data) {
          return { ...old, data: { ...old.data, templates: filtered } };
        } else if (old?.templates) {
          return { templates: filtered };
        }
        return filtered;
      });

      return { previousTemplates };
    },
    onError: (err, id, context) => {
      if (context?.previousTemplates) {
        queryClient.setQueryData(['templates'], context.previousTemplates);
      }
      toast.error(`Failed to delete template: ${err.message}`);
    },
    onSettled: () => {
      setDeleting(null);
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
    onSuccess: () => {
      toast.success('Template deleted successfully!');
    }
  });

  const openDeleteModal = (template) => {
    setTemplateToDelete(template);
    setDeleteModalOpen(true);
  };

  const handleDelete = () => {
    if (!templateToDelete) return;
    deleteMutation.mutate(templateToDelete._id);
    setDeleteModalOpen(false);
  };

  // Format date to readable string
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Calculate stats
  const stats = {
    total: templates?.length || 0,
    withColors: templates?.filter(t => t.colors && t.colors.length > 0).length || 0,
    latest: templates?.length > 0 ? formatDate(templates[0]?.createdAt) : 'N/A'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-slate-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-12 group">
          <div className="text-center lg:text-left">
            <CardTitle className="text-4xl sm:text-3xl md:text-4xl font-bold bg-clip-text dark:from-white dark:to-slate-400  mb-2 tracking-tight capitalize">
              Template Library ( {stats.total} )
            </CardTitle>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 font-medium max-w-xl mx-auto lg:mx-0">
              Manage and deploy your high-performance baseline templates.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-end gap-3 w-full lg:w-auto">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={isLoading || isRefreshing}
              className="w-full sm:w-auto h-11 px-6 gap-2 border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-white/5 backdrop-blur-sm hover:bg-white dark:hover:bg-white/10 transition-all font-bold text-xs uppercase tracking-widest"
            >
              <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
              <span>{isRefreshing ? "Refreshing..." : "Refresh Library"}</span>
            </Button>
            <Link href="/templates/new" className="w-full sm:w-auto">
              <Button
                className="w-full h-11 px-8 gap-2 text-white bg-[#FCCF3C] hover:bg-[#ddc165] shadow-lg shadow-yellow-500/10 transition-all font-bold text-xs uppercase tracking-widest border-0"
              >
                <Plus className="h-4 w-4" />
                <span>New Template</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="mb-8 relative max-w-xl group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-[#FCCF3C] transition-colors" />
          <input
            type="text"
            placeholder="Search templates by title or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-12 pl-12 pr-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[#FCCF3C]/20 focus:border-[#FCCF3C] dark:text-white transition-all placeholder-slate-400 font-medium"
          />
        </div>

        {/* Dynamic Content Area */}
        {isLoading ? (
          <Card className="border-slate-200 dark:border-white/5 bg-white/50 dark:bg-slate-900/40 backdrop-blur-md">
            <CardContent className="p-24 flex flex-col items-center justify-center">
              <div className="relative mb-6">
                <div className="absolute inset-0 rounded-full bg-[#FCCF3C]/20 animate-ping" />
                <div className="relative p-4 rounded-full bg-white dark:bg-slate-900 border border-[#FCCF3C]/30 shadow-xl">
                  <Loader2 className="h-10 w-10 text-[#FCCF3C] animate-spin" />
                </div>
              </div>
              <p className="text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-400 bg-clip-text text-transparent dark:text-white tracking-tight">
                Retrieving Templates...
              </p>
              <p className="text-slate-500 dark:text-white/40 mt-2 text-sm font-medium">Please wait while we sync with the server</p>
            </CardContent>
          </Card>
        ) : isError ? (
          <Card className="border-red-100 dark:border-red-950/30 bg-red-50/30 dark:bg-red-950/10 backdrop-blur-sm">
            <CardContent className="p-12 flex flex-col items-center text-center">
              <div className="p-4 rounded-full bg-red-100 dark:bg-red-500/10 mb-4">
                <AlertCircle className="h-10 w-10 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Sync Error Detected</h3>
              <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto mb-6">
                {error?.message || "There was a problem loading your templates. This might be a temporary connection issue."}
              </p>
              <Button
                onClick={() => refetch()}
                className="bg-red-500 hover:bg-red-600 text-white border-0 font-bold px-8 shadow-lg shadow-red-500/20"
              >
                Retry Connection
              </Button>
            </CardContent>
          </Card>
        ) : filteredTemplates.length === 0 ? (
          <Card className="border-slate-200 dark:border-white/5 bg-white/50 dark:bg-slate-900/40 backdrop-blur-lg">
            <CardContent className="p-20 text-center flex flex-col items-center">
              <div className="w-24 h-24 rounded-3xl bg-slate-50 dark:bg-white/5 flex items-center justify-center mb-8 border border-slate-100 dark:border-white/10 rotate-3 shadow-inner">
                <Layout className="h-10 w-10 text-slate-300 dark:text-slate-700" />
              </div>
              <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-4   uppercase tracking-tighter">No Templates Available</h3>
              <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-10 leading-relaxed font-medium">
                {searchTerm
                  ? "We couldn't find any templates matching your search criteria. Try a different keyword."
                  : "Your template library is currently empty. Start by creating a blueprint that can be reused across your projects."}
              </p>
              {searchTerm ? (
                <Button variant="ghost" onClick={() => setSearchTerm("")} className="font-bold text-[#FCCF3C] hover:bg-[#FCCF3C]/10 underline decoration-2">Clear Search Result</Button>
              ) : (
                <Link href="/templates/new">
                  <Button className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-10 h-12 rounded-full font-black uppercase tracking-widest hover:scale-105 transition-transform shadow-2xl">
                    Define First Template
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredTemplates.map((template) => (
              <Card
                key={template._id}
                className="group relative border-slate-200 dark:border-white/10 bg-white/70 dark:bg-slate-900/40 backdrop-blur-md overflow-hidden hover:shadow-2xl hover:shadow-slate-200/50 dark:hover:shadow-black/50 transition-all duration-500 flex flex-col"
              >
                {/* Visual Accent */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#FCCF3C] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                <CardHeader className="p-6 pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-semibold font-black text-slate-900 dark:text-white group-hover:text-[#ddc165] transition-colors line-clamp-1  uppercase tracking-tight mb-2">
                      {template.title}
                    </CardTitle>
                    {canDelete && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openDeleteModal(template)}
                        className="h-8 w-8 text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                        title="Remove Blueprint"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                </CardHeader>

                <CardContent className="p-6 -pt-4 flex-grow flex flex-col">
                  <p className="text-slate-600 dark:text-slate-400 text-sm line-clamp-3 mb-6 font-medium leading-relaxed">
                    {template.shortDesc || "This baseline template currently has no detailed description defined."}
                  </p>

                  <div className="mt-auto pt-4 border-t border-slate-100 dark:border-white/5">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5 text-xs font-black text-slate-900 dark:text-slate-400">
                          <Calendar className="h-3 w-3 text-[#ddc165]" />
                          {formatDate(template.createdAt)}
                        </div>
                      </div>

                      <Link href={`/templates/${template._id}`}>
                        <Button
                          variant="ghost"
                          className="group/btn h-10 px-4 rounded-xl font-bold text-xs uppercase tracking-widest text-slate-600 dark:text-white hover:bg-[#FCCF3C] hover:text-white dark:hover:text-slate-900 transition-all"
                        >
                          Structure
                          <ChevronRight className="h-4 w-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Footer Info */}
        {!isLoading && filteredTemplates.length > 0 && (
          <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4 py-8 border-t border-slate-200 dark:border-white/5">
            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
              Showing {filteredTemplates.length} of {stats.total} templates
            </span>
            <div className="h-1 w-1 rounded-full bg-slate-300 dark:bg-white/10 hidden sm:block" />
            <button
              onClick={handleRefresh}
              className="text-[11px] font-black uppercase tracking-[0.2em] text-[#ddc165] hover:text-[#FCCF3C] transition-colors"
            >
              refresh
            </button>
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <AlertDialogContent className="dark:bg-slate-950 dark:border-white/10">
          <AlertDialogHeader>
            <div className="mb-4 flex items-center justify-center">
              <div className="p-4 rounded-full bg-red-100 dark:bg-red-500/10">
                <Trash2 className="h-8 w-8 text-red-500" />
              </div>
            </div>
            <AlertDialogTitle className="text-2xl font-black text-center text-slate-900 dark:text-white uppercase tracking-tight  ">
              Purge Template?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center font-medium opacity-80 pt-2 leading-relaxed">
              Are you sure you want to delete <span className="font-black text-slate-900 dark:text-white  ">"{templateToDelete?.title}"</span>?
              <br />This operation cannot be reversed and will remove all associated configurations.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6 flex sm:justify-center gap-3">
            <AlertDialogCancel asChild>
              <Button variant="outline" className="font-bold border-slate-200 uppercase tracking-widest text-xs h-12 px-8">ABORT OPERATION</Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700 text-white border-0 font-bold uppercase tracking-widest text-xs h-12 px-8 shadow-lg shadow-red-600/20"
              >
                CONFIRM PURGE
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TemplateListPage;
