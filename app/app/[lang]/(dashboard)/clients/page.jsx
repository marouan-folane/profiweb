"use client";
import * as React from "react";
import { Search, Plus, Trash2, MoreHorizontal, User, Building2, Mail, Phone, Globe, Loader2, Eye, ChevronLeft, ChevronRight, AlertCircle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { getAllClients, createNewClient, updateClient, deleteClient } from "@/config/functions/client";

export default function ClientManagementPage() {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = React.useState("");
    const [currentPage, setCurrentPage] = React.useState(1);
    const [rowsPerPage, setRowsPerPage] = React.useState(10);

    const params = useParams();
    const lang = params?.lang || "en";

    const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
    const [isViewProjectsOpen, setIsViewProjectsOpen] = React.useState(false);
    const [selectedClient, setSelectedClient] = React.useState(null);
    const [formError, setFormError] = React.useState(""); // server-side error shown inside dialog
    const [formData, setFormData] = React.useState({
        name: "",
        email: "",
        company: "",
        phone: "",
        industry: ""
    });

    // Fetch clients
    const { data: clientsResponse, isLoading, isError, error, refetch } = useQuery({
        queryKey: ['clients'],
        queryFn: () => getAllClients({ limit: 1000 }),
    });

    const createMutation = useMutation({
        mutationFn: createNewClient,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['clients'] });
            toast.success("Client created successfully");
            setIsAddDialogOpen(false);
            setFormError("");
            resetForm();
        },
        onError: (err) => {
            // err.message comes from a thrown JS error; for API 4xx the helper
            // doesn't throw, so we handle that case in handleSubmit instead
            const msg = err?.message || "Failed to create client";
            setFormError(msg);
            toast.error(msg);
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => updateClient(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['clients'] });
            toast.success("Client updated successfully");
            setIsEditDialogOpen(false);
            setSelectedClient(null);
            setFormError("");
            resetForm();
        },
        onError: (err) => {
            const msg = err?.message || "Failed to update client";
            setFormError(msg);
            toast.error(msg);
        }
    });

    const deleteMutation = useMutation({
        mutationFn: deleteClient,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['clients'] });
            toast.success("Client deleted successfully");
        },
        onError: (err) => toast.error(err?.message || "Failed to delete client")
    });

    const resetForm = () => {
        setFormData({
            name: "",
            email: "",
            company: "",
            phone: "",
            industry: ""
        });
    };

    const handleEditClick = (client) => {
        setSelectedClient(client);
        setFormData({
            name: client.name || "",
            email: client.email || "",
            company: client.company || "",
            phone: client.phone || "",
            industry: client.industry || ""
        });
        setIsEditDialogOpen(true);
    };

    const handleViewProjectsClick = (client) => {
        setSelectedClient(client);
        setIsViewProjectsOpen(true);
    };

    const handleDeleteClick = (id) => {
        if (window.confirm("Are you sure you want to delete this client?")) {
            deleteMutation.mutate(id);
        }
    };

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError("");

        // Basic client-side guard
        if (!formData.name.trim()) { setFormError("Client name is required"); return; }
        if (!formData.email.trim()) { setFormError("Email address is required"); return; }
        if (!/\S+@\S+\.\S+/.test(formData.email)) { setFormError("Please enter a valid email address"); return; }

        if (isEditDialogOpen) {
            updateMutation.mutate({ id: selectedClient._id, data: formData });
        } else {
            // createNewClient helper returns the response data instead of throwing on 4xx
            const response = await createNewClient(formData);
            if (response?.status === 'fail' || response?.status === 'error') {
                const msg = response.message || 'Failed to create client';
                setFormError(msg);
                toast.error(msg);
                return; // keep dialog open with form data preserved
            }
            if (response?.status === 'success') {
                queryClient.invalidateQueries({ queryKey: ['clients'] });
                toast.success('Client created successfully');
                setIsAddDialogOpen(false);
                setFormError("");
                resetForm();
            }
        }
    };

    const clientsData = clientsResponse?.data?.clients || [];

    const filteredData = React.useMemo(() => {
        if (!clientsData) return [];
        let filtered = clientsData;

        if (searchTerm) {
            const term = searchTerm.trim().toLowerCase();
            const searchWords = term.split(/\s+/).filter(Boolean);

            filtered = filtered.filter(client => {
                // Multi-word match for name: all search words must be present
                const nameMatch = searchWords.every(word =>
                    client.name?.toLowerCase().includes(word)
                );

                // Fallback search for other fields using the full trimmed term
                const emailMatch = client.email?.toLowerCase().includes(term);
                const companyMatch = client.company?.toLowerCase().includes(term);
                const phoneMatch = client.phone?.toLowerCase().includes(term);

                return nameMatch || emailMatch || companyMatch || phoneMatch;
            });
        }

        return filtered;
    }, [clientsData, searchTerm]);

    const totalPages = Math.ceil(filteredData.length / rowsPerPage);
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const paginatedData = filteredData.slice(startIndex, endIndex);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-10 w-10 text-primary animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-slate-900 p-4 sm:p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-slate-900 to-blue-900 bg-clip-text dark:text-white mb-2">
                        Client Management
                    </h1>
                    <p className="text-sm sm:text-base text-gray-500 dark:text-mist-50">
                        View and manage your platform clients dynamically
                    </p>
                </div>
                <Button
                    className="w-full sm:w-auto gap-2 text-white bg-[#FCCF3C] hover:bg-[#ddc165] transition-all duration-300 shadow-lg shadow-yellow-500/20"
                    onClick={() => { resetForm(); setIsAddDialogOpen(true); }}
                >
                    <Plus className="h-4 w-4" />
                    <span>Add Client</span>
                </Button>
            </div>

            <Card className="border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden bg-white/80 dark:bg-slate-900/50 backdrop-blur-md">
                <CardHeader className="pb-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="relative w-full sm:w-[350px]">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Search clients..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9 w-full border-slate-200 dark:border-slate-700 focus:border-[#FCCF3C] focus:ring-[#FCCF3C] bg-white/50 dark:bg-slate-950/50"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="space-y-6">
                        {/* Mobile & Tablet Card View */}
                        <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {paginatedData.length > 0 ? (
                                paginatedData.map((client) => (
                                    <Card
                                        key={client._id}
                                        className="relative overflow-hidden border-slate-200 dark:border-white/5 transition-all duration-300 hover:shadow-md bg-white/50 dark:bg-slate-900/40 backdrop-blur-sm flex flex-col"
                                    >
                                        <CardContent className="p-5 flex-grow">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-10 w-10 border-2 border-slate-100 dark:border-white/10 shadow-sm">
                                                        <AvatarFallback className="bg-gradient-to-br from-[#FCCF3C] to-[#ddc165] text-white font-bold text-xs uppercase">
                                                            {client.name?.split(' ').map(n => n[0]).join('')}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex flex-col min-w-0">
                                                        <h3 className="font-bold text-slate-900 dark:text-slate-100 truncate group-hover:text-[#FCCF3C] transition-colors leading-tight">
                                                            {client.name}
                                                        </h3>
                                                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider truncate">
                                                            {client.industry || 'No Industry'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <Badge
                                                    variant="secondary"
                                                    className="bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 font-black text-[9px] uppercase tracking-wider h-5"
                                                >
                                                    Client
                                                </Badge>
                                            </div>

                                            <div className="space-y-3 mb-5">
                                                {/* Company Info */}
                                                <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50/50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                                                    <Building2 className="h-4 w-4 text-[#FCCF3C]" />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs font-bold text-slate-800 dark:text-slate-300 truncate">
                                                            {client.company || 'N/A'}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Contact Details */}
                                                <div className="grid grid-cols-1 gap-2">
                                                    <div className="flex items-center gap-2 p-2 rounded-lg border border-slate-100 dark:border-white/5 bg-white/30 dark:bg-white/[0.02]">
                                                        <Mail className="h-3.5 w-3.5 text-slate-400" />
                                                        <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400 truncate">
                                                            {client.email || 'No email'}
                                                        </span>
                                                    </div>
                                                    {client.phone && (
                                                        <div className="flex items-center gap-2 p-2 rounded-lg border border-slate-100 dark:border-white/5 bg-white/30 dark:bg-white/[0.02]">
                                                            <Phone className="h-3.5 w-3.5 text-slate-400" />
                                                            <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
                                                                {client.phone}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Projects Badge */}
                                                <div className="flex items-center justify-between pt-1">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Projects</span>
                                                    {client.projects && client.projects.length > 0 ? (
                                                        <Badge
                                                            variant="outline"
                                                            className="border-[#FCCF3C]/30 text-[#FCCF3C] dark:text-[#FCCF3C] font-black text-[10px] uppercase tracking-wider cursor-pointer bg-[#FCCF3C]/5"
                                                            onClick={() => handleViewProjectsClick(client)}
                                                        >
                                                            {client.projects.length} {client.projects.length === 1 ? 'Project' : 'Projects'}
                                                        </Badge>
                                                    ) : (
                                                        <span className="text-[10px] font-bold text-slate-300 uppercase">None</span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-white/5 mt-auto">
                                                <div className="flex items-center gap-1.5">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-9 w-9 text-slate-500 hover:text-[#FCCF3C] hover:bg-[#FCCF3C]/10 transition-colors"
                                                        onClick={() => handleEditClick(client)}
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-9 w-9 text-slate-500 hover:text-[#FCCF3C] hover:bg-[#FCCF3C]/10 transition-colors"
                                                        onClick={() => handleViewProjectsClick(client)}
                                                    >
                                                        <Building2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-9 w-9 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                                                    onClick={() => handleDeleteClick(client._id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))
                            ) : (
                                <div className="col-span-full h-48 flex flex-col items-center justify-center text-slate-500 bg-slate-50/50 dark:bg-white/[0.02] rounded-xl border-2 border-dashed border-slate-200 dark:border-white/5">
                                    <Search className="w-10 h-10 text-slate-300 mb-2" />
                                    <p className="font-medium">No clients found matching your search.</p>
                                </div>
                            )}
                        </div>

                        {/* Laptop & Desktop Table View */}
                        <div className="hidden lg:block rounded-md border border-slate-200 dark:border-white/5 overflow-hidden">
                            <Table>
                                <TableHeader className="bg-slate-50/50 dark:bg-slate-900/80 backdrop-blur-sm">
                                    <TableRow className="border-slate-200 dark:border-white/5 hover:bg-transparent">
                                        <TableHead className="text-slate-600 dark:text-slate-400 font-bold uppercase text-[10px] tracking-widest py-4">Client</TableHead>
                                        <TableHead className="text-slate-600 dark:text-slate-400 font-bold uppercase text-[10px] tracking-widest py-4">Company</TableHead>
                                        <TableHead className="text-slate-600 dark:text-slate-400 font-bold uppercase text-[10px] tracking-widest py-4">Contact</TableHead>
                                        <TableHead className="text-slate-600 dark:text-slate-400 font-bold uppercase text-[10px] tracking-widest py-4">Projects</TableHead>
                                        <TableHead className="text-slate-600 dark:text-slate-400 font-bold uppercase text-[10px] tracking-widest py-4 text-center">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody className="bg-white dark:bg-slate-900/40">
                                    {paginatedData.length > 0 ? (
                                        paginatedData.map((client) => (
                                            <TableRow
                                                key={client._id}
                                                className="group border-slate-100 dark:border-white/5 transition-all duration-300 hover:bg-slate-50 dark:hover:bg-white/[0.02]"
                                            >
                                                <TableCell className="py-5">
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-9 w-9 border border-slate-200 dark:border-white/10 shadow-sm">
                                                            <AvatarFallback className="bg-gradient-to-br from-[#FCCF3C] to-[#ddc165] text-white font-bold text-xs uppercase">
                                                                {client.name?.split(' ').map(n => n[0]).join('')}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-[#FCCF3C] dark:group-hover:text-[#FCCF3C] transition-colors tracking-tight">
                                                                {client.name}
                                                            </span>
                                                            <span className="text-[11px] text-slate-500 dark:text-slate-500 font-medium">{client.industry || 'No Industry'}</span>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-sm font-medium py-5">
                                                    <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                                                        <Building2 className="h-3.5 w-3.5 text-slate-400" />
                                                        {client.company || 'N/A'}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-5">
                                                    <div className="flex flex-col gap-1">
                                                        <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                                                            <Mail className="h-3 w-3" />
                                                            {client.email || 'No email'}
                                                        </div>
                                                        {client.phone && (
                                                            <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                                                                <Phone className="h-3 w-3" />
                                                                {client.phone}
                                                            </div>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-5">
                                                    <div className="flex flex-wrap gap-1">
                                                        {client.projects && client.projects.length > 0 ? (
                                                            <Badge
                                                                variant="outline"
                                                                className="dark:bg-slate-900/40 dark:border-white/10 dark:text-slate-300 font-bold uppercase text-[10px] tracking-widest cursor-pointer hover:border-[#FCCF3C] hover:text-[#FCCF3C] transition-colors"
                                                                onClick={() => handleViewProjectsClick(client)}
                                                            >
                                                                {client.projects.length} Projects
                                                            </Badge>
                                                        ) : (
                                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">None</span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center py-5">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-slate-500 hover:text-[#FCCF3C] hover:bg-[#FCCF3C]/10 transition-colors"
                                                            onClick={() => handleEditClick(client)}
                                                            title="Edit Client"
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-slate-500 hover:text-[#FCCF3C] hover:bg-[#FCCF3C]/10 transition-colors"
                                                            onClick={() => handleViewProjectsClick(client)}
                                                            title="View Projects"
                                                        >
                                                            <Building2 className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-slate-600 hover:text-red-700 hover:bg-red-50 dark:text-slate-500 dark:hover:text-red-400 dark:hover:bg-red-950/20 transition-colors"
                                                            onClick={() => handleDeleteClick(client._id)}
                                                            title="Delete Client"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-48 text-center text-slate-500">
                                                <div className="flex flex-col items-center justify-center gap-3">
                                                    <Search className="w-12 h-12 text-slate-300 mb-2" />
                                                    <p className="font-medium text-slate-700 dark:text-slate-300">No clients found.</p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination */}
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 pt-6 border-t border-slate-100 dark:border-white/5">
                            <div className="text-[11px] font-black text-slate-500 uppercase tracking-widest">
                                Page {currentPage} of {Math.max(1, totalPages)}
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="border-slate-200 dark:border-slate-700 h-9 px-4 font-bold text-[10px] uppercase tracking-widest"
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                >
                                    <ChevronLeft className="h-4 w-4 mr-2" />
                                    Prev
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="border-slate-200 dark:border-slate-700 h-9 px-4 font-bold text-[10px] uppercase tracking-widest"
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage === totalPages || totalPages === 0}
                                >
                                    Next
                                    <ChevronRight className="h-4 w-4 ml-2" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Add/Edit Client Dialog */}
            <Dialog open={isAddDialogOpen || isEditDialogOpen} onOpenChange={(open) => {
                if (!open) {
                    setIsAddDialogOpen(false);
                    setIsEditDialogOpen(false);
                    setSelectedClient(null);
                    setFormError("");
                }
            }}>
                <DialogContent className="sm:max-w-[500px] dark:bg-slate-900 dark:border-white/10">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-slate-900 dark:text-white">
                            {isEditDialogOpen ? "Edit Client" : "Add New Client"}
                        </DialogTitle>
                        <DialogDescription className="text-slate-500">
                            {isEditDialogOpen ? "Update the client's information below." : "Enter the details for the new client."}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4 py-4">
                        {formError && (
                            <div className="rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 px-4 py-3 text-sm text-red-700 dark:text-red-400 flex items-center gap-2">
                                <AlertCircle className="h-4 w-4 shrink-0" />
                                {formError}
                            </div>
                        )}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-xs font-bold uppercase tracking-widest text-slate-500">Name</Label>
                                <Input id="name" name="name" value={formData.name} onChange={handleFormChange} placeholder="John Doe" required className="border-slate-200 dark:border-slate-700 focus:border-[#FCCF3C] focus:ring-[#FCCF3C]" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-xs font-bold uppercase tracking-widest text-slate-500">Email</Label>
                                <Input id="email" name="email" type="email" value={formData.email} onChange={handleFormChange} placeholder="john@example.com" required className="border-slate-200 dark:border-slate-700 focus:border-[#FCCF3C] focus:ring-[#FCCF3C]" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="company" className="text-xs font-bold uppercase tracking-widest text-slate-500">Company</Label>
                                <Input id="company" name="company" value={formData.company} onChange={handleFormChange} placeholder="Acme Inc." className="border-slate-200 dark:border-slate-700 focus:border-[#FCCF3C] focus:ring-[#FCCF3C]" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone" className="text-xs font-bold uppercase tracking-widest text-slate-500">Phone</Label>
                                <Input id="phone" name="phone" value={formData.phone} onChange={handleFormChange} placeholder="+212..." className="border-slate-200 dark:border-slate-700 focus:border-[#FCCF3C] focus:ring-[#FCCF3C]" />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="industry" className="text-xs font-bold uppercase tracking-widest text-slate-500">Industry</Label>
                                <Input id="industry" name="industry" value={formData.industry} onChange={handleFormChange} placeholder="Tech, Retail, etc." className="border-slate-200 dark:border-slate-700 focus:border-[#FCCF3C] focus:ring-[#FCCF3C]" />
                            </div>
                        </div>
                        <DialogFooter className="pt-6">
                            <Button type="button" variant="outline" onClick={() => { setIsAddDialogOpen(false); setIsEditDialogOpen(false); }} className="border-slate-200 dark:border-slate-700">
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={createMutation.isPending || updateMutation.isPending}
                                className="text-white  bg-[#FCCF3C] "
                            >
                                {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isEditDialogOpen ? "Update Client" : "Create Client"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
            {/* View Projects Dialog */}
            <Dialog open={isViewProjectsOpen} onOpenChange={setIsViewProjectsOpen}>
                <DialogContent className="sm:max-w-[500px] dark:bg-slate-900 dark:border-white/10">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-slate-900 dark:text-white">
                            Projects for {selectedClient?.name}
                        </DialogTitle>
                        <DialogDescription className="text-slate-500">
                            List of active projects associated with this client.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        {selectedClient?.projects && selectedClient.projects.length > 0 ? (
                            <div className="space-y-3">
                                {selectedClient.projects.map((project) => (
                                    <div key={project._id} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 dark:border-white/5 hover:border-[#FCCF3C]/50 transition-all group bg-slate-50/50 dark:bg-white/[0.02]">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-[#FCCF3C] transition-colors">{project.title}</span>
                                        </div>
                                        <Link
                                            href={`/${lang}/projects/${project._id}`}
                                            className="text-slate-400 hover:text-[#FCCF3C] transition-colors p-2 hover:bg-white dark:hover:bg-slate-800 rounded-full shadow-sm"
                                        >
                                            <Eye className="h-4 w-4" />
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 text-slate-400">
                                <Building2 className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                                No active projects found for this client.
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
