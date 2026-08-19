import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

const className =
  "inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground hover:text-foreground";

export function CheckoutVoltar({ from }: { from?: string | undefined }) {
  if (from === "home" || from?.startsWith("treino")) {
    return (
      <Link to="/app" className={className}>
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Link>
    );
  }
  if (from === "plano") {
    return (
      <Link to="/plano" className={className}>
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Link>
    );
  }
  if (from === "perfil") {
    return (
      <Link to="/perfil" className={className}>
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Link>
    );
  }
  if (from === "ranking") {
    return (
      <Link to="/ranking" className={className}>
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Link>
    );
  }
  if (from === "progresso") {
    return (
      <Link to="/progresso" className={className}>
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Link>
    );
  }
  if (from === "biblioteca") {
    return (
      <Link to="/biblioteca" className={className}>
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Link>
    );
  }
  return (
    <Link to="/" className={className}>
      <ArrowLeft className="h-4 w-4" /> Voltar
    </Link>
  );
}
