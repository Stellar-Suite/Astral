import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

/**
 * I will no longeer waste time on typescript gaslighting me on a project which I asked to use jsx on
 * I am a human and do not like fighting with things outside my control
 * github issue: https://github.com/radix-ui/primitives/issues/2309
 * @export
 * @param {any} inp
 * @return {any} 
 */
export function unfuck(inp){
  return inp;
}