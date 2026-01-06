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
        "grid md:auto-rows-[18rem] grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto",
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
      <div className="group-hover/bento:translate-x-2 transition duration-200 relative z-10">
        {icon}
        <div className="text-xl font-semibold text-gray-900 mb-3 mt-2">
          {title}
        </div>
        <div className="text-base text-gray-600 leading-relaxed">
          {description}
        </div>
      </div>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={cn(
          "row-span-1 rounded-2xl group/bento hover:shadow-lg transition-all duration-300 p-8 lg:p-10 bg-gray-50 hover:bg-white border border-gray-200 flex flex-col space-y-4 cursor-pointer relative overflow-hidden card",
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
        "row-span-1 rounded-2xl group/bento hover:shadow-lg transition-all duration-300 p-8 lg:p-10 bg-gray-50 hover:bg-white border border-gray-200 flex flex-col space-y-4 relative overflow-hidden card",
        className
      )}
    >
      {content}
    </div>
  );
};
