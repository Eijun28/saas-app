"use client";

import { cn } from "@/lib/utils";
import { ReactNode } from "react";
import Link from "next/link";

export const BentoGrid = ({
  className,
  children,
}: {
  className?: string;
  children?: ReactNode;
}) => {
  return (
    <div
      className={cn(
        "grid md:auto-rows-[18rem] grid-cols-1 md:grid-cols-3 gap-4 max-w-7xl mx-auto",
        className
      )}
    >
      {children}
    </div>
  );
};

export const BentoGridItem = ({
  className,
  title,
  description,
  header,
  icon,
  href,
}: {
  className?: string;
  title?: string | ReactNode;
  description?: string | ReactNode;
  header?: ReactNode;
  icon?: ReactNode;
  href?: string;
}) => {
  const content = (
    <>
      <div className="flex-1 min-h-0 relative z-10">
        {header}
      </div>
      {(icon || title || description) && (
        <div className="group-hover/bento:translate-x-2 transition duration-200 relative z-10">
          {icon}
          {title && (
            <div className="font-bold text-[#2D1B3D] mb-2 mt-2">
              {title}
            </div>
          )}
          {description && (
            <div className="text-[#5C4470] text-xs">
              {description}
            </div>
          )}
        </div>
      )}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={cn(
          "row-span-1 rounded-xl group/bento hover:shadow-2xl transition duration-200 shadow-input p-4 bg-white/70 backdrop-blur-sm border border-[#823F91]/10 hover:border-[#823F91]/20 flex flex-col space-y-4 cursor-pointer relative overflow-hidden",
          className
        )}
      >
        {content}
      </Link>
    );
  }

  return (
    <div
      className={cn(
        "row-span-1 rounded-xl group/bento hover:shadow-2xl transition duration-200 shadow-input p-4 bg-white/70 backdrop-blur-sm border border-[#823F91]/10 hover:border-[#823F91]/20 flex flex-col space-y-4 relative overflow-hidden",
        className
      )}
    >
      {content}
    </div>
  );
};
