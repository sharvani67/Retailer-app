import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Download, FileText, ArrowLeft, ExternalLink, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import TabBar from '@/components/TabBar';
import { baseurl } from '@/Api/Baseurl';

interface Invoice {
  fileName: string;
  data: string;
  status: string;
}


interface ApiResponse {
  success: boolean;
  count: number;
  orderNumber: string;
  pdfs: Invoice[];
  message?: string;
}

const InvoiceDownload = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const orderNumber = location.state?.orderNumber;
  
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!orderNumber) {
      navigate('/orders');
      return;
    }

    fetchInvoices();
  }, [orderNumber, navigate]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${baseurl}/transactions/download-pdf?order_number=${orderNumber}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch invoices: ${response.status}`);
      }

      const data: ApiResponse = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to load invoices');
      }

      setInvoices(data.pdfs || []);
    } catch (err) {
      console.error('Error fetching invoices:', err);
      setError(err instanceof Error ? err.message : 'Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  const downloadInvoice = (invoice: Invoice, index: number) => {
    try {
      setDownloadingId(`${orderNumber}-${index}`);
      
      // Decode base64 data
      const byteCharacters = atob(invoice.data);
      const byteNumbers = new Array(byteCharacters.length);
      
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = invoice.fileName || `invoice_${index + 1}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      // Also set as preview URL
      setPreviewUrl(url);
      
    } catch (err) {
      console.error('Error downloading invoice:', err);
      alert('Failed to download invoice. Please try again.');
    } finally {
      setDownloadingId(null);
    }
  };

  const openInvoiceInNewTab = (invoice: Invoice, index: number) => {
    try {
      const byteCharacters = atob(invoice.data);
      const byteNumbers = new Array(byteCharacters.length);
      
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (err) {
      console.error('Error opening invoice:', err);
      alert('Failed to open invoice. Please try downloading instead.');
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border">
          <div className="max-w-md mx-auto p-4">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="p-0 h-8 w-8"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Invoice Download</h1>
                <p className="text-sm text-muted-foreground">Loading invoices...</p>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-md mx-auto p-4 space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Skeleton className="h-10 flex-1" />
                  <Skeleton className="h-10 flex-1" />
                </div>
              </CardContent>
            </Card>
          ))}
        </main>
        <TabBar />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border">
          <div className="max-w-md mx-auto p-4">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="p-0 h-8 w-8"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Invoice Download</h1>
                <p className="text-sm text-muted-foreground">Order: {orderNumber}</p>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-md mx-auto p-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
          
          <Button onClick={fetchInvoices} className="w-full mt-4">
            Try Again
          </Button>
        </main>
        <TabBar />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="max-w-md mx-auto p-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="p-0 h-8 w-8"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Invoice Download</h1>
              <p className="text-sm text-muted-foreground">
                Order: {orderNumber} • {invoices.length} invoice{invoices.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto p-4">
        {invoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[60vh] text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="bg-muted rounded-full p-8 mb-6"
            >
              <FileText className="h-16 w-16 text-muted-foreground" />
            </motion.div>
            <h2 className="text-xl font-bold mb-2">No Invoices Found</h2>
            <p className="text-muted-foreground mb-4">
              No invoices available for order {orderNumber}
            </p>
            <Button variant="outline" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Orders
            </Button>
          </div>
        ) : (
          <>
            {/* Success Alert */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Found {invoices.length} invoice{invoices.length !== 1 ? 's' : ''} for order {orderNumber}
                </AlertDescription>
              </Alert>
            </motion.div>

            {/* Invoices List */}
            <div className="space-y-4">
              {invoices.map((invoice, index) => (
                <motion.div
                  key={`${orderNumber}-${index}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <FileText className="h-5 w-5 text-primary" />
                            {invoice.fileName || `Invoice ${index + 1}`}
                          </CardTitle>
                          
                        </div>
                        <Badge variant="outline" className="bg-blue-50">
                         {invoice.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pb-4">
                      <div className="flex gap-2">
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => downloadInvoice(invoice, index)}
                          disabled={downloadingId === `${orderNumber}-${index}`}
                          className="flex-1"
                        >
                          {downloadingId === `${orderNumber}-${index}` ? (
                            <>
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                className="mr-2"
                              >
                                <Download className="h-4 w-4" />
                              </motion.div>
                              Downloading...
                            </>
                          ) : (
                            <>
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </>
                          )}
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openInvoiceInNewTab(invoice, index)}
                          className="flex-1"
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Open
                        </Button>
                      </div>
                      
                      {/* Preview link if downloaded */}
                      {previewUrl && downloadingId === `${orderNumber}-${index}` && (
                        <p className="text-xs text-muted-foreground mt-2 text-center">
                          If download doesn't start,{' '}
                          <a
                            href={previewUrl}
                            download={invoice.fileName}
                            className="text-primary hover:underline"
                          >
                            click here
                          </a>
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </main>

      <TabBar />
    </div>
  );
};

export default InvoiceDownload;