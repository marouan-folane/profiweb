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

      // Check for exact matches in children first (more specific)
      for (const item of menusConfig.mainMenu) {
        if (item.child) {
          for (const child of item.child) {
            if (currentPath === child.href) {
              foundItem = child;
              // Also check if parent is restricted
              if (item.roles && !item.roles.map(r => r.toLowerCase()).includes(userRole)) {
                return false;
              }
              break;
            }
          }
        }
        if (foundItem) break;
      }

      // If not found in exact children, check parents or partial matches
      if (!foundItem) {
        for (const item of menusConfig.mainMenu) {
          if (isLocationMatch(item.href, currentPath)) {
            foundItem = item;
            
            // If it matches a parent, but we are deeper in child paths, 
            // check if there's a more specific child match (partial)
            if (item.child) {
              for (const child of item.child) {
                if (isLocationMatch(child.href, currentPath)) {
                  foundItem = child;
                  break;
                }
              }
            }
            break;
          }
          
          // Additional check: if the path starts with a menu item's href (like /clients/123)
          // we should apply the parent's roles even if it's not a direct match
          if (item.href && item.href !== "/" && currentPath.startsWith(item.href + "/")) {
            foundItem = item;
            break;
          }

          // Also check children's hrefs for sub-paths (like /users/new/something)
          if (item.child) {
             const childMatch = item.child.find(c => c.href && c.href !== "/" && currentPath.startsWith(c.href + "/"));
             if (childMatch) {
                foundItem = childMatch;
                // If parent is restricted, respect that too
                if (item.roles && !item.roles.map(r => r.toLowerCase()).includes(userRole)) {
                  return false;
                }
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

      // If route not in menusConfig, we might want to allow it or check other patterns
      // For now, let's allow routes that are not explicitly defined in menusConfig
      // but we can be stricter later if needed.
      return true;
    };

    const authorized = checkAuthorization();
    setIsAuthorized(authorized);
    setChecking(false);

    if (!authorized) {
      // Redirect to a default page if not authorized
      router.push("/projects");
    }
  }, [session, status, currentPath, userRole, router]);

  if (status === "loading" || checking) {
    return <LayoutLoader />;
  }

  return isAuthorized ? <>{children}</> : null;
};

export default RoleGuard;
