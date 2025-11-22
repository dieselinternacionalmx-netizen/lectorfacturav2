import React, { useState, useMemo } from 'react';
import {
    useReactTable,
    getCoreRowModel,
    getSortedRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    flexRender,
} from '@tanstack/react-table';
import { ArrowUpDown, Search, Edit2 } from 'lucide-react';
import EditTransactionModal from './EditTransactionModal';
import { updateBankTransaction } from '../api';

export default function BankTable({ data, agentFilter, setAgentFilter, onDataUpdate }) {
    const [sorting, setSorting] = useState([]);
    const [globalFilter, setGlobalFilter] = useState('');
    const [editingTransaction, setEditingTransaction] = useState(null);

    // Get unique agents for the dropdown
    const uniqueAgents = useMemo(() => {
        const agents = new Set(data.map(d => d.agent).filter(Boolean));
        return Array.from(agents).sort();
    }, [data]);

    // Filter data manually
    const filteredData = useMemo(() => {
        let filtered = data;
        if (agentFilter) {
            filtered = filtered.filter(item => item.agent === agentFilter);
        }
        return filtered;
    }, [data, agentFilter]);

    // Helper to generate consistent colors for agents
    const getAgentColor = (name) => {
        if (!name) return { bg: '#f3f4f6', text: '#374151', border: '#e5e7eb' };
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

    const handleSaveEdit = async (id, updatedData) => {
        await updateBankTransaction(id, updatedData);
        if (onDataUpdate) onDataUpdate(); // Refresh data
    };

    const columns = useMemo(
        () => [
            {
                id: 'actions',
                cell: info => (
                    <button
                        onClick={() => setEditingTransaction(info.row.original)}
                        className="view-btn"
                        style={{ padding: '0.3rem', color: 'var(--text-secondary)' }}
                        title="Editar"
                    >
                        <Edit2 size={16} />
                    </button>
                ),
                size: 50,
            },
            {
                header: 'Fecha',
                accessorKey: 'date',
                size: 120,
            },
            {
                header: 'Agente',
                accessorKey: 'agent',
                cell: info => {
                    const name = info.getValue();
                    if (!name) return <span className="text-muted">-</span>;
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
                size: 150,
            },
            {
                header: 'Beneficiario',
                accessorKey: 'beneficiary',
                cell: info => <span className="text-secondary font-medium">{info.getValue()}</span>,
                size: 200,
            },
            {
                header: 'Descripción',
                accessorKey: 'description',
                cell: info => <span className="text-xs text-muted truncate block max-w-[300px]" title={info.getValue()}>{info.getValue()}</span>,
                size: 300,
            },
            {
                header: 'Facturas',
                accessorKey: 'associated_invoices',
                cell: info => {
                    const value = info.getValue();
                    if (!value) return <span className="text-muted">-</span>;

                    try {
                        // Try to parse as JSON (new format)
                        const invoices = JSON.parse(value);
                        if (Array.isArray(invoices) && invoices.length > 0) {
                            return (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                    {invoices.map((inv, idx) => (
                                        <span key={idx} className="font-mono text-xs" style={{
                                            backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                            padding: '0.15rem 0.5rem',
                                            borderRadius: '4px',
                                            border: '1px solid rgba(59, 130, 246, 0.2)',
                                            display: 'inline-block',
                                            whiteSpace: 'nowrap'
                                        }}>
                                            {inv.invoice} <span style={{ color: 'var(--success)', fontWeight: 600 }}>${inv.amount?.toFixed(2) || '0.00'}</span>
                                        </span>
                                    ))}
                                </div>
                            );
                        }
                    } catch (e) {
                        // Old format or invalid JSON
                    }

                    // Old format: display as before
                    return <span className="font-mono text-xs bg-dark-lighter px-2 py-1 rounded">{value}</span>;
                },
                size: 200,
            },
            {
                header: 'Rastreo',
                accessorKey: 'tracking_key',
                cell: info => <span className="font-mono text-xs text-muted">{info.getValue()}</span>,
                size: 150,
            },
            {
                header: 'Monto',
                accessorKey: 'amount',
                cell: info => {
                    const val = info.getValue();
                    return <span className={`font-mono font-bold ${val < 0 ? 'text-red-400' : 'text-success'}`}>{`$${(val || 0).toFixed(2)}`}</span>;
                },
                size: 120,
            },
            {
                header: 'Saldo',
                accessorKey: 'balance',
                cell: info => <span className="font-mono text-muted">{`$${(info.getValue() || 0).toFixed(2)}`}</span>,
                size: 120,
            },
        ],
        []
    );

    const table = useReactTable({
        data: filteredData,
        columns,
        state: {
            sorting,
            globalFilter,
        },
        initialState: {
            pagination: {
                pageSize: 10,
            },
        },
        onSortingChange: setSorting,
        onGlobalFilterChange: setGlobalFilter,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
    });

    // Export to CSV
    const handleExport = () => {
        const headers = ['Fecha', 'Agente', 'Beneficiario', 'Descripción', 'Facturas', 'Rastreo', 'Monto', 'Saldo'];
        const csvContent = [
            headers.join(','),
            ...filteredData.map(row => [
                `"${row.date}"`,
                `"${row.agent || ''}"`,
                `"${row.beneficiary || ''}"`,
                `"${row.description.replace(/"/g, '""')}"`,
                `"${row.associated_invoices || ''}"`,
                `"${row.tracking_key || ''}"`,
                (row.amount || 0).toFixed(2),
                (row.balance || 0).toFixed(2)
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `depositos_export_${new Date().toISOString().split('T')[0]}.csv`);
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
                        placeholder="Buscar depósitos..."
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

                    <button onClick={handleExport} className="export-button">
                        Exportar CSV
                    </button>
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

            {/* Pagination Controls */}
            <div className="pagination-controls" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', borderTop: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <button
                        className="view-btn"
                        onClick={() => table.setPageIndex(0)}
                        disabled={!table.getCanPreviousPage()}
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', opacity: !table.getCanPreviousPage() ? 0.5 : 1 }}
                    >
                        {'<<'}
                    </button>
                    <button
                        className="view-btn"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', opacity: !table.getCanPreviousPage() ? 0.5 : 1 }}
                    >
                        {'<'}
                    </button>
                    <button
                        className="view-btn"
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', opacity: !table.getCanNextPage() ? 0.5 : 1 }}
                    >
                        {'>'}
                    </button>
                    <button
                        className="view-btn"
                        onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                        disabled={!table.getCanNextPage()}
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', opacity: !table.getCanNextPage() ? 0.5 : 1 }}
                    >
                        {'>>'}
                    </button>
                </div>

                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    Página <strong>{table.getState().pagination.pageIndex + 1}</strong> de <strong>{table.getPageCount()}</strong>
                </span>

                <select
                    value={table.getState().pagination.pageSize}
                    onChange={e => {
                        table.setPageSize(Number(e.target.value))
                    }}
                    className="agent-select"
                    style={{ width: 'auto', minWidth: 'auto', padding: '0.4rem 2rem 0.4rem 0.8rem' }}
                >
                    {[10, 20, 30, 40, 50].map(pageSize => (
                        <option key={pageSize} value={pageSize}>
                            Mostrar {pageSize}
                        </option>
                    ))}
                </select>
            </div>

            {table.getRowModel().rows.length === 0 && (
                <div className="no-data">No se encontraron depósitos.</div>
            )}

            <EditTransactionModal
                isOpen={!!editingTransaction}
                onClose={() => setEditingTransaction(null)}
                transaction={editingTransaction}
                onSave={handleSaveEdit}
            />
        </div>
    );
}
