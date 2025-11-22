import { useState, useEffect } from 'react';
import { X, DollarSign, Calendar, CreditCard, Trash2 } from 'lucide-react';
import { getUnallocatedTransactions, registerPayment, getInvoicePayments } from '../api_payments';
import InvoiceStatusBadge from './InvoiceStatusBadge';

/**
 * InvoicePaymentModal - Modal for registering payments to an invoice
 * 
 * @param {object} invoice - The invoice to register payment for
 * @param {function} onClose - Callback to close modal
 * @param {function} onSuccess - Callback after successful payment registration
 */
export default function InvoicePaymentModal({ invoice, onClose, onSuccess }) {
    const [availableDeposits, setAvailableDeposits] = useState([]);
    const [selectedDeposits, setSelectedDeposits] = useState([]);
    const [paymentHistory, setPaymentHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadData();
    }, [invoice.id]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [deposits, history] = await Promise.all([
                getUnallocatedTransactions(),
                getInvoicePayments(invoice.id)
            ]);
            setAvailableDeposits(deposits);
            setPaymentHistory(history);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDepositToggle = (deposit) => {
        const isSelected = selectedDeposits.find(d => d.id === deposit.id);

        if (isSelected) {
            setSelectedDeposits(selectedDeposits.filter(d => d.id !== deposit.id));
        } else {
            // Calculate suggested amount
            const remaining = invoice.remaining_amount || invoice.total;
            const depositRemaining = Math.abs(deposit.amount) - (deposit.allocated_amount || 0);
            const suggestedAmount = Math.min(remaining, depositRemaining);

            setSelectedDeposits([...selectedDeposits, {
                ...deposit,
                appliedAmount: suggestedAmount
            }]);
        }
    };

    const handleAmountChange = (depositId, amount) => {
        setSelectedDeposits(selectedDeposits.map(d =>
            d.id === depositId ? { ...d, appliedAmount: parseFloat(amount) || 0 } : d
        ));
    };

    const getTotalApplied = () => {
        return selectedDeposits.reduce((sum, d) => sum + (d.appliedAmount || 0), 0);
    };

    const getNewStatus = () => {
        const totalApplied = getTotalApplied();
        const currentPaid = invoice.paid_amount || 0;
        const newPaid = currentPaid + totalApplied;

        if (newPaid >= invoice.total) return 'paid';
        if (newPaid > 0) return 'partial';
        return 'pending';
    };

    const handleSubmit = async () => {
        try {
            setSubmitting(true);
            setError(null);

            // Register each payment
            for (const deposit of selectedDeposits) {
                if (deposit.appliedAmount > 0) {
                    await registerPayment(invoice.id, {
                        transaction_id: deposit.id,
                        amount: deposit.appliedAmount,
                        notes: `Pago desde depósito ${deposit.tracking_key || deposit.description}`
                    });
                }
            }

            onSuccess();
            onClose();
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN'
        }).format(amount);
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '900px', maxHeight: '90vh', overflow: 'auto' }}>
                {/* Header */}
                <div className="modal-header">
                    <div>
                        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                            <DollarSign size={24} />
                            Registrar Pago - Factura {invoice.invoice_number}
                        </h2>
                        <p className="text-sm text-gray-400 mt-1">
                            Cliente: {invoice.client}
                        </p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <X size={24} />
                    </button>
                </div>

                {/* Invoice Info */}
                <div className="p-6 bg-dark-lighter rounded-lg mb-6">
                    <div className="grid grid-cols-4 gap-4">
                        <div>
                            <span className="text-xs text-gray-400">Total Factura</span>
                            <p className="text-lg font-semibold text-white">{formatCurrency(invoice.total)}</p>
                        </div>
                        <div>
                            <span className="text-xs text-gray-400">Pagado</span>
                            <p className="text-lg font-semibold text-green-400">{formatCurrency(invoice.paid_amount || 0)}</p>
                        </div>
                        <div>
                            <span className="text-xs text-gray-400">Pendiente</span>
                            <p className="text-lg font-semibold text-yellow-400">{formatCurrency(invoice.remaining_amount || invoice.total)}</p>
                        </div>
                        <div>
                            <span className="text-xs text-gray-400">Estado</span>
                            <div className="mt-1">
                                <InvoiceStatusBadge
                                    status={invoice.payment_status || 'pending'}
                                    paidAmount={invoice.paid_amount || 0}
                                    total={invoice.total}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Available Deposits */}
                <div className="mb-6">
                    <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                        <CreditCard size={20} />
                        Depósitos Disponibles
                    </h3>

                    {loading ? (
                        <div className="text-center py-8 text-gray-400">Cargando depósitos...</div>
                    ) : availableDeposits.length === 0 ? (
                        <div className="text-center py-8 text-gray-400">No hay depósitos disponibles</div>
                    ) : (
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            {availableDeposits.map(deposit => {
                                const isSelected = selectedDeposits.find(d => d.id === deposit.id);
                                const depositRemaining = Math.abs(deposit.amount) - (deposit.allocated_amount || 0);

                                return (
                                    <div
                                        key={deposit.id}
                                        className={`p-4 rounded-lg border cursor-pointer transition-all ${isSelected
                                                ? 'bg-primary/10 border-primary'
                                                : 'bg-dark-lighter border-dark-border hover:border-gray-600'
                                            }`}
                                        onClick={() => !isSelected && handleDepositToggle(deposit)}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3">
                                                    <input
                                                        type="checkbox"
                                                        checked={!!isSelected}
                                                        onChange={() => handleDepositToggle(deposit)}
                                                        className="w-4 h-4"
                                                    />
                                                    <div>
                                                        <p className="text-white font-medium">
                                                            {formatDate(deposit.date)} - {formatCurrency(Math.abs(deposit.amount))}
                                                        </p>
                                                        <p className="text-sm text-gray-400">
                                                            {deposit.description || deposit.tracking_key}
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            Disponible: {formatCurrency(depositRemaining)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {isSelected && (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm text-gray-400">Aplicar:</span>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max={depositRemaining}
                                                        step="0.01"
                                                        value={isSelected.appliedAmount}
                                                        onChange={(e) => handleAmountChange(deposit.id, e.target.value)}
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="w-32 px-3 py-2 bg-dark border border-dark-border rounded text-white"
                                                    />
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDepositToggle(deposit);
                                                        }}
                                                        className="p-2 text-red-400 hover:text-red-300"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Summary */}
                {selectedDeposits.length > 0 && (
                    <div className="p-6 bg-dark-lighter rounded-lg mb-6">
                        <h3 className="text-lg font-semibold text-white mb-4">Resumen</h3>
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-gray-400">Total a aplicar:</span>
                                <span className="text-white font-semibold">{formatCurrency(getTotalApplied())}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-400">Nuevo saldo pagado:</span>
                                <span className="text-green-400 font-semibold">
                                    {formatCurrency((invoice.paid_amount || 0) + getTotalApplied())}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-400">Nuevo estado:</span>
                                <InvoiceStatusBadge
                                    status={getNewStatus()}
                                    paidAmount={(invoice.paid_amount || 0) + getTotalApplied()}
                                    total={invoice.total}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg mb-6">
                        <p className="text-red-400">{error}</p>
                    </div>
                )}

                {/* Actions */}
                <div className="flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-dark-lighter text-white rounded-lg hover:bg-dark-border transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={selectedDeposits.length === 0 || getTotalApplied() === 0 || submitting}
                        className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {submitting ? 'Aplicando...' : '💾 Aplicar Pago'}
                    </button>
                </div>
            </div>
        </div>
    );
}
