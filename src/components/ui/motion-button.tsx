'use client'

import { FC } from 'react'
import { ArrowRight } from 'lucide-react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import Link from 'next/link'
import localFont from 'next/font/local'

const astonpoliz = localFont({ src: '../../app/fonts/Astonpoliz.otf' })

function cn(...inputs: any[]) { return twMerge(clsx(inputs)) }

interface Props {
  label: string
  href?: string
  onClick?: () => void
  variant?: 'primary' | 'secondary'
  classes?: string
}

const MotionButton: FC<Props> = ({ label, href, onClick, classes }) => {
  const content = (
    <>
      <span
        className='circle bg-white m-0 block h-12 w-12 overflow-hidden rounded-full duration-500 group-hover:w-full'
        aria-hidden='true'
      ></span>
      <div className='icon absolute top-1/2 left-4 translate-x-0 -translate-y-1/2 duration-500 group-hover:translate-x-[0.4rem] z-10'>
        <ArrowRight className='text-black size-6' />
      </div>
      <span className={cn('button-text text-white group-hover:text-black absolute top-2/4 left-2/4 ml-4 -translate-x-2/4 -translate-y-2/4 text-center text-lg font-medium tracking-tight whitespace-nowrap duration-500 z-10', astonpoliz.className)}>
        {label}
      </span>
    </>
  )

  const className = cn(
    'bg-[#111111] inline-block group relative h-[56px] w-52 cursor-pointer rounded-full border border-white/10 p-1 outline-none overflow-hidden',
    classes
  )

  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    )
  }

  return (
    <button onClick={onClick} className={className}>
      {content}
    </button>
  )
}

export default MotionButton
