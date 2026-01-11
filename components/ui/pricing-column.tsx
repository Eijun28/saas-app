import { Check } from "lucide-react";
import Link from "next/link";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface PricingColumnProps {
  name: string;
  icon?: ReactNode;
  description: string;
  price: number;
  priceNote?: string;
  cta: {
    variant: "default" | "glow" | "outline";
    label: string;
    href?: string;
    planType?: "premium" | "pro";
    onClick?: () => void;
  };
  features: string[];
  variant?: "default" | "glow" | "glow-brand";
  className?: string;
}

export function PricingColumn({
  name,
  icon,
  description,
  price,
  priceNote,
  cta,
  features,
  variant = "default",
  className,
}: PricingColumnProps) {
  const isGlow = variant === "glow" || variant === "glow-brand";
  const isGlowBrand = variant === "glow-brand";

  return (
    <div
      className={cn(
        "relative flex flex-col h-full rounded-xl border bg-white p-6 shadow-sm transition-all hover:shadow-lg",
        isGlow &&
          "border-[#823F91]/20 bg-gradient-to-br from-white to-[#E8D4EF]/10",
        isGlowBrand &&
          "border-[#823F91] ring-2 ring-[#823F91]/20 bg-gradient-to-br from-[#823F91]/5 to-white",
        className
      )}
    >
      {/* Header */}
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-center gap-2">
          {icon && (
            <div className="text-[#823F91]">{icon}</div>
          )}
          <h3 className="text-lg font-semibold text-slate-900">{name}</h3>
        </div>
      </div>

      {/* Description */}
      <p className="mb-6 text-sm text-slate-600 leading-relaxed">
        {description}
      </p>

      {/* Price */}
      <div className="mb-2">
        <div className="flex items-baseline gap-1">
          {price === 0 ? (
            <span className="text-4xl font-bold text-slate-900 tracking-tight">
              Gratuit
            </span>
          ) : (
            <>
              <span className="text-4xl font-bold text-slate-900 tracking-tight">
                {price}€
              </span>
              <span className="text-base text-slate-500">/ mois</span>
            </>
          )}
        </div>
        {priceNote && (
          <p className="mt-2 text-xs text-slate-500">{priceNote}</p>
        )}
      </div>

      {/* Features List */}
      <ul className="mt-6 space-y-3 flex-grow">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start gap-2.5">
            <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#823F91]" strokeWidth={2.5} />
            <span className="text-sm text-slate-700 leading-snug">{feature}</span>
          </li>
        ))}
      </ul>

      {/* CTA Button */}
      {cta.href ? (
        <Link href={cta.href} className="mt-auto">
          <Button
            variant={
              cta.variant === "glow"
                ? "default"
                : cta.variant === "outline"
                ? "outline"
                : "default"
            }
            className={cn(
              "w-full mt-6",
              cta.variant === "glow" &&
                "bg-[#823F91] text-white hover:bg-[#6D3478] shadow-lg shadow-[#823F91]/25 hover:shadow-xl hover:shadow-[#823F91]/30 transition-all",
              cta.variant === "default" &&
                "bg-slate-900 text-white hover:bg-slate-800",
              cta.variant === "outline" &&
                "border-slate-300 text-slate-900 hover:bg-slate-50"
            )}
          >
            {cta.label}
          </Button>
        </Link>
      ) : (
        <div className="mt-auto">
          <Button
            onClick={cta.onClick}
            variant={
              cta.variant === "glow"
                ? "default"
                : cta.variant === "outline"
                ? "outline"
                : "default"
            }
            className={cn(
              "w-full mt-6",
              cta.variant === "glow" &&
                "bg-[#823F91] text-white hover:bg-[#6D3478] shadow-lg shadow-[#823F91]/25 hover:shadow-xl hover:shadow-[#823F91]/30 transition-all",
              cta.variant === "default" &&
                "bg-slate-900 text-white hover:bg-slate-800",
              cta.variant === "outline" &&
                "border-slate-300 text-slate-900 hover:bg-slate-50"
            )}
          >
            {cta.label}
          </Button>
        </div>
      )}
    </div>
  );
}

