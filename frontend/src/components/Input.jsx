const Input = ({ label, name, error, type = 'text', className = '', ...props }) => {
  return (
    <div className="space-y-1 text-xs">
      {label && (
        <label htmlFor={name} className="block text-[11px] text-textSecondary">
          {label}
        </label>
      )}
      <input
        id={name}
        name={name}
        type={type}
        className={`w-full border border-border rounded-md px-3 py-2 bg-surface focus:outline-none focus:ring-1 focus:ring-primary ${className}`}
        {...props}
      />
      {error && <p className="text-[11px] text-red-600">{error}</p>}
    </div>
  )}

export default Input
