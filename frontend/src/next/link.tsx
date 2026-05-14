import type { AnchorHTMLAttributes, MouseEvent } from 'react'
import { useRouter } from './navigation'

export type LinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string
  prefetch?: boolean
  replace?: boolean
}

export default function Link({
  href,
  onClick,
  target,
  rel,
  replace,
  ...props
}: LinkProps) {
  const router = useRouter()

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event)

    if (event.defaultPrevented) {
      return
    }

    if (
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      event.button !== 0 ||
      target === '_blank'
    ) {
      return
    }

    if (typeof href === 'string' && href.startsWith('/')) {
      event.preventDefault()
      if (replace) {
        router.replace(href)
      } else {
        router.push(href)
      }
    }
  }

  return <a href={href} onClick={handleClick} target={target} rel={rel} {...props} />
}
