import '@testing-library/jest-dom'
import { render, screen, fireEvent, waitFor, mockToast } from '@/__tests__/utils/test-utils'
import Login from '@/app/login/page'
import { signIn } from 'next-auth/react'

// Mock next-auth
jest.mock('next-auth/react', () => ({
  signIn: jest.fn(),
}))

// Mock next/router
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}))

describe('Login Page', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks()
  })

  it('renders login form', () => {
    render(<Login />)
    
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('handles form submission', async () => {
    render(<Login />)
    
    // Fill in the form
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    })
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' },
    })

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

    // Verify signIn was called with correct credentials
    await waitFor(() => {
      expect(signIn).toHaveBeenCalledWith('credentials', {
        email: 'test@example.com',
        password: 'password123',
        redirect: false,
      })
    })
  })

  it('shows error message on failed login', async () => {
    // Mock signIn to return an error
    ;(signIn as jest.Mock).mockResolvedValueOnce({
      error: 'Invalid credentials',
    })

    render(<Login />)
    
    // Fill in the form
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'wrong@example.com' },
    })
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'wrongpassword' },
    })

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

    // Verify error toast was shown
    await waitFor(() => {
      expect(mockToast.toast).toHaveBeenCalledWith({
        title: 'Login failed',
        description: 'Invalid credentials',
        variant: 'destructive',
      })
    })
  })
}) 