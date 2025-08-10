import * as React from 'react'
import { cn } from '@/lib/utils'

const Form = React.forwardRef<
  HTMLFormElement,
  React.FormHTMLAttributes<HTMLFormElement>
>(({ className, ...props }, ref) => (
  <form
    ref={ref}
    className={cn('space-y-4', className)}
    {...props}
  />
))
Form.displayName = 'Form'

const FormField = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('space-y-2', className)}
    {...props}
  />
))
FormField.displayName = 'FormField'

const FormLabel = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement> & {
    required?: boolean
  }
>(({ className, children, required, ...props }, ref) => (
  <label
    ref={ref}
    className={cn(
      'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
      className
    )}
    {...props}
  >
    {children}
    {required && <span className="text-red-500 ml-1">*</span>}
  </label>
))
FormLabel.displayName = 'FormLabel'

const FormDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
))
FormDescription.displayName = 'FormDescription'

const FormMessage = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement> & {
    type?: 'error' | 'warning' | 'info'
  }
>(({ className, type = 'error', ...props }, ref) => {
  const typeStyles = {
    error: 'text-red-600',
    warning: 'text-yellow-600', 
    info: 'text-blue-600'
  }

  return (
    <p
      ref={ref}
      className={cn('text-sm font-medium', typeStyles[type], className)}
      role={type === 'error' ? 'alert' : 'status'}
      {...props}
    />
  )
})
FormMessage.displayName = 'FormMessage'

export {
  Form,
  FormField,
  FormLabel,
  FormDescription,
  FormMessage,
}