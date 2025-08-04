import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { LogOut, Store, Clock, CheckCircle, XCircle, Check, X, Ban, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { POSSystem } from "@shared/schema";

type DashboardStats = {
  totalPOS: number;
  pendingPOS: number;
  approvedPOS: number;
  rejectedPOS: number;
};

export default function AdminDashboard() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/admin/stats"],
  });

  const { data: posSystems, isLoading: systemsLoading } = useQuery<POSSystem[]>({
    queryKey: ["/api/admin/pos-systems"],
  });

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("POST", `/api/admin/pos-systems/${id}/approve`);
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pos-systems"] });
      toast({
        title: "POS System Approved",
        description: data.message,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to approve",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("POST", `/api/admin/pos-systems/${id}/reject`);
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pos-systems"] });
      toast({
        title: "POS System Rejected",
        description: data.message,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to reject",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/admin/pos-systems/${id}`);
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pos-systems"] });
      toast({
        title: "POS System Deleted",
        description: data.message,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary" className="bg-warning/10 text-warning">Pending</Badge>;
      case "approved":
        return <Badge variant="secondary" className="bg-success/10 text-success">Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 sm:py-6 gap-4">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <Button
              variant="destructive"
                size="sm"
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
              className="w-full sm:w-auto"
            >
              <LogOut className="w-4 h-4 mr-2" />
                Logout
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage POS system requests and approvals</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center">
                <div className="p-2 bg-primary/10 rounded-md">
                  <Store className="text-primary text-xl" />
                </div>
                <div className="ml-3 sm:ml-4">
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Total POS</p>
                  <p className="text-xl sm:text-2xl font-semibold text-gray-900">
                    {statsLoading ? "..." : stats?.totalPOS || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center">
                <div className="p-2 bg-warning/10 rounded-md">
                  <Clock className="text-warning text-xl" />
                </div>
                <div className="ml-3 sm:ml-4">
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-xl sm:text-2xl font-semibold text-gray-900">
                    {statsLoading ? "..." : stats?.pendingPOS || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="sm:col-span-2 lg:col-span-1">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center">
                <div className="p-2 bg-success/10 rounded-md">
                  <CheckCircle className="text-success text-xl" />
                </div>
                <div className="ml-3 sm:ml-4">
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Approved</p>
                  <p className="text-xl sm:text-2xl font-semibold text-gray-900">
                    {statsLoading ? "..." : stats?.approvedPOS || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center">
                <div className="p-2 bg-error/10 rounded-md">
                  <XCircle className="text-error text-xl" />
                </div>
                <div className="ml-3 sm:ml-4">
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Rejected</p>
                  <p className="text-xl sm:text-2xl font-semibold text-gray-900">
                    {statsLoading ? "..." : stats?.rejectedPOS || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* POS Requests Table */}
        <Card>
          <CardContent className="p-0">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">POS System Requests</h2>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Business</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {systemsLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : posSystems?.length ? (
                    posSystems.map((system) => (
                      <TableRow key={system.id}>
                        <TableCell className="font-medium">{system.businessName}</TableCell>
                        <TableCell>{system.contactEmail}</TableCell>
                        <TableCell>{system.username}</TableCell>
                        <TableCell>{getStatusBadge(system.status)}</TableCell>
                        <TableCell>{formatDate(system.createdAt)}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2 flex-wrap">
                            {system.status === "pending" && (
                              <>
                                <Button
                                  size="sm"
                                  className="bg-success text-white hover:bg-emerald-600"
                                  onClick={() => approveMutation.mutate(system.id)}
                                  disabled={approveMutation.isPending || rejectMutation.isPending || deleteMutation.isPending}
                                >
                                  <Check className="w-3 h-3 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => rejectMutation.mutate(system.id)}
                                  disabled={approveMutation.isPending || rejectMutation.isPending || deleteMutation.isPending}
                                >
                                  <X className="w-3 h-3 mr-1" />
                                  Reject
                                </Button>
                              </>
                            )}
                            {system.status === "approved" && (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => rejectMutation.mutate(system.id)}
                                disabled={approveMutation.isPending || rejectMutation.isPending || deleteMutation.isPending}
                              >
                                <Ban className="w-3 h-3 mr-1" />
                                Revoke
                              </Button>
                            )}
                            {system.status === "rejected" && (
                              <Button
                                size="sm"
                                className="bg-success text-white hover:bg-emerald-600"
                                onClick={() => approveMutation.mutate(system.id)}
                                disabled={approveMutation.isPending || rejectMutation.isPending || deleteMutation.isPending}
                              >
                                <Check className="w-3 h-3 mr-1" />
                                Approve
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-red-300 text-red-600 hover:bg-red-50"
                              onClick={() => deleteMutation.mutate(system.id)}
                              disabled={approveMutation.isPending || rejectMutation.isPending || deleteMutation.isPending}
                            >
                              <Trash2 className="w-3 h-3 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        No POS systems found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}