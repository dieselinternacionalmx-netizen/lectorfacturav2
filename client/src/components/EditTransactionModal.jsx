import React, { useState, useEffect } from 'react';
import { X, Save, Plus, Trash2, AlertCircle } from 'lucide-react';

export default function EditTransactionModal({ isOpen, onClose, transaction, onSave }) {
    const [agent, setAgent] = useState('');
    const [invoiceLines, setInvoiceLines] = useState([{ invoice: '', amount: 0 }]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (transaction) {
            setAgent(transaction.agent || '');

            // Parse associated_invoices
            let parsedInvoices = [];
            if (transaction.associated_invoices) {
                try {
                    // Try to parse as JSON (new format)
                    parsedInvoices = JSON.parse(transaction.associated_invoices);
                    if (!Array.isArray(parsedInvoices)) {
                        // Old format: comma-separated string
                        const invoiceNames = transaction.associated_invoices.split(',').map(s => s.trim()).filter(Boolean);
                        parsedInvoices = invoiceNames.map(inv => ({ invoice: inv, amount: 0 }));
                    }
                } catch (e) {
                    // Old format: comma-separated string
                    const invoiceNames = transaction.associated_invoices.split(',').map(s => s.trim()).filter(Boolean);
                    parsedInvoices = invoiceNames.map(inv => ({ invoice: inv, amount: 0 }));
                }
            }

            setInvoiceLines(parsedInvoices.length > 0 ? parsedInvoices : [{ invoice: '', amount: 0 }]);
        }
    }, [transaction]);

    if (!isOpen) return null;

    const depositAmount = Math.abs(transaction?.amount || 0);
    const totalAssigned = invoiceLines.reduce((sum, line) => sum + (parseFloat(line.amount) || 0), 0);
    const remaining = depositAmount - totalAssigned;

    const handleAddLine = () => {
        setInvoiceLines([...invoiceLines, { invoice: '', amount: 0 }]);
    };

    const handleRemoveLine = (index) => {
        if (invoiceLines.length > 1) {
            setInvoiceLines(invoiceLines.filter((_, i) => i !== index));
        }
    };

    const handleLineChange = (index, field, value) => {
        const newLines = [...invoiceLines];
        newLines[index][field] = field === 'amount' ? parseFloat(value) || 0 : value;
        setInvoiceLines(newLines);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Filter out empty invoice lines
            const validLines = invoiceLines.filter(line => line.invoice.trim() !== '');

            await onSave(transaction.id, {
                agent,
                associated_invoices: validLines
            });
            onClose();
        } catch (error) {
            console.error('Error saving:', error);
            alert('Error al guardar los cambios');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(4px)'
        }}>
            <div className="modal-content" style={{
                backgroundColor: 'var(--card-bg)',
                padding: '2rem',
                borderRadius: '12px',
                width: '100%',
                maxWidth: '700px',
                maxHeight: '90vh',
                overflow: 'auto',
                border: '1px solid var(--border-color)',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>Editar Depósito</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                        <X size={24} />
                    </button>
                </div>

                <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Descripción Original</div>
                    <div style={{ fontSize: '0.9rem', fontFamily: 'var(--font-mono)' }}>{transaction?.description}</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 600, marginTop: '0.5rem', color: depositAmount >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                        Monto: ${depositAmount.toFixed(2)}
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 500 }}>Agente</label>
                        <input
                            type="text"
                            value={agent}
                            onChange={(e) => setAgent(e.target.value)}
                            className="search-input"
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                border: '1px solid var(--border-color)',
                                borderRadius: '6px',
                                backgroundColor: 'var(--bg-color)',
                                boxSizing: 'border-box'
                            }}
                            placeholder="Nombre del Agente"
                        />
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                            <label style={{ fontSize: '0.9rem', fontWeight: 500 }}>Facturas Asociadas</label>
                            <button
                                type="button"
                                onClick={handleAddLine}
                                className="view-btn"
                                style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                            >
                                <Plus size={16} /> Agregar Factura
                            </button>
                        </div>

                        <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)' }}>
                                        <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.85rem', fontWeight: 500, borderBottom: '1px solid var(--border-color)' }}>Factura</th>
                                        <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.85rem', fontWeight: 500, borderBottom: '1px solid var(--border-color)', width: '150px' }}>Monto</th>
                                        <th style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.85rem', fontWeight: 500, borderBottom: '1px solid var(--border-color)', width: '60px' }}>Acción</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {invoiceLines.map((line, index) => (
                                        <tr key={index} style={{ borderBottom: index < invoiceLines.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                                            <td style={{ padding: '0.5rem' }}>
                                                <input
                                                    type="text"
                                                    value={line.invoice}
                                                    onChange={(e) => handleLineChange(index, 'invoice', e.target.value)}
                                                    placeholder="F-123"
                                                    style={{
                                                        width: '100%',
                                                        padding: '0.5rem',
                                                        border: '1px solid var(--border-color)',
                                                        borderRadius: '4px',
                                                        backgroundColor: 'var(--bg-color)',
                                                        fontFamily: 'var(--font-mono)',
                                                        fontSize: '0.9rem'
                                                    }}
                                                />
                                            </td>
                                            <td style={{ padding: '0.5rem' }}>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    value={line.amount}
                                                    onChange={(e) => handleLineChange(index, 'amount', e.target.value)}
                                                    placeholder="0.00"
                                                    style={{
                                                        width: '100%',
                                                        padding: '0.5rem',
                                                        border: '1px solid var(--border-color)',
                                                        borderRadius: '4px',
                                                        backgroundColor: 'var(--bg-color)',
                                                        fontFamily: 'var(--font-mono)',
                                                        fontSize: '0.9rem'
                                                    }}
                                                />
                                            </td>
                                            <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveLine(index)}
                                                    disabled={invoiceLines.length === 1}
                                                    style={{
                                                        background: 'none',
                                                        border: 'none',
                                                        color: invoiceLines.length === 1 ? 'var(--text-muted)' : 'var(--danger)',
                                                        cursor: invoiceLines.length === 1 ? 'not-allowed' : 'pointer',
                                                        padding: '0.25rem',
                                                        opacity: invoiceLines.length === 1 ? 0.3 : 1
                                                    }}
                                                    title="Eliminar"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Summary */}
                        <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                                <span>Total Asignado:</span>
                                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>${totalAssigned.toFixed(2)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                                <span>Monto Depósito:</span>
                                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>${depositAmount.toFixed(2)}</span>
                            </div>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                fontSize: '0.95rem',
                                fontWeight: 600,
                                paddingTop: '0.5rem',
                                borderTop: '1px solid var(--border-color)',
                                color: remaining < 0 ? 'var(--danger)' : remaining === 0 ? 'var(--success)' : 'var(--warning)'
                            }}>
                                <span>Diferencia:</span>
                                <span style={{ fontFamily: 'var(--font-mono)' }}>
                                    ${Math.abs(remaining).toFixed(2)} {remaining === 0 ? '✓' : remaining < 0 ? '⚠️' : ''}
                                </span>
                            </div>
                            {remaining < 0 && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.75rem', padding: '0.5rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: '4px', fontSize: '0.85rem', color: 'var(--danger)' }}>
                                    <AlertCircle size={16} />
                                    <span>El total asignado excede el monto del depósito</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                        <button
                            type="button"
                            onClick={onClose}
                            className="view-btn"
                            style={{ border: '1px solid var(--border-color)' }}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="scan-button"
                            disabled={loading}
                            style={{ padding: '0.6rem 1.5rem' }}
                        >
                            {loading ? 'Guardando...' : (
                                <>
                                    <Save size={18} /> Guardar Cambios
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
