import { 
  Users as UsersIcon, 
  UserPlus, 
  List, 
  UserCog,
  MessageSquare,
  MessageCircle,
  Bot,
  Brain,
  Globe
} from "lucide-react";

export const menusConfig = {
  mainMenu: [
    {
      title: "Users",
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
    {
      title: "Templates",
      icon: UserCog,
      child: [
        {
          title: "List",
          icon: List,
          href: "/templates/list",
        },
        {
          title: "Create",
          icon: UserPlus,
          href: "/templates/new",
        },
        {
          title: "Global AI Interactions",
          icon: Globe,
          href: "/templates/global-interactions",
        },
      ]
    },
    {
      title: "Projects",
      icon: UsersIcon,
      child: [
        {
          title: "List",
          icon: List,
          href: "/projects",
        },
        {
          title: "Create",
          icon: UserPlus,
          href: "/projects/new",
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