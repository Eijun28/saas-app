import { type VariantProps } from "class-variance-authority";
import { ReactNode } from "react";

import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

import { Button, buttonVariants } from "@/components/ui/button";
import Glow from "@/components/ui/glow";
import { Section } from "@/components/ui/section";

interface CTAButtonProps {
  href: string;
  text: string;
  variant?: VariantProps<typeof buttonVariants>["variant"];
  icon?: ReactNode;
  iconRight?: ReactNode;
}

interface CTAProps {
  title?: string;
  buttons?: CTAButtonProps[] | false;
  className?: string;
}

export default function CTA({
  title = "Commencez votre mariage de rêve",
  buttons = [
    {
      href: siteConfig.getStartedUrl,
      text: "Commencer",
      variant: "default",
    },
  ],
  className,
}: CTAProps) {
  return (
    <Section className={cn("group relative overflow-hidden bg-gray-900 py-20 lg:py-28", className)}>
      <div className="max-w-4xl relative z-10 mx-auto flex flex-col items-center gap-6 text-center sm:gap-8 px-6">
        <h2 className="max-w-[640px] text-4xl lg:text-5xl leading-tight font-bold text-white mb-6">
          {title}
        </h2>
        {buttons !== false && buttons.length > 0 && (
          <div className="flex justify-center gap-4">
            {buttons.map((button, index) => (
              <Button
                key={index}
                variant={button.variant || "default"}
                size="lg"
                asChild
                className={cn(
                  button.variant === "default" && "bg-violet-600 hover:bg-violet-700 text-white",
                  button.variant === "outline" && "bg-white/10 hover:bg-white/20 text-white border border-white/20"
                )}
              >
                <a href={button.href}>
                  {button.icon}
                  {button.text}
                  {button.iconRight}
                </a>
              </Button>
            ))}
          </div>
        )}
      </div>
    </Section>
  );
}

