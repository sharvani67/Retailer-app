import React, { useState, useEffect } from 'react'

function PendingInvoice() {
  const [pendingOrders, setPendingOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPendingOrders();
  }, []);

  const fetchPendingOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch('${baseurl}/orders/all-orders');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Filter orders with invoice_status = 0 (pending invoice)
      const pendingInvoiceOrders = data.filter(order => 
        order.invoice_status === 0 || order.invoice_number === null
      );
      
      setPendingOrders(pendingInvoiceOrders);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching pending orders:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h1>Pending Invoice</h1>
        <p>Loading pending invoices...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h1>Pending Invoice</h1>
        <p style={{ color: 'red' }}>Error: {error}</p>
        <button onClick={fetchPendingOrders}>Retry</button>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>Pending Invoice</h1>
      
      {pendingOrders.length === 0 ? (
        <p>No pending invoices found.</p>
      ) : (
        <>
          <p>Total Pending Invoices: {pendingOrders.length}</p>
          
          <div style={{ overflowX: 'auto', marginTop: '20px' }}>
            <table style={{ 
              width: '100%', 
              borderCollapse: 'collapse',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              <thead>
                <tr style={{ backgroundColor: '#f8f9fa' }}>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Order #</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Customer</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Order Total</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Net Payable</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Assigned Staff</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Approval Status</th>
                  {/* <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Actions</th> */}
                </tr>
              </thead>
              <tbody>
                {pendingOrders.map(order => (
                  <tr key={order.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                    <td style={{ padding: '12px' }}>
                      <strong>{order.order_number}</strong>
                    </td>
                    <td style={{ padding: '12px' }}>
                      {order.customer_name}
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        Placed by: {order.ordered_by}
                      </div>
                    </td>
                    <td style={{ padding: '12px' }}>
                      ₹{parseFloat(order.order_total).toFixed(2)}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <strong>₹{parseFloat(order.net_payable).toFixed(2)}</strong>
                    </td>
                    <td style={{ padding: '12px' }}>
                      {order.assigned_staff}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        padding: '4px 12px',
                        backgroundColor: order.approval_status === 'Approved' ? '#d4edda' : '#fff3cd',
                        color: order.approval_status === 'Approved' ? '#155724' : '#856404',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}>
                        {order.approval_status}
                      </span>
                    </td>
                    {/* <td style={{ padding: '12px' }}>
                      {order.canGenerateInvoice && order.approval_status === 'Approved' ? (
                        <button 
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#28a745',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                          onClick={() => handleGenerateInvoice(order.id)}
                        >
                          Generate Invoice
                        </button>
                      ) : (
                        <span style={{ color: '#666', fontSize: '12px' }}>
                          Cannot generate
                        </span>
                      )}
                    </td> */}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

// Optional: Function to handle invoice generation
const handleGenerateInvoice = (orderId) => {
  console.log(`Generate invoice for order ID: ${orderId}`);
  // Add your invoice generation logic here
};

export default PendingInvoice;