import { useState } from 'react';
import { X, Upload as UploadIcon, AlertCircle } from 'lucide-react';
import FileUploadZone, { FileUploadProgress } from './FileUploadZone';
import { uploadInvoices } from '../api_upload';

/**
 * UploadInvoicesModal - Modal for uploading multiple invoice PDFs
 */
export default function UploadInvoicesModal({ onClose, onSuccess }) {
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);

    const handleFilesSelected = (files) => {
        const fileObjects = files.map(file => ({
            file,
            name: file.name,
            size: file.size,
            status: 'pending'
        }));
        setSelectedFiles(prev => [...prev, ...fileObjects]);
    };

    const handleRemoveFile = (index) => {
        setSelectedFiles(files => files.filter((_, i) => i !== index));
    };

    const handleUpload = async () => {
        if (selectedFiles.length === 0) return;

        setUploading(true);
        setError(null);

        try {
            // Update all to uploading
            setSelectedFiles(files => files.map(f => ({ ...f, status: 'uploading' })));

            // Upload files
            const results = await uploadInvoices(selectedFiles.map(f => f.file));

            // Update status based on results
            setSelectedFiles(files => files.map((f, i) => ({
                ...f,
                status: results[i].success ? 'success' : 'error',
                error: results[i].error
            })));

            // Check if all succeeded
            const allSuccess = results.every(r => r.success);
            if (allSuccess) {
                setTimeout(() => {
                    onSuccess();
                    onClose();
                }, 1000);
            } else {
                setError(`${results.filter(r => !r.success).length} archivos fallaron al procesar`);
            }
        } catch (err) {
            setError(err.message);
            setSelectedFiles(files => files.map(f => ({ ...f, status: 'error' })));
        } finally {
            setUploading(false);
        }
    };

    const successCount = selectedFiles.filter(f => f.status === 'success').length;
    const errorCount = selectedFiles.filter(f => f.status === 'error').length;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px' }}>
                {/* Header */}
                <div className="modal-header">
                    <div>
                        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                            <UploadIcon size={24} />
                            Subir Facturas
                        </h2>
                        <p className="text-sm text-gray-400 mt-1">
                            Selecciona uno o más archivos PDF de facturas
                        </p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <X size={24} />
                    </button>
                </div>

                {/* Upload Zone */}
                <div className="p-6">
                    {selectedFiles.length === 0 ? (
                        <FileUploadZone onFilesSelected={handleFilesSelected} multiple={true} />
                    ) : (
                        <div className="space-y-4">
                            <FileUploadProgress
                                files={selectedFiles}
                                onRemove={!uploading ? handleRemoveFile : null}
                            />

                            {/* Debug Info for Errors */}
                            {selectedFiles.some(f => f.error) && (
                                <div className="mt-2 p-3 bg-red-900/20 rounded text-xs font-mono text-red-300 overflow-auto max-h-32">
                                    <strong>Detalles del error:</strong>
                                    <ul className="list-disc pl-4 mt-1">
                                        {selectedFiles.filter(f => f.error).map((f, i) => (
                                            <li key={i}>{f.name}: {f.error}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {!uploading && (
                                <FileUploadZone onFilesSelected={handleFilesSelected} multiple={true} />
                            )}
                        </div>
                    )}

                    {/* Summary */}
                    {selectedFiles.length > 0 && (
                        <div className="mt-4 p-4 bg-dark-lighter rounded-lg">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Total de archivos:</span>
                                <span className="text-white font-semibold">{selectedFiles.length}</span>
                            </div>
                            {successCount > 0 && (
                                <div className="flex justify-between text-sm mt-2">
                                    <span className="text-gray-400">Procesados exitosamente:</span>
                                    <span className="text-green-400 font-semibold">{successCount}</span>
                                </div>
                            )}
                            {errorCount > 0 && (
                                <div className="flex justify-between text-sm mt-2">
                                    <span className="text-gray-400">Errores:</span>
                                    <span className="text-red-400 font-semibold">{errorCount}</span>
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
                        {uploading ? 'Procesando...' : 'Cancelar'}
                    </button>
                    <button
                        onClick={handleUpload}
                        disabled={selectedFiles.length === 0 || uploading}
                        className="px-6 py-2 bg-primary text-black rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                    >
                        {uploading ? `Subiendo ${selectedFiles.length} archivo(s)...` : `Subir ${selectedFiles.length} Factura(s)`}
                    </button>
                </div>
            </div>
        </div>
    );
}
