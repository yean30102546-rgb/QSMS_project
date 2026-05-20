import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/src/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "bg-[#18181b] text-white",
        secondary: "bg-[#f4f4f5] text-[#18181b]",
        destructive: "bg-red-100 text-red-700",
        outline: "border border-[#e4e4e7] text-[#18181b]",
        // Roster shift status variants
        work: "bg-green-100 text-green-700",
        off: "bg-amber-100 text-amber-700",
        holiday: "bg-slate-100 text-slate-600",
        ot: "bg-blue-100 text-blue-700",
        leave: "bg-red-100 text-red-600",
        swap: "bg-purple-100 text-purple-700",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
