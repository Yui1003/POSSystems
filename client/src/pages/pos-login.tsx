import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/use-auth";
import { useLocation, useParams } from "wouter";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Store, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { posLoginSchema, type POSLoginData, POSSystem } from "@shared/schema";

export default function POSLogin() {
  const { user, posLoginMutation } = useAuth();
  const [, setLocation] = useLocation();
  const params = useParams();
  const posId = params.id;

  // Get POS system details if posId is provided
  const { data: posSystem } = useQuery<POSSystem>({
    queryKey: ["/api/pos/systems", posId],
    queryFn: async () => {
      if (!posId) return null;
      const response = await fetch(`/api/pos/systems/${posId}`);
      if (!response.ok) throw new Error('POS system not found');
      return response.json();
    },
    enabled: !!posId,
  });

  const form = useForm<POSLoginData>({
    resolver: zodResolver(posLoginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  useEffect(() => {
    if (user) {
      if (user.userType === "pos") {
        setLocation("/pos/interface");
      } else {
        setLocation("/");
      }
    }
  }, [user, setLocation]);

  const onSubmit = (data: POSLoginData) => {
    posLoginMutation.mutate(data);
  };

  const goBack = () => {
    if (posId) {
      setLocation("/pos/list");
    } else {
      setLocation("/");
    }
  };

  if (posId && !posSystem) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading POS system...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <Card>
          <CardContent className="p-8">
            <div className="text-center mb-6">
              <Store className="text-primary text-3xl mb-4 mx-auto" />
              <h2 className="text-2xl font-bold text-gray-900">
                {posSystem ? `Login to ${posSystem.businessName}` : 'POS Login'}
              </h2>
              <p className="text-gray-600 mt-2">
                {posSystem ? `Enter credentials for ${posSystem.username}` : 'Enter your POS credentials'}
              </p>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter POS username" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Enter password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full bg-primary text-white hover:bg-blue-600"
                  disabled={posLoginMutation.isPending}
                >
                  {posLoginMutation.isPending ? "Signing in..." : "Access POS System"}
                </Button>
              </form>
            </Form>

            <Button
              variant="ghost"
              className="w-full mt-4 text-gray-600 hover:text-gray-800"
              onClick={goBack}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {posId ? 'Back to POS List' : 'Back to Home'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
