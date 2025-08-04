import { useState } from "react";
import * as React from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Plus, Edit2, Trash2, ArrowLeft, Package, DollarSign, Tag, AlertTriangle, Camera, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Product, InsertProduct } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Edit, MoreHorizontal } from "lucide-react";

type ProductFormData = {
  name: string;
  price: string;
  category: string;
  stock: string;
  image: string;
};

export default function ProductManagement() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    price: "",
    category: "",
    stock: "",
    image: "",
  });
  const [currencyDialogOpen, setCurrencyDialogOpen] = useState(false);
  const [currencySymbol, setCurrencySymbol] = useState("$");
  const [businessInfoDialogOpen, setBusinessInfoDialogOpen] = useState(false);
  const [businessInfo, setBusinessInfo] = useState({
    businessName: "",
    businessAddress: "123 Main Street, City, ST 12345",
    businessPhone: "(555) 123-4567",
    receiptFooter: "Thank you for your business!\nPlease come again",
    taxRate: "8.5",
  });

  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ["/api/pos/products"],
    enabled: !!user && user.userType === "pos",
  });

  const { data: currentPOS } = useQuery({
    queryKey: ["/api/pos/systems", user?.id],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/pos/systems/${user?.id}`);
      return await res.json();
    },
    enabled: !!user && user.userType === "pos",
  });

  // Update local state when currentPOS data changes
  React.useEffect(() => {
    if (currentPOS) {
      setCurrencySymbol(currentPOS.currencySymbol || "$");
      setBusinessInfo({
        businessName: currentPOS.businessName || "",
        businessAddress: currentPOS.businessAddress || "123 Main Street, City, ST 12345",
        businessPhone: currentPOS.businessPhone || "(555) 123-4567",
        receiptFooter: currentPOS.receiptFooter || "Thank you for your business!\nPlease come again",
        taxRate: currentPOS.taxRate || "8.5",
      });
    }
  }, [currentPOS]);

  const updateCurrencyMutation = useMutation({
    mutationFn: async (newCurrencySymbol: string) => {
      const res = await apiRequest("PUT", "/api/pos/currency", { currencySymbol: newCurrencySymbol });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pos/systems", user?.id] });
      setCurrencyDialogOpen(false);
      toast({
        title: "Success",
        description: "Currency symbol updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateBusinessInfoMutation = useMutation({
    mutationFn: async (info: typeof businessInfo) => {
      const res = await apiRequest("PUT", "/api/pos/business-info", info);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pos/systems", user?.id] });
      setBusinessInfoDialogOpen(false);
      toast({
        title: "Success",
        description: "Business information updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createProductMutation = useMutation({
    mutationFn: async (productData: InsertProduct) => {
      const res = await apiRequest("POST", "/api/pos/products", productData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pos/products"] });
      setIsDialogOpen(false);
      resetForm();
      toast({
        title: "Success",
        description: "Product created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: async ({ id, ...productData }: { id: string } & Partial<Product>) => {
      const res = await apiRequest("PUT", `/api/pos/products/${id}`, productData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pos/products"] });
      setIsDialogOpen(false);
      setEditingProduct(null);
      resetForm();
      toast({
        title: "Success",
        description: "Product updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/pos/products/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pos/products"] });
      toast({
        title: "Success",
        description: "Product deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({ name: "", price: "", category: "", stock: "", image: "" });
    setEditingProduct(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.price || !formData.category || !formData.stock) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    // Validate image URL if provided
    if (formData.image && formData.image.trim() && !isValidUrl(formData.image.trim())) {
      toast({
        title: "Error",
        description: "Please enter a valid image URL",
        variant: "destructive",
      });
      return;
    }

    if (editingProduct) {
      updateProductMutation.mutate({
        id: editingProduct.id,
        name: formData.name.trim(),
        price: formData.price,
        category: formData.category,
        stock: parseInt(formData.stock),
        image: formData.image.trim() || null,
      });
    } else {
      createProductMutation.mutate({
        name: formData.name.trim(),
        price: formData.price,
        category: formData.category,
        stock: parseInt(formData.stock),
        image: formData.image.trim() || null,
        posId: user?.id || "",
      });
    }
  };

  const isValidUrl = (string: string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      price: product.price,
      category: product.category || "",
      stock: product.stock?.toString() || "0",
      image: product.image || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      deleteProductMutation.mutate(id);
    }
  };

  const categories = [
    "Beverages",
    "Food", 
    "Desserts",
    "Appetizers",
    "Main Course",
    "Sides",
    "Snacks",
    "Other"
  ];

    const handleDeleteProduct = (id: string) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      deleteProductMutation.mutate(id);
    }
  };

  // Group products by category
  const productsByCategory = products?.reduce((acc, product) => {
    const category = product.category || "Other";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(product);
    return acc;
  }, {} as Record<string, Product[]>) || {};

  if (!user || user.userType !== "pos") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-6 text-center">
            <p className="text-red-600">Access denied. POS login required.</p>
            <Button onClick={() => setLocation("/")} className="mt-4">
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-3 sm:py-0 sm:h-16 gap-3 sm:gap-0">
            <div className="flex items-center w-full sm:w-auto">
              <Package className="text-primary text-xl sm:text-2xl mr-2 sm:mr-3 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">Product Management</h1>
                <p className="text-xs sm:text-sm text-gray-500 truncate">{user.businessName}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-start sm:justify-end">
              <Dialog open={businessInfoDialogOpen} onOpenChange={setBusinessInfoDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="text-xs sm:text-sm">
                    <Settings className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    <span className="hidden xs:inline">Business Settings</span>
                    <span className="xs:hidden">Settings</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Business Information</DialogTitle>
                    <DialogDescription>
                      Update your business details for receipts
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="businessName">Business Name</Label>
                      <Input
                        id="businessName"
                        value={businessInfo.businessName}
                        onChange={(e) => setBusinessInfo({ ...businessInfo, businessName: e.target.value })}
                        placeholder="Your Business Name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="businessAddress">Address</Label>
                      <Input
                        id="businessAddress"
                        value={businessInfo.businessAddress}
                        onChange={(e) => setBusinessInfo({ ...businessInfo, businessAddress: e.target.value })}
                        placeholder="123 Main St, City, ST 12345"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="businessPhone">Phone</Label>
                      <Input
                        id="businessPhone"
                        value={businessInfo.businessPhone}
                        onChange={(e) => setBusinessInfo(prev => ({ ...prev, businessPhone: e.target.value }))}
                        placeholder="(555) 123-4567"
                      />
                    </div>
                    <div>
                      <Label htmlFor="taxRate">
                        Tax Rate (%)
                      </Label>
                      <Input
                        id="taxRate"
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        value={businessInfo.taxRate}
                        onChange={(e) => setBusinessInfo(prev => ({ ...prev, taxRate: e.target.value }))}
                        placeholder="8.5"
                      />
                    </div>
                  </div>
                    <div>
                      <Label htmlFor="receiptFooter">Receipt Footer</Label>
                      <Input
                        id="receiptFooter"
                        value={businessInfo.receiptFooter}
                        onChange={(e) => setBusinessInfo({ ...businessInfo, receiptFooter: e.target.value })}
                        placeholder="Thank you for your business!"
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => setBusinessInfoDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={() => updateBusinessInfoMutation.mutate(businessInfo)}
                        disabled={updateBusinessInfoMutation.isPending}
                      >
                        Update
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              <Dialog open={currencyDialogOpen} onOpenChange={setCurrencyDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="text-xs sm:text-sm">
                    <DollarSign className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    <span className="hidden xs:inline">Currency</span>
                    <span className="xs:hidden">{currencySymbol}</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Update Currency Symbol</DialogTitle>
                    <DialogDescription>
                      Choose the currency symbol for your POS system
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="currency">Currency Symbol</Label>
                      <Input
                        id="currency"
                        value={currencySymbol}
                        onChange={(e) => setCurrencySymbol(e.target.value)}
                        placeholder="Enter currency symbol (e.g. $, €, £, ¥)"
                        maxLength={3}
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => setCurrencyDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={() => updateCurrencyMutation.mutate(currencySymbol)}
                        disabled={updateCurrencyMutation.isPending}
                      >
                        Update
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={resetForm} size="sm" className="text-xs sm:text-sm">
                    <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    <span className="hidden xs:inline">Add Product</span>
                    <span className="xs:hidden">Add</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {editingProduct ? "Edit Product" : "Add New Product"}
                    </DialogTitle>
                    <DialogDescription>
                      {editingProduct ? "Update product details" : "Create a new product for your POS system"}
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="name">Product Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Enter product name"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="price">Price</Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        placeholder="0.00"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="category">Category</Label>
                      <Select
                        value={formData.category}
                        onValueChange={(value) => setFormData({ ...formData, category: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="stock">Stock Quantity</Label>
                      <Input
                        id="stock"
                        type="number"
                        min="0"
                        value={formData.stock}
                        onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                        placeholder="0"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="image">Product Image URL (Optional)</Label>
                      <Input
                        id="image"
                        type="url"
                        value={formData.image}
                        onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                        placeholder="https://example.com/image.jpg"
                      />
                      {formData.image && formData.image.trim() && (
                        <div className="mt-2">
                          <img
                            src={formData.image}
                            alt="Preview"
                            className="w-16 h-16 object-cover rounded border"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                    </div>
                    <div className="flex justify-end space-x-2 pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsDialogOpen(false);
                          resetForm();
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={createProductMutation.isPending || updateProductMutation.isPending}
                      >
                        {editingProduct ? "Update" : "Create"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLocation("/pos/interface")}
                className="text-xs sm:text-sm"
              >
                <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden xs:inline">Back to POS</span>
                <span className="xs:hidden">Back</span>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-4 sm:py-6 lg:py-8 px-3 sm:px-4 lg:px-6">
        {isLoading ? (
          <div className="text-center py-8">
            <p>Loading products...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.keys(productsByCategory).length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No products yet</h3>
                  <p className="text-gray-500">Start by adding your first product to the system.</p>
                </CardContent>
              </Card>
            ) : (
              Object.entries(productsByCategory).map(([category, categoryProducts]) => (
                <div key={category}>
                  <div className="flex items-center mb-3 sm:mb-4">
                    <Tag className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 mr-2 flex-shrink-0" />
                    <h2 className="text-base sm:text-lg font-semibold text-gray-900">{category}</h2>
                    <Badge variant="secondary" className="ml-2 text-xs">
                      {categoryProducts.length}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-6">
                    {categoryProducts.map((product) => (
                      <Card key={product.id} className="relative">
                        <CardContent className="p-3 sm:p-4 lg:p-6">
                          {product.image && (
                            <div className="mb-2 sm:mb-3">
                              <img
                                src={product.image}
                                alt={product.name}
                                className="w-full h-24 sm:h-28 lg:h-32 object-cover rounded border"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                }}
                              />
                            </div>
                          )}
                          <div className="flex justify-between items-start mb-3 sm:mb-4">
                            <div className="flex-1 min-w-0 pr-1 sm:pr-2">
                              <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 line-clamp-2 leading-tight">
                                {product.name}
                              </h3>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="flex-shrink-0 h-6 w-6 sm:h-8 sm:w-8 p-0 min-h-[24px] sm:min-h-[32px]">
                                  <MoreHorizontal className="w-3 h-3 sm:w-4 sm:h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="z-50">
                                <DropdownMenuItem
                                  onClick={() => handleEdit(product)}
                                >
                                  <Edit className="w-4 h-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDeleteProduct(product.id)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          <div className="flex flex-col xs:flex-row justify-between items-start xs:items-center gap-1 sm:gap-2">
                            <span className="text-base sm:text-lg lg:text-xl font-bold text-green-600">
                              {currentPOS?.currencySymbol || "$"}{parseFloat(product.price).toFixed(2)}
                            </span>
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                              {product.stock} in stock
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
}