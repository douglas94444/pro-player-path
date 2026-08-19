export function soDigitos(valor: string) {
  return valor.replace(/\D/g, "");
}

export function maskCpf(valor: string) {
  const d = soDigitos(valor).slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

export function maskPhone(valor: string) {
  const d = soDigitos(valor).slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export function cpfValido(valor: string) {
  return soDigitos(valor).length === 11;
}

export function phoneValido(valor: string) {
  const d = soDigitos(valor);
  return d.length === 10 || d.length === 11;
}

export function phoneE164Br(valor: string) {
  const d = soDigitos(valor);
  if (!d) return "";
  return d.startsWith("55") ? d : `55${d}`;
}
