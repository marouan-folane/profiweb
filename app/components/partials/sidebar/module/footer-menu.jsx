import React from "react";
import { Icon } from "@iconify/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Settings } from "@/components/svg";
import { useSession, signIn, signOut } from "next-auth/react";
import Image from "next/image";
const FooterMenu = () => {
  const { data: session } = useSession();
  return (
    <div className="space-y-5 flex flex-col items-center justify-center pb-6">
      <button className="w-11 h-11  mx-auto text-default-500 flex items-center justify-center  rounded-md transition-all duration-200 hover:bg-primary hover:text-primary-foreground">
        <Settings className=" h-8 w-8" />
      </button>
      <div>
        <div>
          {session?.user?.profileImage ? (
            <Image
              src={`${process.env.NEXT_PUBLIC_SITE_URL}${session.user.profileImage}`}
              alt={session?.user?.firstName ?? ""}
              width={36}
              height={36}
              className="rounded-full object-cover w-9 h-9"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold uppercase">
              {session?.user?.firstName?.charAt(0) || "U"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default FooterMenu;
