"use client";
import React, { useEffect } from "react";
import { cn } from "@/lib/utils";
import { useSidebar, useThemeStore } from "@/store";
import ProfileInfo from "./profile-info";
import HorizontalHeader from "./horizontal-header";
import HorizontalMenu from "./horizontal-menu";
import { useMediaQuery } from "@/hooks/use-media-query";
import MobileMenuHandler from "./mobile-menu-handler";
import ClassicHeader from "./layout/classic-header";
import FullScreen from "./full-screen";
import ThemeButton from "./theme-button";
import { useSession } from "next-auth/react";

// Static roles array based on your schema
export const USER_ROLES = [
  'superadmin',
  'admin',
  'user',
  'd.s',
  'd.i',
  'd.inf',
  'd.c',
  'd.d',
  'd.it',
  'd.in',
  'c.m'
];

// Helper function to check if user has required role
export const hasRequiredRole = (userRole, requiredRole) => {
  // Define role hierarchy - higher number means higher privilege
  const roleHierarchy = {
    'superadmin': 9,
    'admin': 8,
    'd.s': 7,
    'd.i': 6,
    'd.inf': 5,
    'd.c': 4,
    'd.d': 3,
    'd.it': 2,
    'd.in': 2,
    'c.m': 2,
    'user': 1
  };

  const userLevel = roleHierarchy[userRole] || 0;
  const requiredLevel = roleHierarchy[requiredRole] || 0;

  return userLevel >= requiredLevel;
};

// Role badge component for displaying role
export const RoleBadge = ({ role }) => {
  const getRoleColor = (role) => {
    switch (role) {
      case 'superadmin': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'admin': return 'bg-red-100 text-red-800 border-red-200';
      case 'd.s': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'd.i': return 'bg-green-100 text-green-800 border-green-200';
      case 'd.inf': return 'bg-cyan-100 text-cyan-800 border-cyan-200';
      case 'd.c': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'd.d': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'd.it': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'd.in': return 'bg-teal-100 text-teal-800 border-teal-200';
      case 'c.m': return 'bg-violet-100 text-violet-800 border-violet-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRoleDisplayName = (role) => {
    const displayNames = {
      'superadmin': 'Super Admin',
      'admin': 'Admin',
      'd.s': 'D. Sales',
      'd.i': 'D. Information',
      'd.inf': 'D. Info',
      'd.c': 'D. Content',
      'd.d': 'D. Design',
      'd.it': 'D. IT',
      'd.in': 'D. Integration',
      'c.m': 'Control Manager',
      'user': 'User'
    };
    return displayNames[role] || role;
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRoleColor(role)}`}>
      {getRoleDisplayName(role)}
    </span>
  );
};

// Component for conditional rendering based on role
export const RoleProtected = ({
  children,
  requiredRole,
  userRole,
  fallback = null
}) => {
  if (!userRole) return fallback;
  return hasRequiredRole(userRole, requiredRole) ? children : fallback;
};

const NavTools = ({ isDesktop, isMobile, sidebarType, userRole }) => {
  return (
    <div className="nav-tools flex items-center gap-2">
      {isDesktop && <FullScreen />}

      {/* Example: Display role badge for superadmin */}
      {isDesktop && userRole === 'superadmin' && (
        <div className="flex items-center gap-2">
          <div className="text-xs font-medium text-yellow-600">⚡ Super Admin Mode</div>
          <RoleBadge role={userRole} />
        </div>
      )}
      <ThemeButton />
      <div className="ltr:pl-2 rtl:pr-2">
        <ProfileInfo userRole={userRole} />
      </div>

      {!isDesktop && sidebarType !== "module" && <MobileMenuHandler />}
    </div>
  );
};

const Header = ({ handleOpenSearch, trans }) => {
  const { data: session, status } = useSession();
  const { sidebarType, setSidebarType } = useSidebar();
  const { layout } = useThemeStore();

  const isDesktop = useMediaQuery("(min-width: 1280px)");
  const isMobile = useMediaQuery("(min-width: 768px)");

  // Get user role directly from session
  const userRole = session?.user?.role || null;

  // Log role for debugging
  useEffect(() => {
    if (userRole) {
      console.log("Current User Role: ", userRole);
      console.log("User has admin access: ", hasRequiredRole(userRole, 'admin'));
      console.log("User has d.i access: ", hasRequiredRole(userRole, 'd.i'));
    }
  }, [userRole]);

  // Set header style to classic if not desktop
  React.useEffect(() => {
    if (!isDesktop && layout === "horizontal") {
      setSidebarType("classic");
    }
  }, [isDesktop, layout, setSidebarType]);

  // Show loading state while session is loading
  if (status === "loading") {
    return (
      <ClassicHeader>
        <div className="w-full bg-card/90 backdrop-blur-lg md:px-6 px-[15px] py-3 border-b border-solid border-border!">
          <div className="flex justify-between items-center h-full">
            <div className="flex items-center gap-2">
              <div className="animate-pulse h-6 w-32 bg-gray-200 rounded"></div>
            </div>
            <div className="animate-pulse h-8 w-8 rounded-full bg-gray-200"></div>
          </div>
        </div>
      </ClassicHeader>
    );
  }

  // Check if user is authenticated
  if (!session && status === "unauthenticated") {
    // Optionally handle unauthenticated state
    // Or just show minimal header
  }

  return (
    <ClassicHeader
      className={cn({
        "sticky top-0 z-50": true,
      })}
    >
      <div className="w-full bg-card/90 backdrop-blur-lg md:px-6 px-[15px] py-3 border-b border-solid border-border!">
        <div className="flex justify-between items-center h-full">
          <HorizontalHeader
            handleOpenSearch={handleOpenSearch}
            userRole={userRole}
          />
          <NavTools
            isDesktop={isDesktop}
            isMobile={isMobile}
            sidebarType={sidebarType}
            userRole={userRole}
          />
        </div>
      </div>

      {isDesktop && userRole && (
        <div className="bg-card/90 backdrop-blur-lg w-full px-6 shadow-md">
          <HorizontalMenu
            trans={trans}
            userRole={userRole}
          />
        </div>
      )}
    </ClassicHeader>
  );
};

export default Header;