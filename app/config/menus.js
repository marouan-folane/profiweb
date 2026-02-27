import {
  Users as UsersIcon,
  UserPlus,
  List,
  UserCog,
  Globe,
} from "lucide-react";

export const menusConfig = {
  mainMenu: [
    {
      title: "Users",
      icon: UsersIcon,
      roles: ["superadmin", "admin", "manager"],
      child: [
        {
          title: "List",
          icon: List,
          href: "/users",
          roles: ["superadmin", "admin", "manager"],
        },
        {
          title: "Create",
          icon: UserPlus,
          href: "/users/new",
          roles: ["superadmin", "admin", "manager"],
        },
      ]
    },
    {
      title: "Templates",
      icon: UserCog,
      roles: ["superadmin", "admin", "manager"],
      child: [
        {
          title: "List",
          icon: List,
          href: "/templates/list",
          roles: ["superadmin", "admin", "manager"],
        },
        {
          title: "Create",
          icon: UserPlus,
          href: "/templates/new",
          roles: ["superadmin", "admin", "manager"],
        },
        {
          title: "Global AI Interactions",
          icon: Globe,
          href: "/templates/global-interactions",
          roles: ["superadmin", "admin", "manager"],
        },
      ]
    },
    {
      title: "Projects",
      icon: UsersIcon,
      roles: ["superadmin", "admin", "manager", "d.s", "d.i", "d.in", "d.it", "d.d", "d.c", "c.m"],
      child: [
        {
          title: "List",
          icon: List,
          href: "/projects",
          roles: ["superadmin", "admin", "manager", "d.s", "d.i", "d.in", "d.it", "d.d", "d.c", "c.m"],
        },
        {
          title: "Create",
          icon: UserPlus,
          href: "/projects/new",
          roles: ["superadmin", "admin", "manager", "d.s"],
        },
      ]
    },
    {
      title: "Clients",
      icon: UsersIcon,
      roles: ["superadmin", "admin", "manager"],
      child: [
        {
          title: "List",
          icon: List,
          href: "/clients",
          roles: ["superadmin", "admin", "manager"],
        },
      ]
    },
  ],
  mainMesssnu: [
    {
      title: "asxasxasx",
      icon: UsersIcon,
      child: [
        {
          title: "List",
          icon: List,
          href: "/users",
        },
        {
          title: "Create",
          icon: UserPlus,
          href: "/users/new",
        },
      ]
    },
  ],
};