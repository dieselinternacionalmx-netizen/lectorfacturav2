// API functions for payment management

const API_BASE = 'http://localhost:3001/api';

// Get payment history for an invoice
export async function getInvoicePayments(invoiceId) {
    const response = await fetch(`${API_BASE}/invoices/${invoiceId}/payments`);
    if (!response.ok) throw new Error('Failed to fetch invoice payments');
    return response.json();
}

// Register a payment to an invoice
export async function registerPayment(invoiceId, paymentData) {
    const response = await fetch(`${API_BASE}/invoices/${invoiceId}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentData)
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to register payment');
    }
    return response.json();
}

// Revert a payment
export async function revertPayment(paymentId) {
    const response = await fetch(`${API_BASE}/invoice-payments/${paymentId}`, {
        method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to revert payment');
    return response.json();
}

// Get unallocated bank transactions
export async function getUnallocatedTransactions() {
    const response = await fetch(`${API_BASE}/bank-transactions/unallocated`);
    if (!response.ok) throw new Error('Failed to fetch unallocated transactions');
    return response.json();
}

// Get allocations for a transaction
export async function getTransactionAllocations(transactionId) {
    const response = await fetch(`${API_BASE}/bank-transactions/${transactionId}/allocations`);
    if (!response.ok) throw new Error('Failed to fetch allocations');
    return response.json();
}
