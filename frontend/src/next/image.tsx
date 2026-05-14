import type { ImgHTMLAttributes } from 'react'

type NextImageProps = ImgHTMLAttributes<HTMLImageElement> & {
  fill?: boolean
  priority?: boolean
  unoptimized?: boolean
}

export default function Image({
  fill,
  style,
  src,
  alt,
  width,
  height,
  ...props
}: NextImageProps) {
  const resolvedSrc = typeof src === 'string' ? src : (src as { src: string }).src

  return (
    <img
      src={resolvedSrc}
      alt={alt}
      width={width}
      height={height}
      style={
        fill
          ? {
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: style?.objectFit ?? 'cover',
              ...style,
            }
          : style
      }
      {...props}
    />
  )
}
