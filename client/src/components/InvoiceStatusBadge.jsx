import React from 'react';
import { CheckCircle2, AlertCircle, Circle } from 'lucide-react';

/**
 * InvoiceStatusBadge - Visual indicator for invoice payment status
 * 
 * @param {string} status - 'pending', 'partial', or 'paid'
 * @param {number} paidAmount - Amount already paid
 * @param {number} total - Total invoice amount
 */
export default function InvoiceStatusBadge({ status, paidAmount = 0, total = 0 }) {
    const getStatusConfig = () => {
        switch (status) {
            case 'paid':
                return {
                    icon: CheckCircle2,
                    label: 'Pagada',
                    color: 'text-green-400',
                    bgColor: 'bg-green-400/10',
                    borderColor: 'border-green-400/20'
                };
            case 'partial':
                return {
                    icon: AlertCircle,
                    label: 'Parcial',
                    color: 'text-yellow-400',
                    bgColor: 'bg-yellow-400/10',
                    borderColor: 'border-yellow-400/20'
                };
            default: // pending
                return {
                    icon: Circle,
                    label: 'Pendiente',
                    color: 'text-red-400',
                    bgColor: 'bg-red-400/10',
                    borderColor: 'border-red-400/20'
                };
        }
    };

    const config = getStatusConfig();
    const Icon = config.icon;
    const percentage = total > 0 ? (paidAmount / total) * 100 : 0;

    return (
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border ${config.bgColor} ${config.borderColor}`}>
            <Icon size={16} className={config.color} />
            <span className={`text-sm font-medium ${config.color}`}>
                {config.label}
            </span>
            {status === 'partial' && (
                <span className="text-xs text-gray-400">
                    ({percentage.toFixed(0)}%)
                </span>
            )}
        </div>
    );
}
