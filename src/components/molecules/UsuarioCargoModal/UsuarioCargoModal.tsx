"use client";
import { useState } from "react";
import styles from "./UsuarioCargoModal.module.css";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal } from "@/components/molecules/Modal";
import { Button } from "@/components/atoms/Button";
import { cargosUsuario, type UsuarioGestao } from "@/services/usuario.service";

const schema = z.object({
  cargo: z.string(),
  cep: z.string(),
  rua: z.string(),
  numero: z.string(),
  cidade: z.string(),
  estado: z.string(),
  pais: z.string(),
  complemento: z.string(),
  banco: z.string(),
  agencia: z.string(),
  conta: z.string(),
  tipo: z.string(),
  chavePix: z.string(),
});
type Form = z.infer<typeof schema>;
export function UsuarioCargoModal({
  usuario,
  error,
  onClose,
  onSave,
}: {
  usuario: UsuarioGestao;
  error?: string;
  onClose: () => void;
  onSave: (cargo: number, dadosPerfil: unknown) => Promise<void>;
}) {
  const [validation, setValidation] = useState("");
  const {
    register,
    watch,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: {
      cargo: String(cargosUsuario.find((c) => c.nome === usuario.cargo)?.value ?? 2),
      cep: "",
      rua: "",
      numero: "",
      cidade: "",
      estado: "",
      pais: "",
      complemento: "",
      banco: "",
      agencia: "",
      conta: "",
      tipo: "",
      chavePix: "",
    },
  });
  const cargo = Number(watch("cargo"));
  const endereco = cargo !== 1 && !usuario.possuiEndereco;
  const banco = cargo === 4 && !usuario.possuiContaBanco;
  const submit = handleSubmit(async (d) => {
    if (
      (endereco && [d.cep, d.rua, d.numero, d.cidade, d.estado, d.pais].some((v) => !v.trim())) ||
      (banco && [d.banco, d.agencia, d.conta, d.chavePix].some((v) => !v.trim()))
    ) {
      setValidation("Preencha os dados obrigatórios do perfil de destino.");
      return;
    }
    setValidation("");
    await onSave(cargo, {
      ...(endereco
        ? {
            endereco: {
              cep: d.cep,
              rua: d.rua,
              numero: d.numero,
              cidade: d.cidade,
              estado: d.estado,
              pais: d.pais,
              complemento: d.complemento,
            },
          }
        : {}),
      ...(banco
        ? {
            contaBanco: {
              banco: d.banco,
              agencia: d.agencia,
              conta: d.conta,
              tipo: d.tipo,
              chavePix: d.chavePix,
            },
          }
        : {}),
    });
  });
  const field = (name: keyof Form, label: string, required = true) => (
    <label key={name} className={styles.field}>
      {label}
      {required ? " *" : ""}
      <input className={styles.control} {...register(name)} required={required} />
    </label>
  );
  return (
    <Modal
      isOpen
      onClose={() => !isSubmitting && onClose()}
      title={`Alterar perfil de ${usuario.nome}`}
      maxWidth={620}
    >
      <form onSubmit={submit} className={styles.form}>
        <label className={styles.field}>
          Perfil
          <select className={styles.control} {...register("cargo")}>
            {cargosUsuario.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
        {endereco && (
          <fieldset className={styles.fields}>
            <legend>Endereço obrigatório</legend>
            {field("cep", "CEP")}
            {field("rua", "Rua")}
            {field("numero", "Número")}
            {field("cidade", "Cidade")}
            {field("estado", "Estado")}
            {field("pais", "País")}
            {field("complemento", "Complemento", false)}
          </fieldset>
        )}
        {banco && (
          <fieldset className={styles.fields}>
            <legend>Conta bancária obrigatória</legend>
            {field("banco", "Banco")}
            {field("agencia", "Agência")}
            {field("conta", "Conta")}
            {field("chavePix", "Chave Pix")}
            {field("tipo", "Tipo", false)}
          </fieldset>
        )}
        <p className={styles.note}>
          A alteração encerra as sessões do usuário. O histórico será preservado.
        </p>
        {(error || validation) && (
          <p role="alert" className={styles.error}>
            {error || validation}
          </p>
        )}
        <div className={styles.footer}>
          <Button type="button" variant="ghost" disabled={isSubmitting} onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={isSubmitting}>
            Salvar perfil
          </Button>
        </div>
      </form>
    </Modal>
  );
}
