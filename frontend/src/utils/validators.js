export const validateEmail = (value) => {
  if (!value) return 'Email is required'
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!re.test(value)) return 'Invalid email format'
  return ''
}

export const validatePhone = (value) => {
  if (!value) return 'Phone is required'
  if (!/^[0-9]{10}$/.test(value)) return 'Phone must be 10 digits'
  return ''
}

export const validatePassword = (value) => {
  if (!value) return 'Password is required'
  if (value.length < 8) return 'Password must be at least 8 characters'
  if (!/[A-Z]/.test(value) || !/[0-9]/.test(value)) {
    return 'Password must contain 1 uppercase letter and 1 number'
  }
  return ''
}

export const validatePincode = (value) => {
  if (!value) return 'Pincode is required'
  if (!/^[0-9]{6}$/.test(value)) return 'Pincode must be 6 digits'
  return ''
}
