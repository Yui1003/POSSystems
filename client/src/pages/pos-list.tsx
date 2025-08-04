import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Store, ArrowLeft, CheckCircle, Clock, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { POSSystem } from "@shared/schema";

export default function POSList() {
  const [, setLocation] = useLocation();

  const { data: posSystems, isLoading } = useQuery<POSSystem[]>({
    queryKey: ["/api/pos/systems"],
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="secondary" className="bg-warning/10 text-warning">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case "approved":
        return (
          <Badge variant="secondary" className="bg-success/10 text-success">
            <CheckCircle className="w-3 h-3 mr-1" />
            Active
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="destructive">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handlePOSSelect = (posId: string) => {
    setLocation(`/pos/login/${posId}`);
  };

  const approvedSystems = posSystems || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Store className="text-primary text-2xl mr-3" />
              <h1 className="text-xl font-semibold text-gray-900">Select POS System</h1>
            </div>
            <div className="flex items-center">
              <Button
                variant="ghost"
                onClick={() => setLocation("/")}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto py-8 px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Available POS Systems</h1>
          <p className="text-gray-600">Choose a POS system to access</p>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading POS systems...</p>
          </div>
        ) : approvedSystems.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {approvedSystems.map((system) => (
              <Card
                key={system.id}
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => handlePOSSelect(system.id)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <Store className="text-primary text-2xl" />
                    </div>
                    {getStatusBadge(system.status)}
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {system.businessName}
                  </h3>
                  
                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    <p><span className="font-medium">Username:</span> {system.username}</p>
                    <p><span className="font-medium">Contact:</span> {system.contactEmail}</p>
                    <p><span className="font-medium">Created:</span> {new Date(system.createdAt).toLocaleDateString()}</p>
                  </div>
                  
                  <Button className="w-full bg-primary text-white hover:bg-blue-600">
                    Access POS System
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Store className="text-gray-400 text-6xl mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Active POS Systems</h3>
            <p className="text-gray-600 mb-6">
              There are currently no approved POS systems available.
            </p>
            <div className="space-x-4">
              <Button
                onClick={() => setLocation("/pos/create")}
                className="bg-success text-white hover:bg-emerald-600"
              >
                Create New POS
              </Button>
              <Button
                variant="outline"
                onClick={() => setLocation("/")}
              >
                Back to Home
              </Button>
            </div>
          </div>
        )}

        {/* All Systems (for reference) */}
        {posSystems && posSystems.length > approvedSystems.length && (
          <div className="mt-12">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">All POS Systems</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {posSystems.map((system) => (
                <Card key={system.id} className="opacity-75">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{system.businessName}</h4>
                      {getStatusBadge(system.status)}
                    </div>
                    <p className="text-sm text-gray-600">@{system.username}</p>
                    {system.status !== "approved" && (
                      <p className="text-xs text-gray-500 mt-2">
                        {system.status === "pending" ? "Awaiting admin approval" : "Access denied"}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}