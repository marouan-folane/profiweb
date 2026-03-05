"use client";
import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { menusConfig } from "@/config/menus";
import { getDynamicPath, isLocationMatch } from "@/lib/utils";
import LayoutLoader from "@/components/layout-loader";

const RoleGuard = ({ children }) => {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);

  const userRole = session?.user?.role?.toLowerCase();
  const currentPath = getDynamicPath(pathname);

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/auth/login");
      return;
    }

    // Role-based route check
    const checkAuthorization = () => {
      // Allow root or common paths if necessary
      if (currentPath === "/") {
        return true;
      }

      // Find the menu item matching the current path
      let foundItem = null;

      // Filter menus based on user role first
      const accessibleMenus = menusConfig.mainMenu.filter(item =>
        !item.roles || item.roles.map(r => r.toLowerCase()).includes(userRole)
      );

      // Check for exact matches in children first (more specific)
      for (const item of accessibleMenus) {
        if (item.child) {
          for (const child of item.child) {
            if (currentPath === child.href) {
              // Only consider children that the user has access to
              if (!child.roles || child.roles.map(r => r.toLowerCase()).includes(userRole)) {
                foundItem = child;
                break;
              }
            }
          }
        }
        if (foundItem) break;
      }

      // If not found in exact children, check parents or partial matches
      if (!foundItem) {
        for (const item of accessibleMenus) {
          if (isLocationMatch(item.href, currentPath)) {
            foundItem = item;

            // If it matches a parent, but we are deeper in child paths, 
            // check if there's a more specific child match (partial)
            if (item.child) {
              for (const child of item.child) {
                if (isLocationMatch(child.href, currentPath)) {
                  if (!child.roles || child.roles.map(r => r.toLowerCase()).includes(userRole)) {
                    foundItem = child;
                    break;
                  }
                }
              }
            }
            break;
          }

          // Additional check: if the path starts with a menu item's href (like /clients/123)
          if (item.href && item.href !== "/" && currentPath.startsWith(item.href + "/")) {
            foundItem = item;
            break;
          }

          // Also check children's hrefs for sub-paths
          if (item.child) {
            const childMatch = item.child.find(c =>
              c.href && c.href !== "/" &&
              currentPath.startsWith(c.href + "/") &&
              (!c.roles || c.roles.map(r => r.toLowerCase()).includes(userRole))
            );
            if (childMatch) {
              foundItem = childMatch;
              break;
            }
          }
        }
      }

      if (foundItem) {
        // If the item has specific roles defined, check if user has one
        if (foundItem.roles) {
          return foundItem.roles.map(r => r.toLowerCase()).includes(userRole);
        }
        return true;
      }

      // Special case: Always allow /projects as it's the landing page for most roles
      // High-level backend RBAC will handle item-level visibility
      if (currentPath === "/projects") {
        return true;
      }

      // If route not in menusConfig, allow it
      return true;
    };

    const authorized = checkAuthorization();
    setIsAuthorized(authorized);
    setChecking(false);

    if (!authorized) {
      // Get lang from pathname to properly redirect
      const langMatch = pathname.match(/^\/([a-z]{2})/);
      const lang = langMatch ? langMatch[1] : 'en';
      router.push(`/${lang}/projects`);
    }
  }, [session, status, currentPath, userRole, router, pathname]);

  if (status === "loading" || checking) {
    return <LayoutLoader />;
  }

  return isAuthorized ? <>{children}</> : null;
};

export default RoleGuard;
