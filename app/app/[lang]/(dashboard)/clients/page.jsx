"use client";
import * as React from "react";
import { Search, Plus, Trash2, MoreHorizontal, User, Building2, Mail, Phone, Globe, Loader2, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
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
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Client Management</h1>
                    <p className="text-muted-foreground mt-1">
                        View and manage your platform clients dynamically.
                    </p>
                </div>
                <Button className="bg-primary text-white" onClick={() => { resetForm(); setIsAddDialogOpen(true); }}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Client
                </Button>
            </div>

            <Card className="border-none shadow-sm">
                <CardHeader className="pb-0">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search clients..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-9 w-full md:w-[300px]"
                                />
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="rounded-md border border-muted overflow-hidden">
                        <Table>
                            <TableHeader className="bg-muted/30">
                                <TableRow>
                                    <TableHead className="font-semibold text-gray-900">Client</TableHead>
                                    <TableHead className="font-semibold text-gray-900">Company</TableHead>
                                    <TableHead className="font-semibold text-gray-900">Contact</TableHead>
                                    <TableHead className="font-semibold text-gray-900">Projects</TableHead>
                                    <TableHead className="font-semibold text-gray-900 text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginatedData.length > 0 ? (
                                    paginatedData.map((client) => (
                                        <TableRow key={client._id} className="hover:bg-muted/10 transition-colors">
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-9 w-9 border border-muted">
                                                        <AvatarFallback className="bg-primary/5 text-primary text-xs">
                                                            {client.name?.split(' ').map(n => n[0]).join('')}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium text-gray-900">{client.name}</span>
                                                        <span className="text-xs text-muted-foreground">{client.industry || 'No Industry'}</span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-sm font-medium">
                                                <div className="flex items-center gap-2">
                                                    <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                                                    {client.company || 'N/A'}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                        <Mail className="h-3 w-3" />
                                                        {client.email || 'No email'}
                                                    </div>
                                                    {client.phone && (
                                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                            <Phone className="h-3 w-3" />
                                                            {client.phone}
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-wrap gap-1">
                                                    {client.projects && client.projects.length > 0 ? (
                                                        <Badge
                                                            variant="outline"
                                                            className="text-[10px] px-1.5 py-0 cursor-pointer hover:bg-primary/10 transition-colors"
                                                            onClick={() => handleViewProjectsClick(client)}
                                                        >
                                                            {client.projects.length} Projects
                                                        </Badge>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground">None</span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-[160px]">
                                                        <DropdownMenuLabel>View Details</DropdownMenuLabel>
                                                        <DropdownMenuItem className="cursor-pointer" onClick={() => handleEditClick(client)}>
                                                            Edit Client
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem className="cursor-pointer" onClick={() => handleViewProjectsClick(client)}>
                                                            View Projects
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem className="text-destructive focus:text-destructive cursor-pointer" onClick={() => handleDeleteClick(client._id)}>
                                                            Delete Client
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                                            No clients found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination - Always visible to match screenshot */}
                    <div className="flex items-center justify-center gap-4 mt-6">
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-9 w-9 border-muted text-primary hover:bg-muted"
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </Button>
                        
                        <span className="text-sm font-medium text-gray-700">
                            Page {currentPage} of {Math.max(1, totalPages)}
                        </span>

                        <Button
                            variant="outline"
                            size="icon"
                            className="h-9 w-9 border-muted text-primary hover:bg-muted"
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages || totalPages === 0}
                        >
                            <ChevronRight className="h-5 w-5" />
                        </Button>
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
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>{isEditDialogOpen ? "Edit Client" : "Add New Client"}</DialogTitle>
                        <DialogDescription>
                            {isEditDialogOpen ? "Update the client's information below." : "Enter the details for the new client."}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4 py-4">
                        {formError && (
                            <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
                                <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {formError}
                            </div>
                        )}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Name</Label>
                                <Input id="name" name="name" value={formData.name} onChange={handleFormChange} placeholder="John Doe" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" name="email" type="email" value={formData.email} onChange={handleFormChange} placeholder="john@example.com" required />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="company">Company</Label>
                                <Input id="company" name="company" value={formData.company} onChange={handleFormChange} placeholder="Acme Inc." />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone</Label>
                                <Input id="phone" name="phone" value={formData.phone} onChange={handleFormChange} placeholder="+212..." />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="industry">Industry</Label>
                                <Input id="industry" name="industry" value={formData.industry} onChange={handleFormChange} placeholder="Tech, Retail, etc." />
                            </div>
                        </div>
                        <DialogFooter className="pt-4">
                            <Button type="button" variant="outline" onClick={() => { setIsAddDialogOpen(false); setIsEditDialogOpen(false); }}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                                {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isEditDialogOpen ? "Update Client" : "Create Client"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
            {/* View Projects Dialog */}
            <Dialog open={isViewProjectsOpen} onOpenChange={setIsViewProjectsOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Projects for {selectedClient?.name}</DialogTitle>
                        <DialogDescription>
                            List of active projects associated with this client.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        {selectedClient?.projects && selectedClient.projects.length > 0 ? (
                            <div className="space-y-3">
                                {selectedClient.projects.map((project) => (
                                    <div key={project._id} className="flex items-center justify-between p-3 rounded-lg border border-muted hover:border-primary/50 transition-colors group">
                                        <div className="flex flex-col">
                                            <span className="font-medium text-gray-900">{project.title}</span>
                                        </div>
                                        <Link
                                            href={`/${lang}/projects/${project._id}`}
                                            className="text-muted-foreground hover:text-primary transition-colors p-2 hover:bg-muted rounded-full"
                                        >
                                            <Eye className="h-4 w-4" />
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                No active projects found for this client.
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
