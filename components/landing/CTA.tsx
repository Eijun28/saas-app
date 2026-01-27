import { type VariantProps } from "class-variance-authority";
import { ReactNode } from "react";

import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

import { Button, buttonVariants } from "@/components/ui/button";
import { Section } from "@/components/ui/section";
// import LightRays from "@/components/LightRays"; // Désactivé temporairement - nécessite 'ogl'

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
    <Section 
      className={cn("group relative overflow-hidden bg-transparent", className)}
      style={{ 
        background: 'radial-gradient(circle at top center, rgba(255, 255, 255, 0.1), transparent 70%)'
      }}
    >
      <div className="max-w-container relative z-10 mx-auto flex flex-col items-center gap-6 text-center sm:gap-8">
        <h2 className="max-w-[900px] text-3xl leading-[1.1] font-black sm:text-[90px] sm:leading-[1.1]" style={{ color: '#823F91' }}>
          {typeof title === 'string' ? (
            <>
              <span className="block">Commencez votre</span>
              <span className="block -mt-1 sm:-mt-2">mariage de rêve</span>
            </>
          ) : (
            title
          )}
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
                  button.variant === "default" && "bg-[#c081e3] hover:bg-[#a865d0] text-white"
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
      {/* Light Rays - effet de rayons lumineux - Désactivé temporairement */}
      {/* <div className="absolute inset-0 overflow-hidden pointer-events-none bg-transparent z-0" style={{ opacity: 0.6 }}>
        <div style={{ width: '100%', height: '100%', position: 'relative', background: 'transparent' }}>
          <LightRays
            raysOrigin="top-center"
            raysColor="#c081e3"
            raysSpeed={0.4}
            lightSpread={0.4}
            rayLength={2.0}
            pulsating={false}
            fadeDistance={1.5}
            saturation={0.8}
            followMouse={false}
            mouseInfluence={0}
            noiseAmount={0}
            distortion={0}
          />
        </div>
      </div> */}
    </Section>
  );
}

