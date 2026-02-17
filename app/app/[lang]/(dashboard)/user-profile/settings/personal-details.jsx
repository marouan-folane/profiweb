"use client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useSession } from "next-auth/react";
import { useMutation } from "@tanstack/react-query";
import { updateMe, updateAvatar } from "@/config/functions/user";
import { toast } from "react-hot-toast";
import { Icon } from "@iconify/react";
import Image from "next/image";
import UserDefault from "@/public/images/avatar/user.png";

import { requestEmailChange, verifyEmailChange } from "@/config/functions/user";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";

const PersonalDetails = () => {
  const { data: session, update } = useSession();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    bio: "",
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  const [newEmail, setNewEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    if (session?.user) {
      setFormData({
        firstName: session.user.firstName || "",
        lastName: session.user.lastName || "",
        phone: session.user.phone || "",
        bio: session.user.bio || "",
      });
      if (session.user.profileImage) {
        setAvatarPreview(`${process.env.NEXT_PUBLIC_SITE_URL}${session.user.profileImage}`);
      }
    }
  }, [session]);

  const updateProfileMutation = useMutation({
    mutationFn: updateMe,
    onSuccess: async (data) => {
      toast.success("Profile updated successfully");
      await update({
        ...session,
        user: { ...session.user, ...data.user }
      });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update profile");
    }
  });

  const uploadAvatarMutation = useMutation({
    mutationFn: updateAvatar,
    onSuccess: async (data) => {
      toast.success("Avatar updated successfully");
      setAvatarFile(null);
      await update({
        ...session,
        user: { ...session.user, profileImage: data.profileImage }
      });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to upload avatar");
    }
  });

  const requestEmailMutation = useMutation({
    mutationFn: requestEmailChange,
    onSuccess: () => {
      toast.success("Verification code sent to your email");
      setIsVerifying(true);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to request email change");
    }
  });

  const verifyEmailMutation = useMutation({
    mutationFn: verifyEmailChange,
    onSuccess: async (data) => {
      toast.success("Email updated successfully");
      setShowEmailDialog(false);
      setIsVerifying(false);
      setNewEmail("");
      setVerificationCode("");
      await update({
        ...session,
        user: { ...session.user, email: data.user.email }
      });
    },
    onError: (error) => {
      toast.error(error.message || "Invalid verification code");
    }
  });

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    updateProfileMutation.mutate(formData);

    if (avatarFile) {
      const avatarFormData = new FormData();
      avatarFormData.append("profileImage", avatarFile);
      uploadAvatarMutation.mutate(avatarFormData);
    }
  };

  const handleRequestEmailChange = () => {
    if (!newEmail) return toast.error("Please enter a new email");
    requestEmailMutation.mutate({ newEmail });
  };

  const handleVerifyEmail = () => {
    if (!verificationCode) return toast.error("Please enter verification code");
    verifyEmailMutation.mutate({ code: verificationCode });
  };

  return (
    <Card className="rounded-t-none pt-6">
      <CardContent>
        <div className="mb-6 flex flex-col items-center">
          <div className="relative group cursor-pointer" onClick={() => document.getElementById('avatar-input').click()}>
            <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-primary relative">
              <Image
                src={avatarPreview || UserDefault}
                alt="Avatar Preview"
                width={96}
                height={96}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40 items-center justify-center flex opacity-0 group-hover:opacity-100 transition-opacity">
                <Icon icon="heroicons:camera" className="text-white w-6 h-6" />
              </div>
            </div>
            <input
              id="avatar-input"
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleAvatarChange}
            />
            <p className="mt-2 text-xs text-default-500 font-medium text-center">Click to change avatar</p>
          </div>
        </div>

        <div className="grid grid-cols-12 md:gap-x-12 gap-y-5">
          <div className="col-span-12 md:col-span-6">
            <Label htmlFor="firstName" className="mb-2">
              First Name
            </Label>
            <Input id="firstName" value={formData.firstName} onChange={handleChange} />
          </div>
          <div className="col-span-12 md:col-span-6">
            <Label htmlFor="lastName" className="mb-2">
              Last Name
            </Label>
            <Input id="lastName" value={formData.lastName} onChange={handleChange} />
          </div>
          <div className="col-span-12 md:col-span-6">
            <Label htmlFor="phone" className="mb-2">
              Phone Number
            </Label>
            <Input id="phone" value={formData.phone} onChange={handleChange} />
          </div>
          <div className="col-span-12 md:col-span-6">
            <Label htmlFor="email" className="mb-2">
              Email Address
            </Label>
            <div className="flex gap-2">
              <Input id="email" value={session?.user?.email || ""} disabled className="bg-default-50 cursor-not-allowed flex-1" />
              <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">Change</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{isVerifying ? "Verify Email Change" : "Update Email Address"}</DialogTitle>
                  </DialogHeader>
                  <div className="py-4 space-y-4">
                    {!isVerifying ? (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="newEmail">New Email Address</Label>
                          <Input
                            id="newEmail"
                            type="email"
                            placeholder="new@example.com"
                            value={newEmail}
                            onChange={(e) => setNewEmail(e.target.value)}
                          />
                        </div>
                        <p className="text-sm text-default-500">
                          We will send a verification code to your current email to confirm this change.
                        </p>
                      </>
                    ) : (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="verificationCode">Verification Code</Label>
                          <Input
                            id="verificationCode"
                            placeholder="Enter 6-digit code"
                            value={verificationCode}
                            onChange={(e) => setVerificationCode(e.target.value)}
                          />
                        </div>
                        <p className="text-sm text-default-500">
                          Code sent to {session?.user?.email}.
                        </p>
                      </>
                    )}
                  </div>
                  <DialogFooter>
                    {!isVerifying ? (
                      <Button onClick={handleRequestEmailChange} disabled={requestEmailMutation.isPending}>
                        {requestEmailMutation.isPending && <Icon icon="heroicons:arrow-path" className="w-4 h-4 mr-2 animate-spin" />}
                        Send Code
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button variant="ghost" onClick={() => setIsVerifying(false)}>Back</Button>
                        <Button onClick={handleVerifyEmail} disabled={verifyEmailMutation.isPending}>
                          {verifyEmailMutation.isPending && <Icon icon="heroicons:arrow-path" className="w-4 h-4 mr-2 animate-spin" />}
                          Verify & Update
                        </Button>
                      </div>
                    )}
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="col-span-12 ">
            <Label htmlFor="bio" className="mb-2">
              About / Bio
            </Label>
            <Textarea id="bio" value={formData.bio} onChange={handleChange} placeholder="Tell us about yourself..." />
          </div>
        </div>
        <div className="flex justify-end gap-4 mt-6">
          <Button color="secondary" onClick={() => setFormData({
            firstName: session.user.firstName || "",
            lastName: session.user.lastName || "",
            phone: session.user.phone || "",
            bio: session.user.bio || "",
          })}>Cancel</Button>
          <Button
            onClick={handleSave}
            disabled={updateProfileMutation.isPending || uploadAvatarMutation.isPending}
          >
            {(updateProfileMutation.isPending || uploadAvatarMutation.isPending) && (
              <Icon icon="heroicons:arrow-path" className="w-4 h-4 mr-2 animate-spin" />
            )}
            Save Changes
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PersonalDetails;
