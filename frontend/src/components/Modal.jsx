const Modal = ({ open, title, children, footer, onClose }) => {
  if (!open) return null
  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-40">
      <div className="bg-surface border border-border rounded-md p-5 max-w-sm w-full">
        {title && (
          <h2 className="text-sm font-semibold text-textPrimary mb-2">{title}</h2>
        )}
        <div className="text-xs text-textSecondary mb-3">{children}</div>
        {footer && <div className="flex justify-end gap-2 mt-2 text-xs">{footer}</div>}
      </div>
    </div>
  )
}

export default Modal
