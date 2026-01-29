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
  billingPeriod?: "day" | "month";
  cta: {
    variant: "default" | "outline";
    label: string;
    href?: string;
    planType?: "premium" | "pro";
    onClick?: () => void;
  };
  features: string[];
  variant?: "default";
  className?: string;
  comingSoon?: boolean;
}

export function PricingColumn({
  name,
  icon,
  description,
  price,
  priceNote,
  billingPeriod = "month",
  cta,
  features,
  variant = "default",
  className,
  comingSoon = false,
}: PricingColumnProps) {
  return (
    <div
      className={cn(
        "relative flex flex-col h-full rounded-xl border bg-white p-6 shadow-sm transition-all",
        !comingSoon && "hover:shadow-lg",
        comingSoon && "opacity-60 pointer-events-none",
        className
      )}
    >
      {/* Bandeau "À venir" en diagonale */}
      {comingSoon && (
        <div className="absolute inset-0 overflow-hidden rounded-xl z-10 pointer-events-none">
          <div 
            className="absolute"
            style={{
              top: '20px',
              right: '-60px',
              width: '200px',
              height: '40px',
              background: '#823F91',
              transform: 'rotate(45deg)',
              boxShadow: '0 2px 8px rgba(130, 63, 145, 0.3)',
            }}
          />
          <div 
            className="absolute top-6 right-4 z-20"
            style={{
              transform: 'rotate(45deg)',
            }}
          >
            <span className="text-white font-bold text-xs sm:text-sm tracking-wider whitespace-nowrap">
              À VENIR
            </span>
          </div>
        </div>
      )}
      
      {/* Contenu flouté */}
      <div className={cn("relative", comingSoon && "blur-sm")}>
      {/* Header */}
      <div className="mb-4 flex items-center justify-center">
        <div className="flex items-center gap-2">
          {icon && (
            <div className="text-[#823F91]">{icon}</div>
          )}
          <h3 className="text-lg font-semibold text-slate-900 text-center">{name}</h3>
        </div>
      </div>

      {/* Description */}
      <p className="mb-6 text-sm text-slate-600 leading-relaxed text-center">
        {description}
      </p>

      {/* Price */}
      <div className="mb-2">
        <div className="flex items-baseline gap-1 justify-center">
          {price === 0 ? (
            <span className="text-4xl font-bold text-slate-900 tracking-tight">
              Gratuit
            </span>
          ) : (
            <>
              <span className="text-4xl font-bold text-slate-900 tracking-tight">
                {price % 1 === 0 ? price.toFixed(0) : price.toFixed(2)}€
              </span>
              <span className="text-base text-slate-500">
                {billingPeriod === "day" ? "/ jour" : "/ mois"}
              </span>
            </>
          )}
        </div>
        {priceNote && (
          <p className="mt-2 text-xs text-slate-500 text-center">{priceNote}</p>
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
      {cta.href || cta.onClick ? (
        cta.href ? (
          <Link href={cta.href} className="mt-auto">
            <Button
              variant={cta.variant === "outline" ? "outline" : "default"}
              className={cn(
                "w-full mt-6",
                cta.variant === "default" &&
                  "bg-[#823F91] text-white hover:bg-[#6D3478]",
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
              variant={cta.variant === "outline" ? "outline" : "default"}
              className={cn(
                "w-full mt-6",
                cta.variant === "default" &&
                  "bg-[#823F91] text-white hover:bg-[#6D3478]",
                cta.variant === "outline" &&
                  "border-slate-300 text-slate-900 hover:bg-slate-50"
              )}
            >
              {cta.label}
            </Button>
          </div>
        )
      ) : null}
      </div>
    </div>
  );
}

