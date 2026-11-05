import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { buttonClass, type ButtonSize, type ButtonVariant } from './buttonStyles'

type ButtonLinkProps = {
  variant?: ButtonVariant
  size?: ButtonSize
  leftIcon?: ReactNode
  className?: string
  title?: string
  children?: ReactNode
} & (
  | { to: string; href?: never }
  // External links open in a new tab.
  | { href: string; to?: never }
)

export function ButtonLink({
  variant = 'primary',
  size = 'md',
  leftIcon,
  className = '',
  title,
  children,
  ...target
}: ButtonLinkProps) {
  const classes = buttonClass(variant, size, className)

  if (target.href !== undefined) {
    return (
      <a href={target.href} target="_blank" rel="noopener noreferrer" className={classes} title={title}>
        {leftIcon}
        {children}
      </a>
    )
  }

  return (
    <Link to={target.to} className={classes} title={title}>
      {leftIcon}
      {children}
    </Link>
  )
}
