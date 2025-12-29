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
        "grid md:auto-rows-[20rem] grid-cols-1 md:grid-cols-3 gap-4 max-w-7xl mx-auto",
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
      <div className="flex-1 min-h-0 relative overflow-hidden">
        {header}
      </div>
      <div className="group-hover/bento:translate-x-2 transition duration-200 flex-shrink-0">
        {icon}
        <div className="font-bold text-neutral-900 dark:text-neutral-200 mb-2 mt-2 text-sm md:text-base leading-tight line-clamp-2 break-words">
          {title}
        </div>
        <div className="text-neutral-600 dark:text-neutral-300 text-xs leading-relaxed line-clamp-4 break-words">
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
          "row-span-1 rounded-xl group/bento hover:shadow-2xl transition duration-200 shadow-input dark:shadow-none p-5 dark:bg-black dark:border-white/[0.2] bg-white border border-gray-200 dark:border-white/[0.2] flex flex-col space-y-4 cursor-pointer overflow-hidden",
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
        "row-span-1 rounded-xl group/bento hover:shadow-2xl transition duration-200 shadow-input dark:shadow-none p-5 dark:bg-black dark:border-white/[0.2] bg-white border border-gray-200 dark:border-white/[0.2] flex flex-col space-y-4 overflow-hidden",
        className
      )}
    >
      {content}
    </div>
  );
};
