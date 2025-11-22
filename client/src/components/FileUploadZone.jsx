import { useState } from 'react';
import { Upload, FileText, CheckCircle, XCircle, Loader } from 'lucide-react';

/**
 * FileUploadZone - Drag & drop zone for uploading multiple PDFs
 * 
 * @param {function} onFilesSelected - Callback when files are selected
 * @param {boolean} multiple - Allow multiple files
 * @param {string} accept - File types to accept
 */
export default function FileUploadZone({ onFilesSelected, multiple = true, accept = '.pdf' }) {
    const [isDragging, setIsDragging] = useState(false);

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);

        const files = Array.from(e.dataTransfer.files).filter(file =>
            file.type === 'application/pdf'
        );

        if (files.length > 0) {
            onFilesSelected(files);
        }
    };

    const handleFileInput = (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            onFilesSelected(files);
        }
    };

    return (
        <div
            className={`upload-zone ${isDragging ? 'dragging' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <input
                type="file"
                id="file-input"
                accept={accept}
                multiple={multiple}
                onChange={handleFileInput}
                style={{ display: 'none' }}
            />

            <label htmlFor="file-input" className="upload-label">
                <Upload size={48} className="upload-icon" />
                <h3 className="upload-title">
                    {multiple ? 'Arrastra archivos aquí o haz clic para seleccionar' : 'Selecciona un archivo'}
                </h3>
                <p className="upload-subtitle">
                    {multiple ? 'Puedes subir múltiples archivos PDF a la vez' : 'Solo archivos PDF'}
                </p>
            </label>
        </div>
    );
}

/**
 * FileUploadProgress - Shows upload progress for files
 */
export function FileUploadProgress({ files, onRemove }) {
    return (
        <div className="upload-progress-list">
            {files.map((file, index) => (
                <div key={index} className="upload-progress-item">
                    <FileText size={20} className="file-icon" />
                    <div className="file-info">
                        <span className="file-name">{file.name}</span>
                        <span className="file-size">{(file.size / 1024).toFixed(1)} KB</span>
                    </div>
                    <div className="file-status">
                        {file.status === 'uploading' && <Loader size={20} className="spin" />}
                        {file.status === 'success' && <CheckCircle size={20} className="text-green-400" />}
                        {file.status === 'error' && <XCircle size={20} className="text-red-400" />}
                    </div>
                    {file.status === 'pending' && onRemove && (
                        <button onClick={() => onRemove(index)} className="remove-btn">
                            <XCircle size={16} />
                        </button>
                    )}
                </div>
            ))}
        </div>
    );
}
