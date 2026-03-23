import { Input } from "@/components/atoms/Input";
import type { InputProps } from "@/components/atoms/Input";
import { Label } from "@/components/atoms/Label";

type NativeInputProps = Omit<InputProps, "label">;

export interface FormFieldProps extends NativeInputProps {
  label: string;
  labelClassName?: string;
  wrapperClassName?: string;
}

export function FormField({
  label,
  labelClassName,
  wrapperClassName,
  id,
  error,
  ...inputProps
}: FormFieldProps) {
  const fieldId: string = id ?? label.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className={["flex w-full flex-col", wrapperClassName].filter(Boolean).join(" ")}>
      <Label
        htmlFor={fieldId}
        className={["mb-2 text-sm font-semibold text-(--color-text-primary)", labelClassName]
          .filter(Boolean)
          .join(" ")}
      >
        {label}
      </Label>

      <Input id={fieldId} error={error} {...inputProps} />
    </div>
  );
}
