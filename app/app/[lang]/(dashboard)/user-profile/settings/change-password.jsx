"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Icon } from "@iconify/react";
import { Eye, EyeOff } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useSession } from 'next-auth/react';

import windowsImage from "@/public/images/social/windows.png";
import androidImage from "@/public/images/social/android.png";
import macImage from "@/public/images/social/mac.png";
import iphoneImage from "@/public/images/social/iphone.png";
import Image from "next/image";

const ChangePassword = () => {
  const { data: session } = useSession();
  const [currentPasswordType, setCurrentPasswordType] = useState("password");
  const [newPasswordType, setNewPasswordType] = useState("password");
  const [confirmPasswordType, setConfirmPasswordType] = useState("password");

  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    passwordConfirm: "",
    code: ""
  });

  const [showVerification, setShowVerification] = useState(false);

  const requestVerifyMutation = useMutation({
    mutationFn: requestPasswordVerify,
    onSuccess: () => {
      toast.success("Verification code sent to your email");
      setShowVerification(true);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to send verification code");
    }
  });

  const updatePasswordMutation = useMutation({
    mutationFn: updatePassword,
    onSuccess: () => {
      toast.success("Password updated successfully");
      setFormData({
        currentPassword: "",
        newPassword: "",
        passwordConfirm: "",
        code: ""
      });
      setShowVerification(false);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update password");
    }
  });

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const handleSave = () => {
    if (!formData.currentPassword || !formData.newPassword || !formData.passwordConfirm) {
      toast.error("Please fill in all password fields");
      return;
    }
    if (formData.newPassword !== formData.passwordConfirm) {
      toast.error("Passwords do not match");
      return;
    }

    updatePasswordMutation.mutate(formData);
  };

  const data = [
    // ... existing data
  ];
  return (
    <>
      <Card className="rounded-t-none pt-6">
        <CardContent>
          <div className="grid grid-cols-12 md:gap-x-12 gap-y-5">
            <div className="col-span-12 md:col-span-6">
              <Label
                htmlFor="currentPassword"
                className="mb-2 text-default-800"
              >
                Current Password
              </Label>
              <div className="relative">
                <Input id="currentPassword" type={currentPasswordType} value={formData.currentPassword} onChange={handleChange} />
                <Eye
                  className={cn(
                    "absolute right-3 top-1/2 -translate-y-1/2 text-default-500 w-4 h-4 cursor-pointer",
                    currentPasswordType === "text" && "hidden"
                  )}
                  onClick={() => setCurrentPasswordType("text")}
                />
                <EyeOff
                  className={cn(
                    "absolute right-3 top-1/2 -translate-y-1/2 text-default-500 w-4 h-4 cursor-pointer",
                    currentPasswordType === "password" && "hidden"
                  )}
                  onClick={() => setCurrentPasswordType("password")}
                />
              </div>
            </div>
            <div className="col-span-12 md:col-span-6"></div>
            <div className="col-span-12 md:col-span-6">
              <Label htmlFor="newPassword" className="mb-2 text-default-800">
                New Password
              </Label>
              <div className="relative">
                <Input id="newPassword" type={newPasswordType} value={formData.newPassword} onChange={handleChange} />
                <Eye
                  className={cn(
                    "absolute right-3 top-1/2 -translate-y-1/2 text-default-500 w-4 h-4 cursor-pointer",
                    newPasswordType === "text" && "hidden"
                  )}
                  onClick={() => setNewPasswordType("text")}
                />
                <EyeOff
                  className={cn(
                    "absolute right-3 top-1/2 -translate-y-1/2 text-default-500 w-4 h-4 cursor-pointer",
                    newPasswordType === "password" && "hidden"
                  )}
                  onClick={() => setNewPasswordType("password")}
                />
              </div>
            </div>
            <div className="col-span-12 md:col-span-6">
              <Label
                htmlFor="passwordConfirm"
                className="mb-2 text-default-800"
              >
                Confirm Password
              </Label>
              <div className="relative">
                <Input id="passwordConfirm" type={confirmPasswordType} value={formData.passwordConfirm} onChange={handleChange} />
                <Eye
                  className={cn(
                    "absolute right-3 top-1/2 -translate-y-1/2 text-default-500 w-4 h-4 cursor-pointer",
                    confirmPasswordType === "text" && "hidden"
                  )}
                  onClick={() => setConfirmPasswordType("text")}
                />
                <EyeOff
                  className={cn(
                    "absolute right-3 top-1/2 -translate-y-1/2 text-default-500 w-4 h-4 cursor-pointer",
                    confirmPasswordType === "password" && "hidden"
                  )}
                  onClick={() => setConfirmPasswordType("password")}
                />
              </div>
            </div>

            {showVerification && (
              <div className="col-span-12 md:col-span-6 animate-in fade-in slide-in-from-top-4">
                <Label htmlFor="code" className="mb-2 text-primary font-bold">
                  Verification Code (Sent to Email)
                </Label>
                <Input id="code" placeholder="Enter 6-digit code" value={formData.code} onChange={handleChange} className="border-primary" />
              </div>
            )}
          </div>

          <div className="mt-5 text-sm font-medium text-default-800">
            Password Requirements:
          </div>
          <div className="mt-3 space-y-1.5">
            {[
              "Minimum 8 characters long - the more, the better.",
              "At least one lowercase character.",
              "At least one number, symbol, or whitespace character.",
            ].map((item, index) => (
              <div
                className="flex items-center gap-1.5"
                key={`requirement-${index}`}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-default-400"></div>
                <div className="text-xs text-default-600">{item}</div>
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap gap-4 justify-end">
            {!showVerification ? (
              <Button
                variant="outline"
                color="primary"
                onClick={() => requestVerifyMutation.mutate()}
                disabled={requestVerifyMutation.isPending}
              >
                {requestVerifyMutation.isPending && <Icon icon="heroicons:arrow-path" className="w-4 h-4 mr-2 animate-spin" />}
                Get Verification Code
              </Button>
            ) : (
              <Button variant="ghost" onClick={() => setShowVerification(false)}>Cancel Verification</Button>
            )}

            <Button onClick={handleSave} disabled={updatePasswordMutation.isPending}>
              {(updatePasswordMutation.isPending) && (
                <Icon icon="heroicons:arrow-path" className="w-4 h-4 mr-2 animate-spin" />
              )}
              <Icon
                icon="heroicons:lock-closed"
                className="w-5 h-5 text-primary-foreground me-1"
              />
              {showVerification ? "Verify & Change Password" : "Change Password"}
            </Button>
          </div>
        </CardContent>
      </Card>
      {/* recent device table */}
      <Card className="mt-6">
        <CardHeader className="flex-row items-center border-none mb-0">
          <CardTitle className="flex-1 text-lg font-medium text-default-800">
            Recent Device
          </CardTitle>
          <Button className="flex-none" size="sm" variant="outline">
            {" "}
            Logout All{" "}
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                {[
                  "Browser",
                  "DEVICE",
                  "LOCATION",
                  "RECEN ACTIVITIES",
                  "ACTION",
                ].map((column, index) => (
                  <TableHead
                    key={`column-${index}`}
                    className="last:text-right border-t border-border first:pl-5 last:pr-5 whitespace-nowrap"
                  >
                    {column}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item, index) => (
                <TableRow key={`device-row-${index}`} className="border-border">
                  <TableCell className="py-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-default-600 whitespace-nowrap">
                      <div className="h-5 w-5 grid place-content-center rounded bg-default-100 dark:bg-default-50">
                        <Image
                          className="w-3.5 h-3.5"
                          src={item.image}
                          alt={item.browser}
                        />
                      </div>
                      {item.browser}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm  text-default-600 py-2 whitespace-nowrap">
                    {item.device}
                  </TableCell>
                  <TableCell className="text-sm  text-default-600 capitalize py-2 whitespace-nowrap">
                    {item.location}
                  </TableCell>
                  <TableCell className="text-sm  text-default-600 capitalize py-2 whitespace-nowrap">
                    {item.recent_activites}
                  </TableCell>
                  <TableCell className="text-right py-2">
                    <Button size="sm" variant="ghost">
                      Logout
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
};

export default ChangePassword;
