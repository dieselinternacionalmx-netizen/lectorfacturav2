import axios from 'axios';

// Use relative path to leverage Vite proxy
const api = axios.create({
    baseURL: '/api',
});

export const getInvoices = async () => {
    const response = await api.get('/invoices');
    return response.data;
};

export const scanInvoices = async () => {
    const response = await api.post('/scan');
    return response.data;
};

export const getBankTransactions = async () => {
    const response = await api.get('/bank-transactions');
    return response.data;
};

export const scanBankTransactions = async () => {
    const response = await api.post('/scan-bank');
    return response.data;
};

export const updateBankTransaction = async (id, data) => {
    const response = await api.put(`/bank-transactions/${id}`, data);
    return response.data;
};
