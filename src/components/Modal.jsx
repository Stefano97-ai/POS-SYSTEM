import { X } from 'lucide-react';

export default function Modal({ isOpen, onClose, title, children, size = 'md', hideHeader = false, noPadding = false }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={`modal-content modal-${size}`} onClick={(e) => e.stopPropagation()} style={noPadding ? { padding: 0, overflow: 'hidden' } : {}}>
        {!hideHeader && (
          <div className="modal-header" style={noPadding ? { padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--color-border)', marginBottom: 0 } : {}}>
            <h2 className="modal-title">{title}</h2>
            <button className="modal-close" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
        )}
        <div className="modal-body" style={noPadding ? { padding: 0 } : {}}>{children}</div>
      </div>
    </div>
  );
}
