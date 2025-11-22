// ============================================
// NEW PAYMENT ENDPOINTS
// For invoice-centric payment registration
// ============================================

// GET /api/invoices/:id/payments - Get payment history for an invoice
app.get('/api/invoices/:id/payments', (req, res) => {
    try {
        const { id } = req.params;

        const payments = db.prepare(`
            SELECT 
                ip.*,
                bt.date as transaction_date,
                bt.description,
                bt.tracking_key
            FROM invoice_payments ip
            JOIN bank_transactions bt ON ip.transaction_id = bt.id
            WHERE ip.invoice_id = ?
            ORDER BY ip.applied_at DESC
        `).all(id);

        res.json(payments);
    } catch (error) {
        console.error('Error getting invoice payments:', error);
        res.status(500).json({ error: error.message });
    }
});

// POST /api/invoices/:id/payments - Register a payment to an invoice
app.post('/api/invoices/:id/payments', (req, res) => {
    try {
        const { id } = req.params;
        const { transaction_id, amount, notes } = req.body;

        // Validate inputs
        if (!transaction_id || !amount) {
            return res.status(400).json({ error: 'transaction_id and amount are required' });
        }

        if (amount <= 0) {
            return res.status(400).json({ error: 'Amount must be greater than 0' });
        }

        // Get invoice
        const invoice = db.prepare('SELECT * FROM invoices WHERE id = ?').get(id);
        if (!invoice) {
            return res.status(404).json({ error: 'Invoice not found' });
        }

        // Get transaction
        const transaction = db.prepare('SELECT * FROM bank_transactions WHERE id = ?').get(transaction_id);
        if (!transaction) {
            return res.status(404).json({ error: 'Transaction not found' });
        }

        // Check if payment would exceed invoice total
        const currentPaid = invoice.paid_amount || 0;
        if (currentPaid + amount > invoice.total) {
            return res.status(400).json({
                error: 'Payment amount would exceed invoice total',
                invoice_total: invoice.total,
                already_paid: currentPaid,
                remaining: invoice.total - currentPaid
            });
        }

        // Check if payment would exceed transaction remaining amount
        const txAllocated = transaction.allocated_amount || 0;
        const txRemaining = Math.abs(transaction.amount) - txAllocated;
        if (amount > txRemaining) {
            return res.status(400).json({
                error: 'Payment amount exceeds transaction remaining amount',
                transaction_amount: Math.abs(transaction.amount),
                already_allocated: txAllocated,
                remaining: txRemaining
            });
        }

        // Insert payment (triggers will update invoice and transaction automatically)
        const insertStmt = db.prepare(`
            INSERT INTO invoice_payments (invoice_id, transaction_id, amount, notes)
            VALUES (?, ?, ?, ?)
        `);

        const result = insertStmt.run(id, transaction_id, amount, notes || null);

        // Get updated invoice
        const updatedInvoice = db.prepare('SELECT * FROM invoices WHERE id = ?').get(id);

        res.json({
            success: true,
            payment_id: result.lastInsertRowid,
            invoice: updatedInvoice
        });
    } catch (error) {
        console.error('Error registering payment:', error);
        res.status(500).json({ error: error.message });
    }
});

// DELETE /api/invoice-payments/:id - Revert a payment
app.delete('/api/invoice-payments/:id', (req, res) => {
    try {
        const { id } = req.params;

        // Get payment info before deleting
        const payment = db.prepare('SELECT * FROM invoice_payments WHERE id = ?').get(id);
        if (!payment) {
            return res.status(404).json({ error: 'Payment not found' });
        }

        // Delete payment (triggers will update invoice and transaction automatically)
        const deleteStmt = db.prepare('DELETE FROM invoice_payments WHERE id = ?');
        deleteStmt.run(id);

        // Get updated invoice
        const updatedInvoice = db.prepare('SELECT * FROM invoices WHERE id = ?').get(payment.invoice_id);

        res.json({
            success: true,
            message: 'Payment reverted successfully',
            invoice: updatedInvoice
        });
    } catch (error) {
        console.error('Error reverting payment:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET /api/bank-transactions (enhanced with unallocated filter)
// Update existing endpoint to support ?unallocated=true
app.get('/api/bank-transactions/unallocated', (req, res) => {
    try {
        const stmt = db.prepare(`
            SELECT * FROM bank_transactions 
            WHERE (allocated_amount IS NULL OR allocated_amount < ABS(amount))
            AND amount > 0
            ORDER BY date DESC
        `);
        const transactions = stmt.all();
        res.json(transactions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/bank-transactions/:id/allocations - See where a deposit is allocated
app.get('/api/bank-transactions/:id/allocations', (req, res) => {
    try {
        const { id } = req.params;

        const allocations = db.prepare(`
            SELECT 
                ip.*,
                i.invoice_number,
                i.client,
                i.total as invoice_total
            FROM invoice_payments ip
            JOIN invoices i ON ip.invoice_id = i.id
            WHERE ip.transaction_id = ?
            ORDER BY ip.applied_at DESC
        `).all(id);

        res.json(allocations);
    } catch (error) {
        console.error('Error getting allocations:', error);
        res.status(500).json({ error: error.message });
    }
});
