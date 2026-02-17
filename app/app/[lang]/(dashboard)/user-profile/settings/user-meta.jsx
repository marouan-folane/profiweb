"use client"
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Icon } from "@iconify/react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { useMutation } from "@tanstack/react-query";
import { updateAvatar } from "@/config/functions/user";
import { toast } from "react-hot-toast";
import UserDefault from "@/public/images/avatar/user.png";

const UserMeta = () => {
  const { data: session, update } = useSession();

  const uploadAvatarMutation = useMutation({
    mutationFn: updateAvatar,
    onSuccess: async (data) => {
      toast.success("Avatar updated successfully");
      await update({
        ...session,
        user: { ...session.user, profileImage: data.profileImage }
      });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to upload avatar");
    }
  });

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const formData = new FormData();
      formData.append("profileImage", file);
      uploadAvatarMutation.mutate(formData);
    }
  };

  const userRoleDisplay = () => {
    if (!session?.user?.role) return "User";
    if (Array.isArray(session.user.role)) return session.user.role[0];
    return session.user.role;
  };

  return (
    <Card>
      <CardContent className="p-6 flex flex-col items-center text-center">
        <div className="w-[124px] h-[124px] relative rounded-full border-4 border-primary/10 p-1">
          <div className="w-full h-full rounded-full overflow-hidden relative">
            <Image
              src={session?.user?.profileImage ? `${process.env.NEXT_PUBLIC_SITE_URL}${session.user.profileImage}` : UserDefault}
              alt="avatar"
              width={124}
              height={124}
              className="w-full h-full object-cover"
            />
            {uploadAvatarMutation.isPending && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <Icon icon="heroicons:arrow-path" className="w-6 h-6 text-white animate-spin" />
              </div>
            )}
          </div>
          <Button asChild
            size="icon"
            className="h-8 w-8 rounded-full cursor-pointer absolute bottom-0 right-0 border-2 border-background"
          >
            <Label
              htmlFor="avatar-meta"
            >
              <Icon className="w-5 h-5 text-primary-foreground" icon="heroicons:pencil-square" />
            </Label>
          </Button>
          <Input type="file" className="hidden" id="avatar-meta" accept="image/*" onChange={handleAvatarChange} />
        </div>
        <div className="mt-4 text-xl font-semibold text-default-900 capitalize">
          {session?.user?.firstName || ""} {session?.user?.lastName || session?.user?.username || "User"}
        </div>
        <div className="mt-1.5 text-sm font-medium text-default-500 uppercase tracking-wider">{userRoleDisplay()}</div>
      </CardContent>
    </Card>
  );
};

export default UserMeta;