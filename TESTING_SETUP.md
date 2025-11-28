# Testing Setup Guide

## Overview

Jest and React Native Testing Library have been configured for the mobile app.

## Installation

Run the following to install testing dependencies:

```bash
cd mess-management-mobile
npm install
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode (development)
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Test Structure

Tests should be placed in:
- `src/**/__tests__/**/*.test.ts` or `*.test.tsx`
- `src/**/__tests__/**/*.spec.ts` or `*.spec.tsx`

## Example Test

See `src/lib/__tests__/logger.test.ts` for an example test file.

## Writing Tests

### Component Test Example

```typescript
import { render, screen, fireEvent } from '@testing-library/react-native'
import { MyComponent } from '../MyComponent'

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />)
    expect(screen.getByText('Hello')).toBeTruthy()
  })

  it('handles button press', () => {
    const onPress = jest.fn()
    render(<MyComponent onPress={onPress} />)
    
    fireEvent.press(screen.getByText('Button'))
    expect(onPress).toHaveBeenCalled()
  })
})
```

### Function Test Example

```typescript
import { myFunction } from '../myFunction'

describe('myFunction', () => {
  it('returns expected value', () => {
    const result = myFunction('input')
    expect(result).toBe('expected')
  })

  it('handles errors', () => {
    expect(() => myFunction(null)).toThrow()
  })
})
```

## Coverage Goals

- **Minimum**: 30% coverage for critical functions
- **Target**: 50%+ coverage
- **Critical**: All payment, authentication, and data operations should have tests

## Next Steps

1. Add tests for payment creation (Edge Function integration)
2. Add tests for authentication flows
3. Add tests for attendance marking
4. Add tests for student management
5. Add integration tests for critical user flows

## Mocking

Common mocks are set up in `jest.setup.js`:
- AsyncStorage
- Expo Constants
- Console warnings/errors

For additional mocks, create them in test files or add to `jest.setup.js`.









