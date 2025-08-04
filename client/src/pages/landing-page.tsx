import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { ScanBarcode, Store, PlusCircle, ShieldQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function LandingPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (user) {
      if (user.userType === "admin") {
        setLocation("/admin/dashboard");
      } else if (user.userType === "pos") {
        setLocation("/pos/interface");
      }
    }
  }, [user, setLocation]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ScanBarcode className="text-primary text-2xl" />
                <span className="ml-2 text-xl font-semibold text-gray-900">POS Management</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">POS Management System</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Manage your point-of-sale systems with enterprise-grade security and approval workflows
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {/* Access Existing POS */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setLocation("/pos/list")}>
            <CardContent className="p-8 text-center">
              <div className="mx-auto h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Store className="text-primary text-2xl" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Access POS</h3>
              <p className="text-gray-600 mb-4">Choose and login to your approved POS system</p>
              <Button className="w-full bg-primary text-white hover:bg-blue-600">
                View POS Systems
              </Button>
            </CardContent>
          </Card>

          {/* Create New POS */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setLocation("/pos/create")}>
            <CardContent className="p-8 text-center">
              <div className="mx-auto h-16 w-16 bg-success/10 rounded-full flex items-center justify-center mb-4">
                <PlusCircle className="text-success text-2xl" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Create POS</h3>
              <p className="text-gray-600 mb-4">Request a new POS system setup</p>
              <Button className="w-full bg-success text-white hover:bg-emerald-600">
                Create POS
              </Button>
            </CardContent>
          </Card>

          {/* Admin Access */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setLocation("/admin/login")}>
            <CardContent className="p-8 text-center">
              <div className="mx-auto h-16 w-16 bg-warning/10 rounded-full flex items-center justify-center mb-4">
                <ShieldQuestion className="text-warning text-2xl" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Admin Login</h3>
              <p className="text-gray-600 mb-4">Manage and approve POS systems</p>
              <Button className="w-full bg-warning text-white hover:bg-amber-600">
                Admin Access
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}