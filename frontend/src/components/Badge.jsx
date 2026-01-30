const Badge = ({ variant = 'default', children, className = '' }) => {
  const base = 'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium'
  const variants = {
    default: 'bg-slate-100 text-slate-800',
    success: 'bg-emerald-100 text-emerald-800',
    danger: 'bg-red-100 text-red-700',
    warning: 'bg-amber-100 text-amber-800',
  }
  const v = variants[variant] || variants.default
  return <span className={`${base} ${v} ${className}`}>{children}</span>
}

export default Badge
