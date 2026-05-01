'use client'

import React from 'react'

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'heading' | 'avatar' | 'card' | 'image'
  width?: string | number
  height?: string | number
  count?: number
}

function Skeleton({
  variant = 'text',
  width,
  height,
  count = 1,
  className = '',
  ...props
}: SkeletonProps) {
  const baseClasses = 'bg-gradient-to-r from-slate-800 to-slate-700 animate-pulse rounded'

  const variants = {
    text: 'h-4 w-full',
    heading: 'h-8 w-3/4',
    avatar: 'h-12 w-12 rounded-full',
    card: 'h-48 w-full rounded-lg',
    image: 'h-64 w-full rounded-lg',
  }

  const styles = {
    width: width || (variant === 'avatar' ? '3rem' : '100%'),
    height: height || '1rem',
  }

  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`${baseClasses} ${variants[variant]} ${className}`}
          style={styles}
          {...props}
        />
      ))}
    </>
  )
}

export default Skeleton
