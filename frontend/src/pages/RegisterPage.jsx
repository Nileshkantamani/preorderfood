import { useNavigate, Link } from 'react-router-dom'

const RegisterPage = () => {
  const navigate = useNavigate()

  return (
    <div className="flex justify-center items-center py-12 px-4">
      <div className="max-w-md w-full bg-surface border border-border rounded-xl p-8 shadow-sm">
        <h2 className="text-2xl font-bold text-textPrimary mb-2">Create Your Account</h2>
        <p className="text-sm text-textSecondary mb-6">Choose your role to get started.</p>

        <div className="space-y-4 mb-6">
          <button
            onClick={() => navigate('/register/customer')}
            className="w-full text-left bg-surface border border-border rounded-lg p-4 hover:border-primary transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl" role="img" aria-label="customer">🧑‍🍽️</span>
              <div>
                <h3 className="font-semibold text-textPrimary">I'm a Customer</h3>
                <p className="text-xs text-textSecondary">Order food from restaurants.</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => navigate('/register/restaurant')}
            className="w-full text-left bg-surface border border-border rounded-lg p-4 hover:border-primary transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl" role="img" aria-label="restaurant">🏪</span>
              <div>
                <h3 className="font-semibold text-textPrimary">I'm a Restaurant</h3>
                <p className="text-xs text-textSecondary">Manage orders and your menu.</p>
              </div>
            </div>
          </button>
        </div>

        <p className="text-xs text-textSecondary text-center">
          Already have an account?{' '}
          <Link to="/login" className="text-primary hover:underline">Login</Link>
        </p>
      </div>
    </div>
  )
}

export default RegisterPage
