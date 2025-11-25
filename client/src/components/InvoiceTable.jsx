import React, { useState, useMemo } from 'react';
import {
    useReactTable,
    getCoreRowModel,
    getSortedRowModel,
    getFilteredRowModel,
    flexRender,
} from '@tanstack/react-table';
import { ArrowUpDown, Search, DollarSign, Trash2 } from 'lucide-react';
import InvoiceStatusBadge from './InvoiceStatusBadge';
import InvoicePaymentModal from './InvoicePaymentModal';
import { deleteInvoices } from '../api';

export default function InvoiceTable({ data, agentFilter, setAgentFilter, onDataUpdate }) {
    const [sorting, setSorting] = useState([]);
    const [globalFilter, setGlobalFilter] = useState('');
    const [monthFilter, setMonthFilter] = useState('');
    const [paymentModalInvoice, setPaymentModalInvoice] = useState(null);
    const [selectedRows, setSelectedRows] = useState(new Set());
    const [isDeleting, setIsDeleting] = useState(false);

    // Get unique agents for the dropdown
    const uniqueAgents = useMemo(() => {
        const agents = new Set(data.map(d => d.agent).filter(Boolean));
        return Array.from(agents).sort();
    }, [data]);

    // Get unique months/years for the dropdown
    const uniqueMonths = useMemo(() => {
        const months = new Set();
        data.forEach(item => {
            if (item.date) {
                // Extract YYYY-MM from the date
                const monthYear = item.date.substring(0, 7); // Assumes format YYYY-MM-DD
                months.add(monthYear);
            }
        });
        return Array.from(months).sort().reverse(); // Most recent first
    }, [data]);

    // Filter data manually to avoid table state issues
    const filteredData = useMemo(() => {
        let filtered = data;

        // Filter by agent
        if (agentFilter) {
            filtered = filtered.filter(item => item.agent === agentFilter);
        }

        // Filter by month/year
        if (monthFilter) {
            filtered = filtered.filter(item => item.date && item.date.startsWith(monthFilter));
        }

        return filtered;
    }, [data, agentFilter, monthFilter]);

    // Helper to generate consistent colors for agents
    const getAgentColor = (name) => {
        const colors = [
            { bg: 'rgba(254, 202, 202, 0.15)', text: '#fca5a5', border: 'rgba(254, 202, 202, 0.2)' }, // Red
            { bg: 'rgba(253, 186, 116, 0.15)', text: '#fdba74', border: 'rgba(253, 186, 116, 0.2)' }, // Orange
            { bg: 'rgba(252, 211, 77, 0.15)', text: '#fcd34d', border: 'rgba(252, 211, 77, 0.2)' }, // Amber
            { bg: 'rgba(134, 239, 172, 0.15)', text: '#86efac', border: 'rgba(134, 239, 172, 0.2)' }, // Green
            { bg: 'rgba(147, 197, 253, 0.15)', text: '#93c5fd', border: 'rgba(147, 197, 253, 0.2)' }, // Blue
            { bg: 'rgba(165, 180, 252, 0.15)', text: '#a5b4fc', border: 'rgba(165, 180, 252, 0.2)' }, // Indigo
            { bg: 'rgba(216, 180, 254, 0.15)', text: '#d8b4fe', border: 'rgba(216, 180, 254, 0.2)' }, // Purple
            { bg: 'rgba(240, 171, 252, 0.15)', text: '#f0abfc', border: 'rgba(240, 171, 252, 0.2)' }, // Pink
        ];
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    };

    const handleDeleteSelected = async () => {
        if (selectedRows.size === 0) return;

        const confirmed = window.confirm(
            `¿Estás seguro de que deseas eliminar ${selectedRows.size} factura(s)? Esta acción no se puede deshacer.`
        );

        if (!confirmed) return;

        setIsDeleting(true);
        try {
            await deleteInvoices(Array.from(selectedRows));
            setSelectedRows(new Set());
            if (onDataUpdate) onDataUpdate();
        } catch (error) {
            console.error('Error deleting invoices:', error);
            alert(`Error al eliminar facturas: ${error.message}`);
        } finally {
            setIsDeleting(false);
        }
    };

    const toggleRowSelection = (rowId) => {
        setSelectedRows(prev => {
            const newSet = new Set(prev);
            if (newSet.has(rowId)) {
                newSet.delete(rowId);
            } else {
                newSet.add(rowId);
            }
            return newSet;
        });
    };

    const toggleSelectAll = () => {
        if (selectedRows.size === filteredData.length) {
            setSelectedRows(new Set());
        } else {
            setSelectedRows(new Set(filteredData.map(row => row.id)));
        }
    };

    const columns = useMemo(
        () => [
            {
                id: 'select',
                header: () => (
                    <input
                        type="checkbox"
                        checked={selectedRows.size === filteredData.length && filteredData.length > 0}
                        onChange={toggleSelectAll}
                        className="cursor-pointer"
                    />
                ),
                cell: ({ row }) => (
                    <input
                        type="checkbox"
                        checked={selectedRows.has(row.original.id)}
                        onChange={() => toggleRowSelection(row.original.id)}
                        className="cursor-pointer"
                    />
                ),
                size: 50,
            },
            {
                header: 'Archivo',
                accessorKey: 'filename',
                size: 200,
            },
            {
                header: 'Factura #',
                accessorKey: 'invoice_number',
                size: 120,
            },
            {
                header: 'Fecha',
                accessorKey: 'date',
                size: 120,
            },
            {
                header: 'Cliente',
                accessorKey: 'client',
                cell: info => <span className="text-secondary">{info.getValue() || ''}</span>,
                size: 250,
            },
            {
                header: 'RFC',
                accessorKey: 'rfc',
                size: 150,
            },
            {
                header: 'Agente',
                accessorKey: 'agent',
                cell: info => {
                    const name = info.getValue();
                    const style = getAgentColor(name);
                    return (
                        <span
                            className="agent-badge"
                            style={{
                                backgroundColor: style.bg,
                                color: style.text,
                                border: `1px solid ${style.border}`
                            }}
                        >
                            {name}
                        </span>
                    );
                },
                size: 180,
            },
            {
                header: 'Subtotal',
                accessorKey: 'subtotal',
                cell: info => <span className="font-mono">{`$${(info.getValue() || 0).toFixed(2)}`}</span>,
                size: 120,
            },
            {
                header: 'IVA',
                accessorKey: 'iva',
                cell: info => <span className="font-mono">{`$${(info.getValue() || 0).toFixed(2)}`}</span>,
                size: 120,
            },
            {
                header: 'Total',
                accessorKey: 'total',
                cell: info => <span className="font-bold text-success text-lg font-mono">{`$${(info.getValue() || 0).toFixed(2)}`}</span>,
                size: 140,
            },
            {
                header: 'Pagado',
                accessorKey: 'paid_amount',
                cell: info => {
                    const paid = info.getValue() || 0;
                    return <span className="font-mono text-green-400">{`$${paid.toFixed(2)}`}</span>;
                },
                size: 120,
            },
            {
                header: 'Estado',
                accessorKey: 'payment_status',
                cell: info => {
                    const row = info.row.original;
                    return (
                        <InvoiceStatusBadge
                            status={info.getValue() || 'pending'}
                            paidAmount={row.paid_amount || 0}
                            total={row.total}
                        />
                    );
                },
                size: 140,
            },
            {
                header: 'Acción',
                id: 'actions',
                cell: info => {
                    const row = info.row.original;
                    const isPending = (row.payment_status || 'pending') !== 'paid';

                    return isPending ? (
                        <button
                            onClick={() => setPaymentModalInvoice(row)}
                            className="px-3 py-1.5 bg-primary hover:bg-primary/90 text-white rounded text-sm font-medium transition-colors flex items-center gap-1"
                        >
                            <DollarSign size={16} />
                            Pagar
                        </button>
                    ) : (
                        <span className="text-xs text-gray-500">Pagada</span>
                    );
                },
                size: 100,
            },
        ],
        [selectedRows, filteredData]
    );

    const table = useReactTable({
        data: filteredData,
        columns,
        state: {
            sorting,
            globalFilter,
        },
        onSortingChange: setSorting,
        onGlobalFilterChange: setGlobalFilter,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
    });

    // Export to CSV
    const handleExport = () => {
        // Debug: Check first row
        if (filteredData.length > 0) {
            console.log('First row data:', filteredData[0]);
        }

        const headers = ['Archivo', 'Factura #', 'Fecha', 'Cliente', 'RFC', 'Agente', 'Subtotal', 'IVA', 'Total'];
        const csvContent = [
            headers.join(','),
            ...filteredData.map(row => [
                `"${row.filename}"`,
                `"${row.invoice_number}"`,
                `"${row.date}"`,
                `"${row.client || ''}"`,
                `"${row.rfc || ''}"`,
                `"${row.agent || ''}"`,
                (row.subtotal || 0).toFixed(2),
                (row.iva || 0).toFixed(2),
                (row.total || 0).toFixed(2)
            ].join(','))
        ].join('\n');

        console.log('CSV Preview (first 500 chars):', csvContent.substring(0, 500));

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `facturas_export_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="table-container">
            <div className="controls">
                <div className="search-bar">
                    <Search size={20} />
                    <input
                        value={globalFilter ?? ''}
                        onChange={e => setGlobalFilter(e.target.value)}
                        placeholder="Buscar en todas las columnas..."
                        className="search-input"
                    />
                </div>

                <div className="filter-group">
                    <select
                        className="agent-select"
                        value={agentFilter}
                        onChange={e => setAgentFilter(e.target.value)}
                    >
                        <option value="">Todos los Agentes</option>
                        {uniqueAgents.map(agent => (
                            <option key={agent} value={agent}>{agent}</option>
                        ))}
                    </select>

                    <select
                        className="month-select"
                        value={monthFilter}
                        onChange={e => setMonthFilter(e.target.value)}
                    >
                        <option value="">Todos los Meses</option>
                        {uniqueMonths.map(month => {
                            const [year, monthNum] = month.split('-');
                            const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
                            const monthName = monthNames[parseInt(monthNum) - 1];
                            return (
                                <option key={month} value={month}>{monthName} {year}</option>
                            );
                        })}
                    </select>

                    <button onClick={handleExport} className="export-button">
                        Exportar CSV
                    </button>

                    {selectedRows.size > 0 && (
                        <button
                            onClick={handleDeleteSelected}
                            disabled={isDeleting}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-2 font-semibold disabled:opacity-50"
                        >
                            <Trash2 size={18} />
                            {isDeleting ? 'Eliminando...' : `Eliminar ${selectedRows.size}`}
                        </button>
                    )}
                </div>
            </div>

            <table className="invoice-table">
                <thead>
                    {table.getHeaderGroups().map(headerGroup => (
                        <tr key={headerGroup.id}>
                            {headerGroup.headers.map(header => (
                                <th key={header.id} onClick={header.column.getToggleSortingHandler()}>
                                    <div className="th-content">
                                        {flexRender(header.column.columnDef.header, header.getContext())}
                                        {{
                                            asc: <ArrowUpDown size={14} className="sort-icon asc" />,
                                            desc: <ArrowUpDown size={14} className="sort-icon desc" />,
                                        }[header.column.getIsSorted()] ?? <ArrowUpDown size={14} className="sort-icon" />}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    ))}
                </thead>
                <tbody>
                    {table.getRowModel().rows.map(row => (
                        <tr key={row.id}>
                            {row.getVisibleCells().map(cell => (
                                <td key={cell.id}>
                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
            {table.getRowModel().rows.length === 0 && (
                <div className="no-data">No se encontraron resultados.</div>
            )}

            {/* Payment Modal */}
            {paymentModalInvoice && (
                <InvoicePaymentModal
                    invoice={paymentModalInvoice}
                    onClose={() => setPaymentModalInvoice(null)}
                    onSuccess={() => {
                        setPaymentModalInvoice(null);
                        if (onDataUpdate) onDataUpdate();
                    }}
                />
            )}
        </div>
    );
}
