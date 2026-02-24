// app/[lang]/(dashboard)/projects/[id]/overview/page.jsx
"use client";
import { useEffect, useState } from "react";
import QuestionsTab from "./QuestionsTab";
import FoldersTab from "./FoldersTab";
import GeneratedTab from "./GeneratedTab";
import AccessesTab from "./AccessesTab";
import { getProject } from "@/config/functions/project";
import { getSiteAccess } from "@/config/functions/access";
import { useParams } from "next/navigation";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Icon } from "@iconify/react";
import { Badge } from "@/components/ui/badge";
import DesignChecklistModal from "./DesignChecklistModal";

const Overview = () => {
  const params = useParams();
  const projectId = params.id;
  const queryClient = useQueryClient();

  const { data: session } = useSession();

  const [activeTab, setActiveTab] = useState("questions"); // Default to questions tab
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [lastActiveTab, setLastActiveTab] = useState("questions");
  const [isDesignModalOpen, setIsDesignModalOpen] = useState(false);
  const [websiteDomain, setWebsiteDomain] = useState("");

  useEffect(() => {
    const setDefaultTabByRole = () => {
      if (!session?.user?.role) return;

      const role = session.user.role;

      // Configuration object for role-to-tab mappings
      const roleTabConfig = {
        'superadmin': 'questions',
        'admin': 'questions',
        'd.i': 'questions',
        'd.it': 'accesses',
        'd.c': 'folders',
        'd.d': 'folders',
        'd.s': 'questions',
        'd.in': 'accesses',
      };

      // Get the tab for the role
      const defaultTab = roleTabConfig[role];

      if (defaultTab) {
        setActiveTab(defaultTab);
      } else if (role.startsWith('d.')) {
        setActiveTab('folders');
      } else {
        setActiveTab('questions');
      }
    };

    setDefaultTabByRole();
  }, [session]);

  // Fetch site access domain for Designer role
  useEffect(() => {
    const fetchDomainForDesigner = async () => {
      if (session?.user?.role === "d.d" && projectId) {
        try {
          const response = await getSiteAccess(projectId);
          if (response?.data?.domain?.name) {
            setWebsiteDomain(response.data.domain.name);
          }
        } catch (err) {
          console.error("Error fetching site access for designer:", err);
        }
      }
    };
    fetchDomainForDesigner();
  }, [session, projectId]);

  // React Query for fetching project data
  const {
    data: projectData,
    isLoading,
    error,
    refetch: refetchProject
  } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => getProject(projectId),
    enabled: !!projectId, // Only run if projectId exists
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Handle tab change with refresh
  const handleTabChange = (tabName) => {
    // If switching to a different tab, refresh data
    if (tabName !== activeTab) {
      setActiveTab(tabName);
      setLastActiveTab(activeTab);

      // Invalidate and refetch project data
      queryClient.invalidateQueries(['project', projectId]);
      refetchProject();

      // Invalidate other relevant queries based on tab
      switch (tabName) {
        case 'folders':
          queryClient.invalidateQueries(['folders']);
          break;
        case 'questions':
          queryClient.invalidateQueries(['questions']);
          break;
        case 'generated':
          queryClient.invalidateQueries(['generated']);
          break;
      }
    }
  };

  // Extract project data from API response
  const project = projectData?.data?.project || {};

  // Get project title and description
  const projectTitle = project?.title || "";
  const projectDescription = project?.description || "";
  const shortDescription = project?.shortDescription || "";
  const clientName = project?.client?.name || "";

  // if (formSubmitted) {
  //   return (
  //     <div className="min-h-screen bg-gray-50 flex items-center justify-center">
  //       <div className="max-w-md w-full mx-4">
  //         <div className="bg-white rounded-lg shadow-lg p-8 text-center">
  //           <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
  //             <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
  //               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
  //             </svg>
  //           </div>
  //           <h1 className="text-2xl font-bold text-gray-900 mb-3">Success!</h1>
  //           <p className="text-gray-600 mb-6">
  //             Your information has been submitted successfully. PDFs are being generated.
  //           </p>
  //           <button
  //             onClick={() => window.location.reload()}
  //             className="w-full bg-primary text-white font-medium py-3 px-6 rounded-md hover:bg-primary-dark transition-colors"
  //           >
  //             Start New Form
  //           </button>
  //         </div>
  //       </div>
  //     </div>
  //   );
  // }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading project data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full mx-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <div className="text-red-600 mb-2">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-red-900 mb-2">Error Loading Project</h3>
            <p className="text-red-700 mb-4">Failed to load project data. Please try again.</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto px-4 py-8">
        {/* Project Header */}
        <div className="mb-0">
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 mb-3">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">{projectTitle}</h1>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm text-gray-600">Client:</span>
                      <span className="text-sm font-medium text-gray-800">{clientName}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-1">Project Description</h3>
                    <p className="text-gray-800">{projectDescription}</p>
                  </div>

                  {shortDescription && shortDescription !== "No short description available" && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-1">Short Description</h3>
                      <p className="text-gray-600">{shortDescription}</p>
                    </div>
                  )}

                  {/* Website Domain — visible only for Designer role when domain exists */}
                  {session?.user?.role === "d.d" && websiteDomain && (
                    <div className="pt-1">
                      <a
                        href={websiteDomain.startsWith("http") ? websiteDomain : `https://${websiteDomain}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-3 px-4 py-2.5 rounded-xl bg-primary/5 border border-primary/15 hover:bg-primary/10 hover:border-primary/30 transition-all group w-fit"
                      >
                        {/* Globe icon */}
                        <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary flex-shrink-0">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" />
                          </svg>
                        </span>

                        {/* Domain text */}
                        <span className="text-sm font-semibold text-primary leading-none">
                          {websiteDomain}
                        </span>

                        {/* External link arrow */}
                        <svg className="w-3.5 h-3.5 text-primary/50 group-hover:text-primary transition-colors ml-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    </div>
                  )}
                </div>

                {/* Designer Confirm Button */}
                {session?.user?.role === "d.d" && (
                  <div className="mt-4 pt-4 border-t border-gray-100 flex justify-start">
                    {project.designStatus === 'completed' ? (
                      <Badge color="success" variant="soft" className="px-4 py-2">
                        <span className="inline-flex items-center gap-2 text-sm">
                          <Icon icon="lucide:check-circle" className="w-5 h-5" />
                          Design Workflow Completed
                        </span>
                      </Badge>
                    ) : (
                      <Button
                        variant="outline"
                        className="gap-2 border-pink-200 text-pink-700 hover:bg-pink-50 hover:text-pink-800 font-bold px-6 py-2 transition-all active:scale-95"
                        onClick={() => setIsDesignModalOpen(true)}
                      >
                        <Icon icon="lucide:palette" className="w-5 h-5" />
                        Confirm Work (Design Department)
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {/* Refresh Button */}
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => {
                    queryClient.invalidateQueries(['project', projectId]);
                    refetchProject();
                  }}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh
                </button>
                <div className="text-xs text-gray-500">
                  Last updated: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Card with Tabs */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 mb-8">

          {/* Tabs Navigation */}
          <div className="border-b border-gray-200">
            <nav className="flex">

              {["superadmin", "d.s", "d.i"].includes(session?.user?.role) && (
                <button
                  onClick={() => handleTabChange("questions")}
                  className={`px-6 py-4 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${activeTab === "questions"
                    ? "border-primary text-primary"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                >
                  Questions
                  {activeTab === "questions" && isLoading && (
                    <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                </button>
              )}




              {(["superadmin", "d.d", "d.c", "d.s", "d.in"].includes(session?.user?.role) || (session?.user?.role === 'd.it' && ((project.itStatus === 'setup_validated' && project.contentStatus === 'completed') || project.itStatus === 'integration_completed'))) && (
                <button
                  onClick={() => handleTabChange("folders")}
                  className={`px-6 py-4 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${activeTab === "folders"
                    ? "border-primary text-primary"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                >
                  Folders
                  {activeTab === "folders" && isLoading && (
                    <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                </button>
              )}

              {["d.it", "d.in"].includes(session?.user?.role) && (
                <button
                  onClick={() => handleTabChange("accesses")}
                  className={`px-6 py-4 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${activeTab === "accesses"
                    ? "border-primary text-primary"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                >
                  {(project.itStatus === 'setup_validated' && project.contentStatus === 'completed') || project.itStatus === 'integration_completed' ? "Integration" : "Accesses"}
                  {activeTab === "accesses" && isLoading && (
                    <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                </button>
              )}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === "questions" && (
              <QuestionsTab setFormSubmitted={setFormSubmitted} projectId={projectId} />
            )}
            {activeTab === "folders" && <FoldersTab projectId={projectId} />}
            {activeTab === "generated" && <GeneratedTab projectId={projectId} />}
            {activeTab === "accesses" && <AccessesTab projectId={projectId} />}
          </div>
        </div>
      </div>

      <DesignChecklistModal
        isOpen={isDesignModalOpen}
        onClose={() => setIsDesignModalOpen(false)}
        onSuccess={() => {
          queryClient.invalidateQueries(['project', projectId]);
          refetchProject();
        }}
        projectId={projectId}
        projectTitle={projectTitle}
      />
    </div>
  );
};

export default Overview;