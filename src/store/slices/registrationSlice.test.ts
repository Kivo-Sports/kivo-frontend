import { describe, expect, it } from "vitest";

import reducer, {
  clearFieldError,
  goToNextStep,
  goToPreviousStep,
  goToStep,
  markStepCompleted,
  resetRegistration,
  setIsSubmitting,
  setStepErrors,
  setSubmitError,
  setUserType,
  updateFormData,
  updateFormField,
  type RegistrationState,
} from "./registrationSlice";

const initialState = reducer(undefined, { type: "@@INIT" });

describe("registrationSlice: estado inicial", () => {
  it("comeca sem tipo de usuario, no passo 1 e sem erros", () => {
    expect(initialState.userType).toBeNull();
    expect(initialState.currentStep).toBe(1);
    expect(initialState.errors).toEqual({});
    expect(initialState.completedSteps).toEqual([]);
  });
});

describe("registrationSlice: setUserType", () => {
  it("define o tipo e reseta o formulario/passo/erros", () => {
    const comProgresso: RegistrationState = {
      ...initialState,
      userType: "torcedor",
      currentStep: 3,
      errors: { nome: "obrigatorio" },
      completedSteps: [1, 2],
    };

    const state = reducer(comProgresso, setUserType("organizador-campeonato"));

    expect(state.userType).toBe("organizador-campeonato");
    expect(state.currentStep).toBe(1);
    expect(state.errors).toEqual({});
    expect(state.completedSteps).toEqual([]);
  });
});

describe("registrationSlice: updateFormField", () => {
  it("atualiza um campo de primeiro nivel", () => {
    const state = reducer(initialState, updateFormField({ field: "nome", value: "Fulano" }));
    expect(state.formData.nome).toBe("Fulano");
  });

  it("atualiza um campo aninhado em endereco", () => {
    const state = reducer(initialState, updateFormField({ field: "endereco.cidade", value: "São Paulo" }));
    expect(state.formData.endereco.cidade).toBe("São Paulo");
  });

  it("atualiza um campo aninhado em contaBanco", () => {
    const state = reducer(initialState, updateFormField({ field: "contaBanco.banco", value: "Itaú" }));
    expect(state.formData.contaBanco?.banco).toBe("Itaú");
  });

  it("limpa o erro do campo (chave completa e chave normalizada) ao digitar", () => {
    const comErro: RegistrationState = {
      ...initialState,
      errors: { "endereco.cidade": "obrigatorio", cidade: "obrigatorio" },
    };

    const state = reducer(comErro, updateFormField({ field: "endereco.cidade", value: "SP" }));

    expect(state.errors).toEqual({});
  });
});

describe("registrationSlice: updateFormData", () => {
  it("faz merge parcial no formData existente", () => {
    const comNome = reducer(initialState, updateFormField({ field: "nome", value: "Fulano" }));

    const state = reducer(comNome, updateFormData({ email: "fulano@kivo.local" }));

    expect(state.formData.nome).toBe("Fulano");
    expect(state.formData.email).toBe("fulano@kivo.local");
  });
});

describe("registrationSlice: erros", () => {
  it("setStepErrors substitui todos os erros do passo", () => {
    const state = reducer(initialState, setStepErrors({ nome: "obrigatorio", email: "invalido" }));
    expect(state.errors).toEqual({ nome: "obrigatorio", email: "invalido" });
  });

  it("clearFieldError remove apenas o erro indicado", () => {
    const comErros: RegistrationState = { ...initialState, errors: { nome: "x", email: "y" } };
    const state = reducer(comErros, clearFieldError("nome"));
    expect(state.errors).toEqual({ email: "y" });
  });
});

describe("registrationSlice: navegacao entre passos", () => {
  it("markStepCompleted adiciona o passo sem duplicar", () => {
    const state1 = reducer(initialState, markStepCompleted(1));
    const state2 = reducer(state1, markStepCompleted(1));
    expect(state2.completedSteps).toEqual([1]);
  });

  it("goToNextStep avanca o passo e limpa submitError", () => {
    const comErro: RegistrationState = { ...initialState, submitError: "falhou" };
    const state = reducer(comErro, goToNextStep());
    expect(state.currentStep).toBe(2);
    expect(state.submitError).toBeNull();
  });

  it("goToPreviousStep volta o passo sem ir abaixo de 1", () => {
    const noPasso1 = reducer(initialState, goToPreviousStep());
    expect(noPasso1.currentStep).toBe(1);

    const noPasso3: RegistrationState = { ...initialState, currentStep: 3 };
    const state = reducer(noPasso3, goToPreviousStep());
    expect(state.currentStep).toBe(2);
  });

  it("goToStep pula direto para o passo indicado", () => {
    const state = reducer(initialState, goToStep(4));
    expect(state.currentStep).toBe(4);
  });
});

describe("registrationSlice: submissao", () => {
  it("setIsSubmitting e setSubmitError refletem o estado observavel", () => {
    const loading = reducer(initialState, setIsSubmitting(true));
    expect(loading.isSubmitting).toBe(true);

    const comErro = reducer(loading, setSubmitError("Erro ao enviar"));
    expect(comErro.submitError).toBe("Erro ao enviar");
  });
});

describe("registrationSlice: resetRegistration", () => {
  it("volta tudo ao estado inicial", () => {
    const comProgresso: RegistrationState = {
      userType: "torcedor",
      currentStep: 5,
      formData: { ...initialState.formData, nome: "Fulano" },
      errors: { nome: "x" },
      completedSteps: [1, 2, 3],
      isSubmitting: true,
      submitError: "falhou",
    };

    const state = reducer(comProgresso, resetRegistration());

    expect(state).toEqual(initialState);
  });
});
