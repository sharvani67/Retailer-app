import React, { useState, useEffect } from 'react';
import TabBar from '@/components/TabBar';
import { baseurl } from '@/Api/Baseurl';

function Receipts() {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retailerName, setRetailerName] = useState('Sai'); // Default retailer name

  // // Fetch receipts data
  // useEffect(() => {
  //   const fetchReceipts = async () => {
  //     try {
  //       const response = await fetch(`${baseurl}/api/receipts`);
        
  //       // Filter receipts for the specific retailer only
  //       const filteredReceipts = response.data.filter(
  //         receipt => receipt.PartyName === retailerName || receipt.AccountName === retailerName
  //       );
        
  //       setReceipts(filteredReceipts);
  //       setLoading(false);
  //     } catch (err) {
  //       setError('Failed to fetch receipts');
  //       setLoading(false);
  //       console.error('Error fetching receipts:', err);
  //     }
  //   };

  //   fetchReceipts();
  // }, [retailerName]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Receipts</h1>
        <div className="text-lg font-semibold text-blue-600">
          Retailer: {retailerName}
        </div>
      </div>

      {receipts.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500 text-lg">No receipts found for {retailerName}</p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Receipt No.
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Invoice No.
                </th>
                <th className="px6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment Terms
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {receipts.map((receipt) => (
                <tr key={receipt.VoucherID} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {receipt.VchNo}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {formatDate(receipt.Date)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {receipt.InvoiceNumber || receipt.invoice_numbers?.join(', ')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-green-600">
                      {formatCurrency(receipt.paid_amount || receipt.TotalAmount)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      receipt.status === 'Paid' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {receipt.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {receipt.PaymentTerms}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button className="text-blue-600 hover:text-blue-900 mr-4">
                      View
                    </button>
                    <button className="text-gray-600 hover:text-gray-900">
                      Download
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50">
              <tr>
                {/* <td colSpan="3" className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                  Total Amount:
                </td> */}
                <td className="px-6 py-3 text-sm font-bold text-gray-900">
                  {formatCurrency(
                    receipts.reduce((sum, receipt) => sum + parseFloat(receipt.paid_amount || receipt.TotalAmount || 0), 0)
                  )}
                </td>
                {/* <td colSpan="3"></td> */}
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* Summary Cards */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-blue-50 p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">Total Receipts</h3>
          <p className="text-3xl font-bold text-blue-600">{receipts.length}</p>
        </div>
        <div className="bg-green-50 p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-green-800 mb-2">Total Paid</h3>
          <p className="text-3xl font-bold text-green-600">
            {formatCurrency(
              receipts.reduce((sum, receipt) => sum + parseFloat(receipt.paid_amount || receipt.TotalAmount || 0), 0)
            )}
          </p>
        </div>
        <div className="bg-purple-50 p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-purple-800 mb-2">Average per Receipt</h3>
          <p className="text-3xl font-bold text-purple-600">
            {receipts.length > 0 
              ? formatCurrency(
                  receipts.reduce((sum, receipt) => sum + parseFloat(receipt.paid_amount || receipt.TotalAmount || 0), 0) / receipts.length
                )
              : formatCurrency(0)
            }
          </p>
        </div>
      </div>
      <TabBar />
    </div>
  );
}

export default Receipts;