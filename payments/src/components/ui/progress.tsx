"use client"

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "@/lib/utils"

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, value, "aria-label": ariaLabel, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    // role="progressbar" needs an accessible name; fall back to the percentage
    // when a caller doesn't pass a more descriptive aria-label / aria-labelledby.
    aria-label={
      ariaLabel ?? (props["aria-labelledby"] ? undefined : `${Math.round(value ?? 0)}%`)
    }
    className={cn(
      "relative h-2 w-full overflow-hidden rounded-full bg-primary/20",
      className
    )}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className="h-full w-full flex-1 bg-primary transition-all"
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </ProgressPrimitive.Root>
))
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
