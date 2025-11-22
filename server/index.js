const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const db = require('./database');
const { parseInvoice } = require('./parser');
const { parseBankPDF } = require('./parse_bank_pdf');
const config = require('./config');

const app = express();
const PORT = config.SERVER_PORT;

app.use(cors());
app.use(express.json());

// Request logger
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`${req.method} ${req.url} took ${duration}ms [${res.statusCode}]`);
    });
    next();
});

const PDF_DIR = path.join(__dirname, '..', config.PDF_FOLDER_NAME);

// API to get all invoices
app.get('/api/invoices', (req, res) => {
    try {
        const stmt = db.prepare('SELECT * FROM invoices ORDER BY date DESC');
        const invoices = stmt.all();
        res.json(invoices);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// API to scan directory and process new files
app.post('/api/scan', async (req, res) => {
    try {
        if (!fs.existsSync(PDF_DIR)) {
            return res.status(400).json({ error: 'Directory not found' });
        }

        const files = fs.readdirSync(PDF_DIR).filter(file => file.toLowerCase().endsWith('.pdf'));
        let processedCount = 0;

        const insertStmt = db.prepare(`
            INSERT OR IGNORE INTO invoices (filename, invoice_number, date, agent, client, rfc, subtotal, iva, total, raw_text)
            VALUES (@filename, @invoice_number, @date, @agent, @client, @rfc, @subtotal, @iva, @total, @raw_text)
        `);

        for (const file of files) {
            const filePath = path.join(PDF_DIR, file);

            // Check if already processed
            const exists = db.prepare('SELECT id FROM invoices WHERE filename = ?').get(file);
            if (exists) continue;

            const data = await parseInvoice(filePath);
            if (data) {
                insertStmt.run(data);
                processedCount++;
            }
        }

        res.json({ message: `Scan complete. Processed ${processedCount} new files.`, count: processedCount });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// API to get all bank transactions
app.get('/api/bank-transactions', (req, res) => {
    try {
        const stmt = db.prepare('SELECT * FROM bank_transactions ORDER BY id DESC');
        const transactions = stmt.all();
        res.json(transactions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// API to scan bank PDF
app.post('/api/scan-bank', async (req, res) => {
    try {
        const bankPdfPath = path.join(__dirname, '..', 'depositosbanorte', 'depositos.pdf');

        if (!fs.existsSync(bankPdfPath)) {
            return res.status(400).json({ error: 'File depositosbanorte/depositos.pdf not found' });
        }

        const transactions = await parseBankPDF(bankPdfPath);
        let processedCount = 0;

        const insertStmt = db.prepare(`
            INSERT INTO bank_transactions (date, agent, description, amount, balance, beneficiary, tracking_key, associated_invoices)
            VALUES (@date, @agent, @description, @amount, @balance, @beneficiary, @tracking_key, @associated_invoices)
        `);

        const deleteStmt = db.prepare('DELETE FROM bank_transactions');
        deleteStmt.run();

        const transaction = db.transaction((txs) => {
            for (const tx of txs) {
                insertStmt.run(tx);
                processedCount++;
            }
        });

        transaction(transactions);

        res.json({ message: `Scan complete. Processed ${processedCount} transactions.`, count: processedCount });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// API to update a bank transaction
app.put('/api/bank-transactions/:id', (req, res) => {
    try {
        const { id } = req.params;
        const { agent, associated_invoices } = req.body;

        // Get the transaction to check the amount
        const transaction = db.prepare('SELECT amount FROM bank_transactions WHERE id = ?').get(id);
        if (!transaction) {
            return res.status(404).json({ error: 'Transaction not found' });
        }

        // Validate and serialize associated_invoices
        let invoicesData = associated_invoices;

        // If it's an array (new format), validate and serialize to JSON
        if (Array.isArray(associated_invoices)) {
            // Validate structure
            for (const item of associated_invoices) {
                if (!item.invoice || typeof item.amount !== 'number') {
                    return res.status(400).json({ error: 'Invalid invoice format. Each item must have "invoice" and "amount" fields.' });
                }
                if (item.amount < 0) {
                    return res.status(400).json({ error: 'Invoice amounts cannot be negative.' });
                }
            }

            // Calculate total assigned
            const totalAssigned = associated_invoices.reduce((sum, item) => sum + item.amount, 0);
            const depositAmount = Math.abs(transaction.amount);

            // Warning if exceeds (but allow it)
            if (totalAssigned > depositAmount) {
                console.warn(`Warning: Total assigned ($${totalAssigned}) exceeds deposit amount ($${depositAmount}) for transaction ${id}`);
            }

            // Serialize to JSON string for storage
            invoicesData = JSON.stringify(associated_invoices);
        }

        // Update the transaction
        const updateStmt = db.prepare(`
            UPDATE bank_transactions 
            SET agent = ?, associated_invoices = ?
            WHERE id = ?
        `);

        updateStmt.run(agent, invoicesData, id);

        res.json({ success: true, message: 'Transaction updated successfully' });
    } catch (error) {
        console.error('Error updating transaction:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// PAYMENT ENDPOINTS (Invoice-Centric)
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

// GET /api/bank-transactions/unallocated - Get unallocated deposits
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

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
