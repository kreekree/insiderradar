'use client';
import { clsx } from 'clsx';

export function ShimmerButton({ children, className, shimmerColor = '#ffffff', shimmerSize = '0.1em', shimmerDuration = '1.5s', borderRadius = '8px', background = 'rgba(16, 185, 129, 1)', ...props }) {
  return (
    <button
      style={{
        '--shimmer-color': shimmerColor,
        '--shimmer-size': shimmerSize,
        '--shimmer-duration': shimmerDuration,
        '--border-radius': borderRadius,
        '--background': background,
        '--spread': '90deg',
        '--cut': '0.1em',
      }}
      className={clsx(
        'group relative flex cursor-pointer items-center justify-center overflow-hidden whitespace-nowrap px-5 py-3 font-bold text-slate-950 text-sm',
        '[border-radius:var(--border-radius)] [background:var(--background)]',
        'transition-transform duration-300 ease-in-out active:translate-y-px hover:brightness-110',
        className
      )}
      {...props}
    >
      <div
        className={clsx(
          'absolute inset-0 overflow-hidden [border-radius:var(--border-radius)]',
        )}
      >
        <div className={clsx(
          'absolute inset-[-100%] rotate-[-60deg] animate-shimmer',
          '[background:conic-gradient(from_calc(270deg-(var(--spread)*0.5)),transparent_0,var(--shimmer-color)_var(--spread),transparent_var(--spread))]',
          'opacity-0 transition-opacity duration-300 group-hover:opacity-30',
        )} />
      </div>
      <span className="relative z-10">{children}</span>
    </button>
  );
}
