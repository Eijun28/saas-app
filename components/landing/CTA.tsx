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
    <Section className={cn("group relative overflow-hidden", className)}>
      <div className="max-w-container relative z-10 mx-auto flex flex-col items-center gap-6 text-center sm:gap-8">
        <h2 className="max-w-[640px] text-3xl leading-tight font-semibold sm:text-5xl sm:leading-tight text-[#2D1B3D]">
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
                  button.variant === "default" && "bg-[#823F91] hover:bg-[#6D3478] text-white"
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
      {/* Glows blancs subtils pour illuminer la section */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Glow blanc principal - effet lumière douce */}
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[300px] rounded-full blur-3xl opacity-40"
          style={{
            background: 'radial-gradient(circle at center, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0.4) 30%, transparent 70%)',
          }}
        />
        
        {/* Glow blanc secondaire - accent lumineux */}
        <div 
          className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[50%] h-[150px] rounded-full blur-2xl opacity-50"
          style={{
            background: 'radial-gradient(circle at center, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.3) 40%, transparent 70%)',
          }}
        />
        
        {/* Petits glows blancs dispersés */}
        <div 
          className="absolute top-1/4 left-1/4 w-24 h-24 rounded-full blur-2xl opacity-30"
          style={{ background: 'rgba(255, 255, 255, 0.6)' }}
        />
        <div 
          className="absolute bottom-1/3 right-1/4 w-32 h-32 rounded-full blur-2xl opacity-25"
          style={{ background: 'rgba(255, 255, 255, 0.5)' }}
        />
      </div>
    </Section>
  );
}

