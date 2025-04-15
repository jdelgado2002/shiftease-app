import { render, screen, fireEvent, waitFor, mockToast } from '@/__tests__/utils/test-utils'
import Register from '@/app/register/page'
import { useRouter } from 'next/navigation'

// Mock the router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}))

describe('Registration Page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders registration form', () => {
    render(<Register />)
    
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^password \*/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^confirm password \*/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument()
  })

  it('validates password match', async () => {
    render(<Register />)
    
    // Fill in the form with mismatched passwords
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    })
    fireEvent.change(screen.getByLabelText(/^password \*/i), {
      target: { value: 'password123' },
    })
    fireEvent.change(screen.getByLabelText(/^confirm password \*/i), {
      target: { value: 'differentpassword' },
    })

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /create account/i }))

    // Verify error toast was shown
    await waitFor(() => {
      expect(mockToast.toast).toHaveBeenCalledWith({
        title: "Passwords don't match",
        description: "Please make sure your passwords match.",
        variant: "destructive",
      })
    })
  })

  it('handles successful registration', async () => {
    // Mock the fetch API
    global.fetch = jest.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      })
    ) as jest.Mock

    render(<Register />)
    
    // Fill in the form
    fireEvent.change(screen.getByLabelText(/restaurant or business name/i), {
      target: { value: 'Test Restaurant' },
    })
    fireEvent.change(screen.getByLabelText(/first name/i), {
      target: { value: 'John' },
    })
    fireEvent.change(screen.getByLabelText(/last name/i), {
      target: { value: 'Doe' },
    })
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    })
    fireEvent.change(screen.getByLabelText(/^password \*/i), {
      target: { value: 'password123' },
    })
    fireEvent.change(screen.getByLabelText(/^confirm password \*/i), {
      target: { value: 'password123' },
    })

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /create account/i }))

    // Verify success toast was shown
    await waitFor(() => {
      expect(mockToast.toast).toHaveBeenCalledWith({
        title: "Registration successful",
        description: "Welcome to ShiftEase!",
      })
    })
  })
}) 