import {
  Users as UsersIcon,
  UserPlus,
  List,
  UserCog,
  Globe,
  Palette,
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
      title: "AI Studio",
      icon: Globe,
      roles: ["superadmin", "admin", "manager"],
      child: [
        {
          title: "Global AI Interactions",
          icon: Globe,
          href: "/templates/global-interactions",
          roles: ["superadmin", "admin", "manager"],
        },
        {
          title: "List of design templates",
          icon: List,
          href: "/templates/list",
          roles: ["superadmin", "admin", "manager"],
        },
        {
          title: "Create design template",
          icon: UserPlus,
          href: "/templates/new",
          roles: ["superadmin", "admin", "manager"],
        },
      ]
    },
    {
      title: "Design",
      icon: Palette,
      roles: ["superadmin", "admin", "manager", "d.it"],
      child: [
        {
          title: "List of Designs",
          icon: List,
          href: "/templates/list",
          roles: ["superadmin", "admin", "manager", "d.it"],
        },
        {
          title: "Create Design",
          icon: UserPlus,
          href: "/templates/new",
          roles: ["superadmin", "admin", "manager", "d.it"],
        },
      ]
    },
    {
      title: "Questions",
      icon: List,
      href: "/questions",
      roles: ["superadmin", "admin"],
    },
    {
      title: "Projects",
      icon: UsersIcon,
      roles: ["superadmin", "admin", "manager", "d.s", "c.m", "d.d", "d.i", "d.inf", "d.c", "d.it", "d.in"],
      child: [
        {
          title: "List",
          icon: List,
          href: "/projects",
          roles: ["superadmin", "admin", "manager", "d.s", "c.m", "d.d", "d.i", "d.inf", "d.c", "d.it", "d.in"],
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
      href: "/clients",
      roles: ["superadmin", "admin", "manager"],
      
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