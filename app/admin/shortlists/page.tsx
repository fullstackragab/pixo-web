"use client";

import { useState, useEffect, useCallback, Suspense, useMemo } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import api from "@/lib/api";
import { HiringLocation } from "@/types";

interface AdminShortlist {
  id: string;
  companyId?: string;
  companyName: string;
  roleTitle: string;
  techStackRequired?: string[];
  seniorityRequired?: string | number | null;
  locationPreference?: string | null;
  hiringLocation?: HiringLocation;
  remoteAllowed?: boolean;
  additionalNotes?: string | null;
  status: string;
  pricePaid: number | null;
  candidatesCount: number;
  createdAt: string;
  completedAt: string | null;
}

// Normalize seniority to display label
const normalizeSeniority = (seniority: string | number | null | undefined): string => {
  if (seniority === null || seniority === undefined) return 'Any';
  if (typeof seniority === 'number') {
    const labels = ['Junior', 'Mid', 'Senior', 'Lead', 'Principal'];
    return labels[seniority] || 'Any';
  }
  // Capitalize first letter if string
  return seniority.charAt(0).toUpperCase() + seniority.slice(1).toLowerCase();
};


function AdminShortlistsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialStatus = searchParams.get("status") || "all";

  const [shortlists, setShortlists] = useState<AdminShortlist[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>(initialStatus);
  const [searchQuery, setSearchQuery] = useState("");

  // Calculate age in days for urgency indicators
  const getAgeDays = (dateString: string): number => {
    const date = new Date(dateString);
    const now = new Date();
    return Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  };

  // Get urgency class based on status and age
  const getUrgencyClass = (shortlist: AdminShortlist): string => {
    const status = shortlist.status.toLowerCase();
    if (status === 'completed' || status === 'cancelled') return '';

    const ageDays = getAgeDays(shortlist.createdAt);
    if (status === 'pending') {
      if (ageDays >= 2) return 'bg-red-50 border-l-4 border-l-red-500';
      if (ageDays >= 1) return 'bg-orange-50 border-l-4 border-l-orange-500';
    }
    if (status === 'processing' && ageDays >= 5) {
      return 'bg-yellow-50 border-l-4 border-l-yellow-500';
    }
    return '';
  };

  // Filter shortlists by status and search query (client-side)
  const filteredShortlists = useMemo(() => {
    let filtered = shortlists;

    // Filter by status (handle grouped statuses)
    if (filterStatus !== 'all') {
      filtered = filtered.filter(s => {
        const status = s.status.toLowerCase();
        switch (filterStatus) {
          case 'processing':
            return status === 'processing' || status === 'matching';
          case 'pricingpending':
            return status === 'pricingpending' || status === 'pricingrequested';
          case 'completed':
            return status === 'completed' || status === 'paymentcaptured';
          default:
            return status === filterStatus;
        }
      });
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(s =>
        s.companyName.toLowerCase().includes(query) ||
        s.roleTitle.toLowerCase().includes(query) ||
        s.id.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [shortlists, filterStatus, searchQuery]);

  // Calculate status counts for filter buttons
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: shortlists.length };
    shortlists.forEach(s => {
      const status = s.status.toLowerCase();
      counts[status] = (counts[status] || 0) + 1;
    });
    return counts;
  }, [shortlists]);

  // Navigate to detail page
  const handleRowClick = (shortlistId: string) => {
    router.push(`/admin/shortlists/${shortlistId}`);
  };

  // Normalize status from backend (could be number or string)
  const normalizeStatus = (status: string | number): string => {
    if (typeof status === 'number') {
      const statusMap: Record<number, string> = {
        0: 'pending',
        1: 'processing',
        2: 'completed',
        3: 'cancelled'
      };
      return statusMap[status] || 'pending';
    }
    // Remove underscores and lowercase for consistency
    return status.toLowerCase().replace(/_/g, '');
  };

  const loadShortlists = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    // Always load all shortlists to get accurate counts, filter client-side
    const url = `/admin/shortlists?page=${page}&pageSize=100`;

    try {
      const res = await api.get<AdminShortlist[]>(url);
      if (res.success && res.data) {
        // Normalize status values from backend
        const normalizedData = res.data.map(s => ({
          ...s,
          status: normalizeStatus(s.status)
        }));
        setShortlists(normalizedData);
        setTotalCount(normalizedData.length);
      } else {
        setError(res.error || "Failed to load shortlists");
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  }, [page]);

  useEffect(() => {
    loadShortlists();
  }, [loadShortlists]);

  const updateStatus = async (shortlistId: string, newStatus: string) => {
    try {
      const res = await api.put(`/admin/shortlists/${shortlistId}/status`, {
        status: newStatus,
      });
      if (res.success) {
        setShortlists((prev) =>
          prev.map((s) => (s.id === shortlistId ? { ...s, status: newStatus } : s))
        );
      } else {
        setError(res.error || "Failed to update status");
      }
    } catch {
      setError("Failed to update status");
    }
  };

  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase().replace(/_/g, '');
    switch (s) {
      case "draft":
        return <Badge variant="default">Draft</Badge>;
      case "pending":
        return <Badge variant="warning">Pending</Badge>;
      case "submitted":
        return <Badge variant="primary">Submitted</Badge>;
      case "processing":
      case "matching":
        return <Badge variant="primary">Processing</Badge>;
      case "readyforpricing":
        return <Badge variant="warning">Ready for Pricing</Badge>;
      case "pricingpending":
      case "pricingrequested":
        return <Badge variant="warning">Awaiting Approval</Badge>;
      case "pricingapproved":
        return <Badge variant="success">Approved</Badge>;
      case "completed":
      case "delivered":
        return <Badge variant="success">Delivered</Badge>;
      case "paymentcaptured":
        return <Badge variant="success">Complete</Badge>;
      case "cancelled":
        return <Badge variant="danger">Cancelled</Badge>;
      default:
        // Format unknown status in title case
        const displayStatus = s.replace(/([a-z])([A-Z])/g, '$1 $2')
          .replace(/^./, str => str.toUpperCase());
        return <Badge variant="default">{displayStatus}</Badge>;
    }
  };

  const getSeniorityLabel = (seniority: string | number | null | undefined) => {
    return normalizeSeniority(seniority);
  };

  const getHiringLocationDisplay = (shortlist: AdminShortlist) => {
    // Prefer structured hiringLocation
    if (shortlist.hiringLocation) {
      const hl = shortlist.hiringLocation;
      if (hl.displayText) return { text: hl.displayText, isRemote: hl.isRemote };

      const parts = [];
      if (hl.city) parts.push(hl.city);
      if (hl.country) parts.push(hl.country);

      const locationStr = parts.length > 0 ? parts.join(", ") : null;

      if (hl.isRemote && locationStr) {
        return { text: `${locationStr} · Remote-friendly`, isRemote: true };
      } else if (hl.isRemote) {
        return { text: "Remote", isRemote: true };
      } else if (locationStr) {
        return { text: locationStr, isRemote: false };
      }
    }

    // Fall back to legacy fields
    return {
      text: shortlist.locationPreference || "Any",
      isRemote: shortlist.remoteAllowed || false,
    };
  };

  // Pagination based on filtered results
  const totalPages = Math.ceil(filteredShortlists.length / pageSize);
  const paginatedShortlists = filteredShortlists.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div>
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-2 text-red-500 hover:text-red-700"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="flex items-center justify-between mb-6 sm:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            Shortlist Requests
          </h1>
          <p className="text-gray-500 mt-1 text-sm sm:text-base">
            {filterStatus === 'all'
              ? `${totalCount} total requests`
              : `${filteredShortlists.length} ${filterStatus} (${totalCount} total)`
            }
          </p>
        </div>
      </div>

      {/* Search + Filters */}
      <Card className="mb-4 sm:mb-6" padding="sm">
        <div className="flex flex-col gap-3">
          {/* Search Bar */}
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search by company, role, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Status Filters */}
          <div className="flex flex-wrap gap-2">
            {[
              { key: "all", label: "All" },
              { key: "pending", label: "Pending" },
              { key: "submitted", label: "Submitted" },
              { key: "processing", label: "Processing" },
              { key: "pricingpending", label: "Awaiting Approval" },
              { key: "pricingapproved", label: "Approved" },
              { key: "delivered", label: "Delivered" },
              { key: "completed", label: "Complete" },
            ].map(({ key, label }) => {
                // Count matching statuses (some statuses group together)
                let count = 0;
                if (key === 'all') {
                  count = shortlists.length;
                } else if (key === 'processing') {
                  count = (statusCounts['processing'] || 0) + (statusCounts['matching'] || 0);
                } else if (key === 'pricingpending') {
                  count = (statusCounts['pricingpending'] || 0) + (statusCounts['pricingrequested'] || 0);
                } else if (key === 'delivered') {
                  count = (statusCounts['delivered'] || 0);
                } else if (key === 'completed') {
                  count = (statusCounts['completed'] || 0) + (statusCounts['paymentcaptured'] || 0);
                } else {
                  count = statusCounts[key] || 0;
                }

                const isUrgent = (key === 'pending' || key === 'submitted') && count > 0;
                const isSelected = filterStatus === key;

                // Skip filters with 0 count (except All)
                if (count === 0 && key !== 'all') return null;

                return (
                  <button
                    key={key}
                    onClick={() => {
                      setFilterStatus(key);
                      setPage(1);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                      isSelected
                        ? "bg-blue-600 text-white"
                        : isUrgent
                          ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {label}
                    {count > 0 && (
                      <span className={`px-1.5 py-0.5 text-xs rounded-full ${
                        isSelected
                          ? "bg-blue-500 text-white"
                          : isUrgent
                            ? "bg-yellow-200 text-yellow-800"
                            : "bg-gray-200 text-gray-600"
                      }`}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              }
            )}
          </div>
        </div>
      </Card>

      {/* Shortlists Table */}
      <Card>
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : paginatedShortlists.length > 0 ? (
          <>
            {/* Mobile card view */}
            <div className="lg:hidden space-y-3">
              {paginatedShortlists.map((shortlist) => {
                const ageDays = getAgeDays(shortlist.createdAt);
                const urgencyClass = getUrgencyClass(shortlist);
                return (
                  <div
                    key={shortlist.id}
                    onClick={() => handleRowClick(shortlist.id)}
                    className={`border border-gray-200 rounded-lg p-3 cursor-pointer hover:border-blue-300 transition-colors ${urgencyClass}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-900">{shortlist.roleTitle}</p>
                        <p className="text-sm text-gray-500">{shortlist.companyName}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {getStatusBadge(shortlist.status)}
                        {ageDays > 0 && (shortlist.status.toLowerCase() === 'pending' || shortlist.status.toLowerCase() === 'processing') && (
                          <span className={`text-xs ${ageDays >= 2 ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                            {ageDays}d old
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Tech Stack */}
                    {shortlist.techStackRequired && shortlist.techStackRequired.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {shortlist.techStackRequired.slice(0, 3).map((tech, i) => (
                          <Badge key={i} variant="default">{tech}</Badge>
                        ))}
                        {shortlist.techStackRequired.length > 3 && (
                          <Badge variant="default">+{shortlist.techStackRequired.length - 3}</Badge>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex gap-4 text-gray-500">
                        <span>{getSeniorityLabel(shortlist.seniorityRequired)}</span>
                        <span>{shortlist.candidatesCount} candidates</span>
                      </div>
                      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                        {shortlist.status.toLowerCase() === "pending" && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => updateStatus(shortlist.id, "processing")}
                          >
                            Start
                          </Button>
                        )}
                        {shortlist.status.toLowerCase() === "processing" && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => updateStatus(shortlist.id, "completed")}
                          >
                            Complete
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop table view */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Role / Company
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Tech Stack
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Level
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Location
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                      #
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Age
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginatedShortlists.map((shortlist) => {
                    const ageDays = getAgeDays(shortlist.createdAt);
                    const urgencyClass = getUrgencyClass(shortlist);
                    const status = shortlist.status.toLowerCase();
                    const isActionable = status === 'pending' || status === 'processing';
                    return (
                      <tr
                        key={shortlist.id}
                        onClick={() => handleRowClick(shortlist.id)}
                        className={`hover:bg-blue-50 cursor-pointer transition-colors ${urgencyClass}`}
                      >
                        <td className="px-3 py-2">
                          <div className="font-medium text-gray-900">{shortlist.roleTitle}</div>
                          <div className="text-sm text-gray-500">{shortlist.companyName}</div>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex flex-wrap gap-1 max-w-48" title={shortlist.techStackRequired?.join(', ')}>
                            {shortlist.techStackRequired
                              ?.slice(0, 2)
                              .map((tech, i) => (
                                <Badge key={i} variant="default">
                                  {tech}
                                </Badge>
                              ))}
                            {(shortlist.techStackRequired?.length ?? 0) > 2 && (
                              <Badge variant="default">
                                +{(shortlist.techStackRequired?.length ?? 0) - 2}
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-600">
                          {getSeniorityLabel(shortlist.seniorityRequired)}
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-600">
                          {(() => {
                            const loc = getHiringLocationDisplay(shortlist);
                            return (
                              <span title={loc.text}>
                                {loc.text.length > 15 ? loc.text.slice(0, 15) + '...' : loc.text}
                                {loc.isRemote && !loc.text.includes("Remote") && (
                                  <span className="ml-1 text-green-600" title="Remote OK">🌍</span>
                                )}
                              </span>
                            );
                          })()}
                        </td>
                        <td className="px-3 py-2">
                          {getStatusBadge(shortlist.status)}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span className={`font-medium ${shortlist.candidatesCount > 0 ? 'text-gray-900' : 'text-gray-400'}`}>
                            {shortlist.candidatesCount}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-sm">
                          <span className={`${
                            isActionable && ageDays >= 2
                              ? 'text-red-600 font-medium'
                              : isActionable && ageDays >= 1
                                ? 'text-orange-600'
                                : 'text-gray-500'
                          }`}>
                            {ageDays === 0 ? 'Today' : `${ageDays}d`}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex gap-1 justify-end">
                            {status === "pending" && (
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => updateStatus(shortlist.id, "processing")}
                              >
                                Start
                              </Button>
                            )}
                            {status === "processing" && (
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => updateStatus(shortlist.id, "completed")}
                              >
                                Done
                              </Button>
                            )}
                            {!isActionable && (
                              <Button variant="ghost" size="sm">
                                View
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-gray-200 pt-4 mt-4">
                <p className="text-sm text-gray-500 order-2 sm:order-1">
                  Showing {(page - 1) * pageSize + 1} to{" "}
                  {Math.min(page * pageSize, filteredShortlists.length)} of {filteredShortlists.length}
                </p>
                <div className="flex gap-2 order-1 sm:order-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => p - 1)}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">
              {searchQuery
                ? `No shortlists match "${searchQuery}"`
                : filterStatus !== 'all'
                  ? `No ${filterStatus} shortlists`
                  : 'No shortlist requests found'
              }
            </p>
            {(searchQuery || filterStatus !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setFilterStatus("all");
                }}
                className="mt-2 text-sm text-blue-600 hover:text-blue-700"
              >
                Clear filters
              </button>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}

export default function AdminShortlistsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      }
    >
      <AdminShortlistsContent />
    </Suspense>
  );
}
