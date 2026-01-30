import { useNavigate } from 'react-router-dom'

const features = [
  {
    title: 'Pre-Order Food',
    description: 'Browse menus from your favorite restaurants and order in advance.',
    icon: '🍽️',
  },
  {
    title: 'Skip Waiting',
    description: 'Your food is being prepared before you arrive, so you save time.',
    icon: '⏱️',
  },
  {
    title: 'Easy Arrival',
    description: 'Select your arrival time and party size so restaurants can plan ahead.',
    icon: '🚶',
  },
]

const HomePage = () => {
  const navigate = useNavigate()

  const handlePrimary = () => {
    navigate('/register')
  }

  const handleSecondary = () => {
    // Let anyone browse the list of restaurants; login is required only when placing an order
    navigate('/customer/home')
  }

  return (
    <div className="bg-background">
      <section className="max-w-5xl mx-auto px-4 py-16 text-center">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-textPrimary mb-4">
          Pre-Order Your Favorite Food
        </h1>
        <p className="text-lg text-textSecondary max-w-2xl mx-auto mb-8">
          Skip the wait. Order ahead and pick up when you arrive.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4 mb-12">
          <button
            onClick={handlePrimary}
            className="px-6 py-3 rounded-lg bg-primary text-white font-medium hover:bg-primary/90"
          >
            Get Started
          </button>
          <button
            onClick={handleSecondary}
            className="px-6 py-3 rounded-lg border border-border text-textSecondary hover:bg-surface"
          >
            Browse Restaurants
          </button>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 pb-16">
        <div className="grid gap-6 md:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="bg-surface border border-border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="text-3xl mb-4">{f.icon}</div>
              <h3 className="text-lg font-semibold mb-2 text-textPrimary">{f.title}</h3>
              <p className="text-sm text-textSecondary">{f.description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

export default HomePage
