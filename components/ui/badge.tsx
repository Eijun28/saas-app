import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border border-border/100 text-xs font-bold transition-colors shadow-sm focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2 gap-2 [&_svg]:[&_path]:!stroke-none [&_svg]:[&_line]:!hidden [&_svg]:[&_rect]:!fill-none",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow-sm",
        brand:
          "border-transparent bg-brand text-primary-foreground shadow-sm",
        "brand-secondary":
          "border-transparent bg-brand-foreground/20 text-brand shadow-sm",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground shadow-sm",
        destructive:
          "border-transparent bg-destructive/30 text-destructive-foreground shadow-sm",
        outline: "text-foreground shadow-sm",
      },
      size: {
        default: "px-2.5 py-1",
        sm: "px-2 py-0.5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Badge({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span";

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
