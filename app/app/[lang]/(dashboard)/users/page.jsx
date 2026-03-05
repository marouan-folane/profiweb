"use client";
import * as React from "react";

import { Search, Filter, Plus, UserX, UserCheck, Trash2, ChevronDown, MoreHorizontal, ChevronLeft, ChevronRight } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getAllUsers, deactivateUserById, activateUserById, deleteUserPermanently } from "@/config/functions/admin";

// Sample data removed

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
            const mappedDept = roleDeptMapping[roleKey] || user.department || 'Not Assigned';

            return {
                id: user._id || user.id,
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                email: user.email || 'No email',
                role: roleKey,
                fullRoleName: roleDeptMapping[roleKey] || user.role || 'User',
                department: mappedDept,
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

    // Get unique roles from data for mapping
    const uniqueRoleOptions = React.useMemo(() => {
        const rolesMap = new Map();
        processedData.forEach(user => {
            if (user.role && !rolesMap.has(user.role)) {
                rolesMap.set(user.role, user.fullRoleName);
            }
        });
        return Array.from(rolesMap.entries()).map(([value, label]) => ({ value, label }));
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
                                className="w-full sm:w-auto h-11 gap-2 text-white bg-[#FCCF3C] hover:bg-[#ddc165] font-bold text-xs uppercase tracking-widest px-8 shadow-lg shadow-yellow-500/10"
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
                                className="pl-9 h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500 w-full sm:w-64"
                            />
                        </div>
                        <Select
                            value={selectedStatus}
                            onValueChange={setSelectedStatus}
                        >
                            <SelectTrigger className="h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500 w-full sm:w-40">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
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
                            <SelectTrigger className="h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500 w-full sm:w-40">
                                <SelectValue placeholder="Role" />
                            </SelectTrigger>
                            <SelectContent>
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

                {/* Table */}
                <div className="rounded-lg border border-gray-200 overflow-hidden">
                    <Table>
                        <TableHeader className="bg-gray-50">
                            <TableRow className="border-gray-200 hover:bg-gray-50">
                                <TableHead className="text-gray-700 font-semibold py-3 w-12">
                                    <Checkbox
                                        checked={isAllSelected}
                                        indeterminate={isSomeSelected}
                                        onCheckedChange={handleSelectAll}
                                        aria-label="Select all"
                                        className="border-gray-300"
                                    />
                                </TableHead>
                                <TableHead className="text-gray-700 font-semibold py-3">User</TableHead>
                                <TableHead className="text-gray-700 font-semibold py-3">Email</TableHead>
                                <TableHead className="text-gray-700 font-semibold py-3">Role</TableHead>
                                <TableHead className="text-gray-700 font-semibold py-3">Status</TableHead>
                                <TableHead className="text-gray-700 font-semibold py-3 text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedData.length > 0 ? (
                                paginatedData.map((user) => (
                                    <TableRow
                                        key={user.id}
                                        className={`border-gray-100 hover:bg-gray-50/50 transition-colors ${selectedRows.has(user.id) ? 'bg-blue-50/30' : ''
                                            }`}
                                    >
                                        <TableCell>
                                            <Checkbox
                                                checked={selectedRows.has(user.id)}
                                                onCheckedChange={(checked) => handleSelectRow(user.id, checked)}
                                                aria-label={`Select ${user.firstName} ${user.lastName}`}
                                                className="border-gray-300"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-9 w-9 border border-gray-200">
                                                    <AvatarImage src={user.profileImage} alt={`${user.firstName} ${user.lastName}`} />
                                                    <AvatarFallback className="bg-gray-100 text-gray-600">
                                                        {`${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-gray-900">
                                                        {user.firstName} {user.lastName}
                                                    </span>
                                                    <span className="text-sm text-gray-500">{user.department}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-gray-600">
                                            {user.email}
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant="outline"
                                                color={
                                                    user.role === 'Admin' ? 'destructive' :
                                                        user.role === 'Manager' ? 'warning' :
                                                            user.role === 'D.T' ? 'info' :
                                                                user.role === 'D.I' ? 'success' :
                                                                    user.role === 'D.C' ? 'primary' : 'default'
                                                }
                                                className="font-medium"
                                            >
                                                {user.role}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant="soft"
                                                color={user.status === 'active' ? 'success' :
                                                    user.status === 'inactive' ? 'destructive' : 'warning'}
                                                className="capitalize font-medium"
                                            >
                                                {user.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        className="h-8 w-8 p-0 hover:bg-gray-100"
                                                    >
                                                        <span className="sr-only">Open menu</span>
                                                        <MoreHorizontal className="h-4 w-4 text-gray-500" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-48">
                                                    <DropdownMenuLabel className="text-gray-700">Actions</DropdownMenuLabel>

                                                    <DropdownMenuSeparator />

                                                    {user.status === 'active' ? (
                                                        <DropdownMenuItem
                                                            className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 cursor-pointer"
                                                            onClick={() => handleDeactivate(user.id, `${user.firstName} ${user.lastName}`)}
                                                        >
                                                            <UserX className="w-4 h-4 mr-2" />
                                                            Deactivate
                                                        </DropdownMenuItem>
                                                    ) : (
                                                        <DropdownMenuItem
                                                            className="text-green-600 hover:text-green-700 hover:bg-green-50 cursor-pointer"
                                                            onClick={() => handleActivate(user.id, `${user.firstName} ${user.lastName}`)}
                                                        >
                                                            <UserCheck className="w-4 h-4 mr-2" />
                                                            Activate
                                                        </DropdownMenuItem>
                                                    )}

                                                    <DropdownMenuItem
                                                        className="text-red-600 hover:text-red-700 hover:bg-red-50 cursor-pointer"
                                                        onClick={() => handleDelete(user.id, `${user.firstName} ${user.lastName}`)}
                                                    >
                                                        <Trash2 className="w-4 h-4 mr-2" />
                                                        Delete Permanently
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-32 text-center text-gray-500">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                                            </svg>
                                            <p>No users found.</p>
                                            {(searchTerm || selectedStatus !== 'all' || selectedRole !== 'all') && (
                                                <Button
                                                    variant="link"
                                                    className="text-blue-600 hover:text-blue-700"
                                                    onClick={() => {
                                                        setSearchTerm('');
                                                        setSelectedStatus('all');
                                                        setSelectedRole('all');
                                                    }}
                                                >
                                                    Clear filters
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-gray-100">
                    <div className="text-sm text-gray-600 whitespace-nowrap">
                        {selectedRows.size} of {filteredData.length} user(s) selected.
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