# Console Statement Replacement Guide

## Overview

All `console.log`, `console.error`, and `console.warn` statements should be replaced with the logger utility.

## Logger Usage

### Import
```typescript
import { logger } from '@/lib/logger'
```

### Replacements

#### console.log → logger.info or logger.debug
```typescript
// Before
console.log('User logged in:', userId)

// After
logger.info('User logged in', { userId })
```

#### console.error → logger.error
```typescript
// Before
console.error('Error creating payment:', error)

// After
logger.error('Error creating payment', error as Error, { studentId, amount })
```

#### console.warn → logger.warn
```typescript
// Before
console.warn('Rate limit approaching')

// After
logger.warn('Rate limit approaching', { remaining: 5 })
```

## Files Already Updated

- ✅ `src/lib/announcements.ts` - All console.error replaced
- ✅ `src/lib/payments.ts` - console.error replaced
- ✅ `src/app/_layout.tsx` - console.log/error replaced
- ✅ `src/components/ErrorBoundary.tsx` - Uses logger

## Remaining Files (168+ instances across 30 files)

The following files still need console statements replaced:

- `src/lib/students.ts` (27 instances)
- `src/lib/attendance.ts` (8 instances)
- `src/lib/plans.ts` (11 instances)
- `src/lib/notifications.ts` (8 instances)
- `src/lib/dashboard.ts` (9 instances)
- `src/context/NotificationContext.tsx` (18 instances)
- `src/context/AuthContext.tsx` (6 instances)
- And 23 more files...

## Automated Replacement Script

You can use find/replace in your IDE:

1. Find: `console.log\(`
   Replace: `logger.info(`
   
2. Find: `console.error\(`
   Replace: `logger.error(`
   
3. Find: `console.warn\(`
   Replace: `logger.warn(`

**Note:** After replacement, you may need to:
- Add `import { logger } from '@/lib/logger'` if missing
- Adjust parameters (logger methods expect message, error?, context?)
- Remove string concatenation in favor of context object

## Example Transformations

### Simple log
```typescript
// Before
console.log('Loading students...')

// After
logger.info('Loading students')
```

### Log with data
```typescript
// Before
console.log('Student created:', studentId, studentName)

// After
logger.info('Student created', { studentId, studentName })
```

### Error with context
```typescript
// Before
console.error('Failed to update student:', error, studentId)

// After
logger.error('Failed to update student', error as Error, { studentId })
```

## Benefits

1. **Structured logging** - Consistent format across app
2. **Sensitive data protection** - Automatically redacts passwords, tokens, etc.
3. **Production-ready** - Can easily integrate with Sentry
4. **Development vs Production** - Different behavior in dev vs prod
5. **Better debugging** - Timestamps and log levels









