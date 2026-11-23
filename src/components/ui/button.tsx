import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import { Slot } from "radix-ui"

/* Home Row look on the shadcn Button: a dark primary with a 3px edge, an outline button (today's "ghost") and a quiet
   ghost button. The `btn` marker class lets the carried-over layout rules in app.css (stage bar, panel foot, …) find buttons. */
const buttonVariants = cva(
  "btn group/button inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 border-0 font-heading font-semibold leading-none whitespace-nowrap no-underline transition-[transform,box-shadow,background-color,color] duration-75 outline-none select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-[0_3px_0_var(--btn-edge)] hover:-translate-y-px hover:shadow-[0_4px_0_var(--btn-edge)] active:translate-y-0.5 active:shadow-[0_1px_0_var(--btn-edge)]",
        outline:
          "bg-surface text-fg shadow-[0_0_0_1px_var(--line),0_3px_0_var(--cap-edge)] hover:-translate-y-px hover:bg-surface-2 hover:shadow-[0_0_0_1px_var(--line),0_4px_0_var(--cap-edge)] active:translate-y-0.5 active:shadow-[0_0_0_1px_var(--line),0_1px_0_var(--cap-edge)]",
        secondary:
          "bg-secondary text-secondary-foreground shadow-[0_0_0_1px_var(--line)] hover:bg-surface",
        ghost: "quiet bg-transparent text-fg-2 hover:bg-surface-2 hover:text-fg",
        destructive:
          "bg-error text-surface shadow-[0_3px_0_color-mix(in_oklab,var(--error)_60%,var(--shade))] hover:-translate-y-px hover:shadow-[0_4px_0_color-mix(in_oklab,var(--error)_60%,var(--shade))] active:translate-y-0.5 active:shadow-[0_1px_0_color-mix(in_oklab,var(--error)_60%,var(--shade))]",
        link: "text-primary underline underline-offset-4 hover:no-underline",
      },
      size: {
        default: "sm:text-base min-h-11 rounded-[10px] px-[18px] text-base",
        xs: "min-h-6 rounded-md px-2 text-xs",
        sm: "sm min-h-[34px] rounded-lg px-3 text-sm",
        lg: "min-h-12 rounded-xl px-6 text-base",
        icon: "size-9 rounded-lg",
        "icon-xs": "size-6 rounded-md",
        "icon-sm": "size-8 rounded-lg",
        "icon-lg": "size-10 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
