import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ArrowLeft, TrendingUp, Receipt, DollarSign, Calendar, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { Transaction } from "@shared/schema";
import ReceiptModal from "@/components/receipt-modal";

type DailySalesData = {
  transactions: Transaction[];
  totalSales: number;
  totalTransactions: number;
};

export default function SalesAnalytics() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showReceipt, setShowReceipt] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [currencySymbol, setCurrencySymbol] = useState("$");

  const { data: currentPOS } = useQuery({
    queryKey: ["/api/pos/systems", user?.id],
    queryFn: async () => {
      const response = await fetch(`/api/pos/systems/${user?.id}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch POS data');
      return response.json();
    },
    enabled: !!user && user.userType === "pos",
  });

  // Update currency symbol when currentPOS data changes
  React.useEffect(() => {
    if (currentPOS?.currencySymbol) {
      setCurrencySymbol(currentPOS.currencySymbol);
    }
  }, [currentPOS]);

  const { data: dailySales, isLoading } = useQuery<DailySalesData>({
    queryKey: ["/api/pos/sales/daily", selectedDate],
    queryFn: async () => {
      const response = await fetch(`/api/pos/sales/daily?date=${selectedDate}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch sales data');
      return response.json();
    },
    enabled: !!user && user.userType === "pos",
  });

  const formatCurrency = (amount: number) => {
    return `${currencySymbol}${amount.toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(selectedDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleViewReceipt = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setShowReceipt(true);
  };

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
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <TrendingUp className="text-primary text-2xl mr-3" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Sales Analytics</h1>
                <p className="text-sm text-gray-500">{user.businessName}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                onClick={() => setLocation("/pos/interface")}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to POS
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 px-4">
        {/* Date Selector */}
        <div className="mb-6">
          <div className="flex items-center space-x-4">
            <div>
              <Label htmlFor="date">Select Date</Label>
              <Input
                id="date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-40"
              />
            </div>
            <div className="text-lg font-medium text-gray-900">
              {formatDate(selectedDate)}
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-8">
            <p>Loading sales data...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
              <Card>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                    </div>
                    <div className="ml-3 sm:ml-4">
                      <p className="text-xs sm:text-sm font-medium text-gray-500">Today's Sales</p>
                      <p className="text-xl sm:text-2xl font-bold text-gray-900">
                        {formatCurrency(dailySales?.totalSales || 0)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Receipt className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Total Transactions</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {dailySales?.totalTransactions || 0}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <TrendingUp className="w-6 h-6 text-purple-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Average Sale</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatCurrency(
                          dailySales?.totalTransactions 
                            ? (dailySales.totalSales / dailySales.totalTransactions)
                            : 0
                        )}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Transaction Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Receipt className="w-5 h-5 mr-2" />
                  Transaction Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!dailySales?.transactions || dailySales.transactions.length === 0 ? (
                  <div className="text-center py-8">
                    <Receipt className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions yet</h3>
                    <p className="text-gray-500">No sales recorded for this date.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {dailySales.transactions.map((transaction) => (
                      <div
                        key={transaction.id}
                        className="flex justify-between items-center p-4 bg-gray-50 rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex items-center space-x-4">
                            <Badge variant="outline" className="font-mono">
                              {transaction.receiptNumber}
                            </Badge>
                            <span className="text-sm text-gray-500">
                              {new Date(transaction.createdAt).toLocaleTimeString()}
                            </span>
                            <Badge variant="secondary">
                              {transaction.paymentMethod.toUpperCase()}
                            </Badge>
                          </div>
                          <div className="mt-2">
                            <p className="text-sm text-gray-600">
                              {Array.isArray(transaction.items) 
                                ? transaction.items.map((item: any) => `${item.quantity}x ${item.name}`).join(', ')
                                : 'Items not available'
                              }
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-gray-900">
                            {formatCurrency(parseFloat(transaction.total))}
                          </p>
                          <p className="text-xs text-gray-500">
                            Tax: {formatCurrency(parseFloat(transaction.tax))}
                          </p>
                          <Button
                            size="sm"
                            variant="outline"
                            className="mt-2"
                            onClick={() => handleViewReceipt(transaction)}
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            View Receipt
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      {/* Receipt Modal */}
      {showReceipt && selectedTransaction && (
        <ReceiptModal
          isOpen={showReceipt}
          onClose={() => setShowReceipt(false)}
          transaction={{
            receiptNumber: selectedTransaction.receiptNumber,
            businessName: user?.businessName || "",
            businessAddress: user?.businessAddress || currentPOS?.businessAddress,
            businessPhone: user?.businessPhone || currentPOS?.businessPhone,
            receiptFooter: user?.receiptFooter || currentPOS?.receiptFooter,
            cashier: user?.username || "",
            items: Array.isArray(selectedTransaction.items) ? selectedTransaction.items : [],
            subtotal: selectedTransaction.subtotal,
            tax: selectedTransaction.tax,
            total: selectedTransaction.total,
            paymentMethod: selectedTransaction.paymentMethod,
            createdAt: selectedTransaction.createdAt,
            currencySymbol: currencySymbol,
            taxPercentage: selectedTransaction.taxPercentage || (currentPOS?.taxRate ? parseFloat(currentPOS.taxRate).toFixed(1) : "8.5"),
          }}
        />
      )}
    </div>
  );
}