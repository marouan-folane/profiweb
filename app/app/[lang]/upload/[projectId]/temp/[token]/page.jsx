"use client";

import { useState, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { useMutation } from "@tanstack/react-query";
import { uploadFiles } from "@/config/functions/upload";
import Confetti from "react-confetti";
import { jwtDecode } from "jwt-decode";
import Image from "next/image";

const Page = () => {
    const params = useParams();
    const router = useRouter();
    const { token, projectId } = params;
    const fileInputRef = useRef(null);

    const [files, setFiles] = useState([]);
    const [dragActive, setDragActive] = useState(false);
    const [showConfetti, setShowConfetti] = useState(false);
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

    // Decode token and get project info
    useEffect(() => {
        if (token) {
            try {
                console.log("🔍 Token found in URL:", token.substring(0, 30) + "...");

                // Decode the JWT token
                const decoded = jwtDecode(token);
                console.log("🔍 Decoded token:", decoded);

                // Check if token has required data
                if (decoded.projectId && decoded.type === 'temporary_upload') {
                    // Check if project ID in URL matches token
                    if (projectId && decoded.projectId !== projectId) {
                        setErrorMessage('🔒 This link is for a different project. Please use the correct link.');
                        setUploadInfo({ isValid: false, error: 'Project mismatch' });
                        return;
                    }
                    const expiresAt = new Date(decoded.exp * 1000);
                    const now = new Date();

                    // Check if token is expired
                    if (expiresAt < now) {
                        setErrorMessage('🔒 This upload link has expired. Please request a new link from your project manager.');
                        setUploadInfo({
                            isValid: false,
                            error: 'Token expired'
                        });
                    } else {
                        // Set upload info
                        setUploadInfo({
                            projectId: decoded.projectId,
                            projectName: 'Project Files',
                            expiresAt: expiresAt,
                            isValid: true,
                            timeRemaining: Math.floor((expiresAt - now) / (1000 * 60))
                        });

                        console.log(`✅ Valid token for project: ${decoded.projectId}`);
                        console.log(`⏰ Token expires at: ${expiresAt.toLocaleString()}`);
                    }
                } else {
                    setErrorMessage('🔒 Invalid upload link. Incorrect link type or format.');
                    setUploadInfo({
                        isValid: false,
                        error: 'Invalid token type'
                    });
                }
            } catch (error) {
                console.error("❌ Error decoding token:", error);
                setErrorMessage('🔒 Invalid upload link. Please check the link and try again.');
                setUploadInfo({
                    isValid: false,
                    error: 'Token decode failed'
                });
            }
        } else {
            console.log("⚠️ No token found in URL");
            setErrorMessage('🔒 No upload token provided. Please use a valid upload link.');
            setUploadInfo({
                isValid: false,
                error: 'No token'
            });
        }

        setIsLoading(false);
    }, [token]);

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
            return uploadFiles(files, null, null, token);
        },
        onSuccess: (data) => {
            console.log("Upload successful:", data);
            setErrorMessage(null);
            setShowConfetti(true);

            setTimeout(() => {
                setShowConfetti(false);
            }, 5000);

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
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 relative overflow-hidden">
            {/* Decorative Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
            </div>

            {/* Confetti Celebration */}
            {showConfetti && (
                <Confetti
                    width={windowDimensions.width}
                    height={windowDimensions.height}
                    recycle={false}
                    numberOfPieces={500}
                    gravity={0.15}
                    colors={['#6366f1', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b']}
                    style={{ position: 'fixed', top: 0, left: 0, zIndex: 9999 }}
                />
            )}

            <div className="relative z-10 max-w-5xl mx-auto px-4 py-8 md:py-12">
                {/* Header with Logo */}
                <div className="text-center mb-12">
                    {/* Logo Placeholder - Replace with your actual logo */}
                    <div className="mb-8 flex justify-center">
                        <div className="w-32 h-32 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl transform hover:scale-105 transition-transform">
                            {/* Replace this div with your actual logo image */}
                            <Icon icon="carbon:cloud-upload" className="text-6xl text-white" />
                            {/* Example with Image component:
                            <Image 
                                src="/your-logo.png" 
                                alt="Company Logo" 
                                width={100} 
                                height={100}
                                className="object-contain"
                            />
                            */}
                        </div>
                    </div>

                    <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight">
                        Welcome, Valued Client! 👋
                    </h1>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
                        We're excited to receive your files. Simply upload your site images and documents below, 
                        and we'll take care of the rest.
                    </p>
                </div>

                {/* Upload Info Banner */}
                {uploadInfo.isValid && (
                    <div className="mb-10 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-3xl p-8 shadow-lg backdrop-blur-sm">
                        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
                            <div className="flex items-center gap-5">
                                <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
                                    <Icon icon="carbon:checkmark-filled" className="text-3xl text-white" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900 mb-1">Secure Upload Portal</h2>
                                    <p className="text-gray-700 mb-2">
                                        Uploading to <span className="font-semibold text-green-700">{uploadInfo.projectName}</span>
                                    </p>
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <Icon icon="carbon:time" className="text-lg text-green-600" />
                                        <span>Link expires in <span className="font-semibold text-green-700">{formatTimeRemaining(uploadInfo.timeRemaining)}</span></span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-3">
                                <div className="px-5 py-2.5 bg-white border-2 border-green-300 rounded-full flex items-center gap-2 shadow-sm">
                                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                    <span className="text-sm font-semibold text-green-700">Secure Connection</span>
                                </div>
                                <div className="px-5 py-2.5 bg-white border-2 border-indigo-300 rounded-full flex items-center gap-2 shadow-sm">
                                    <Icon icon="carbon:encryption" className="text-indigo-600" />
                                    <span className="text-sm font-semibold text-indigo-700">Encrypted</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Error Message Banner */}
                {errorMessage && (
                    <div className="mb-10 bg-white border-2 border-red-200 rounded-3xl p-8 shadow-2xl animate-shake">
                        <div className="flex items-start gap-5">
                            <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                                <Icon icon="carbon:warning-alt" className="text-3xl text-red-600" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-2xl font-bold text-red-900 mb-3">Oops! Something Went Wrong</h3>
                                <p className="text-red-700 mb-6 whitespace-pre-line leading-relaxed">{errorMessage}</p>
                                <div className="flex flex-wrap gap-4">
                                    <button
                                        onClick={() => uploadMutation.mutate()}
                                        className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all flex items-center gap-2 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                                        disabled={isUploading}
                                    >
                                        <Icon icon="carbon:retry" className="text-xl" />
                                        Try Again
                                    </button>
                                    <button
                                        onClick={() => setErrorMessage(null)}
                                        className="px-6 py-3 bg-white text-red-600 border-2 border-red-300 rounded-xl hover:bg-red-50 transition-all font-semibold"
                                    >
                                        Dismiss
                                    </button>
                                </div>
                            </div>
                            <button
                                onClick={() => setErrorMessage(null)}
                                className="text-red-400 hover:text-red-600 transition-colors flex-shrink-0"
                            >
                                <Icon icon="carbon:close" className="text-2xl" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Success Message */}
                {uploadMutation.isSuccess && !showConfetti && (
                    <div className="mb-10 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-3xl p-8 shadow-2xl animate-scale-up">
                        <div className="flex items-center gap-5">
                            <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg">
                                <Icon icon="carbon:checkmark-filled" className="text-4xl text-white" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-green-900 mb-2">Files Uploaded Successfully! 🎉</h3>
                                <p className="text-green-700 leading-relaxed">
                                    Thank you! Your files have been securely uploaded to our system. We'll review them and get back to you shortly.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Upload Area */}
                <div
                    className={`relative border-3 border-dashed rounded-3xl p-12 mb-10 text-center transition-all duration-300 backdrop-blur-sm ${
                        dragActive
                            ? 'border-indigo-500 bg-indigo-50 shadow-2xl scale-[1.02]'
                            : 'border-gray-300 hover:border-indigo-400 bg-white/80 shadow-xl hover:shadow-2xl'
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        onChange={handleFileChange}
                        className="hidden"
                        accept=".jpg,.jpeg,.png,.gif,.bmp,.tiff,.tif,.webp,.avif,.heic,.heif,.ico,.svg,.ai,.eps,.pdf,.apng,.raw,.cr2,.cr3,.nef,.arw,.orf,.dng,.psd,.xcf,.hdr,.exr,.dds,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.rtf"
                    />

                    <div className="py-16">
                        <div className="mb-8 relative inline-block">
                            <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full blur-2xl opacity-30 animate-pulse"></div>
                            <div className="relative w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto shadow-2xl transform hover:scale-110 transition-transform">
                                <Icon
                                    icon={dragActive ? "carbon:folder-add" : "carbon:cloud-upload"}
                                    className="text-5xl text-white"
                                />
                            </div>
                        </div>

                        <h3 className="text-3xl font-bold text-gray-900 mb-4">
                            {dragActive ? '🎯 Drop Your Files Here' : '📂 Upload Your Files'}
                        </h3>
                        <p className="text-lg text-gray-600 mb-3 max-w-lg mx-auto leading-relaxed">
                            Drag and drop your files here, or click the button below to browse
                        </p>
                        <p className="text-sm text-gray-500 mb-8">
                            We accept images, documents, and design files • Up to 50 files • 100MB per file
                        </p>

                        <button
                            onClick={() => fileInputRef.current.click()}
                            className="px-10 py-5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-lg rounded-2xl hover:from-indigo-700 hover:to-purple-700 transition-all flex items-center justify-center gap-3 mx-auto font-semibold shadow-2xl hover:shadow-3xl transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                            disabled={isUploading || !uploadInfo.isValid}
                        >
                            <Icon icon="carbon:folder-open" className="text-2xl" />
                            Choose Files to Upload
                        </button>
                    </div>
                </div>

                {/* File List */}
                {files.length > 0 && (
                    <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 mb-10 border border-gray-100">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                                    <Icon icon="carbon:document-multiple-01" className="text-xl text-white" />
                                </div>
                                Your Selected Files ({files.length})
                            </h2>
                            <button
                                onClick={() => setFiles([])}
                                className="text-red-500 hover:text-red-700 text-sm font-semibold flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-red-50 transition-all"
                                disabled={isUploading}
                            >
                                <Icon icon="carbon:trash-can" className="text-lg" />
                                Clear All
                            </button>
                        </div>

                        <div className="grid gap-4">
                            {files.map((file, index) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-between p-5 border-2 border-gray-200 rounded-2xl hover:border-indigo-300 hover:bg-indigo-50/50 transition-all group"
                                >
                                    <div className="flex items-center gap-5 flex-1 min-w-0">
                                        <div className="w-14 h-14 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                                            <Icon
                                                icon={getFileIcon(file)}
                                                className="text-3xl"
                                            />
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-gray-900 truncate text-lg mb-1">
                                                {file.name}
                                            </p>
                                            <div className="flex items-center gap-3 text-sm text-gray-500">
                                                <span className="font-medium">{formatFileSize(file.size)}</span>
                                                <span>•</span>
                                                <span className="truncate">{file.type || 'Unknown type'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => removeFile(index)}
                                        className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all ml-4 flex-shrink-0"
                                        disabled={isUploading}
                                    >
                                        <Icon icon="carbon:close" className="text-2xl" />
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* Upload Button */}
                        <div className="mt-8 pt-8 border-t-2 border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-6">
                            <div className="flex items-center gap-3 text-gray-600">
                                <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                                    <Icon icon="carbon:data-1" className="text-xl text-indigo-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Total Size</p>
                                    <p className="text-lg font-bold text-gray-900">
                                        {formatFileSize(files.reduce((sum, file) => sum + file.size, 0))}
                                    </p>
                                </div>
                            </div>
                            
                            <button
                                onClick={handleUpload}
                                disabled={isUploading || !uploadInfo.isValid}
                                className={`px-10 py-5 rounded-2xl flex items-center gap-3 transition-all font-bold text-lg shadow-2xl ${
                                    isUploading || !uploadInfo.isValid
                                        ? 'bg-gray-300 cursor-not-allowed text-gray-500'
                                        : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white hover:shadow-3xl transform hover:-translate-y-1'
                                }`}
                            >
                                {isUploading ? (
                                    <>
                                        <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Uploading Your Files...
                                    </>
                                ) : (
                                    <>
                                        <Icon icon="carbon:cloud-upload" className="text-2xl" />
                                        Upload {files.length} File{files.length > 1 ? 's' : ''}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {/* Info Cards Grid */}
                <div className="grid md:grid-cols-2 gap-6 mb-10">
                    {/* Supported File Types */}
                    <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-gray-100">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center">
                                <Icon icon="carbon:document-tasks" className="text-2xl text-white" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900">Accepted Files</h3>
                        </div>
                        <div className="space-y-3">
                            {[
                                { icon: "vscode-icons:file-type-image", label: "Images", types: "JPG, PNG, GIF, WebP, SVG, HEIC" },
                                { icon: "vscode-icons:file-type-photoshop", label: "Design Files", types: "PSD, AI, EPS, XCF" },
                                { icon: "carbon:raw", label: "RAW Photos", types: "CR2, NEF, ARW, DNG, ORF" },
                                { icon: "vscode-icons:file-type-pdf2", label: "Documents", types: "PDF, Word, Excel, PowerPoint" },
                            ].map((type, index) => (
                                <div key={index} className="flex items-start gap-4 p-4 hover:bg-indigo-50 rounded-xl transition-colors">
                                    <Icon icon={type.icon} className="text-3xl flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-semibold text-gray-900">{type.label}</p>
                                        <p className="text-sm text-gray-600">{type.types}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Security Info */}
                    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-3xl p-8 shadow-xl border-2 border-indigo-200">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                                <Icon icon="carbon:security" className="text-2xl text-white" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900">Your Privacy Matters</h3>
                        </div>
                        <ul className="space-y-4">
                            {[
                                "Secure encrypted upload with JWT authentication",
                                "Files are stored safely in your project folder",
                                "Upload link expires automatically for security",
                                "Only authorized team members can access files"
                            ].map((item, index) => (
                                <li key={index} className="flex items-start gap-3">
                                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <Icon icon="carbon:checkmark" className="text-sm text-white" />
                                    </div>
                                    <span className="text-gray-700 leading-relaxed">{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center text-gray-600 pt-8 border-t-2 border-gray-200">
                    <p className="text-lg mb-2">
                        Need help? Feel free to reach out to your project manager.
                    </p>
                    <p className="text-sm text-gray-500">
                        Thank you for choosing us! We appreciate your business. 💼
                    </p>
                </div>
            </div>

            {/* Custom CSS */}
            <style jsx global>{`
                @keyframes blob {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    25% { transform: translate(20px, -50px) scale(1.1); }
                    50% { transform: translate(-20px, 20px) scale(0.9); }
                    75% { transform: translate(50px, 50px) scale(1.05); }
                }
                
                .animate-blob {
                    animation: blob 7s infinite;
                }
                
                .animation-delay-2000 {
                    animation-delay: 2s;
                }
                
                .animation-delay-4000 {
                    animation-delay: 4s;
                }
                
                @keyframes scale-up {
                    0% {
                        transform: scale(0.9);
                        opacity: 0;
                    }
                    100% {
                        transform: scale(1);
                        opacity: 1;
                    }
                }
                
                .animate-scale-up {
                    animation: scale-up 0.4s ease-out forwards;
                }
                
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
                    20%, 40%, 60%, 80% { transform: translateX(5px); }
                }
                
                .animate-shake {
                    animation: shake 0.5s ease-out;
                }
                
                .border-3 {
                    border-width: 3px;
                }
                
                .shadow-3xl {
                    box-shadow: 0 35px 60px -15px rgba(0, 0, 0, 0.3);
                }
            `}</style>
        </div>
    );
};

export default Page;