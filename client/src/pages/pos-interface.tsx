import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useState } from "react";
import { LogOut, Coffee, Cookie, IceCream, Minus, Plus, Trash2, Settings, TrendingUp, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Product, InsertTransaction } from "@shared/schema";
import ReceiptModal from "../components/receipt-modal";

type CartItem = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
};

export default function POSInterface() {
  const { user, logoutMutation } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastTransaction, setLastTransaction] = useState<any>(null);

  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ["/api/pos/products"],
  });

  const { data: currentPOS } = useQuery({
    queryKey: ["/api/pos/systems", user?.id],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/pos/systems/${user?.id}`);
      return await res.json();
    },
    enabled: !!user && user.userType === "pos",
    refetchOnWindowFocus: true,
  });

  const createTransactionMutation = useMutation({
    mutationFn: async (transactionData: Omit<InsertTransaction, "posId">) => {
      const res = await apiRequest("POST", "/api/pos/transactions", transactionData);
      return await res.json();
    },
    onSuccess: (transaction) => {
      // Invalidate the products cache to refresh stock numbers
      queryClient.invalidateQueries({ queryKey: ["/api/pos/products"] });

      setLastTransaction(transaction);
      setShowReceipt(true);
      setCart([]);
      toast({
        title: "Transaction Complete",
        description: "Order has been processed successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Transaction Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const categories = ["all", "Beverages", "Food", "Desserts"];

  const filteredProducts = products?.filter(product => 
    activeCategory === "all" || product.category === activeCategory
  ) || [];

  const addToCart = (product: Product) => {
    // Check if product is in stock
    if (product.stock === 0) {
      toast({
        title: "Out of Stock",
        description: `${product.name} is currently out of stock`,
        variant: "destructive",
      });
      return;
    }

    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id);
      const currentQuantityInCart = existing ? existing.quantity : 0;

      // Check if adding one more would exceed stock
      if (product.stock && currentQuantityInCart >= product.stock) {
        toast({
          title: "Insufficient Stock",
          description: `Only ${product.stock} items available for ${product.name}`,
          variant: "destructive",
        });
        return prev;
      }

      if (existing) {
        return prev.map(item =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prev, {
          productId: product.id,
          name: product.name,
          price: parseFloat(product.price),
          quantity: 1,
        }];
      }
    });
  };

  const updateQuantity = (productId: string, change: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.productId === productId) {
          const newQuantity = item.quantity + change;
          return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
        }
        return item;
      }).filter(item => item.quantity > 0);
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.productId !== productId));
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const taxRate = currentPOS?.taxRate ? parseFloat(currentPOS.taxRate) / 100 : 0.085; // Default to 8.5% if not set
  const tax = subtotal * taxRate;
  const total = subtotal + tax;

  const completeOrder = (paymentMethod: "cash" | "card") => {
    if (cart.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Please add items to cart before completing order",
        variant: "destructive",
      });
      return;
    }

    const receiptNumber = `R${Date.now().toString().slice(-6)}`;

    const transactionData = {
      receiptNumber,
      items: cart,
      subtotal: subtotal.toFixed(2),
      tax: tax.toFixed(2),
      total: total.toFixed(2),
      paymentMethod,
      taxPercentage: (taxRate * 100).toFixed(1),
    };

    createTransactionMutation.mutate(transactionData);
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case "beverages":
        return <Coffee className="w-4 h-4" />;
      case "food":
        return <Cookie className="w-4 h-4" />;
      case "desserts":
        return <IceCream className="w-4 h-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex flex-col lg:flex-row h-screen">
        {/* Left Panel - Products */}
        <div className="flex-1 lg:w-2/3 p-2 sm:p-4 flex flex-col">
          <div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Point of Sale</h2>
            <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
              <span className="text-gray-600 truncate max-w-32 sm:max-w-none">
                {user?.userType === "pos" ? user.businessName : user?.username}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLocation("/product-management")}
                className="text-xs px-2 py-1 sm:px-3 sm:py-2"
              >
                <Settings className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Manage Products</span>
                <span className="sm:hidden">Manage</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLocation("/sales-analytics")}
                className="text-xs px-2 py-1 sm:px-3 sm:py-2"
              >
                <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Sales Analytics</span>
                <span className="sm:hidden">Analytics</span>
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
                className="text-xs px-2 py-1 sm:px-3 sm:py-2"
              >
                <LogOut className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Logout</span>
                <span className="sm:hidden">Exit</span>
              </Button>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="mb-4">
            <div className="flex space-x-1 sm:space-x-2 border-b border-gray-200 overflow-x-auto">
              {categories.map((category) => (
                <button
                  key={category}
                  className={`px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium whitespace-nowrap ${
                    activeCategory === category
                      ? "text-primary border-b-2 border-primary"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                  onClick={() => setActiveCategory(category)}
                >
                  {category === "all" ? "All Items" : category}
                </button>
              ))}
            </div>
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4 overflow-y-auto flex-1">
            {isLoading ? (
              <div className="col-span-full text-center py-8">Loading products...</div>
            ) : filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <Card
                  key={product.id}
                  className={`cursor-pointer hover:shadow-md transition-shadow ${
                    product.stock === 0 ? 'opacity-60 cursor-not-allowed' : ''
                  }`}
                  onClick={() => addToCart(product)}
                >
                  <CardContent className="p-2 sm:p-4">
                    <div className="aspect-square bg-gray-200 rounded-md mb-2 sm:mb-3 flex items-center justify-center relative overflow-hidden">
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                      ) : null}
                      <div className={`${product.image ? 'hidden' : ''} flex items-center justify-center`}>
                        {getCategoryIcon(product.category) || <Coffee className="text-gray-400 text-lg sm:text-2xl" />}
                      </div>
                      {product.stock === 0 && (
                        <div className="absolute inset-0 bg-red-500 bg-opacity-20 rounded-md flex items-center justify-center">
                          <AlertTriangle className="text-red-600 w-4 h-4 sm:w-6 sm:h-6" />
                        </div>
                      )}
                    </div>
                    <h3 className="font-semibold text-gray-900 text-xs sm:text-sm mb-1 line-clamp-2">{product.name}</h3>
                    <p className="text-primary font-bold text-sm sm:text-base">
                      {currentPOS?.currencySymbol || "$"}{parseFloat(product.price).toFixed(2)}
                    </p>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-1 gap-1">
                      <Badge variant="secondary" className="text-xs">
                        {product.category}
                      </Badge>
                      <div className="text-xs">
                        {product.stock === 0 ? (
                          <span className="text-red-600 font-medium">Out of Stock</span>
                        ) : product.stock && product.stock < 10 ? (
                          <span className="text-orange-600 font-medium">Stock: {product.stock}</span>
                        ) : (
                          <span className="text-green-600 font-medium">Stock: {product.stock || 0}</span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center py-8">No products found</div>
            )}
          </div>
        </div>

        {/* Right Panel - Cart */}
        <div className="w-full lg:w-1/3 bg-white border-t lg:border-t-0 lg:border-l border-gray-200 p-2 sm:p-4 flex flex-col max-h-96 lg:max-h-none">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-4">Current Order</h3>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto mb-2 sm:mb-4 max-h-32 lg:max-h-none">
            {cart.length > 0 ? (
              cart.map((item) => (
                <div key={item.productId} className="flex justify-between items-center py-1 sm:py-2 border-b border-gray-100">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 text-xs sm:text-sm truncate">{item.name}</h4>
                    <p className="text-xs text-gray-600">
                      {currentPOS?.currencySymbol || "$"}{item.price.toFixed(2)} x {item.quantity}
                    </p>
                  </div>
                  <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-5 h-5 sm:w-6 sm:h-6 p-0"
                      onClick={() => updateQuantity(item.productId, -1)}
                    >
                      <Minus className="w-2 h-2 sm:w-3 sm:h-3" />
                    </Button>
                    <span className="w-6 sm:w-8 text-center text-xs sm:text-sm">{item.quantity}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-5 h-5 sm:w-6 sm:h-6 p-0"
                      onClick={() => updateQuantity(item.productId, 1)}
                    >
                      <Plus className="w-2 h-2 sm:w-3 sm:h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="w-5 h-5 sm:w-6 sm:h-6 p-0 text-red-600 hover:text-red-700"
                      onClick={() => removeFromCart(item.productId)}
                    >
                      <Trash2 className="w-2 h-2 sm:w-3 sm:h-3" />
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4 sm:py-8 text-gray-500 text-sm">
                Cart is empty
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="border-t border-gray-200 pt-2 sm:pt-4">
            <div className="flex justify-between mb-1 sm:mb-2">
              <span className="text-gray-600 text-xs sm:text-sm">Subtotal:</span>
              <span className="font-medium text-xs sm:text-sm">{currentPOS?.currencySymbol || "$"}{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between mb-1 sm:mb-2">
              <span className="text-gray-600 text-xs sm:text-sm">Tax ({(taxRate * 100).toFixed(1)}%):</span>
              <span className="font-medium text-xs sm:text-sm">{currentPOS?.currencySymbol || "$"}{tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm sm:text-lg font-bold border-t border-gray-200 pt-1 sm:pt-2">
              <span>Total:</span>
              <span>{currentPOS?.currencySymbol || "$"}{total.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="mt-2 sm:mt-4">
            <div className="grid grid-cols-2 gap-1 sm:gap-2 mb-2 sm:mb-4">
              <Button
                className="bg-primary text-white hover:bg-blue-600 text-xs sm:text-sm py-1 sm:py-2"
                onClick={() => completeOrder("cash")}
                disabled={createTransactionMutation.isPending || cart.length === 0}
              >
                💵 Cash
              </Button>
              <Button
                className="bg-gray-600 text-white hover:bg-gray-700 text-xs sm:text-sm py-1 sm:py-2"
                onClick={() => completeOrder("card")}
                disabled={createTransactionMutation.isPending || cart.length === 0}
              >
                💳 Card
              </Button>
            </div>
            <Button
              className="w-full bg-green-600 text-white hover:bg-green-700 text-sm sm:text-lg font-semibold py-2 sm:py-3"
              onClick={() => completeOrder("cash")}
              disabled={createTransactionMutation.isPending || cart.length === 0}
            >
              {createTransactionMutation.isPending ? "Processing..." : "Complete Order"}
            </Button>
          </div>
        </div>
      </div>

      {/* Receipt Modal */}
      {showReceipt && lastTransaction && (
        <ReceiptModal
          isOpen={showReceipt}
          onClose={() => setShowReceipt(false)}
          transaction={{
            ...lastTransaction,
            businessName: user?.userType === "pos" ? user.businessName || "" : "",
            businessAddress: user?.businessAddress || currentPOS?.businessAddress,
            businessPhone: user?.businessPhone || currentPOS?.businessPhone,
            receiptFooter: user?.receiptFooter || currentPOS?.receiptFooter,
            cashier: user?.username || "",
            currencySymbol: currentPOS?.currencySymbol || "$",
            taxPercentage: lastTransaction?.taxPercentage || (taxRate * 100).toFixed(1),
          }}
        />
      )}
    </div>
  );
}