"use client";
import * as React from "react";

import { Search, Filter, Plus, UserX, UserCheck, Trash2, ChevronDown, MoreHorizontal, ChevronLeft, ChevronRight } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getAllUsers, deactivateUserById, activateUserById, deleteUserPermanently } from "@/config/functions/admin";

export function UserManagementTable() {
    const queryClient = useQueryClient();
    const [selectedRows, setSelectedRows] = React.useState(new Set());
    const [searchTerm, setSearchTerm] = React.useState("");
    const [selectedStatus, setSelectedStatus] = React.useState("all");
    const [selectedRole, setSelectedRole] = React.useState("all");
    const [currentPage, setCurrentPage] = React.useState(1);
    const [rowsPerPage, setRowsPerPage] = React.useState(10);

    // Fetch users
    const { data: usersData, isLoading, isError, error, refetch } = useQuery({
        queryKey: ['users'],
        queryFn: getAllUsers,
        staleTime: 5 * 60 * 1000,
        retry: 2,
    });

    // Mutations
    const deactivateMutation = useMutation({
        mutationFn: deactivateUserById,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            if (data?.success) {
                toast.success(data.message || 'User deactivated successfully');
            }
        },
        onError: (error) => {
            toast.error(error?.message || 'Failed to deactivate user');
        }
    });

    const activateMutation = useMutation({
        mutationFn: activateUserById,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            if (data?.success) {
                toast.success(data.message || 'User activated successfully');
            }
        },
        onError: (error) => {
            toast.error(error?.message || 'Failed to activate user');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: deleteUserPermanently,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            if (data?.success) {
                toast.success(data.message || 'User deleted successfully');
            }
        },
        onError: (error) => {
            toast.error(error?.message || 'Failed to delete user');
        }
    });

    // Process data
    const processedData = React.useMemo(() => {
        if (!usersData?.data) return [];

        const roleDeptMapping = {
            'd.s': 'Sales Department',
            'd.i': 'Information Department',
            'd.inf': 'Information Department',
            'd.it': 'IT Department',
            'd.d': 'Design Department',
            'd.in': 'Integration Department',
            'd.c': 'Content Department',
            'admin': 'Administration',
            'manager': 'Management',
            'c.m': 'Control Manager',
            'user': 'Project Manager'
        };

        return usersData.data.map(user => {
            const roleKey = user.role?.toLowerCase().trim();
            const mappedName = roleDeptMapping[roleKey] || user.role || 'User';

            return {
                id: user._id || user.id,
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                email: user.email || 'No email',
                role: mappedName,
                roleKey: roleKey,
                department: roleDeptMapping[roleKey] || user.department || 'Not Assigned',
                status: user.isActive !== false ? 'active' : 'inactive',
                lastLogin: user.lastLogin || user.updatedAt || new Date().toISOString(),
                profileImage: user.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username || user.email}`,
            };
        });
    }, [usersData]);

    // Filter and search data
    const filteredData = React.useMemo(() => {
        let filtered = processedData;

        // Search filter
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(user =>
                user.firstName.toLowerCase().includes(term) ||
                user.lastName.toLowerCase().includes(term) ||
                user.email.toLowerCase().includes(term) ||
                user.role.toLowerCase().includes(term) ||
                user.department.toLowerCase().includes(term)
            );
        }

        // Status filter
        if (selectedStatus !== "all") {
            filtered = filtered.filter(user => user.status === selectedStatus);
        }

        // Role filter
        if (selectedRole !== "all") {
            filtered = filtered.filter(user =>
                user.role.toLowerCase() === selectedRole.toLowerCase()
            );
        }

        return filtered;
    }, [processedData, searchTerm, selectedStatus, selectedRole]);

    // Pagination
    const totalPages = Math.ceil(filteredData.length / rowsPerPage);
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const paginatedData = filteredData.slice(startIndex, endIndex);

    // Row selection handlers
    const handleSelectAll = (checked) => {
        if (checked) {
            const allIds = new Set(paginatedData.map(user => user.id));
            setSelectedRows(allIds);
        } else {
            setSelectedRows(new Set());
        }
    };

    const handleSelectRow = (userId, checked) => {
        const newSelected = new Set(selectedRows);
        if (checked) {
            newSelected.add(userId);
        } else {
            newSelected.delete(userId);
        }
        setSelectedRows(newSelected);
    };

    const isAllSelected = paginatedData.length > 0 && paginatedData.every(user => selectedRows.has(user.id));
    const isSomeSelected = paginatedData.some(user => selectedRows.has(user.id)) && !isAllSelected;

    // Bulk actions
    const handleBulkDeactivate = () => {
        if (selectedRows.size === 0) {
            toast.error("Please select at least one user");
            return;
        }

        if (window.confirm(`Are you sure you want to deactivate ${selectedRows.size} user(s)?`)) {
            selectedRows.forEach(userId => {
                deactivateMutation.mutate(userId);
            });
        }
    };

    const handleBulkActivate = () => {
        if (selectedRows.size === 0) {
            toast.error("Please select at least one user");
            return;
        }

        if (window.confirm(`Are you sure you want to activate ${selectedRows.size} user(s)?`)) {
            selectedRows.forEach(userId => {
                activateMutation.mutate(userId);
            });
        }
    };

    const handleBulkDelete = () => {
        if (selectedRows.size === 0) {
            toast.error("Please select at least one user");
            return;
        }

        if (window.confirm(`Are you sure you want to permanently delete ${selectedRows.size} user(s)? This action cannot be undone.`)) {
            selectedRows.forEach(userId => {
                deleteMutation.mutate(userId);
            });
        }
    };

    // Individual action handlers
    const handleDeactivate = (userId, userName) => {
        if (window.confirm(`Are you sure you want to deactivate ${userName}?`)) {
            deactivateMutation.mutate(userId);
        }
    };

    const handleActivate = (userId, userName) => {
        if (window.confirm(`Are you sure you want to activate ${userName}?`)) {
            activateMutation.mutate(userId);
        }
    };

    const handleDelete = (userId, userName) => {
        if (window.confirm(`Are you sure you want to permanently delete ${userName}? This action cannot be undone.`)) {
            deleteMutation.mutate(userId);
        }
    };

    // Get unique roles from data
    const uniqueRoles = React.useMemo(() => {
        const roles = processedData.map(user => user.role).filter(Boolean);
        return [...new Set(roles)];
    }, [processedData]);

    // Loading state
    if (isLoading) {
        return (
            <Card className="border-gray-200 shadow-sm">
                <CardContent className="p-6">
                    <div className="flex items-center justify-center h-64">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="mt-4 text-gray-600">Loading users...</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Error state
    if (isError) {
        return (
            <Card className="border-gray-200 shadow-sm">
                <CardContent className="p-6">
                    <div className="flex items-center justify-center h-64">
                        <div className="text-center">
                            <svg className="w-16 h-16 text-red-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="mt-4 text-gray-600">Error loading users</p>
                            <p className="text-sm text-gray-500 mt-1">{error?.message || 'Please try again later'}</p>
                            <Button
                                variant="outline"
                                className="mt-4 border-gray-300"
                                onClick={() => refetch()}
                            >
                                Retry
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-slate-900 p-6">
            <Card className="border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                <CardHeader className="border-b border-slate-100 dark:border-white/5 px-4 py-6 sm:px-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                        <div className="text-center sm:text-left">
                            <CardTitle className="text-4xl sm:text-3xl md:text-4xl font-bold bg-clip-text dark:from-white dark:to-slate-400  mb-2 tracking-tight capitalize">
                                User Management
                            </CardTitle>
                            <CardDescription className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium max-w-sm mx-auto sm:mx-0">
                                Manage your team members and their account permissions
                            </CardDescription>
                        </div>
                        <div className="flex items-center justify-center sm:justify-end">
                            <Button
                                size="sm"
                                className="w-full sm:w-auto h-10 gap-2 text-white bg-[#FCCF3C] hover:bg-[#ddc165] font-bold text-xs uppercase tracking-widest px-8 shadow-lg shadow-yellow-500/10"
                                onClick={() => window.location.href = "/users/new"}
                            >
                                <Plus className="h-4 w-4" />
                                <span>Add User</span>
                            </Button>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-6">
                    {/* Bulk Actions */}
                    {selectedRows.size > 0 && (
                        <div className="mb-6 p-4 bg-blue-50/50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-900/30">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                                    {selectedRows.size} user{selectedRows.size !== 1 ? 's' : ''} selected
                                </div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-400 dark:hover:bg-amber-950/20"
                                        onClick={handleBulkDeactivate}
                                        disabled={deactivateMutation.isPending}
                                    >
                                        <UserX className="mr-2 h-4 w-4" />
                                        Deactivate Selected
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="border-green-300 text-green-700 hover:bg-green-50 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-950/20"
                                        onClick={handleBulkActivate}
                                        disabled={activateMutation.isPending}
                                    >
                                        <UserCheck className="mr-2 h-4 w-4" />
                                        Activate Selected
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="border-red-300 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/20"
                                        onClick={handleBulkDelete}
                                        disabled={deleteMutation.isPending}
                                    >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete Selected
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-gray-600 dark:text-gray-400"
                                        onClick={() => setSelectedRows(new Set())}
                                    >
                                        Clear Selection
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Filters and Search */}
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
                        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                            <div className="relative flex-1 sm:flex-initial">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Search users..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-9 h-10 border-slate-200 dark:border-slate-700 focus:border-[#FCCF3C] focus:ring-[#FCCF3C] w-full sm:w-64"
                                />
                            </div>
                            <Select
                                value={selectedStatus}
                                onValueChange={setSelectedStatus}
                            >
                                <SelectTrigger className="h-10 border-slate-200 dark:border-slate-700 focus:border-[#FCCF3C] focus:ring-[#FCCF3C] w-full sm:w-40">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent className="dark:bg-slate-900 border-white/10">
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="inactive">Inactive</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select
                                value={selectedRole}
                                onValueChange={setSelectedRole}
                            >
                                <SelectTrigger className="h-10 border-slate-200 dark:border-slate-700 focus:border-[#FCCF3C] focus:ring-[#FCCF3C] w-full sm:w-40">
                                    <SelectValue placeholder="Role" />
                                </SelectTrigger>
                                <SelectContent className="dark:bg-slate-900 border-white/10">
                                    <SelectItem value="all">All Roles</SelectItem>
                                    {uniqueRoles.map((role) => (
                                        <SelectItem key={role} value={role.toLowerCase()}>
                                            {role}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Responsive Views */}
                    <div className="space-y-6">
                        {/* Mobile & Tablet Card View */}
                        <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {paginatedData.length > 0 ? (
                                paginatedData.map((user) => (
                                    <Card
                                        key={user.id}
                                        className={cn(
                                            "relative overflow-hidden border-slate-200 dark:border-white/5 transition-all duration-300 hover:shadow-md",
                                            selectedRows.has(user.id) ? 'ring-2 ring-[#FCCF3C]/50 bg-blue-50/10 dark:bg-blue-900/10' : 'bg-white/50 dark:bg-slate-900/40 backdrop-blur-sm'
                                        )}
                                    >
                                        <CardContent className="p-5">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex items-center gap-3">
                                                    <Checkbox
                                                        checked={selectedRows.has(user.id)}
                                                        onCheckedChange={(checked) => handleSelectRow(user.id, checked)}
                                                        aria-label={`Select ${user.firstName} ${user.lastName}`}
                                                        className="border-slate-300 dark:border-white/20 mt-1"
                                                    />
                                                    <Avatar className="h-12 w-12 border-2 border-white dark:border-slate-800 shadow-sm">
                                                        <AvatarImage src={user.profileImage} alt={`${user.firstName} ${user.lastName}`} />
                                                        <AvatarFallback className="bg-gradient-to-br from-[#FCCF3C] to-[#ddc165] text-white font-bold">
                                                            {`${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex flex-col">
                                                        <h3 className="font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-tight">
                                                            {user.firstName} {user.lastName}
                                                        </h3>
                                                        <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">{user.department}</p>
                                                    </div>
                                                </div>
                                                <Badge
                                                    variant="soft"
                                                    color={user.status === 'active' ? 'success' :
                                                        user.status === 'inactive' ? 'destructive' : 'warning'}
                                                    className="capitalize font-black text-[9px] dark:text-green-500 dark:bg-green-500/10"
                                                >
                                                    {user.status}
                                                </Badge>
                                            </div>

                                            <div className="space-y-3 mb-5">
                                                <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                                                    <span className="truncate">{user.email}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-xs">                                                    <Badge
                                                    variant="outline"
                                                    className="dark:bg-slate-900/40 dark:border-white/10 dark:text-slate-300 font-bold uppercase text-[9px] tracking-widest px-2 py-0"
                                                >
                                                    {user.role}
                                                </Badge>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-white/5">
                                                <span className="text-[10px] text-slate-400 font-medium">ARCH. ID: {user.id.slice(-8)}</span>
                                                <div className="flex items-center gap-1">
                                                    {user.status === 'active' ? (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-slate-600 hover:text-amber-700 hover:bg-amber-50 dark:text-slate-500 dark:hover:text-amber-400 dark:hover:bg-amber-950/20 transition-colors"
                                                            onClick={() => handleDeactivate(user.id, `${user.firstName} ${user.lastName}`)}
                                                            title="Deactivate"
                                                        >
                                                            <UserX className="h-4 w-4" />
                                                        </Button>
                                                    ) : (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-slate-600 hover:text-green-700 hover:bg-green-50 dark:text-slate-500 dark:hover:text-green-400 dark:hover:bg-green-950/20 transition-colors"
                                                            onClick={() => handleActivate(user.id, `${user.firstName} ${user.lastName}`)}
                                                            title="Activate"
                                                        >
                                                            <UserCheck className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-slate-600 hover:text-red-700 hover:bg-red-50 dark:text-slate-500 dark:hover:text-red-400 dark:hover:bg-red-950/20 transition-colors"
                                                        onClick={() => handleDelete(user.id, `${user.firstName} ${user.lastName}`)}
                                                        title="Delete Permanently"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))
                            ) : (
                                <div className="col-span-full h-48 flex flex-col items-center justify-center text-slate-500 bg-white/50 dark:bg-slate-900/40 rounded-2xl border border-dashed border-slate-200 dark:border-white/10">
                                    <Search className="w-10 h-10 text-slate-300 mb-2" />
                                    <p className="font-medium">No members match your search.</p>
                                </div>
                            )}
                        </div>

                        {/* Laptop & Desktop Table View */}
                        <div className="hidden lg:block rounded-lg border border-slate-200 dark:border-white/5 overflow-hidden">
                            <Table>
                                <TableHeader className="bg-slate-50/50 dark:bg-slate-900/80 backdrop-blur-sm">
                                    <TableRow className="border-slate-200 dark:border-white/5 hover:bg-transparent">
                                        <TableHead className="text-slate-600 dark:text-slate-400 font-bold uppercase text-[10px] tracking-widest py-3 w-12">
                                            <Checkbox
                                                checked={isAllSelected}
                                                indeterminate={isSomeSelected}
                                                onCheckedChange={handleSelectAll}
                                                aria-label="Select all"
                                                className="border-slate-300 dark:border-white/20"
                                            />
                                        </TableHead>
                                        <TableHead className="text-slate-600 dark:text-slate-400 font-bold uppercase text-[10px] tracking-widest py-3">User</TableHead>
                                        <TableHead className="text-slate-600 dark:text-slate-400 font-bold uppercase text-[10px] tracking-widest py-3">Email</TableHead>
                                        <TableHead className="text-slate-600 dark:text-slate-400 font-bold uppercase text-[10px] tracking-widest py-3">Role</TableHead>
                                        <TableHead className="text-slate-600 dark:text-slate-400 font-bold uppercase text-[10px] tracking-widest py-3">Status</TableHead>
                                        <TableHead className="text-slate-600 dark:text-slate-400 font-bold uppercase text-[10px] tracking-widest py-3 text-center">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody className="bg-white dark:bg-slate-900/40">
                                    {paginatedData.length > 0 ? (
                                        paginatedData.map((user) => (
                                            <TableRow
                                                key={user.id}
                                                className={cn(
                                                    "group border-slate-100 dark:border-white/5 transition-all duration-300 hover:bg-slate-50 dark:hover:bg-white/[0.02]",
                                                    selectedRows.has(user.id) ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''
                                                )}
                                            >
                                                <TableCell>
                                                    <Checkbox
                                                        checked={selectedRows.has(user.id)}
                                                        onCheckedChange={(checked) => handleSelectRow(user.id, checked)}
                                                        aria-label={`Select ${user.firstName} ${user.lastName}`}
                                                        className="border-slate-300 dark:border-white/20"
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-9 w-9 border border-slate-200 dark:border-white/10 shadow-sm">
                                                            <AvatarImage src={user.profileImage} alt={`${user.firstName} ${user.lastName}`} />
                                                            <AvatarFallback className="bg-gradient-to-br from-yellow-500 to-yellow-300 text-white font-bold text-xs uppercase">
                                                                {`${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-[#FCCF3C] dark:group-hover:text-[#FCCF3C] transition-colors tracking-tight">
                                                                {user.firstName} {user.lastName}
                                                            </span>
                                                            <span className="text-[11px] text-slate-500 dark:text-slate-500 font-medium">{user.department}</span>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-slate-600 dark:text-slate-400 text-sm">
                                                    {user.email}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant="outline"
                                                        color={
                                                            user.roleKey === 'admin' ? 'destructive' :
                                                                user.roleKey === 'manager' ? 'warning' :
                                                                    user.roleKey?.includes('d.') ? 'info' : 'default'
                                                        }
                                                        className="dark:bg-slate-900/40 dark:border-white/10 dark:text-slate-300 font-bold uppercase text-[10px] tracking-widest"
                                                    >
                                                        {user.role}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant="soft"
                                                        color={user.status === 'active' ? 'success' :
                                                            user.status === 'inactive' ? 'destructive' : 'warning'}
                                                        className="capitalize font-bold text-[10px] dark:text-green-500 dark:bg-green-500/10 dark:border-green-500/10"
                                                    >
                                                        {user.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <div className="flex items-center justify-center gap-1">
                                                        {user.status === 'active' ? (
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-slate-600 hover:text-amber-700 hover:bg-amber-50 dark:text-slate-500 dark:hover:text-amber-400 dark:hover:bg-amber-950/20 transition-colors"
                                                                onClick={() => handleDeactivate(user.id, `${user.firstName} ${user.lastName}`)}
                                                                title="Deactivate"
                                                            >
                                                                <UserX className="h-4 w-4" />
                                                            </Button>
                                                        ) : (
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-slate-600 hover:text-green-700 hover:bg-green-50 dark:text-slate-500 dark:hover:text-green-400 dark:hover:bg-green-950/20 transition-colors"
                                                                onClick={() => handleActivate(user.id, `${user.firstName} ${user.lastName}`)}
                                                                title="Activate"
                                                            >
                                                                <UserCheck className="h-4 w-4" />
                                                            </Button>
                                                        )}

                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-slate-600 hover:text-red-700 hover:bg-red-50 dark:text-slate-500 dark:hover:text-red-400 dark:hover:bg-red-950/20 transition-colors"
                                                            onClick={() => handleDelete(user.id, `${user.firstName} ${user.lastName}`)}
                                                            title="Delete Permanently"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-48 text-center text-slate-500">
                                                <div className="flex flex-col items-center justify-center gap-3">
                                                    <Search className="w-12 h-12 text-slate-300 mb-2" />
                                                    <p className="font-medium text-slate-700 dark:text-slate-300">No users found.</p>
                                                    {(searchTerm || selectedStatus !== 'all' || selectedRole !== 'all') && (
                                                        <Button
                                                            variant="link"
                                                            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                                                            onClick={() => {
                                                                setSearchTerm('');
                                                                setSelectedStatus('all');
                                                                setSelectedRole('all');
                                                            }}
                                                        >
                                                            Clear all filters
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>

                    {/* Pagination */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 pt-6 border-t border-slate-100 dark:border-white/5">
                        <div className="text-[11px] font-black text-slate-500 dark:text-slate-500 uppercase tracking-widest whitespace-nowrap">
                            {selectedRows.size} of {filteredData.length} user{filteredData.length !== 1 ? 's' : ''} selected.
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-500 dark:text-slate-500 uppercase tracking-wider mr-4">
                                <span>Rows:</span>
                                <Select
                                    value={`${rowsPerPage}`}
                                    onValueChange={(value) => {
                                        setRowsPerPage(Number(value));
                                        setCurrentPage(1);
                                    }}
                                >
                                    <SelectTrigger className="h-8 w-16 border-slate-200 dark:border-slate-700 bg-transparent">
                                        <SelectValue placeholder={rowsPerPage} />
                                    </SelectTrigger>
                                    <SelectContent className="dark:bg-slate-900 border-white/10">
                                        {[10, 20, 30, 40, 50].map((pageSize) => (
                                            <SelectItem key={pageSize} value={`${pageSize}`}>
                                                {pageSize}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex items-center gap-3">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                    className="h-9 w-9 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-white/10 transition-colors"
                                >
                                    <ChevronLeft className="h-5 w-5" />
                                </Button>

                                <span className="text-[11px] font-black text-slate-900 dark:text-slate-300 uppercase tracking-tighter">
                                    Page {currentPage} / {totalPages}
                                </span>

                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage === totalPages || totalPages === 0}
                                    className="h-9 w-9 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-white/10 transition-colors"
                                >
                                    <ChevronRight className="h-5 w-5" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export default UserManagementTable;