import { useState } from 'react';
import { X, Upload as UploadIcon, AlertCircle, FileText } from 'lucide-react';
import FileUploadZone from './FileUploadZone';
import { uploadBankDeposits } from '../api_upload';

/**
 * UploadBankDepositsModal - Modal for uploading bank deposit PDF
 */
export default function UploadBankDepositsModal({ onClose, onSuccess }) {
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);
    const [result, setResult] = useState(null);

    const handleFileSelected = (files) => {
        if (files.length > 0) {
            setSelectedFile(files[0]);
            setError(null);
            setResult(null);
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) return;

        setUploading(true);
        setError(null);

        try {
            const uploadResult = await uploadBankDeposits(selectedFile);
            setResult(uploadResult);

            setTimeout(() => {
                onSuccess();
                onClose();
            }, 2000);
        } catch (err) {
            setError(err.message);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
                {/* Header */}
                <div className="modal-header">
                    <div>
                        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                            <UploadIcon size={24} />
                            Subir Depósitos Bancarios
                        </h2>
                        <p className="text-sm text-gray-400 mt-1">
                            Selecciona el PDF de depósitos del banco
                        </p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <X size={24} />
                    </button>
                </div>

                {/* Upload Zone */}
                <div className="p-6">
                    {!selectedFile ? (
                        <FileUploadZone onFilesSelected={handleFileSelected} multiple={false} />
                    ) : (
                        <div className="space-y-4">
                            <div className="p-4 bg-dark-lighter rounded-lg border border-dark-border">
                                <div className="flex items-center gap-3">
                                    <FileText size={32} className="text-primary" />
                                    <div className="flex-1">
                                        <p className="text-white font-medium">{selectedFile.name}</p>
                                        <p className="text-sm text-gray-400">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                                    </div>
                                    {!uploading && (
                                        <button
                                            onClick={() => setSelectedFile(null)}
                                            className="text-gray-400 hover:text-red-400"
                                        >
                                            <X size={20} />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {result && (
                                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                                    <p className="text-green-400 font-semibold">
                                        ✓ Procesado exitosamente: {result.count} depósitos encontrados
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2">
                            <AlertCircle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
                            <p className="text-red-400 text-sm">{error}</p>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 px-6 pb-6">
                    <button
                        onClick={onClose}
                        disabled={uploading}
                        className="px-6 py-2 bg-dark-lighter text-white rounded-lg hover:bg-dark-border transition-colors disabled:opacity-50"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleUpload}
                        disabled={!selectedFile || uploading}
                        className="px-6 py-2 bg-primary text-black rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                    >
                        {uploading ? 'Procesando...' : 'Subir y Procesar'}
                    </button>
                </div>
            </div>
        </div>
    );
}
