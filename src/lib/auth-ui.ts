export function forcaSenha(senha: string) {
  let pontos = 0;
  if (senha.length >= 8) pontos++;
  if (senha.length >= 12) pontos++;
  if (/[a-z]/.test(senha) && /[A-Z]/.test(senha)) pontos++;
  if (/\d/.test(senha)) pontos++;
  if (/[^A-Za-z0-9]/.test(senha)) pontos++;
  const nivel = Math.min(3, Math.max(1, Math.ceil(pontos / 2)));
  return { nivel, label: nivel === 1 ? "Fraca" : nivel === 2 ? "Média" : "Forte" };
}
