"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { Icon } from "@iconify/react";
import toast from "react-hot-toast";
import {
    getControlChecklist,
    toggleControlChecklistItem,
    confirmProjectFinished,
} from "@/config/functions/controlChecklist";

const ControlTab = ({ projectId, project }) => {
    const { data: session } = useSession();
    const router = useRouter();
    const queryClient = useQueryClient();
    const userRole = session?.user?.role;

    const [confirmingFinish, setConfirmingFinish] = useState(false);
    const [togglingItem, setTogglingItem] = useState(null);

    // ── Fetch Checklist ──────────────────────────────────────────────────────
    const {
        data: checklistData,
        isLoading,
        error,
    } = useQuery({
        queryKey: ["controlChecklist", projectId],
        queryFn: () => getControlChecklist(projectId),
        enabled: !!projectId,
        staleTime: 1000 * 30,
    });

    const sections = checklistData?.data?.sections ?? [];
    const controlStatus = checklistData?.data?.controlStatus ?? project?.controlStatus ?? "pending";

    // Compute total item counts for the confirm button
    const totalItems = sections.reduce((acc, s) => acc + s.items.length, 0);
    const checkedItems = sections.reduce(
        (acc, s) => acc + s.items.filter((i) => i.checked).length,
        0
    );
    const allChecked = totalItems > 0 && checkedItems === totalItems;
    const isConfirmed = controlStatus === "confirmed";

    // ── Toggle Mutation ──────────────────────────────────────────────────────
    const toggleMutation = useMutation({
        mutationFn: ({ itemId, sectionId, label, checked }) =>
            toggleControlChecklistItem(projectId, { itemId, sectionId, label, checked }),
        onMutate: ({ itemId }) => setTogglingItem(itemId),
        onSuccess: () => {
            queryClient.invalidateQueries(["controlChecklist", projectId]);
        },
        onError: (err) => {
            toast.error(err?.message || "Failed to update checklist item.");
        },
        onSettled: () => setTogglingItem(null),
    });

    // ── Confirm Mutation ─────────────────────────────────────────────────────
    const handleConfirmFinished = async () => {
        if (!allChecked || isConfirmed) return;
        setConfirmingFinish(true);
        try {
            const res = await confirmProjectFinished(projectId);
            if (res?.status === "success") {
                toast.success("Project confirmed as finished!");
                queryClient.invalidateQueries(["controlChecklist", projectId]);
                queryClient.invalidateQueries(["project", projectId]);
                router.push('/projects');
            } else {
                toast.error(res?.message || "Failed to confirm project.");
            }
        } catch {
            toast.error("An unexpected error occurred.");
        } finally {
            setConfirmingFinish(false);
        }
    };

    // ── Loading ──────────────────────────────────────────────────────────────
    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-16">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">Loading checklist…</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                <Icon icon="lucide:alert-circle" className="w-8 h-8 text-red-500 mx-auto mb-2" />
                <p className="text-red-700 font-medium">Failed to load control checklist.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">

            {/* ── Header banner ─────────────────────────────────────────────── */}
            <div className={`rounded-xl border p-5 flex items-center justify-between ${isConfirmed
                ? "bg-green-50 border-green-200"
                : "bg-violet-50 border-violet-100"
                }`}>
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isConfirmed ? "bg-green-100" : "bg-violet-100"
                        }`}>
                        <Icon
                            icon={isConfirmed ? "lucide:check-circle-2" : "lucide:clipboard-check"}
                            className={`w-5 h-5 ${isConfirmed ? "text-green-600" : "text-violet-600"}`}
                        />
                    </div>
                    <div>
                        <h2 className="text-base font-bold text-gray-900">Control Checklist</h2>
                        <p className={`text-xs mt-0.5 ${isConfirmed ? "text-green-600" : "text-gray-500"}`}>
                            {isConfirmed
                                ? "Project has been confirmed as finished."
                                : `${checkedItems} of ${totalItems} items completed`}
                        </p>
                    </div>
                </div>

                {/* Progress pill */}
                {!isConfirmed && (
                    <div className="flex items-center gap-2">
                        <div className="w-28 h-2 bg-violet-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-violet-500 rounded-full transition-all duration-300"
                                style={{ width: totalItems ? `${(checkedItems / totalItems) * 100}%` : "0%" }}
                            />
                        </div>
                        <span className="text-xs font-semibold text-violet-700">
                            {totalItems ? Math.round((checkedItems / totalItems) * 100) : 0}%
                        </span>
                    </div>
                )}
            </div>

            {/* ── Checklist Sections ────────────────────────────────────────── */}
            <div className="space-y-4">
                {sections.map((section) => (
                    <div
                        key={section.id}
                        className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm"
                    >
                        {/* Section header */}
                        <div className="px-5 py-3.5 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
                            <Icon icon="lucide:list-checks" className="w-4 h-4 text-gray-500" />
                            <h3 className="text-sm font-semibold text-gray-800">{section.title}</h3>
                            <span className="ml-auto text-xs text-gray-400">
                                {section.items.filter((i) => i.checked).length}/{section.items.length}
                            </span>
                        </div>

                        {/* Items */}
                        <div className="divide-y divide-gray-100">
                            {section.items.map((item) => {
                                const isToggling = togglingItem === item.id;
                                const canToggle = userRole === "c.m" && !isConfirmed;

                                return (
                                    <div
                                        key={item.id}
                                        className={`flex items-start gap-4 px-5 py-4 transition-colors ${canToggle ? "hover:bg-gray-50 cursor-pointer" : ""
                                            }`}
                                        onClick={() => {
                                            if (!canToggle || isToggling) return;
                                            toggleMutation.mutate({
                                                itemId: item.id,
                                                sectionId: section.id,
                                                label: item.label,
                                                checked: !item.checked,
                                            });
                                        }}
                                    >
                                        {/* Checkbox */}
                                        <div className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${item.checked
                                            ? "bg-violet-600 border-violet-600"
                                            : "border-gray-300 bg-white"
                                            } ${isToggling ? "opacity-50" : ""}`}>
                                            {item.checked && (
                                                <Icon icon="lucide:check" className="w-3 h-3 text-white" />
                                            )}
                                            {isToggling && (
                                                <Icon icon="lucide:loader-2" className="w-3 h-3 text-violet-400 animate-spin" />
                                            )}
                                        </div>

                                        {/* Label + who completed */}
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm ${item.checked ? "text-gray-500 line-through" : "text-gray-800"}`}>
                                                {item.label}
                                            </p>
                                            {/* Show who completed it — for superadmin or if checked */}
                                            {item.checked && item.completedBy && (
                                                <p className="text-xs text-violet-500 mt-1 flex items-center gap-1">
                                                    <Icon icon="lucide:user-check" className="w-3 h-3" />
                                                    Completed by {item.completedBy.firstName} {item.completedBy.lastName}
                                                    {item.completedAt && (
                                                        <span className="text-gray-400 ml-1">
                                                            · {new Date(item.completedAt).toLocaleDateString()}
                                                        </span>
                                                    )}
                                                </p>
                                            )}
                                        </div>

                                        {/* Status indicator */}
                                        {item.checked && (
                                            <Icon
                                                icon="lucide:check-circle-2"
                                                className="w-4 h-4 text-violet-500 flex-shrink-0 mt-0.5"
                                            />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Confirm Button / Confirmed Badge ─────────────────────────── */}
            {userRole === "c.m" && (
                <div className="pt-2">
                    {isConfirmed ? (
                        <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-5 py-4">
                            <Icon icon="lucide:badge-check" className="w-6 h-6 text-green-600" />
                            <div>
                                <p className="font-semibold text-green-800 text-sm">Project Confirmed as Finished</p>
                                <p className="text-xs text-green-600">All checklist items have been verified.</p>
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={handleConfirmFinished}
                            disabled={!allChecked || confirmingFinish}
                            className={`w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2.5 transition-all active:scale-95 shadow-sm ${allChecked && !confirmingFinish
                                ? "bg-violet-600 hover:bg-violet-700 text-white"
                                : "bg-gray-100 text-gray-400 cursor-not-allowed shadow-none"
                                }`}
                        >
                            {confirmingFinish ? (
                                <Icon icon="lucide:loader-2" className="w-4 h-4 animate-spin" />
                            ) : (
                                <Icon icon="lucide:flag-triangle-right" className="w-4 h-4" />
                            )}
                            {confirmingFinish
                                ? "Confirming…"
                                : allChecked
                                    ? "Confirm Project Finished"
                                    : `Complete all items first (${checkedItems}/${totalItems})`}
                        </button>
                    )}
                </div>
            )}

            {/* Super Admin read-only notice */}
            {userRole === "superadmin" && !isConfirmed && (
                <p className="text-xs text-center text-gray-400">
                    <Icon icon="lucide:eye" className="inline w-3 h-3 mr-1" />
                    Viewing as Super Admin — read only
                </p>
            )}
        </div>
    );
};

export default ControlTab;
