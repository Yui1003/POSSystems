import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, X } from "lucide-react";

type ReceiptData = {
  receiptNumber: string;
  businessName: string;
  businessAddress?: string;
  businessPhone?: string;
  receiptFooter?: string;
  cashier: string;
  items: Array<{ name: string; price: number; quantity: number }>;
  subtotal: string;
  tax: string;
  total: string;
  paymentMethod: string;
  createdAt: string | Date;
  currencySymbol?: string;
};

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: ReceiptData;
}

export default function ReceiptModal({ isOpen, onClose, transaction }: ReceiptModalProps) {
  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleString();
  };

  const printReceipt = () => {
    const receiptContent = document.getElementById('receipt-content');
    if (!receiptContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Receipt</title>
          <style>
            body { 
              font-family: 'Courier New', monospace; 
              font-size: 12px; 
              margin: 0; 
              padding: 20px; 
              line-height: 1.4;
            }
            .receipt { 
              max-width: 300px; 
              margin: 0 auto; 
            }
            .text-center { text-align: center; }
            .font-bold { font-weight: bold; }
            .text-lg { font-size: 16px; }
            .text-base { font-size: 14px; }
            .text-xs { font-size: 10px; }
            .mb-4 { margin-bottom: 16px; }
            .mb-2 { margin-bottom: 8px; }
            .mb-1 { margin-bottom: 4px; }
            .my-2 { margin-top: 8px; margin-bottom: 8px; }
            .space-y-1 > * + * { margin-top: 4px; }
            .flex { display: flex; }
            .justify-between { justify-content: space-between; }
            .border-b { border-bottom: 1px solid #000; }
            .border-gray-400 { border-color: #9ca3af; }
            .uppercase { text-transform: uppercase; }
            @media print {
              body { margin: 0; padding: 10px; }
            }
          </style>
        </head>
        <body>
          <div class="receipt">${receiptContent.innerHTML}</div>
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() {
                window.close();
              };
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex justify-between items-center">
            Order Complete
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        {/* Receipt Preview */}
        <div id="receipt-content" className="bg-gray-50 p-4 rounded border font-mono text-sm">
          <div className="text-center mb-4">
            <h2 className="font-bold text-lg uppercase">{transaction.businessName}</h2>
            <p className="text-xs">{transaction.businessAddress || "123 Main Street, City, ST 12345"}</p>
            <p className="text-xs">Contact #: {transaction.businessPhone || "(555) 123-4567"}</p>
            <div className="border-b border-gray-400 my-2"></div>
          </div>
          
          <div className="mb-4">
            <p className="text-xs mb-1">Receipt #: <span>{transaction.receiptNumber}</span></p>
            <p className="text-xs mb-1">Date: <span>{formatDate(transaction.createdAt)}</span></p>
            <p className="text-xs mb-2">Cashier: <span>{transaction.cashier}</span></p>
            
            <div className="border-b border-gray-400 my-2"></div>
            
            {/* Receipt Items */}
            <div className="space-y-1 mb-4">
              {transaction.items.map((item, index) => (
                <div key={index} className="flex justify-between">
                  <span>{item.quantity}x {item.name} @ {transaction.currencySymbol || "$"}{item.price.toFixed(2)}</span>
                  <span>{transaction.currencySymbol || "$"}{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            
            <div className="border-b border-gray-400 my-2"></div>
            
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>{transaction.currencySymbol || "$"}{transaction.subtotal}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax ({transaction.taxPercentage}%):</span>
              <span>{transaction.currencySymbol || "$"}{transaction.tax}</span>
            </div>
            <div className="flex justify-between font-bold text-base">
              <span>TOTAL:</span>
              <span>{transaction.currencySymbol || "$"}{transaction.total}</span>
            </div>
            
            <div className="border-b border-gray-400 my-2"></div>
            
            <div className="text-xs">
              <p>Payment Method: {transaction.paymentMethod.toUpperCase()}</p>
            </div>
            
            <div className="border-b border-gray-400 my-2"></div>
            
            <div className="text-center text-xs">
              {transaction.receiptFooter ? (
                transaction.receiptFooter.split('\n').map((line, index) => (
                  <p key={index}>{line}</p>
                ))
              ) : (
                <>
                  <p>Thank you for your business!</p>
                  <p>Please come again</p>
                </>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex space-x-3">
          <Button
            className="flex-1 bg-primary text-white hover:bg-blue-600"
            onClick={printReceipt}
          >
            <Printer className="w-4 h-4 mr-2" />
            Print Receipt
          </Button>
          <Button
            variant="secondary"
            className="flex-1"
            onClick={onClose}
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}