"use client";

import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface AvatarCirclesProps {
  numPeople: number;
  avatarUrls: Array<{
    imageUrl: string;
    profileUrl: string;
  }>;
  className?: string;
}

export function AvatarCircles({
  numPeople,
  avatarUrls,
  className,
}: AvatarCirclesProps) {
  const visibleAvatars = avatarUrls.slice(0, 5);
  const remainingCount = numPeople - visibleAvatars.length;

  return (
    <div className={cn("flex items-center", className)}>
      <div className="flex -space-x-2">
        {visibleAvatars.map((avatar, index) => (
          <Link
            key={index}
            href={avatar.profileUrl}
            className="relative inline-block transition-transform hover:scale-110 hover:z-10"
          >
            <Avatar
              src={avatar.imageUrl}
              alt={`Avatar ${index + 1}`}
              size="sm"
              className="border-2 border-white ring-2 ring-gray-100"
            />
          </Link>
        ))}
        {remainingCount > 0 && (
          <div className="relative inline-flex items-center justify-center h-10 w-10 rounded-full border-2 border-white bg-gray-100 text-gray-600 text-xs font-semibold ring-2 ring-gray-100">
            +{remainingCount}
          </div>
        )}
      </div>
    </div>
  );
}

