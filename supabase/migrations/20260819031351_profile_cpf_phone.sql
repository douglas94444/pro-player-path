-- Dados de checkout (CPF e celular) no perfil. Só dígitos; opcionais até o pagamento.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS cpf text,
  ADD COLUMN IF NOT EXISTS phone text;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_cpf_digits;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_cpf_digits CHECK (cpf IS NULL OR cpf ~ '^\d{11}$');

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_phone_digits;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_phone_digits CHECK (phone IS NULL OR phone ~ '^\d{10,11}$');
