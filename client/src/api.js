import axios from 'axios';
import { supabase } from './supabase';

// Use relative path to leverage Vite proxy
const api = axios.create({
    baseURL: '/api',
});

// Check if running locally (with Express server) or in production (Supabase only)
const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

export const getInvoices = async () => {
    if (isLocal) {
        // Use local Express API
        const response = await api.get('/invoices');
        return response.data;
    } else {
        // Use Supabase directly (for Vercel deployment)
        const { data, error } = await supabase
            .from('invoices')
            .select('*')
            .order('created_at', { ascending: false }); // Newest first

        if (error) throw error;
        return data;
    }
};

export const scanInvoices = async () => {
    const response = await api.post('/scan');
    return response.data;
};

export const getBankTransactions = async () => {
    if (isLocal) {
        // Use local Express API
        const response = await api.get('/bank-transactions');
        return response.data;
    } else {
        // Use Supabase directly (for Vercel deployment)
        const { data, error } = await supabase
            .from('bank_transactions')
            .select('*')
            .order('created_at', { ascending: false }); // Newest first

        if (error) throw error;
        return data;
    }
};

export const scanBankTransactions = async () => {
    const response = await api.post('/scan-bank');
    return response.data;
};

export const updateBankTransaction = async (id, data) => {
    const response = await api.put(`/bank-transactions/${id}`, data);
    return response.data;
};
