"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
    getUnreadNotifications,
    markNotificationRead,
    markAllNotificationsRead,
} from "@/config/functions/notification";

const TYPE_ICONS = {
    project_handover: "🚀",
    phase_complete: "✅",
    action_required: "⚡",
    info: "ℹ️",
};

const TYPE_COLORS = {
    project_handover: "bg-blue-50 border-blue-200",
    phase_complete: "bg-green-50 border-green-200",
    action_required: "bg-orange-50 border-orange-200",
    info: "bg-gray-50 border-gray-200",
};

/**
 * Plays a short, pleasant notification chime using the Web Audio API.
 * No external file needed.
 */
function playNotificationSound() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();

        const playNote = (freq, startTime, duration) => {
            const oscillator = ctx.createOscillator();
            const gain = ctx.createGain();
            oscillator.connect(gain);
            gain.connect(ctx.destination);

            oscillator.type = "sine";
            oscillator.frequency.setValueAtTime(freq, startTime);

            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(0.3, startTime + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

            oscillator.start(startTime);
            oscillator.stop(startTime + duration);
        };

        const now = ctx.currentTime;
        playNote(523.25, now, 0.25);        // C5
        playNote(659.25, now + 0.15, 0.25); // E5
        playNote(783.99, now + 0.3, 0.4);  // G5
    } catch (e) {
        // Audio not supported — silent fail
    }
}

import toast from 'react-hot-toast';

const POLL_INTERVAL = 3000; // 3 seconds

export default function NotificationBell() {
    const { data: session } = useSession();
    const router = useRouter();
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // 🛠️ Debugging & Robust Tracking
    const seenIdsRef = useRef(new Set());
    const isFirstFetchRef = useRef(true);
    const dropdownRef = useRef(null);
    const prevCountRef = useRef(0);

    // Initial Debug Log
    useEffect(() => {
        if (session?.user) {
            console.log("🔔 [Notification Bell] User logged in:", session.user.username);
            console.log("🎭 [Notification Bell] User Role:", session.user.role);
        }
    }, [session]);

    const fetchUnread = useCallback(async () => {
        if (!session?.user) return;

        try {
            const res = await getUnreadNotifications();
            if (res?.data?.notifications) {
                const newNotifs = res.data.notifications;

                // Track which ones are actually NEW (not seen before)
                let hasRealNew = false;
                let latestOne = null;

                newNotifs.forEach(n => {
                    if (!seenIdsRef.current.has(n._id)) {
                        seenIdsRef.current.add(n._id);
                        if (!isFirstFetchRef.current) {
                            hasRealNew = true;
                            latestOne = n;
                        }
                    }
                });

                // 🚀 If a real new notification arrived after initial load
                if (hasRealNew && latestOne) {
                    console.log("📥 [Notification] NEW ALERT:", latestOne.message);
                    playNotificationSound();

                    // Toast with fallback
                    toast.custom((t) => (
                        <div
                            onClick={() => {
                                toast.dismiss(t.id);
                                if (latestOne.projectId?._id) router.push(`/projects/${latestOne.projectId._id}`);
                            }}
                            className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white shadow-2xl rounded-xl pointer-events-auto flex ring-1 ring-black ring-opacity-5 border-l-4 border-primary cursor-pointer transition-all hover:scale-[1.02]`}
                        >
                            <div className="flex-1 w-0 p-4">
                                <div className="flex items-start">
                                    <div className="flex-shrink-0 pt-0.5 text-2xl">
                                        {TYPE_ICONS[latestOne.type] || "🔔"}
                                    </div>
                                    <div className="ml-3 flex-1">
                                        <p className="text-sm font-bold text-gray-900 truncate">
                                            {latestOne.projectId?.title || "New Project Update"}
                                        </p>
                                        <p className="mt-1 text-xs text-gray-600 line-clamp-2">
                                            {latestOne.message}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ), { duration: 6000, position: 'top-right' });
                }

                setNotifications(newNotifs);
                prevCountRef.current = newNotifs.length;
                isFirstFetchRef.current = false;
            }
        } catch (err) {
            console.error("❌ [Notification Bell] Fetch Error:", err);
        }
    }, [session, router]);

    // Initial fetch + polling
    useEffect(() => {
        if (session) {
            fetchUnread();
            const interval = setInterval(fetchUnread, POLL_INTERVAL);
            return () => clearInterval(interval);
        }
    }, [session, fetchUnread]);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClick = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    const handleMarkRead = async (notifId) => {
        await markNotificationRead(notifId);
        setNotifications((prev) => prev.filter((n) => n._id !== notifId));
        prevCountRef.current = Math.max(0, prevCountRef.current - 1);
    };

    const handleMarkAllRead = async () => {
        await markAllNotificationsRead();
        setNotifications([]);
        prevCountRef.current = 0;
    };

    const handleNotifClick = async (notif) => {
        await handleMarkRead(notif._id);
        if (notif.projectId?.slug) {
            router.push(`/projects/${notif.projectId._id}`);
        }
        setIsOpen(false);
    };

    const count = notifications.length;

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell button */}
            <button
                onClick={() => setIsOpen((o) => !o)}
                className="relative p-2 rounded-full hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30"
                aria-label={`Notifications${count > 0 ? ` (${count} unread)` : ""}`}
                id="notification-bell-btn"
            >
                <svg
                    className="w-5 h-5 text-gray-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                </svg>

                {/* Badge */}
                {count > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 text-[10px] font-bold bg-red-500 text-white rounded-full flex items-center justify-center animate-pulse">
                        {count > 9 ? "9+" : count}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
                        <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-900 text-sm">Notifications</span>
                            {count > 0 && (
                                <span className="px-2 py-0.5 text-xs bg-primary text-white rounded-full">
                                    {count} new
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => {
                                    playNotificationSound();
                                    toast.success("Sound & Toast Test! System is live.");
                                }}
                                className="text-[10px] bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded text-gray-700 transition-colors"
                            >
                                Test Alert
                            </button>
                            {count > 0 && (
                                <button
                                    onClick={handleMarkAllRead}
                                    className="text-xs text-primary hover:text-primary/80 font-medium transition-colors"
                                >
                                    Mark all read
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Notification list */}
                    <div className="max-h-[420px] overflow-y-auto divide-y divide-gray-50">
                        {count === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                                <svg className="w-10 h-10 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"
                                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                </svg>
                                <p className="text-sm">You're all caught up!</p>
                            </div>
                        ) : (
                            notifications.map((notif) => (
                                <div
                                    key={notif._id}
                                    className={`flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors border-l-4 ${TYPE_COLORS[notif.type] || TYPE_COLORS.info}`}
                                    onClick={() => handleNotifClick(notif)}
                                >
                                    {/* Icon */}
                                    <span className="text-xl mt-0.5 flex-shrink-0">
                                        {TYPE_ICONS[notif.type] || "🔔"}
                                    </span>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-gray-800 leading-snug">{notif.message}</p>
                                        {notif.projectId?.title && (
                                            <p className="text-xs font-medium text-primary mt-0.5 truncate">
                                                📁 {notif.projectId.title}
                                            </p>
                                        )}
                                        <p className="text-xs text-gray-400 mt-1">
                                            {new Date(notif.createdAt).toLocaleString("en-US", {
                                                month: "short", day: "numeric",
                                                hour: "2-digit", minute: "2-digit",
                                            })}
                                        </p>
                                    </div>

                                    {/* Dismiss */}
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleMarkRead(notif._id); }}
                                        className="flex-shrink-0 p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors"
                                        aria-label="Dismiss"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    {count > 0 && (
                        <div className="px-4 py-2 border-t border-gray-100 bg-gray-50 text-center">
                            <p className="text-xs text-gray-500">Click a notification to open the project</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
