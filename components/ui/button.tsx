import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#823F91]/20 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "text-white shadow-md hover:shadow-lg hover:-translate-y-[1px] bg-[#823F91] hover:bg-[#6D3478]",
        destructive:
          "bg-destructive/30 text-destructive-foreground shadow-md hover:shadow-lg hover:-translate-y-[1px] hover:bg-destructive/90",
        outline:
          "border-0 bg-background text-foreground shadow-[0_1px_3px_rgba(0,0,0,0.08),0_0_0_1px_rgba(130,63,145,0.05)] hover:shadow-[0_2px_6px_rgba(130,63,145,0.12),0_0_0_1px_rgba(130,63,145,0.1)] hover:-translate-y-[1px] hover:bg-[#823F91]/8 hover:text-[#823F91]",
        secondary:
          "bg-secondary text-secondary-foreground shadow-md hover:shadow-lg hover:-translate-y-[1px] hover:bg-secondary/80",
        ghost: "text-foreground hover:bg-[#823F91]/10 hover:text-[#823F91]",
        link: "text-foreground underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-4 py-2",
        xs: "h-8 rounded-xl px-2 text-xs",
        sm: "h-10 rounded-xl px-3 text-xs",
        lg: "h-12 rounded-xl px-5",
        icon: "size-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
