import { baseApi } from "@/store/api/baseApi";
import type {
  TabelaClassificacaoResponse,
  ChaveamentoResponse,
  JogoResponse,
  DetalhePartidaResponse,
  AtualizarPlacarRequest,
  AgendarPartidaRequest,
  JogoOrganizadorTime,
} from "@/types/partida";
import type {
  CriarPartidaAdminRequest,
  EditarPartidaAdminRequest,
  AtualizarPlacarAdminRequest,
} from "@/types/admin";
import type { CampeonatoResponse } from "@/types/campeonato";
import type { TimeResponse } from "@/types/time";

export const partidaApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    gerarTabela: builder.mutation<void, string>({
      query: (campeonatoId) => ({
        url: `/api/partida/gerar-tabela/${campeonatoId}`,
        method: "POST",
      }),
      invalidatesTags: ["Partida"],
    }),
    atualizarPlacar: builder.mutation<void, AtualizarPlacarRequest>({
      query: ({ partidaId, golsTimeCasa, golsTimeVisitante }) => ({
        url: `/api/partida/${partidaId}/atualizar-placar`,
        method: "PATCH",
        body: { golsTimeCasa, golsTimeVisitante },
      }),
      invalidatesTags: ["Partida"],
    }),
    agendarPartida: builder.mutation<void, AgendarPartidaRequest>({
      query: ({ partidaId, dataHora, local }) => ({
        url: `/api/partida/${partidaId}/agendar`,
        method: "PATCH",
        body: { dataHora, local },
      }),
      invalidatesTags: ["Partida"],
    }),
    obterPartida: builder.query<DetalhePartidaResponse, string>({
      query: (partidaId) => ({ url: `/api/partida/${partidaId}`, method: "GET" }),
      providesTags: ["Partida"],
    }),
    listarJogosOrganizadorTime: builder.query<JogoOrganizadorTime[], void>({
      async queryFn(_arg, _api, _extraOptions, fetchWithBQ) {
        const [timesResult, campeonatosResult] = await Promise.all([
          fetchWithBQ("/api/time/organizador"),
          fetchWithBQ("/api/campeonato"),
        ]);
        if (timesResult.error) return { error: timesResult.error };
        if (campeonatosResult.error) return { error: campeonatosResult.error };

        const times = timesResult.data as TimeResponse[];
        const campeonatos = campeonatosResult.data as CampeonatoResponse[];
        const nomesTimes = new Set(
          times.map((time) => time.nome.trim().toLocaleLowerCase("pt-BR")),
        );
        const candidatos: Array<{ id: string; campeonatoId: string; nomeCampeonato: string }> = [];

        const resultados = await Promise.all(
          campeonatos.map(async (campeonato) => {
            const requests: Array<ReturnType<typeof fetchWithBQ>> = [];
            if (
              campeonato.formatoCampeonato === "PontosCorridos" ||
              campeonato.formatoCampeonato === "Hibrido"
            ) {
              requests.push(fetchWithBQ(`/api/partida/jogos/${campeonato.id}`));
            }
            if (
              campeonato.formatoCampeonato === "MataMata" ||
              campeonato.formatoCampeonato === "Hibrido"
            ) {
              requests.push(fetchWithBQ(`/api/partida/chaveamento/${campeonato.id}`));
            }
            return { campeonato, respostas: await Promise.all(requests) };
          }),
        );

        resultados.forEach(({ campeonato, respostas }) => {
          respostas.forEach((resposta) => {
            if (resposta.error || !Array.isArray(resposta.data)) return;
            const dados = resposta.data as Array<JogoResponse | ChaveamentoResponse>;
            dados.forEach((item) => {
              if ("partidas" in item) {
                item.partidas.forEach((partida) =>
                  candidatos.push({
                    id: partida.id,
                    campeonatoId: campeonato.id,
                    nomeCampeonato: campeonato.nome,
                  }),
                );
              } else {
                candidatos.push({
                  id: item.id,
                  campeonatoId: campeonato.id,
                  nomeCampeonato: campeonato.nome,
                });
              }
            });
          });
        });

        const detalhes = await Promise.all(
          [...new Map(candidatos.map((item) => [item.id, item])).values()].map(async (item) => ({
            ...item,
            resposta: await fetchWithBQ(`/api/partida/${item.id}`),
          })),
        );

        const jogos = detalhes.flatMap(({ campeonatoId, nomeCampeonato, resposta }) => {
          if (resposta.error || !resposta.data) return [];
          const partida = resposta.data as DetalhePartidaResponse;
          const casaDoOrganizador = nomesTimes.has(
            partida.nomeTimeCasa.trim().toLocaleLowerCase("pt-BR"),
          );
          const visitanteDoOrganizador = nomesTimes.has(
            partida.nomeTimeVisitante.trim().toLocaleLowerCase("pt-BR"),
          );
          if (!casaDoOrganizador && !visitanteDoOrganizador) return [];
          return [
            {
              id: partida.id,
              campeonatoId,
              nomeCampeonato,
              timeCasaId: partida.timeCasaId ?? null,
              nomeTimeCasa: partida.nomeTimeCasa,
              logoTimeCasa: partida.logoTimeCasa,
              timeVisitanteId: partida.timeVisitanteId ?? null,
              nomeTimeVisitante: partida.nomeTimeVisitante,
              logoTimeVisitante: partida.logoTimeVisitante,
              dataHora: partida.dataHora,
              local: partida.local || "Local a definir",
              golsTimeCasa: partida.golsTimeCasa,
              golsTimeVisitante: partida.golsTimeVisitante,
              finalizado: partida.finalizado,
              ehMandante: casaDoOrganizador,
            },
          ];
        });
        return { data: jogos };
      },
      providesTags: ["Partida"],
    }),
    obterClassificacao: builder.query<TabelaClassificacaoResponse[], string>({
      query: (campeonatoId) => ({ url: `/api/partida/tabela/${campeonatoId}`, method: "GET" }),
      providesTags: ["Partida"],
    }),
    obterChaveamento: builder.query<ChaveamentoResponse[], string>({
      query: (campeonatoId) => ({ url: `/api/partida/chaveamento/${campeonatoId}`, method: "GET" }),
      providesTags: ["Partida"],
    }),
    // Endpoint pendente no backend — ver kivo-backend/PENDENCIAS-BACKEND.md
    listarJogos: builder.query<JogoResponse[], string>({
      query: (campeonatoId) => ({ url: `/api/partida/jogos/${campeonatoId}`, method: "GET" }),
      providesTags: ["Partida"],
    }),
    // --- Admin ---
    criarPartidaAdmin: builder.mutation<{ id: string }, CriarPartidaAdminRequest>({
      query: (body) => ({ url: `/api/partida/admin`, method: "POST", body }),
      invalidatesTags: ["Partida"],
    }),
    editarPartidaAdmin: builder.mutation<void, EditarPartidaAdminRequest>({
      query: ({ id, ...body }) => ({ url: `/api/partida/${id}/admin`, method: "PUT", body }),
      invalidatesTags: ["Partida"],
    }),
    deletarPartidaAdmin: builder.mutation<void, string>({
      query: (id) => ({ url: `/api/partida/${id}/admin`, method: "DELETE" }),
      invalidatesTags: ["Partida"],
    }),
    atualizarPlacarAdmin: builder.mutation<void, AtualizarPlacarAdminRequest>({
      query: ({ partidaId, golsTimeCasa, golsTimeVisitante }) => ({
        url: `/api/partida/${partidaId}/admin-placar`,
        method: "PATCH",
        body: { golsTimeCasa, golsTimeVisitante },
      }),
      invalidatesTags: ["Partida", "Campeonato"],
    }),
  }),
});

export const {
  useGerarTabelaMutation,
  useAtualizarPlacarMutation,
  useAgendarPartidaMutation,
  useObterPartidaQuery,
  useListarJogosOrganizadorTimeQuery,
  useObterClassificacaoQuery,
  useObterChaveamentoQuery,
  useListarJogosQuery,
  useCriarPartidaAdminMutation,
  useEditarPartidaAdminMutation,
  useDeletarPartidaAdminMutation,
  useAtualizarPlacarAdminMutation,
} = partidaApi;
