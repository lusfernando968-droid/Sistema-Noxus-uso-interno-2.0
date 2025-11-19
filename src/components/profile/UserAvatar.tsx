import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

type UserAvatarProps = {
  avatarUrl?: string | null;
  name: string;
  className?: string;
};

export function UserAvatar({ avatarUrl, name, className }: UserAvatarProps) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Avatar className={cn("border-2 border-border", className)}>
      {avatarUrl && <AvatarImage src={avatarUrl} alt={name} className="object-cover object-center w-full h-full" />}
      <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
