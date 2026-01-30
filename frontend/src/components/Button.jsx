const baseClasses =
  'inline-flex items-center justify-center rounded-md text-xs font-medium focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60 disabled:cursor-not-allowed'

const variants = {
  primary: 'bg-primary text-white hover:bg-primary/90 px-4 py-2',
  secondary: 'border border-border text-textSecondary hover:bg-slate-50 px-4 py-2',
  danger: 'border border-red-500 text-red-600 hover:bg-red-50 px-4 py-2',
}

const Button = ({ variant = 'primary', className = '', ...props }) => {
  const v = variants[variant] || variants.primary
  return <button className={`${baseClasses} ${v} ${className}`} {...props} />
}

export default Button
