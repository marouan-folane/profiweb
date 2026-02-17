"use client";
import { useSession, signOut } from "next-auth/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icon } from "@iconify/react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils"; // Optional utility for classNames

const ProfileInfo = () => {
  const { data: session } = useSession();

  // Get first letter of firstName (fallback to 'U' for User if not available)
  const getFirstLetter = () => {
    const firstName = session?.user?.firstName;
    if (firstName && firstName.length > 0) {
      return firstName.charAt(0).toUpperCase();
    }
    return 'U'; // Default to 'U' for User
  };

  // Check if image exists
  const profileImage = session?.user?.profileImage;
  const hasImage = !!profileImage;
  const imageUrl = profileImage ? (profileImage.startsWith('http') ? profileImage : `${process.env.NEXT_PUBLIC_SITE_URL}${profileImage}`) : null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild className="cursor-pointer">
        <div className="flex items-center">
          {hasImage ? (
            <Image
              src={imageUrl}
              alt={session.user.firstName ?? ""}
              width={36}
              height={36}
              className="rounded-full object-cover w-9 h-9"
            />
          ) : (
            <div className="flex items-center justify-center w-9 h-9 rounded-full bg-primary text-white font-semibold text-sm capitalize">
              {getFirstLetter()}
            </div>
          )}
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 p-0" align="end">
        <DropdownMenuLabel className="flex gap-3 items-center mb-1 p-3">
          {hasImage ? (
            <Image
              src={imageUrl}
              alt={session.user.firstName ?? ""}
              width={40}
              height={40}
              className="rounded-full object-cover w-10 h-10"
            />
          ) : (
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-white font-semibold text-base capitalize">
              {getFirstLetter()}
            </div>
          )}
          <div>
            <div className="text-sm font-medium text-default-800 capitalize">
              {session?.user?.firstName}
            </div>
            <Link
              href="/dashboard"
              className="text-xs text-default-600 hover:text-primary"
            >
              @{session?.user?.username}
            </Link>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuSeparator className="mb-0 dark:bg-background" />
        <DropdownMenuItem
          onSelect={() => signOut()}
          className="flex items-center gap-2 text-sm font-medium text-default-600 capitalize my-1 px-3 dark:hover:bg-background cursor-pointer"
        >
          <Icon icon="heroicons:power" className="w-4 h-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
export default ProfileInfo;