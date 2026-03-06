"use client";

import { useState, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { useMutation } from "@tanstack/react-query";
import { uploadFilesClient } from "@/config/functions/upload";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

const Page = () => {
    const params = useParams();
    const router = useRouter();
    const { projectId } = params;
    const fileInputRef = useRef(null);

    const [files, setFiles] = useState([]);
    const [dragActive, setDragActive] = useState(false);
    const [errorMessage, setErrorMessage] = useState(null);
    const [windowDimensions, setWindowDimensions] = useState({
        width: 0,
        height: 0
    });
    const [uploadInfo, setUploadInfo] = useState({
        projectId: null,
        projectName: null,
        expiresAt: null,
        isValid: false
    });
    const [isLoading, setIsLoading] = useState(true);

    // Initialize upload info for client link
    useEffect(() => {
        if (projectId) {
            setUploadInfo({
                projectId: projectId,
                projectName: 'Your Project',
                isValid: true,
                timeRemaining: 999999 // static link doesn't expire in UI
            });
            setErrorMessage(null);
        } else {
            setErrorMessage('🔒 Invalid project link.');
            setUploadInfo({ isValid: false, error: 'No project ID' });
        }
        setIsLoading(false);
    }, [projectId]);

    // Get window dimensions for confetti
    useEffect(() => {
        const updateDimensions = () => {
            setWindowDimensions({
                width: window.innerWidth,
                height: window.innerHeight
            });
        };

        updateDimensions();
        window.addEventListener('resize', updateDimensions);

        return () => window.removeEventListener('resize', updateDimensions);
    }, []);

    // React Query mutation for file upload
    const uploadMutation = useMutation({
        mutationFn: () => {
            return uploadFilesClient(files, projectId);
        },
        onSuccess: (data) => {
            console.log("Upload successful:", data);
            setErrorMessage(null);

            setTimeout(() => {
                setFiles([]);
            }, 1000);
        },
        onError: (error) => {
            console.error("Upload error:", error);

            let userMessage = 'An unexpected error occurred. Please try again.';

            if (error?.message) {
                userMessage = error.message;
            } else if (error?.error) {
                userMessage = error.error;
            } else if (typeof error === 'string') {
                userMessage = error;
            }

            if (userMessage.includes('expired') || error?.status === 401) {
                if (userMessage.toLowerCase().includes('expired')) {
                    userMessage = '🔒 Your upload link has expired. Please request a new link from your project manager.';
                } else {
                    userMessage = '🔒 Upload access denied. Your link might be invalid or for a different project.';
                }
            } else if (userMessage.includes('Network Error') || userMessage.includes('network')) {
                userMessage = '🌐 Network error. Please check your internet connection and try again.';
            } else if (userMessage.includes('413') || userMessage.includes('too large')) {
                userMessage = '📦 Files are too large. Please ensure each file is under 100MB.';
            } else if (userMessage.includes('401') || userMessage.includes('Unauthorized')) {
                userMessage = '🔒 Authentication failed. Your upload link may have expired.';
            } else if (userMessage.includes('404')) {
                userMessage = '❌ Upload endpoint not found. Please contact support.';
            }

            setErrorMessage(userMessage);
        }
    });

    const isUploading = uploadMutation.isPending;

    // File validation constants
    const MAX_FILES = 50;
    const ALLOWED_IMAGE_TYPES = [
        'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
        'image/svg+xml', 'image/bmp', 'image/avif', 'image/heic', 'image/heif',
        'image/x-icon', 'image/tiff', 'image/apng', 'image/vnd.adobe.photoshop',
        'image/x-xcf', 'image/vnd.microsoft.icon', 'image/x-raw'
    ];
    const ALLOWED_DOCUMENT_TYPES = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain',
        'application/rtf',
        'application/postscript',
        'application/illustrator',
        'application/vnd.adobe.photoshop'
    ];

    const ALLOWED_EXTENSIONS = [
        '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.tif', '.webp', '.avif',
        '.heic', '.heif', '.ico', '.svg', '.ai', '.eps', '.pdf', '.apng', '.raw',
        '.cr2', '.cr3', '.nef', '.arw', '.orf', '.dng', '.psd', '.xcf', '.hdr',
        '.exr', '.dds'
    ];

    const isValidFileType = (file) => {
        const extension = '.' + file.name.split('.').pop().toLowerCase();
        return (
            ALLOWED_IMAGE_TYPES.includes(file.type) ||
            ALLOWED_DOCUMENT_TYPES.includes(file.type) ||
            ALLOWED_EXTENSIONS.includes(extension)
        );
    };

    const validateFiles = (newFiles) => {
        const totalFiles = files.length + newFiles.length;

        if (totalFiles > MAX_FILES) {
            setErrorMessage(`You can only upload a maximum of ${MAX_FILES} files. You're trying to add ${newFiles.length} files, but you already have ${files.length} selected.`);
            return [];
        }

        const invalidFiles = newFiles.filter(file => !isValidFileType(file));
        if (invalidFiles.length > 0) {
            const invalidNames = invalidFiles.slice(0, 3).map(f => f.name).join(', ');
            const moreCount = invalidFiles.length > 3 ? ` and ${invalidFiles.length - 3} more` : '';
            setErrorMessage(`🚫 Invalid file type detected. Please upload supported images, documents, or design files.\n\nInvalid files: ${invalidNames}${moreCount}`);
            return [];
        }

        return newFiles;
    };

    const handleFileChange = (e) => {
        const selectedFiles = Array.from(e.target.files);
        const validFiles = validateFiles(selectedFiles);
        if (validFiles.length > 0) {
            setErrorMessage(null);
            setFiles(prev => [...prev, ...validFiles]);
        }
    };

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        const droppedFiles = Array.from(e.dataTransfer.files);
        const validFiles = validateFiles(droppedFiles);
        if (validFiles.length > 0) {
            setErrorMessage(null);
            setFiles(prev => [...prev, ...validFiles]);
        }
    };

    const removeFile = (index) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const getFileIcon = (file) => {
        const type = file.type;
        const extension = file.name.split('.').pop().toLowerCase();

        if (type.includes('pdf')) return "vscode-icons:file-type-pdf2";
        if (type.includes('word') || extension === 'doc' || extension === 'docx')
            return "vscode-icons:file-type-word";
        if (type.includes('excel') || extension === 'xls' || extension === 'xlsx')
            return "vscode-icons:file-type-excel";
        if (type.includes('powerpoint') || extension === 'ppt' || extension === 'pptx')
            return "vscode-icons:file-type-powerpoint";
        if (extension === 'psd') return "vscode-icons:file-type-photoshop";
        if (extension === 'ai' || extension === 'eps') return "vscode-icons:file-type-ai";
        if (['raw', 'cr2', 'cr3', 'nef', 'arw', 'orf', 'dng'].includes(extension)) return "carbon:raw";
        if (type.includes('image')) return "vscode-icons:file-type-image";
        if (type.includes('zip') || extension === 'zip' || extension === 'rar' || extension === '7z')
            return "vscode-icons:file-type-zip";

        return "vscode-icons:file-type-document";
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const formatTimeRemaining = (minutes) => {
        if (minutes < 1) return 'Less than a minute';
        if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return `${hours} hour${hours !== 1 ? 's' : ''}${remainingMinutes > 0 ? ` and ${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''}` : ''}`;
    };

    const handleUpload = () => {
        if (files.length === 0) return;

        if (!uploadInfo.isValid) {
            setErrorMessage('🔒 Upload link is no longer valid. Please request a new link.');
            return;
        }

        setErrorMessage(null);
        uploadMutation.mutate();
    };

    // Show loading state
    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="relative">
                        <div className="w-20 h-20 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-6"></div>
                        <Icon icon="carbon:cloud-upload" className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-3xl text-indigo-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Preparing Your Upload Space</h2>
                    <p className="text-gray-600">Verifying your secure upload link...</p>
                </div>
            </div>
        );
    }

    // Show error if no valid token
    if (!uploadInfo.isValid && !errorMessage) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
                <div className="max-w-lg bg-white rounded-3xl shadow-2xl p-10 text-center border border-gray-100">
                    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Icon icon="carbon:locked" className="text-4xl text-red-500" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-3">Access Denied</h1>
                    <p className="text-gray-600 mb-8 leading-relaxed">
                        This upload link is invalid or has expired. Please contact your project manager for a new secure upload link.
                    </p>
                    <button
                        onClick={() => window.location.href = '/'}
                        className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                        Return to Home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f8fafc] text-slate-900 selection:bg-indigo-500/10 overflow-x-hidden">
            {/* Smooth Scroll Background Blur */}
            <div className="fixed inset-0 pointer-events-none welverflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/5 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/5 rounded-full blur-[120px] animate-pulse delay-700"></div>
            </div>


            {/* Hero Section - Artistic Studio Redesign */}
            <section className="relative min-h-screen flex items-center justify-center px-6 lg:px-24 pt-20 pb-32 overflow-hidden bg-white">
                <div className="container mx-auto relative z-10 flex flex-col lg:flex-row items-center gap-16 lg:gap-32 w-full">

                    {/* Left Content - Creative Typography & Dual CTA */}
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={{
                            visible: { transition: { staggerChildren: 0.1, delayChildren: 0.2 } }
                        }}
                        className="lg:w-[45%] text-left"
                    >
                        <motion.div
                            variants={{
                                hidden: { opacity: 0, x: -20 },
                                visible: { opacity: 1, x: 0 }
                            }}
                            className="text-slate-400 text-sm font-medium mb-12 flex items-center gap-4 uppercase tracking-[0.2em]"
                        >
                            <span className="w-8 h-[1px] bg-slate-200"></span>
                            Secure File Delivery Portal
                        </motion.div>

                        <div className="mb-16">
                            <div className="overflow-hidden">
                                <motion.h1
                                    variants={{
                                        hidden: { y: "100%", rotate: 2 },
                                        visible: { y: 0, rotate: 0 }
                                    }}
                                    transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                                    className="text-5xl md:text-8xl font-black text-slate-900 leading-[1.1] tracking-tight"
                                >
                                    Welcome,
                                </motion.h1>
                            </div>
                            <div className="overflow-hidden py-2 -mt-2">
                                <motion.h1
                                    variants={{
                                        hidden: { y: "100%", rotate: -2, opacity: 0 },
                                        visible: { y: 0, rotate: 0, opacity: 1 }
                                    }}
                                    transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
                                    className="text-5xl md:text-8xl font-black leading-[1.1] tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-500 to-indigo-600 italic font-serif"
                                    style={{ backgroundSize: '200% auto', animation: 'shimmer 8s linear infinite' }}
                                >
                                    Valued Client!
                                </motion.h1>
                            </div>
                        </div>

                        {/* Creative Dual-Action CTA */}
                        <motion.div
                            variants={{
                                hidden: { opacity: 0, scale: 0.9 },
                                visible: { opacity: 1, scale: 1 }
                            }}
                            className="flex items-center gap-4 mb-24"
                        >
                            <button
                                onClick={() => document.getElementById('upload-section')?.scrollIntoView({ behavior: 'smooth' })}
                                className="h-20 px-12 rounded-full border border-slate-100 bg-white/50 backdrop-blur-md shadow-xl shadow-slate-200/40 text-slate-800 text-sm font-bold uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center min-w-[240px]"
                            >
                                Start Delivery
                            </button>
                            <button
                                onClick={() => document.getElementById('upload-section')?.scrollIntoView({ behavior: 'smooth' })}
                                className="w-20 h-20 rounded-full bg-slate-900 shadow-2xl shadow-indigo-500/20 flex items-center justify-center group hover:scale-105 transition-all"
                            >
                                <Icon icon="carbon:arrow-right" className="text-2xl text-white group-hover:translate-x-1 transition-transform" />
                            </button>
                        </motion.div>

                        {/* Numbered Studio Markers */}
                        <div className="flex gap-16">
                            <motion.div variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }} className="flex gap-4 max-w-[200px]">
                                <span className="text-xl font-bold text-slate-900 mt-1">01</span>
                                <p className="text-[11px] text-slate-400 leading-relaxed font-medium">Military-grade encryption for every byte you send to our portal.</p>
                            </motion.div>
                            <motion.div variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }} className="flex gap-4 max-w-[200px]">
                                <span className="text-xl font-bold text-slate-900 mt-1">02</span>
                                <p className="text-[11px] text-slate-400 leading-relaxed font-medium">Automatic workflow integration for your project assets.</p>
                            </motion.div>
                        </div>
                    </motion.div>

                    {/* Right Content - 3D Asset & Atmospheric Effects */}
                    <div className="lg:w-[55%] relative flex items-center justify-center">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            className="relative z-20 w-full max-w-2xl"
                        >
                            {/* The 3D Head Asset */}
                            <img
                                src="https://res.cloudinary.com/dey90btsf/image/upload/v1771349811/1771349652455-019c6caa-58fd-737c-b566-504836acc86f-removebg-preview_f0muai.png"
                                alt="Artistic 3D Portrait"
                                className="w-full h-auto drop-shadow-[0_50px_100px_rgba(0,0,0,0.15)]"
                                style={{ transform: 'scale(1.1) translateY(-20px)' }}
                            />

                            {/* Floating Art Particles (Top) */}
                            <motion.div
                                animate={{ y: [0, -15, 0], rotate: [0, 5, 0] }}
                                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                                className="absolute top-10 left-1/4 w-40 h-40 bg-white/20 blur-3xl rounded-full mix-blend-overlay"
                            />
                        </motion.div>

                        {/* Atmospheric Cloud Shadows */}
                        <div className="absolute inset-0 z-10 pointer-events-none">
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[120px]"></div>
                        </div>
                    </div>
                </div>

                {/* Background Decor */}
                <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-slate-50 to-transparent"></div>
            </section>

            {/* Main Content Area */}
            <div id="upload-section" className="relative z-10 max-w-5xl mx-auto px-4 py-20">

                {/* Upload Info Banner */}
                {uploadInfo.isValid && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="mb-12 bg-emerald-50/50 border border-emerald-100 rounded-3xl p-6 shadow-sm relative overflow-hidden group"
                    >
                        <div className="flex flex-col lg:flex-row items-center justify-between gap-6 relative z-10">
                            <div className="flex items-center gap-6">
                                <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                    <Icon icon="carbon:checkmark-filled" className="text-2xl text-white" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900 mb-0.5">Secure Upload Portal</h2>
                                    <p className="text-sm text-slate-600">
                                        Uploading to <span className="text-emerald-600 font-bold">{uploadInfo.projectName}</span>
                                    </p>
                                    <div className="flex items-center gap-2 text-[11px] text-emerald-700 mt-1.5 font-medium">
                                        <Icon icon="carbon:locked" />
                                        <span>Secure Client Upload</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="px-4 py-2 bg-white border border-emerald-100 rounded-full flex items-center gap-2 shadow-sm">
                                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                                    <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Secure Connection</span>
                                </div>
                                <div className="px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-full flex items-center gap-2 shadow-sm">
                                    <Icon icon="carbon:locked" className="text-xs text-indigo-600" />
                                    <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">Encrypted</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Error / Success Messages */}
                <AnimatePresence mode="wait">
                    {errorMessage && (
                        <motion.div
                            key="error"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mb-8 overflow-hidden"
                        >
                            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 flex items-start gap-4">
                                <Icon icon="carbon:warning-alt" className="text-2xl text-red-600 shrink-0" />
                                <div className="flex-1">
                                    <h3 className="text-lg font-bold text-red-600 mb-1">Upload Issue</h3>
                                    <p className="text-slate-600 leading-relaxed text-sm">{errorMessage}</p>
                                </div>
                                <button onClick={() => setErrorMessage(null)} className="text-slate-400 hover:text-slate-900 transition-colors">
                                    <Icon icon="carbon:close" className="text-xl" />
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {uploadMutation.isSuccess && (
                        <motion.div
                            key="success"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="mb-8 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 flex items-center gap-4"
                        >
                            <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center shrink-0">
                                <Icon icon="carbon:checkmark-filled" className="text-2xl text-emerald-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-emerald-600">Perfect! Files Received</h3>
                                <p className="text-slate-600 text-sm">Our team has been notified and will start processing your delivery.</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Upload Card - "Desktop Tool" Aesthetic */}
                <motion.div
                    initial={{ opacity: 0, y: 60 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                    className="relative group"
                >
                    {/* Glowing Aura */}
                    <div className="absolute -inset-10 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-transparent rounded-[100px] opacity-0 group-hover:opacity-100 blur-[80px] transition-all duration-1000 -z-10"></div>

                    <div className="bg-white border border-slate-200/80 rounded-[40px] overflow-hidden shadow-[0_32px_128px_rgba(0,0,0,0.08)] backdrop-blur-3xl">
                        {/* Tool Header bar */}
                        <div className="px-10 py-6 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="flex gap-1.5">
                                    <div className="w-3 h-3 rounded-full bg-red-400/20"></div>
                                    <div className="w-3 h-3 rounded-full bg-amber-400/20"></div>
                                    <div className="w-3 h-3 rounded-full bg-emerald-400/20"></div>
                                </div>
                                <div className="h-4 w-px bg-slate-200 mx-2"></div>
                                <div>
                                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-[0.2em]">Asset Delivery Processor</h3>
                                </div>
                            </div>
                            <div className="flex items-center gap-6">
                                <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-600 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                    Ready
                                </div>
                                <button className="text-slate-400 hover:text-slate-900 transition-colors">
                                    <Icon icon="carbon:settings" className="text-lg" />
                                </button>
                            </div>
                        </div>

                        {/* Interactive Drop Zone Area */}
                        <div className="p-10">
                            <div
                                onClick={() => fileInputRef.current.click()}
                                onDragEnter={handleDrag}
                                onDragLeave={handleDrag}
                                onDragOver={handleDrag}
                                onDrop={handleDrop}
                                className={`relative min-h-[340px] border-2 border-dashed rounded-[32px] transition-all duration-700 cursor-pointer flex flex-col items-center justify-center p-8 overflow-hidden group/zone ${dragActive
                                    ? 'border-indigo-500 bg-indigo-50/30 scale-[0.99] shadow-inner'
                                    : 'border-slate-200/60 hover:border-indigo-300/60 bg-slate-50/30'
                                    }`}
                            >
                                {/* Animated Background pattern */}
                                <div className="absolute inset-0 opacity-[0.03] pointer-events-none transition-transform duration-1000 group-hover/zone:scale-110">
                                    <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #4f46e5 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
                                </div>

                                <motion.div
                                    animate={dragActive ? { y: [0, -10, 0] } : {}}
                                    transition={{ repeat: Infinity, duration: 2 }}
                                    className="mb-8 relative"
                                >
                                    <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center shadow-2xl shadow-indigo-500/10 group-hover/zone:shadow-indigo-500/20 group-hover/zone:-translate-y-2 transition-all duration-500 border border-slate-100">
                                        <Icon
                                            icon={dragActive ? "carbon:folder-move-to" : "carbon:cloud-upload"}
                                            className={`text-4xl transition-colors duration-500 ${dragActive ? 'text-indigo-600' : 'text-slate-400 group-hover/zone:text-indigo-500'}`}
                                        />
                                    </div>
                                    <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 border-4 border-white group-hover/zone:scale-110 transition-transform">
                                        <Icon icon="carbon:add" className="text-xl" />
                                    </div>
                                </motion.div>

                                <div className="text-center relative z-10">
                                    <h4 className="text-2xl font-bold text-slate-900 mb-2">
                                        {dragActive ? 'Drop assets to delivery' : 'Upload your assets'}
                                    </h4>
                                    <p className="text-slate-500 font-medium max-w-sm mx-auto leading-relaxed">
                                        Drag and drop or <span className="text-indigo-600 hover:text-indigo-500 underline decoration-indigo-500/20 underline-offset-4">browse files</span> on your computer.
                                    </p>
                                </div>

                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    multiple
                                    onChange={handleFileChange}
                                    className="hidden"
                                    accept=".jpg,.jpeg,.png,.gif,.bmp,.tiff,.tif,.webp,.avif,.heic,.heif,.ico,.svg,.ai,.eps,.pdf,.apng,.raw,.cr2,.cr3,.nef,.arw,.orf,.dng,.psd,.xcf,.hdr,.exr,.dds"
                                />
                            </div>

                            {/* Refined constraints summary */}
                            <div className="mt-10 flex items-center justify-center gap-12">
                                <div className="flex items-center gap-3 group/feat">
                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 group-hover/feat:scale-150 transition-transform"></div>
                                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest group-hover/feat:text-slate-600 transition-colors">Max 100MB / File</span>
                                </div>
                                <div className="flex items-center gap-3 group/feat">
                                    <div className="w-1.5 h-1.5 rounded-full bg-purple-500 group-hover/feat:scale-150 transition-transform"></div>
                                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest group-hover/feat:text-slate-600 transition-colors">50 Assets Limit</span>
                                </div>
                                <div className="flex items-center gap-3 group/feat">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 group-hover/feat:scale-150 transition-transform"></div>
                                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest group-hover/feat:text-slate-600 transition-colors">Encrypted Tunnel</span>
                                </div>
                            </div>
                        </div>

                        {/* Card Action bar */}
                        <div className="px-10 py-8 bg-slate-50/50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-6">
                            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Icon icon="carbon:information" className="text-lg text-slate-300" />
                                All files are processed securely by PROFIWEB
                            </div>

                            <div className="flex items-center gap-4 w-full sm:w-auto">
                                <button
                                    onClick={() => setFiles([])}
                                    className="px-8 py-3.5 rounded-2xl border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:border-slate-300 transition-all text-xs font-black uppercase tracking-widest flex items-center justify-center gap-3 disabled:opacity-50"
                                    disabled={isUploading || files.length === 0}
                                >
                                    Clear Pool
                                </button>

                                <button
                                    onClick={handleUpload}
                                    disabled={isUploading || files.length === 0 || !uploadInfo.isValid}
                                    className={`relative px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 overflow-hidden transition-all duration-500 ${isUploading || files.length === 0 || !uploadInfo.isValid
                                        ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
                                        : 'bg-slate-900 text-white shadow-2xl shadow-indigo-500/20 hover:bg-black hover:scale-[1.02] active:scale-95'
                                        }`}
                                >
                                    {isUploading ? (
                                        <div className="flex items-center gap-3">
                                            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                            <span>Processing...</span>
                                        </div>
                                    ) : (
                                        <>
                                            <Icon icon="carbon:send-alt" className="text-xl" />
                                            <span>Establish Delivery</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Selected Files List */}
                <AnimatePresence>
                    {files.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="mt-12 overflow-hidden"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-bold flex items-center gap-2 text-gray-400">
                                    Delivery Queue <span className="text-sm font-normal text-gray-600 tracking-widest uppercase">[{files.length} ITEMS]</span>
                                </h3>
                                <button onClick={() => setFiles([])} className="text-xs text-red-500/70 hover:text-red-500 transition-colors uppercase tracking-widest font-bold">Clear All</button>
                            </div>
                            <div className="grid gap-2">
                                {files.map((file, index) => (
                                    <motion.div
                                        key={`${file.name}-${index}`}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 10 }}
                                        className="flex items-center gap-4 p-4 bg-white border border-slate-200 rounded-2xl group hover:border-indigo-200 hover:shadow-sm transition-all shadow-sm"
                                    >
                                        <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0 border border-indigo-100">
                                            <Icon icon={getFileIcon(file)} className="text-xl text-indigo-600" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[13px] font-semibold text-slate-700 truncate">{file.name}</p>
                                            <p className="text-[11px] text-slate-500 tracking-tighter">{formatFileSize(file.size)} • {file.type || 'Unknown'}</p>
                                        </div>
                                        <button
                                            onClick={() => removeFile(index)}
                                            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all sm:opacity-0 group-hover:opacity-100"
                                        >
                                            <Icon icon="carbon:trash-can" />
                                        </button>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Accepted Files & Privacy Section */}
                <div className="mt-32 grid md:grid-cols-2 gap-10">
                    {/* Accepted Files Card */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 30 }}
                        whileInView={{ opacity: 1, scale: 1, y: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className="bg-white border border-slate-100 rounded-[40px] p-12 shadow-[0_20px_50px_rgba(0,0,0,0.05)] relative hover:shadow-[0_40px_80px_rgba(0,0,0,0.08)] transition-all duration-700"
                    >
                        <div className="absolute -top-6 left-10">
                            <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-600/30">
                                <Icon icon="carbon:document-view" className="text-3xl text-white" />
                            </div>
                        </div>

                        <h3 className="text-3xl font-bold text-slate-900 mb-12 mt-4 ml-2">Accepted Files</h3>

                        <div className="space-y-10">
                            {[
                                { icon: "vscode-icons:file-type-image", title: "Images", desc: "JPG, PNG, GIF, WebP, SVG, HEIC" },
                                { icon: "vscode-icons:file-type-photoshop", title: "Design Files", desc: "PSD, AI, EPS, XCF" },
                                { icon: "carbon:raw", title: "RAW Photos", desc: "CR2, NEF, ARW, DNG, ORF", customIcon: true },
                                { icon: "vscode-icons:file-type-pdf2", title: "Documents", desc: "PDF, Word, Excel, PowerPoint" }
                            ].map((item, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: 0.2 + (i * 0.1), duration: 0.5 }}
                                    className="flex items-center gap-6 group/item"
                                >
                                    <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100 group-hover/item:bg-white group-hover/item:border-indigo-100 group-hover/item:shadow-lg transition-all">
                                        <Icon icon={item.icon} className={`text-3xl ${item.customIcon ? 'text-slate-700' : ''}`} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-900 text-lg mb-1">{item.title}</h4>
                                        <p className="text-sm text-slate-500 font-medium tracking-wide translate-y-[-1px] group-hover/item:text-indigo-600 transition-colors uppercase text-[10px] tracking-widest">{item.desc}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Privacy Card */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 30 }}
                        whileInView={{ opacity: 1, scale: 1, y: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
                        className="bg-white border border-slate-100 rounded-[40px] p-12 shadow-[0_20px_50px_rgba(0,0,0,0.05)] relative hover:shadow-[0_40px_80px_rgba(0,0,0,0.08)] transition-all duration-700"
                    >
                        {/* Clipped Decorative Blobs */}
                        <div className="absolute inset-0 rounded-[40px] overflow-hidden pointer-events-none">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/[0.03] rounded-full blur-3xl -mr-32 -mt-32"></div>
                            <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/[0.02] rounded-full blur-2xl -ml-16 -mb-16"></div>
                        </div>

                        <div className="absolute -top-6 left-10 z-10">
                            <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-600/30">
                                <Icon icon="carbon:security" className="text-3xl text-white" />
                            </div>
                        </div>

                        <h3 className="text-3xl font-bold text-slate-900 mb-12 mt-4 ml-2">Your Privacy Matters</h3>

                        <div className="space-y-8">
                            {[
                                "Secure encrypted upload with JWT authentication",
                                "Files are stored safely in your project folder",
                                "Upload link expires automatically for security",
                                "Only authorized team members can access files"
                            ].map((text, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: 20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: 0.4 + (i * 0.1), duration: 0.5 }}
                                    className="flex items-center gap-5 group/check"
                                >
                                    <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20 group-hover/check:scale-110 transition-transform">
                                        <Icon icon="carbon:checkmark" className="text-white text-lg" />
                                    </div>
                                    <p className="text-slate-700 font-bold text-base leading-relaxed">{text}</p>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </div>

                {/* Info Grid */}
                <div className="mt-40 grid md:grid-cols-3 gap-8">
                    {[
                        { icon: "carbon:security", title: "Encrypted", desc: "Military-grade encryption for every byte you send." },
                        { icon: "carbon:cyclone", title: "Optimized", desc: "Automatic workflow integration for your project assets." },
                        { icon: "carbon:touch-interaction", title: "Cloud-Native", desc: "Built for creators who demand speed and reliability." }
                    ].map((item, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            className="group p-8 rounded-[32px] bg-white border border-slate-100 hover:border-indigo-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-500 shadow-sm"
                        >
                            <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center mb-6 border border-indigo-100 group-hover:bg-indigo-600 transition-colors">
                                <Icon icon={item.icon} className="text-2xl text-indigo-600 group-hover:text-white transition-colors" />
                            </div>
                            <h4 className="text-lg font-bold text-slate-800 mb-3 transition-colors">{item.title}</h4>
                            <p className="text-sm text-slate-500 leading-relaxed transition-colors">{item.desc}</p>
                        </motion.div>
                    ))}
                </div>

                {/* Delivery Intelligence - White Chart Section */}
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    className="mt-40 bg-indigo-50/50 border border-indigo-100 rounded-[40px] p-8 md:p-16 relative overflow-hidden group shadow-sm"
                >
                    <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-indigo-500/5 to-transparent"></div>

                    <div className="relative z-10 flex flex-col lg:flex-row items-center gap-16">
                        <div className="lg:w-1/2">
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2 }}
                                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-bold uppercase tracking-widest mb-6"
                            >
                                <Icon icon="carbon:analytics" />
                                Performance Metrics
                            </motion.div>
                            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-6 leading-tight">
                                Delivery <span className="text-indigo-600">Intelligence</span>
                            </h2>
                            <p className="text-slate-600 text-lg mb-8 leading-relaxed">
                                Our platform optimizes every delivery node. Experience faster processing times and real-time asset validation with our intelligent infrastructure.
                            </p>

                            <div className="grid grid-cols-2 gap-8">
                                <div>
                                    <p className="text-4xl font-bold text-slate-900 mb-1">99.9%</p>
                                    <p className="text-sm text-slate-500 uppercase tracking-wider font-semibold">Uptime Sync</p>
                                </div>
                                <div>
                                    <p className="text-4xl font-bold text-slate-900 mb-1">2x</p>
                                    <p className="text-sm text-slate-500 uppercase tracking-wider font-semibold">Faster Flow</p>
                                </div>
                            </div>
                        </div>

                        <div className="lg:w-1/2 w-full aspect-square md:aspect-video relative bg-white rounded-3xl border border-indigo-100 p-8 flex items-center justify-center overflow-hidden shadow-xl">
                            {/* Custom Indigo Line Chart SVG */}
                            <svg viewBox="0 0 400 200" className="w-full h-full">
                                <defs>
                                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.1" />
                                        <stop offset="100%" stopColor="#4f46e5" stopOpacity="0" />
                                    </linearGradient>
                                </defs>

                                {/* Grid Lines */}
                                {[0, 50, 100, 150].map((y) => (
                                    <line key={y} x1="0" y1={y} x2="400" y2={y} stroke="#4f46e5" strokeOpacity="0.1" strokeWidth="1" />
                                ))}

                                {/* Animated Path */}
                                <motion.path
                                    d="M 0 150 Q 50 160 100 100 T 200 80 T 300 120 T 400 40"
                                    fill="none"
                                    stroke="#4f46e5"
                                    strokeWidth="3"
                                    initial={{ pathLength: 0, opacity: 0 }}
                                    whileInView={{ pathLength: 1, opacity: 1 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 2, ease: "easeInOut", delay: 0.5 }}
                                />

                                {/* Area Fill */}
                                <motion.path
                                    d="M 0 150 Q 50 160 100 100 T 200 80 T 300 120 T 400 40 V 200 H 0 Z"
                                    fill="url(#chartGradient)"
                                    initial={{ opacity: 0 }}
                                    whileInView={{ opacity: 1 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 1, delay: 1.5 }}
                                />

                                {/* Data Points */}
                                {[
                                    { x: 100, y: 100 },
                                    { x: 200, y: 80 },
                                    { x: 300, y: 120 },
                                    { x: 400, y: 40 }
                                ].map((point, i) => (
                                    <motion.circle
                                        key={i}
                                        cx={point.x}
                                        cy={point.y}
                                        r="4"
                                        fill="#4f46e5"
                                        initial={{ scale: 0 }}
                                        whileInView={{ scale: 1 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: 1.5 + (i * 0.1) }}
                                    />
                                ))}
                            </svg>

                            {/* Chart Overlay Label */}
                            <div className="absolute top-6 left-6 text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                                Network Latency Flow
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Helper Section */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="mt-60 mb-20 text-center"
                >
                    <h3 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4 max-w-3xl mx-auto leading-tight italic font-serif">
                        Need help? Feel free to reach out to your project manager.
                    </h3>
                    <motion.p
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        transition={{ delay: 0.5, duration: 1 }}
                        className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[12px] flex items-center justify-center gap-4"
                    >
                        <span>Thank you for choosing us! We appreciate your business.</span>
                        <div className="w-12 h-px bg-slate-200"></div>
                        <span className="text-2xl">💼</span>
                    </motion.p>
                </motion.div>


            </div>

            <style jsx global>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Playfair+Display:ital@1&display=swap');
                
                body {
                    background-color: #f8fafc;
                    font-family: 'Inter', sans-serif;
                }
                
                .font-serif {
                    font-family: 'Playfair Display', serif;
                }

                @keyframes shimmer {
                    to {
                        background-position: 200% center;
                    }
                }
                
                ::-webkit-scrollbar {
                    width: 5px;
                }
                
                ::-webkit-scrollbar-track {
                    background: transparent;
                }
                
                ::-webkit-scrollbar-thumb {
                    background: #e2e8f0;
                    border-radius: 10px;
                }
                
                ::-webkit-scrollbar-thumb:hover {
                    background: #cbd5e1;
                }
            `}</style>
        </div >
    );
};

export default Page;