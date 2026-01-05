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
    <Section className={cn("group relative overflow-hidden bg-transparent", className)}>
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
      {/* Glow effect personnalisé avec couleurs Nuply - subtil */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Glow principal - taille réduite, opacité réduite */}
        <div 
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[100%] h-[300px] sm:h-[400px] rounded-full blur-3xl transition-all duration-500 ease-in-out translate-y-4 group-hover:-translate-y-8 opacity-30 group-hover:opacity-50"
          style={{
            background: 'radial-gradient(circle at center, rgba(130, 63, 145, 0.3) 0%, rgba(157, 95, 168, 0.2) 20%, rgba(130, 63, 145, 0.1) 40%, transparent 70%)',
          }}
        />
        
        {/* Glow secondaire - accent subtil */}
        <div 
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[70%] h-[200px] sm:h-[250px] rounded-full blur-2xl transition-all duration-500 ease-in-out translate-y-4 group-hover:-translate-y-8 opacity-25 group-hover:opacity-40"
          style={{
            background: 'radial-gradient(circle at center, rgba(130, 63, 145, 0.35) 0%, rgba(109, 52, 120, 0.25) 25%, transparent 60%)',
          }}
        />
      </div>
    </Section>
  );
}

