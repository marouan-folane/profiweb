"use client";
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { getAdminDashboardStats } from "@/config/functions/stats";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import {
  Users,
  Briefcase,
  FileText,
  Layout,
  TrendingUp,
  AlertCircle,
  Loader2
} from "lucide-react";
import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect } from "react";

// Dynamic import for ApexCharts to avoid SSR issues
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

const DashboardPageView = ({ trans, lang }) => {
  const { data: session } = useSession();

  const { theme } = useTheme();
  const isDarkMode = theme === "dark";

  const router = useRouter();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["admin-dashboard-stats"],
    queryFn: getAdminDashboardStats,
  });

  useEffect(() => {
    if (session?.user?.role !== "superadmin") {
      // router.push("/projects");
    }
    console.log("session?.user?.role => ", session?.user?.role === "superadmin");
  }, [session]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
        <p className="text-muted-foreground animate-pulse">
          {trans?.loading_stats || "Loading statistics..."}
        </p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h3 className="text-xl font-semibold mb-2">Failed to load statistics</h3>
        <p className="text-muted-foreground max-w-md">
          {error?.message || "An unexpected error occurred while fetching dashboard data."}
        </p>
      </div>
    );
  }

  const { summary, projectByStatus, userGrowth, projectsByCategory } = data?.data || {};

  // Summary Cards Configuration
  const statsCards = [
    {
      title: "Total Users",
      value: summary?.totalUsers || 0,
      icon: Users,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      title: "Total Projects",
      value: summary?.totalProjects || 0,
      icon: Briefcase,
      color: "text-orange-500",
      bg: "bg-orange-500/10",
    },
    {
      title: "Total Clients",
      value: summary?.totalClients || 0,
      icon: FileText,
      color: "text-green-500",
      bg: "bg-green-500/10",
    },
    {
      title: "Active Templates",
      value: summary?.totalTemplates || 0,
      icon: Layout,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
    },
  ];

  // User Growth Chart Configuration
  const growthOptions = {
    chart: {
      type: "area",
      toolbar: { show: false },
      sparkline: { enabled: false },
    },
    dataLabels: { enabled: false },
    stroke: { curve: "smooth", width: 2 },
    colors: ["#3b82f6"],
    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.4,
        opacityTo: 0.1,
        stops: [0, 90, 100],
      },
    },
    xaxis: {
      categories: userGrowth?.map(g => {
        const date = new Date(g._id.year, g._id.month - 1);
        return date.toLocaleString('default', { month: 'short' });
      }) || [],
      labels: {
        style: { colors: isDarkMode ? "#94a3b8" : "#64748b" }
      }
    },
    yaxis: {
      labels: {
        style: { colors: isDarkMode ? "#94a3b8" : "#64748b" }
      }
    },
    grid: {
      borderColor: isDarkMode ? "#1e293b" : "#e2e8f0",
      strokeDashArray: 4,
    },
    tooltip: { theme: isDarkMode ? "dark" : "light" }
  };

  const growthSeries = [
    {
      name: "New Users",
      data: userGrowth?.map(g => g.count) || [],
    },
  ];

  // Projects by Status Chart Configuration
  const statusOptions = {
    chart: { type: "donut" },
    labels: projectByStatus?.map(s => s._id || "Unknown") || [],
    colors: ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"],
    legend: {
      position: "bottom",
      labels: { colors: isDarkMode ? "#94a3b8" : "#64748b" }
    },
    dataLabels: { enabled: false },
    plotOptions: {
      pie: {
        donut: {
          size: "65%",
          labels: {
            show: true,
            total: {
              show: true,
              label: "Projects",
              color: isDarkMode ? "#e2e8f0" : "#1e293b"
            }
          }
        }
      }
    },
    stroke: { show: false },
    tooltip: { theme: isDarkMode ? "dark" : "light" }
  };

  const statusSeries = projectByStatus?.map(s => s.count) || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Superadmin Dashboard</h1>
          <p className="text-muted-foreground">
            Real-time insights and platform activity overview.
          </p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((card, index) => (
          <Card key={index} className="overflow-hidden border-none shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${card.bg}`}>
                  <card.icon className={`h-6 w-6 ${card.color}`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {card.title}
                  </p>
                  <h3 className="text-2xl font-bold">{card.value}</h3>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* User Growth Chart */}
        <div className="xl:col-span-2">

          {/* Platform Health/Info */}
          <Card className="shadow-md bg-white to-transparent border-primary/10">
            <CardHeader>
              <CardTitle>Platform Quick Actions</CardTitle>
              <CardDescription>Common administrative tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Manage Users", href: "/users", icon: Users },
                  { label: "Project List", href: "/projects", icon: Briefcase },
                  { label: "AI Templates", href: "/templates", icon: Layout },
                  { label: "Site Analytics", href: "/accesses", icon: TrendingUp },
                ].map((action, idx) => (
                  <a
                    key={idx}
                    href={`/${lang}${action.href}`}
                    className="flex flex-col items-center justify-center p-4 rounded-xl border bg-background hover:bg-accent transition-colors gap-2 text-center shadow-sm"
                  >
                    <action.icon className="h-5 w-5 text-primary" />
                    <span className="text-xs font-semibold">{action.label}</span>
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Project Status Distribution */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Project Status</CardTitle>
            <CardDescription>Distribution of projects by current status</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="h-[300px] w-full">
              <Chart
                options={statusOptions}
                series={statusSeries}
                type="donut"
                height="100%"
                width="100%"
              />
            </div>
          </CardContent>
        </Card>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-6">

      </div>

    </div>
  );
};

export default DashboardPageView;
