import { LogOut } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { usePlayer } from "@/lib/player-store";
import { cn } from "@/lib/utils";

export function BotaoSair({
  className,
  full = false,
}: {
  className?: string;
  full?: boolean;
}) {
  const { logado, sair } = usePlayer();
  const navigate = useNavigate();
  if (!logado) return null;

  return (
    <Button
      type="button"
      variant={full ? "outline" : "ghost"}
      size={full ? "default" : "sm"}
      className={cn(full && "mt-4 w-full", className)}
      onClick={() => {
        void sair().then(() => navigate({ to: "/" }));
      }}
    >
      <LogOut />
      Sair
    </Button>
  );
}
