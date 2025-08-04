import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { PlusCircle, ArrowLeft, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { posCreationSchema, type POSCreationData } from "@shared/schema";

export default function POSCreation() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const form = useForm<POSCreationData>({
    resolver: zodResolver(posCreationSchema),
    defaultValues: {
      businessName: "",
      contactEmail: "",
      username: "",
      password: "",
      confirmPassword: "",
      currencySymbol: "$",
    },
  });

  const createPOSMutation = useMutation({
    mutationFn: async (data: POSCreationData) => {
      const res = await apiRequest("POST", "/api/pos/create", data);
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "POS Request Submitted",
        description: data.message,
      });
      setLocation("/");
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create POS",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: POSCreationData) => {
    createPOSMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-lg w-full mx-4">
        <Card>
          <CardContent className="p-8">
            <div className="text-center mb-6">
              <PlusCircle className="text-success text-3xl mb-4 mx-auto" />
              <h2 className="text-2xl font-bold text-gray-900">Create New POS</h2>
              <p className="text-gray-600 mt-2">Submit a request for a new POS system</p>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="businessName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter business name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contactEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="Enter contact email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>POS Username</FormLabel>
                      <FormControl>
                        <Input placeholder="Choose a username" {...field} />
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
                      <FormLabel>POS Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Choose a password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Confirm password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                 <FormField
                  control={form.control}
                  name="currencySymbol"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Currency Symbol</FormLabel>
                      <FormControl>
                        <Input placeholder="$" maxLength={3} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Alert className="bg-yellow-50 border-yellow-200">
                  <Info className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-800">
                    Your POS system will require admin approval before activation.
                  </AlertDescription>
                </Alert>

                <Button
                  type="submit"
                  className="w-full bg-success text-white hover:bg-emerald-600"
                  disabled={createPOSMutation.isPending}
                >
                  {createPOSMutation.isPending ? "Submitting..." : "Submit POS Request"}
                </Button>
              </form>
            </Form>

            <Button
              variant="ghost"
              className="w-full mt-4 text-gray-600 hover:text-gray-800"
              onClick={() => setLocation("/")}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}