/**
 * @file FormField.tsx
 * @description Molecule de formulario (Label + Input + mensagem de erro).
 *
 * Eu acabei criando esse componente para parar de repetir a mesma estrutura
 * em tela de login/cadastro.
 *
 * @author Kivo Sports - TCC
 */

// - Atoms
import { Input } from "@/components/atoms/Input";
import { Label } from "@/components/atoms/Label";

interface FormFieldProps {
  id: string;
  label: string;
  placeholder?: string;
  type?: "text" | "email" | "password";
  error?: string;
}

export function FormField({ id, label, placeholder, type = "text", error }: FormFieldProps) {
  return (
    <div className="flex w-full flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type={type} placeholder={placeholder} aria-invalid={Boolean(error)} />
      <span className="min-h-5 text-xs text-rose-600">{error ?? ""}</span>
    </div>
  );
}

// MELHORIA: aceitar descricao abaixo do label para campos mais complexos
