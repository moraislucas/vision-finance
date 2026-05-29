import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Helper canônico do shadcn-vue para mesclar classes Tailwind. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
