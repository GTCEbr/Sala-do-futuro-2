/**
 * ====================================================
 * SALA DO FUTURO V2 - MOTOR DE BANCO DE DADOS LOCAL (LOCALSTORAGE)
 * Modo Demonstração Institucional 100% Autônomo e Persistente
 * ====================================================
 * Armazena e sincroniza todos os dados da escola localmente no navegador:
 * Estudantes, Salas, Guildas, Tarefas, Entregas, Notas Oficiais e Livro de Ocorrências.
 * Mantém total integração com os modelos do Google Gemini via /api/ai/*.
 */

import { 
  salvarUsuarioFirebase, 
  salvarAtividadeFirestore, 
  buscarAtividadesFirestore,
  sincronizarFilaOfflineComFirebase 
} from "./firebase-config.js";
import {
  buscarAlunosAPI,
  buscarQuestoesAPI,
  buscarGuildasAPI,
  buscarGestaoAPI,
  loginAlunoAPI,
  loginGestaoAPI,
  responderQuestaoAPI,
  adicionarXPAlunoAPI,
  adicionarXPGuildaAPI,
  mapearAlunoAPI,
  enfileirarOperacaoAPI,
  obterFilaOperacoesAPI,
  processarFilaOperacoesAPI
} from "./api-sheets.js";

const CHAVE_STORAGE = "SALA_DO_FUTURO_BANCO_LOCAL_V2";

const DADOS_INICIAIS = {
  versao: "3.0-api-sheets",
  atualizadoEm: new Date().toISOString(),
  ultimaSyncAPI: null,

  instituicao: {
    nomeSistema: "Sala do Futuro Maurício Antunes",
    escola: "E.E. Maurício Antunes",
    anoLetivo: 2026,
    proximoCiclo: 2027,
    gremioResponsavel: "Grêmio Aegre",
    gremioLema: "Continuidade, protagonismo estudantil e reutilização em 2027",
    cicloReutilizacaoAtivo: false
  },

  usuarios: [],
  salas: [],
  guildas: [],
  questoesAPI: [],
  gestaoAPI: [],
  tarefas: [],
  entregas: [],
  entregasSP: [],
  redacoes: [],
  notas: [],
  ocorrencias: [],
  comunicados: [],
  chamadas: [],
  materiais: [],
  trabalhosGuilda: [],
  premiacoes: [],
  desafiosDiarios: {},
  usuarioAtivo: null
};
    // DADOS_INICIAIS populados dinamicamente via sincronizarComAPI()

class DBLocalMotor {
  constructor() {
    this.carregar();
    if (typeof window !== "undefined") {
      window.addEventListener("storage", (e) => {
        if (e.key === CHAVE_STORAGE) {
          this.carregar();
          window.dispatchEvent(new CustomEvent("banco-local-atualizado", { detail: { dados: this.dados } }));
        }
      });
    }
  }

  carregar() {
    try {
      const raw = localStorage.getItem(CHAVE_STORAGE);
      if (!raw) {
        this.dados = JSON.parse(JSON.stringify(DADOS_INICIAIS));
        this.salvar();
      } else {
        const parsed = JSON.parse(raw);
        const versaoAnterior = String(parsed.versao || "");
        const precisaPurgarMocks = versaoAnterior !== DADOS_INICIAIS.versao;

        // Se for cache antigo com dados mockados (2.x), limpar listas de demonstração
        const usuariosLimpos = precisaPurgarMocks
          ? (parsed.usuarios || []).filter((u) => u.origemAPI || u.salvoNoFirebase)
          : (parsed.usuarios || []);
        const salasLimpos = precisaPurgarMocks
          ? (parsed.salas || []).filter((s) => s.origemAPI || s.customizada)
          : (parsed.salas || []);
        const guildasLimpos = precisaPurgarMocks
          ? (parsed.guildas || []).filter((g) => g.origemAPI)
          : (parsed.guildas || []);
        const tarefasLimpos = precisaPurgarMocks
          ? (parsed.tarefas || []).filter((t) => t.origemAPI || t.salvoNoFirebase || t.criadaPorDocente)
          : (parsed.tarefas || []);

        const usuarioAtivoValido = precisaPurgarMocks
          ? ((parsed.usuarioAtivo?.origemAPI || parsed.usuarioAtivo?.tipo === "responsavel") ? parsed.usuarioAtivo : null)
          : (parsed.usuarioAtivo || null);

        this.dados = {
          ...DADOS_INICIAIS,
          ...parsed,
          versao: DADOS_INICIAIS.versao,
          instituicao: {
            ...DADOS_INICIAIS.instituicao,
            ...(parsed.instituicao || {}),
            gremioResponsavel: (!parsed.instituicao?.gremioResponsavel || parsed.instituicao.gremioResponsavel === "Grêmio Alegre")
              ? "Grêmio Aegre"
              : parsed.instituicao.gremioResponsavel
          },
          usuarios: usuariosLimpos,
          salas: salasLimpos,
          guildas: guildasLimpos,
          questoesAPI: parsed.questoesAPI || [],
          gestaoAPI: parsed.gestaoAPI || [],
          tarefas: tarefasLimpos,
          entregas: precisaPurgarMocks ? (parsed.entregas || []).filter((e) => e.origemReal) : (parsed.entregas || []),
          entregasSP: precisaPurgarMocks ? (parsed.entregasSP || []).filter((e) => e.origemReal) : (parsed.entregasSP || []),
          redacoes: precisaPurgarMocks ? [] : (parsed.redacoes || []),
          notas: precisaPurgarMocks ? [] : (parsed.notas || []),
          ocorrencias: precisaPurgarMocks ? [] : (parsed.ocorrencias || []),
          comunicados: precisaPurgarMocks ? (parsed.comunicados || []).filter((c) => !String(c.id || "").startsWith("com_1") && !String(c.id || "").startsWith("com_2")) : (parsed.comunicados || []),
          chamadas: precisaPurgarMocks ? [] : (parsed.chamadas || []),
          materiais: precisaPurgarMocks ? [] : (parsed.materiais || []),
          trabalhosGuilda: parsed.trabalhosGuilda || [],
          premiacoes: parsed.premiacoes || [],
          desafiosDiarios: parsed.desafiosDiarios || {},
          usuarioAtivo: usuarioAtivoValido
        };

        if (precisaPurgarMocks) {
          this.salvar();
        }
      }
    } catch (e) {
      console.warn("Erro ao ler banco local, inicializando estado limpo:", e);
      this.dados = JSON.parse(JSON.stringify(DADOS_INICIAIS));
      this.salvar();
    }
  }

  salvar() {
    try {
      this.dados.atualizadoEm = new Date().toISOString();
      localStorage.setItem(CHAVE_STORAGE, JSON.stringify(this.dados));
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("banco-local-atualizado", { detail: { dados: this.dados } }));
      }
    } catch (e) {
      console.error("Falha ao persistir no localStorage:", e);
    }
  }

  // --- USUÁRIOS / ALUNOS ---
  obterAlunos() {
    this.carregar();
    return this.dados.usuarios.filter(u => !u.tipo || u.tipo === "aluno");
  }

  obterTodosUsuarios() {
    this.carregar();
    return this.dados.usuarios;
  }

  obterUsuarioPorId(id) {
    this.carregar();
    return this.dados.usuarios.find(u => u.id === id);
  }

  salvarAluno(aluno) {
    this.carregar();
    const id = aluno.id || `aluno_${Date.now()}`;
    const idx = this.dados.usuarios.findIndex(u => u.id === id);
    const registro = {
      tipo: "aluno",
      xp: 0,
      nivel: 1,
      ...aluno,
      id
    };
    if (idx !== -1) {
      this.dados.usuarios[idx] = { ...this.dados.usuarios[idx], ...registro };
    } else {
      this.dados.usuarios.push(registro);
    }
    this.salvar();

    // Sincronização em segundo plano no Firebase Auth e Firestore
    try {
      salvarUsuarioFirebase(registro).catch(e => console.warn("Firebase sync aluno aviso:", e));
    } catch (e) {}

    return registro;
  }

  obterProfessores() {
    this.carregar();
    return this.dados.usuarios.filter(u => u.tipo === "professor" || (u.cargo && u.cargo.toLowerCase().includes("prof")));
  }

  salvarProfessor(prof) {
    this.carregar();
    const id = prof.id || `prof_${Date.now()}`;
    const idx = this.dados.usuarios.findIndex(u => u.id === id);
    const registro = {
      tipo: "professor",
      cargo: "Professor",
      ...prof,
      id
    };
    if (idx !== -1) {
      this.dados.usuarios[idx] = { ...this.dados.usuarios[idx], ...registro };
    } else {
      this.dados.usuarios.push(registro);
    }
    this.salvar();

    // Sincronização no Firebase Auth e Firestore (coleção 'usuarios', documento 'professores', campo = prof.nome)
    try {
      salvarUsuarioFirebase(registro).then(res => {
        if (res && res.firestoreCriado) {
          console.log(`🔥 [Firebase] Professor "${registro.nome}" sincronizado na coleção usuarios/professores`);
        }
      }).catch(e => console.warn("Firebase sync professor aviso:", e));
    } catch (e) {}

    return registro;
  }

  salvarUsuario(usr) {
    if (usr?.tipo === "professor" || usr?.cargo?.toLowerCase().includes("prof")) {
      return this.salvarProfessor(usr);
    }
    return this.salvarAluno(usr);
  }

  excluirAluno(id) {
    this.carregar();
    this.dados.usuarios = this.dados.usuarios.filter(u => u.id !== id);
    this.salvar();
    return true;
  }

  // --- PERFIL DO ALUNO (COMPATIBILIDADE TAREFA SP E REDAÇÃO SP) ---
  obterPerfilAluno() {
    this.carregar();
    const ativo = this.obterUsuarioAtivo();
    if (ativo && (ativo.tipo === "aluno" || !ativo.tipo)) {
      return ativo;
    }
    try {
      const salvo = localStorage.getItem("perfilAluno") || localStorage.getItem("usuarioLogado");
      if (salvo) {
        const parsed = JSON.parse(salvo);
        if (parsed && (parsed.tipo === "aluno" || !parsed.tipo)) return parsed;
      }
    } catch (e) {}
    const alunos = this.obterAlunos();
    return alunos[0] || null;
  }

  salvarPerfilAluno(perfil) {
    if (!perfil) return null;
    this.carregar();
    const salvo = this.salvarAluno(perfil);
    this.definirUsuarioAtivo(salvo);
    try {
      localStorage.setItem("perfilAluno", JSON.stringify(salvo));
      localStorage.setItem("usuarioLogado", JSON.stringify(salvo));
    } catch (e) {}
    return salvo;
  }

  // --- SALAS ---
  obterSalas() {
    this.carregar();
    return this.dados.salas;
  }

  salvarSala(sala) {
    this.carregar();
    const id = sala.id || `sala_${Date.now()}`;
    const idx = this.dados.salas.findIndex(s => s.id === id);
    const registro = { totalAlunos: 30, turno: "Manhã", ...sala, id };
    if (idx !== -1) {
      this.dados.salas[idx] = { ...this.dados.salas[idx], ...registro };
    } else {
      this.dados.salas.push(registro);
    }
    this.salvar();
    return registro;
  }

  excluirSala(id) {
    this.carregar();
    this.dados.salas = this.dados.salas.filter(s => s.id !== id);
    this.salvar();
    return true;
  }

  // --- GUILDAS ---
  obterGuildas() {
    this.carregar();
    return this.dados.guildas;
  }

  salvarGuilda(guilda) {
    this.carregar();
    const id = guilda.id || `guilda_${Date.now()}`;
    const idx = this.dados.guildas.findIndex(g => g.id === id);
    const registro = { pontos: 0, membros: 1, cor: "#1d5a9e", icone: "🛡️", ...guilda, id };
    if (idx !== -1) {
      this.dados.guildas[idx] = { ...this.dados.guildas[idx], ...registro };
    } else {
      this.dados.guildas.push(registro);
    }
    this.salvar();
    return registro;
  }

  excluirGuilda(id) {
    this.carregar();
    this.dados.guildas = this.dados.guildas.filter(g => g.id !== id);
    this.salvar();
    return true;
  }

  // --- TAREFAS DOCENTES ---
  obterTarefas() {
    this.carregar();
    return this.dados.tarefas;
  }

  salvarTarefa(tarefa) {
    this.carregar();
    const id = tarefa.id || `tar_${Date.now()}`;
    const idx = this.dados.tarefas.findIndex(t => t.id === id);
    const registro = { status: "ativa", pontosXP: 30, ...tarefa, id };
    if (idx !== -1) {
      this.dados.tarefas[idx] = { ...this.dados.tarefas[idx], ...registro };
    } else {
      this.dados.tarefas.unshift(registro);
    }
    this.salvar();

    // Lança atividade no Cloud Firestore na coleção Atividades/{disciplina}/itens
    try {
      salvarAtividadeFirestore(registro).then(res => {
        if (res && res.firestoreSalvo) {
          console.log(`🔥 [Firestore] Atividade "${registro.titulo}" sincronizada em Atividades/${res.disciplinaDoc}`);
        }
      }).catch(e => console.warn("Firestore sync atividade aviso:", e));
    } catch (e) {}

    return registro;
  }

  async carregarAtividadesNuvemFirestore() {
    try {
      const atividadesNuvem = await buscarAtividadesFirestore();
      if (Array.isArray(atividadesNuvem) && atividadesNuvem.length > 0) {
        this.carregar();
        let novos = 0;
        atividadesNuvem.forEach(atv => {
          const idx = this.dados.tarefas.findIndex(t => t.id === atv.id);
          if (idx === -1) {
            this.dados.tarefas.unshift(atv);
            novos++;
          } else {
            this.dados.tarefas[idx] = { ...this.dados.tarefas[idx], ...atv };
          }
        });
        if (novos > 0) {
          this.salvar();
          console.log(`📥 [Firestore] ${novos} nova(s) atividade(s) sincronizada(s) da nuvem`);
        }
        return atividadesNuvem;
      }
    } catch (e) {
      console.warn("Aviso ao buscar atividades do Firestore:", e);
    }
    return [];
  }

  excluirTarefa(id) {
    this.carregar();
    this.dados.tarefas = this.dados.tarefas.filter(t => t.id !== id);
    this.salvar();
    return true;
  }

  // --- ENTREGAS DE TAREFAS ---
  obterEntregas() {
    this.carregar();
    return this.dados.entregas;
  }

  salvarEntrega(entrega) {
    this.carregar();
    const id = entrega.id || `ent_${Date.now()}`;
    const idx = this.dados.entregas.findIndex(e => e.id === id || (e.tarefaId === entrega.tarefaId && e.alunoId === entrega.alunoId));
    const registro = { data: new Date().toISOString().split("T")[0], status: "Entregue", ...entrega, id };
    if (idx !== -1) {
      this.dados.entregas[idx] = { ...this.dados.entregas[idx], ...registro };
    } else {
      this.dados.entregas.unshift(registro);
    }
    this.salvar();
    return registro;
  }

  // --- ENTREGAS TAREFAS SP ---
  obterEntregasSP() {
    this.carregar();
    return this.dados.entregasSP;
  }

  salvarEntregaSP(entrega) {
    this.carregar();
    const id = entrega.id || `esp_${Date.now()}`;
    const idx = this.dados.entregasSP.findIndex(e => e.id === id);
    const registro = { data: new Date().toISOString().split("T")[0], status: "Entregue", ...entrega, id };
    if (idx !== -1) {
      this.dados.entregasSP[idx] = { ...this.dados.entregasSP[idx], ...registro };
    } else {
      this.dados.entregasSP.unshift(registro);
    }
    this.salvar();
    return registro;
  }

  // --- ENTREGAS OFICIAIS TAREFA SP ---
  obterEntregasOficiais() {
    this.carregar();
    return this.dados.entregasOficiais || [];
  }

  salvarEntregaOficial(entrega) {
    this.carregar();
    if (!this.dados.entregasOficiais) this.dados.entregasOficiais = [];
    const id = entrega.id || `ent_sp_${Date.now()}`;
    const idx = this.dados.entregasOficiais.findIndex(e => e.id === id || (e.atividadeId === entrega.atividadeId && e.alunoId === entrega.alunoId));
    const registro = { ...entrega, id };
    if (idx !== -1) {
      this.dados.entregasOficiais[idx] = { ...this.dados.entregasOficiais[idx], ...registro };
    } else {
      this.dados.entregasOficiais.unshift(registro);
    }
    this.salvar();
    return registro;
  }

  // --- PONTUAÇÃO OFICIAL TAREFA SP ---
  obterPontuacaoOficial(alunoId) {
    this.carregar();
    if (!this.dados.pontuacoesOficiais) this.dados.pontuacoesOficiais = {};
    return this.dados.pontuacoesOficiais[alunoId] || null;
  }

  salvarPontuacaoOficial(alunoId, pontuacao) {
    this.carregar();
    if (!this.dados.pontuacoesOficiais) this.dados.pontuacoesOficiais = {};
    this.dados.pontuacoesOficiais[alunoId] = {
      ...this.dados.pontuacoesOficiais[alunoId],
      ...pontuacao,
      alunoId
    };
    this.salvar();
    return this.dados.pontuacoesOficiais[alunoId];
  }

  // --- RESPOSTAS DESAFIO DIÁRIO ---
  obterDesafioDiario(respostaId) {
    this.carregar();
    if (!this.dados.desafiosDiarios) this.dados.desafiosDiarios = {};
    return this.dados.desafiosDiarios[respostaId] || null;
  }

  salvarDesafioDiario(respostaId, dados) {
    this.carregar();
    if (!this.dados.desafiosDiarios) this.dados.desafiosDiarios = {};
    this.dados.desafiosDiarios[respostaId] = {
      ...this.dados.desafiosDiarios[respostaId],
      ...dados,
      id: respostaId
    };
    this.salvar();
    return this.dados.desafiosDiarios[respostaId];
  }

  // --- TRABALHOS DA GUILDA ---
  obterTrabalhosGuilda() {
    this.carregar();
    return this.dados.trabalhosGuilda || [];
  }

  salvarTrabalhoGuilda(trab) {
    this.carregar();
    if (!this.dados.trabalhosGuilda) this.dados.trabalhosGuilda = this.obterTrabalhosGuilda();
    const id = trab.id || `trab_${Date.now()}`;
    const idx = this.dados.trabalhosGuilda.findIndex(t => t.id === id);
    const registro = { ...trab, id };
    if (idx !== -1) {
      this.dados.trabalhosGuilda[idx] = { ...this.dados.trabalhosGuilda[idx], ...registro };
    } else {
      this.dados.trabalhosGuilda.push(registro);
    }
    this.salvar();
    return registro;
  }

  // --- PREMIAÇÕES ---
  obterPremiacoes() {
    this.carregar();
    return this.dados.premiacoes || [];
  }

  salvarPremiacao(premio) {
    this.carregar();
    if (!this.dados.premiacoes) this.dados.premiacoes = this.obterPremiacoes();
    const id = premio.id || `prem_${Date.now()}`;
    const idx = this.dados.premiacoes.findIndex(p => p.id === id);
    const registro = { ...premio, id };
    if (idx !== -1) {
      this.dados.premiacoes[idx] = { ...this.dados.premiacoes[idx], ...registro };
    } else {
      this.dados.premiacoes.push(registro);
    }
    this.salvar();
    return registro;
  }

  // --- NOTAS ESCOLARES ---
  obterNotas() {
    this.carregar();
    return this.dados.notas;
  }

  salvarNota(nota) {
    this.carregar();
    const id = nota.id || `not_${Date.now()}`;
    const idx = this.dados.notas.findIndex(n => n.id === id);
    const registro = { ...nota, id };
    if (idx !== -1) {
      this.dados.notas[idx] = { ...this.dados.notas[idx], ...registro };
    } else {
      this.dados.notas.unshift(registro);
    }
    this.salvar();
    return registro;
  }

  excluirNota(id) {
    this.carregar();
    this.dados.notas = this.dados.notas.filter(n => n.id !== id);
    this.salvar();
    return true;
  }

  // --- OCORRÊNCIAS ---
  // ====================================================
  // MÓDULO: LIVRO DE OCORRÊNCIAS & VISTO DIGITAL DOS PAIS
  // ====================================================

  /**
   * Obtém a lista completa de ocorrências disciplinares e pedagógicas da escola.
   * @returns {Array<Object>} Lista de ocorrências escolares.
   */
  obterOcorrencias() {
    this.carregar();
    return this.dados.ocorrencias;
  }

  /**
   * Salva ou atualiza uma ocorrência no banco de dados local.
   * Suporta vinculação de estudante, professor autor, gravidade e solicitação de assinatura.
   * @param {Object} oc - Objeto com os dados da ocorrência.
   * @returns {Object} A ocorrência salva.
   */
  salvarOcorrencia(oc) {
    this.carregar();
    const id = oc.id || `oc_${Date.now()}`;
    const idx = this.dados.ocorrencias.findIndex(o => o.id === id);
    const registro = { data: new Date().toISOString().split("T")[0], status: "Em Acompanhamento", ...oc, id };
    if (idx !== -1) {
      this.dados.ocorrencias[idx] = { ...this.dados.ocorrencias[idx], ...registro };
    } else {
      this.dados.ocorrencias.unshift(registro);
    }
    this.salvar();
    return registro;
  }

  /**
   * Registra a confirmação de ciência e assinatura digital do responsável legal pelo estudante.
   * Atualiza o status para 'Ciência Confirmada pelos Pais' com carimbo de data, hora e parecer familiar.
   * @param {string} id - ID da ocorrência a ser assinada.
   * @param {Object} dados - Nome do responsável, grau de parentesco e parecer opcional.
   * @returns {Object|null} A ocorrência atualizada ou null se não encontrada.
   */
  assinarOcorrenciaPorPais(id, { responsavelNome, vinculo, observacaoPais }) {
    this.carregar();
    const idx = this.dados.ocorrencias.findIndex(o => o.id === id);
    if (idx === -1) return null;
    const oc = this.dados.ocorrencias[idx];
    const agora = new Date();
    const dataFormatada = agora.toLocaleDateString("pt-BR") + " às " + agora.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    
    oc.status = "Ciência Confirmada pelos Pais";
    oc.assinaturaPais = {
      assinado: true,
      responsavelNome: responsavelNome || "Responsável Legal",
      vinculo: vinculo || "Responsável",
      dataAssinatura: dataFormatada,
      observacaoPais: observacaoPais || ""
    };
    this.dados.ocorrencias[idx] = oc;
    this.salvar();
    return oc;
  }

  /**
   * Remove uma ocorrência do banco de dados local por ID.
   * @param {string} id - ID da ocorrência a ser removida.
   * @returns {boolean} True se a exclusão foi concluída.
   */
  excluirOcorrencia(id) {
    this.carregar();
    this.dados.ocorrencias = this.dados.ocorrencias.filter(o => o.id !== id);
    this.salvar();
    return true;
  }

  // --- COMUNICADOS E AVISOS ---
  obterComunicados() {
    this.carregar();
    return this.dados.comunicados || DADOS_INICIAIS.comunicados || [];
  }

  salvarComunicado(comunicado) {
    this.carregar();
    if (!this.dados.comunicados) this.dados.comunicados = [];
    const id = comunicado.id || `com_${Date.now()}`;
    const idx = this.dados.comunicados.findIndex(c => c.id === id);
    const registro = {
      data: new Date().toISOString().split("T")[0],
      autor: "Coordenação Pedagógica",
      destino: "TODOS",
      tipo: "Comunica SP",
      ...comunicado,
      id
    };
    if (idx !== -1) {
      this.dados.comunicados[idx] = { ...this.dados.comunicados[idx], ...registro };
    } else {
      this.dados.comunicados.unshift(registro);
    }
    this.salvar();
    return registro;
  }

  excluirComunicado(id) {
    this.carregar();
    if (!this.dados.comunicados) return true;
    this.dados.comunicados = this.dados.comunicados.filter(c => c.id !== id);
    this.salvar();
    return true;
  }

  // --- ALIASES PARA DOCENTES E SALA DE AULA ---
  obterTarefasDocentes() {
    return this.obterTarefas();
  }

  salvarTarefaDocente(tarefa) {
    return this.salvarTarefa(tarefa);
  }

  obterEntregasDocentes() {
    return this.obterEntregas();
  }

  salvarEntregaDocente(entrega) {
    return this.salvarEntrega(entrega);
  }

  salvarAvaliacaoDocente(dados) {
    this.carregar();
    const entregas = this.obterEntregas();
    const idx = entregas.findIndex(e => 
      e.id === dados.id || 
      (e.tarefaId === dados.tarefaId && e.alunoId === dados.alunoId)
    );
    let registro;
    if (idx !== -1) {
      entregas[idx] = {
        ...entregas[idx],
        ...dados,
        status: "Avaliação",
        atualizadoEm: new Date().toISOString()
      };
      registro = entregas[idx];
    } else {
      registro = this.salvarEntrega({
        ...dados,
        status: "Avaliação"
      });
    }

    // Atualiza ou insere também na lista de notas se houver componente
    if (dados.nota !== undefined && dados.nota !== null && dados.componente) {
      this.salvarNota({
        alunoId: dados.alunoId,
        alunoNome: dados.alunoNome || "Estudante",
        alunoRA: dados.alunoRA || "000.123.456-7 SP",
        turma: dados.turma || "8º Ano A",
        componente: dados.componente,
        bimestre: dados.bimestre || "2º Bimestre",
        notaTarefas: Number(dados.nota),
        media: Number(dados.nota),
        situacao: Number(dados.nota) >= 6.0 ? "Aprovado" : "Em Recuperação",
        observacoes: dados.devolutiva || "Avaliação de atividade prática realizada pelo professor."
      });
    }

    this.salvar();
    return registro;
  }

  // ====================================================
  // INTEGRAÇÃO REAL COM API GOOGLE APPS SCRIPT + CACHE OFFLINE
  // ====================================================

  agruparQuestoesPorTask(questoes) {
    if (!Array.isArray(questoes) || questoes.length === 0) return [];
    const mapa = new Map();

    questoes.forEach((q) => {
      const taskKey = String(q.task || `t${q.codigo}`).trim();
      const materia = String(q.materia || "Geral").trim();
      const chaveGrupo = `${taskKey}__${materia}`;

      if (!mapa.has(chaveGrupo)) {
        mapa.set(chaveGrupo, {
          taskCode: taskKey,
          materia,
          questoes: []
        });
      }
      mapa.get(chaveGrupo).questoes.push(q);
    });

    return Array.from(mapa.values()).map((grupo) => {
      const qtd = grupo.questoes.length;
      const preview = grupo.questoes[0]?.questao || "";
      const previewCurto = preview.length > 52 ? `${preview.slice(0, 52)}...` : preview;
      const titulo = qtd === 1
        ? `${grupo.taskCode.toUpperCase()} • ${grupo.materia} — ${previewCurto}`
        : `Task ${grupo.taskCode.toUpperCase()} • ${grupo.materia} (${qtd} questões)`;

      return {
        id: `api_task_${grupo.taskCode}_${grupo.materia.replace(/[^a-zA-Z0-9]/g, "")}`,
        taskCode: grupo.taskCode,
        titulo,
        componente: grupo.materia,
        disciplina: grupo.materia,
        turma: "TODOS",
        pontosXP: qtd * 10,
        xp: qtd * 10,
        status: "ativa",
        ativa: true,
        origemAPI: true,
        habilidadeBNCC: `Planilha • ${grupo.taskCode.toUpperCase()}`,
        descricao: qtd === 1 ? preview : `${qtd} questões oficiais de ${grupo.materia} (${grupo.taskCode})`,
        questoes: grupo.questoes.map((q) => ({
          id: `q_${q.codigo}`,
          codigo: q.codigo,
          tipo: "multiplaEscolha",
          enunciado: q.questao,
          alternativas: q.alternativas,
          respostaCorreta: q.alt,
          pontos: 10,
          materia: q.materia,
          task: q.task,
          habilidadeBNCC: `${q.materia} • Cód. ${q.codigo}`,
          explicacao: `Gabarito oficial registrado na planilha: alternativa ${q.alt}.`
        }))
      };
    });
  }

  async sincronizarComAPI({ forcar = false } = {}) {
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      return { ok: false, offline: true, dados: this.dados };
    }

    if (this._syncEmAndamento && !forcar) {
      return this._syncEmAndamento;
    }

    this._syncEmAndamento = (async () => {
      this.carregar();
      const [resAlunos, resQuestoes, resGuildas, resGestao] = await Promise.allSettled([
        buscarAlunosAPI(),
        buscarQuestoesAPI(),
        buscarGuildasAPI(),
        buscarGestaoAPI()
      ]);

      let atualizouAlgo = false;

      if (resGuildas.status === "fulfilled" && resGuildas.value?.ok) {
        this.dados.guildas = resGuildas.value.data;
        atualizouAlgo = true;
      }

      if (resAlunos.status === "fulfilled" && resAlunos.value?.ok) {
        const guildasAtuais = this.dados.guildas || [];
        const alunosReais = resAlunos.value.data.map((al) => {
          const guildaEncontrada = guildasAtuais.find((g) =>
            (g.membrosLista || []).some((m) =>
              m.toLowerCase() === al.nome.toLowerCase() || m === al.ra
            )
          );
          return {
            ...al,
            guilda: guildaEncontrada?.nome || al.guilda || ""
          };
        });

        const naoAlunos = (this.dados.usuarios || []).filter((u) => u.tipo && u.tipo !== "aluno");
        this.dados.usuarios = [...alunosReais, ...naoAlunos];

        // Deriva salas reais a partir das turmas dos alunos sincronizados
        const mapaSalas = new Map();
        alunosReais.forEach((al) => {
          const nomeSala = String(al.sala || "").trim();
          if (!nomeSala || nomeSala === "Sem Sala") return;
          if (!mapaSalas.has(nomeSala)) {
            mapaSalas.set(nomeSala, {
              id: `sala_${nomeSala.replace(/[^a-zA-Z0-9]/g, "")}`,
              nome: nomeSala,
              ano: nomeSala,
              turno: "Regular",
              professor: "Docentes da Unidade",
              totalAlunos: 0,
              origemAPI: true
            });
          }
          mapaSalas.get(nomeSala).totalAlunos += 1;
        });
        const salasCustom = (this.dados.salas || []).filter((s) => !s.origemAPI);
        this.dados.salas = [...Array.from(mapaSalas.values()), ...salasCustom];
        atualizouAlgo = true;
      }

      if (resQuestoes.status === "fulfilled" && resQuestoes.value?.ok) {
        this.dados.questoesAPI = resQuestoes.value.data;
        const tarefasAPI = this.agruparQuestoesPorTask(resQuestoes.value.data);
        const tarefasLocaisExtras = (this.dados.tarefas || []).filter((t) => !t.origemAPI);
        this.dados.tarefas = [...tarefasAPI, ...tarefasLocaisExtras];
        atualizouAlgo = true;
      }

      if (resGestao.status === "fulfilled" && resGestao.value?.ok) {
        this.dados.gestaoAPI = resGestao.value.data;
        const apenasAlunos = (this.dados.usuarios || []).filter((u) => !u.tipo || u.tipo === "aluno");
        const profsFirebaseLocais = (this.dados.usuarios || []).filter((u) => u.tipo === "professor" && !u.origemAPI);
        const gestaoMapeada = resGestao.value.data;
        this.dados.usuarios = [...apenasAlunos, ...gestaoMapeada, ...profsFirebaseLocais];
        atualizouAlgo = true;
      }

      // Atualiza o perfil do aluno logado caso exista na planilha
      if (this.dados.usuarioAtivo && (!this.dados.usuarioAtivo.tipo || this.dados.usuarioAtivo.tipo === "aluno")) {
        const raAtivo = String(this.dados.usuarioAtivo.ra || "").trim();
        const alunoAtualizado = (this.dados.usuarios || []).find((u) =>
          (!u.tipo || u.tipo === "aluno") && String(u.ra || "").trim() === raAtivo
        );
        if (alunoAtualizado) {
          this.dados.usuarioAtivo = { ...this.dados.usuarioAtivo, ...alunoAtualizado };
          try {
            localStorage.setItem("usuarioLogado", JSON.stringify(this.dados.usuarioAtivo));
            localStorage.setItem("perfilAluno", JSON.stringify(this.dados.usuarioAtivo));
          } catch (e) {}
        }
      }

      if (atualizouAlgo) {
        this.dados.ultimaSyncAPI = new Date().toISOString();
        this.salvar();
      }

      return { ok: atualizouAlgo, dados: this.dados };
    })();

    try {
      return await this._syncEmAndamento;
    } finally {
      this._syncEmAndamento = null;
    }
  }

  obterQuestoesAPI() {
    this.carregar();
    return this.dados.questoesAPI || [];
  }

  obterGestaoAPI() {
    this.carregar();
    return this.dados.gestaoAPI || [];
  }

  // --- AUTENTICAÇÃO REAL VIA GOOGLE APPS SCRIPT ---
  async autenticarAlunoAPI(ra, senha = "") {
    const raLimpo = String(ra || "").trim();
    if (!raLimpo) throw new Error("Por favor, informe o seu RA.");
    if (!senha) throw new Error("Por favor, informe a sua senha.");

    const res = await loginAlunoAPI(raLimpo, senha);
    if (!res?.ok) {
      if (res?.erroRede) {
        throw new Error("Sem conexão com a internet para validar o login na planilha.");
      }
      throw new Error(res?.msg || "RA ou senha incorreta");
    }

    const alunoMapeado = mapearAlunoAPI(res.aluno || { RA: raLimpo });
    if (!alunoMapeado) {
      throw new Error("Dados do estudante inválidos retornados pela API.");
    }

    this.carregar();
    const idx = this.dados.usuarios.findIndex((u) => String(u.ra || "") === alunoMapeado.ra);
    if (idx !== -1) {
      this.dados.usuarios[idx] = { ...this.dados.usuarios[idx], ...alunoMapeado };
    } else {
      this.dados.usuarios.unshift(alunoMapeado);
    }

    this.dados.usuarioAtivo = alunoMapeado;
    this.salvar();

    try {
      localStorage.setItem("usuarioLogado", JSON.stringify(alunoMapeado));
      localStorage.setItem("perfilAluno", JSON.stringify(alunoMapeado));
    } catch (e) {}

    // Hidrata questões, guildas e colegas em segundo plano
    this.sincronizarComAPI({ forcar: true }).catch(() => {});

    return alunoMapeado;
  }

  async autenticarGestaoAPI(cadastro, senha = "") {
    const cadLimpo = String(cadastro || "").trim();
    if (!cadLimpo) throw new Error("Por favor, informe o número de Cadastro.");
    if (!senha) throw new Error("Por favor, informe a sua senha.");

    const res = await loginGestaoAPI(cadLimpo, senha);
    if (!res?.ok) {
      if (res?.erroRede) {
        throw new Error("Sem conexão com a internet para validar o acesso na planilha.");
      }
      throw new Error(res?.msg || "Cadastro ou senha incorreta");
    }

    const cargo = String(res.cargo || "Gestor").trim();
    const ehDocente = cargo.toLowerCase().includes("docente") || cargo.toLowerCase().includes("prof");

    const membro = {
      id: `gestao_${cadLimpo.replace(/\s+/g, "_")}`,
      cadastro: cadLimpo,
      nome: String(res.nome || cadLimpo).trim(),
      cargo,
      departamento: ehDocente ? "Corpo Docente" : "Gestão Escolar",
      unidade: this.obterInstituicao().escola || "E.E. Maurício Antunes",
      tipo: ehDocente ? "professor" : "gestor",
      origemAPI: true
    };

    this.definirUsuarioAtivo(membro);
    try {
      localStorage.setItem("usuarioLogado", JSON.stringify(membro));
      if (!ehDocente) {
        localStorage.setItem("gestorAtivo", JSON.stringify(membro));
      }
    } catch (e) {}

    return membro;
  }

  async responderQuestaoAPI(ra, codigo, resposta) {
    const raLimpo = String(ra || "").trim();
    const codLimpo = String(codigo || "").trim();
    const respLimpa = String(resposta || "").trim().toUpperCase();
    if (!raLimpo || !codLimpo || !respLimpa) {
      return { ok: false, msg: "Dados incompletos para envio." };
    }

    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      enfileirarOperacaoAPI({
        action: "responder",
        ra: raLimpo,
        codigo: codLimpo,
        resposta: respLimpa
      });
      return { ok: true, offlineEnfileirado: true };
    }

    const res = await responderQuestaoAPI(raLimpo, codLimpo, respLimpa);
    if (res?.erroRede) {
      enfileirarOperacaoAPI({
        action: "responder",
        ra: raLimpo,
        codigo: codLimpo,
        resposta: respLimpa
      });
      return { ok: true, offlineEnfileirado: true };
    }

    if (res?.ok && res.novoXP !== undefined) {
      this._aplicarXPLocalPorRA(raLimpo, Number(res.novoXP));
    }

    return res;
  }

  async adicionarXPAlunoAPI(ra, xp) {
    const raLimpo = String(ra || "").trim();
    const valor = Number(xp) || 0;
    if (!raLimpo || valor === 0) return { ok: false, msg: "RA ou XP inválido." };

    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      enfileirarOperacaoAPI({ action: "addXP", ra: raLimpo, xp: valor });
      const alunoAtual = this.adicionarXPAluno(raLimpo, valor);
      return { ok: true, offlineEnfileirado: true, novoXP: alunoAtual?.xp || 0 };
    }

    const res = await adicionarXPAlunoAPI(raLimpo, valor);
    if (res?.erroRede) {
      enfileirarOperacaoAPI({ action: "addXP", ra: raLimpo, xp: valor });
      const alunoAtual = this.adicionarXPAluno(raLimpo, valor);
      return { ok: true, offlineEnfileirado: true, novoXP: alunoAtual?.xp || 0 };
    }

    if (res?.ok && res.novoXP !== undefined) {
      this._aplicarXPLocalPorRA(raLimpo, Number(res.novoXP));
    }
    return res;
  }

  async adicionarXPGuildaAPI(nomeGuilda, xp) {
    const nomeLimpo = String(nomeGuilda || "").trim();
    const valor = Number(xp) || 0;
    if (!nomeLimpo || valor === 0) return { ok: false, msg: "Guilda ou XP inválido." };

    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      enfileirarOperacaoAPI({ action: "addXPGuilda", nome: nomeLimpo, xp: valor });
      this._aplicarXPGuildaLocal(nomeLimpo, null, valor);
      return { ok: true, offlineEnfileirado: true };
    }

    const res = await adicionarXPGuildaAPI(nomeLimpo, valor);
    if (res?.erroRede) {
      enfileirarOperacaoAPI({ action: "addXPGuilda", nome: nomeLimpo, xp: valor });
      this._aplicarXPGuildaLocal(nomeLimpo, null, valor);
      return { ok: true, offlineEnfileirado: true };
    }

    if (res?.ok && res.novoXP !== undefined) {
      this._aplicarXPGuildaLocal(nomeLimpo, Number(res.novoXP), 0);
    }
    return res;
  }

  _aplicarXPLocalPorRA(ra, novoXP) {
    this.carregar();
    const raLimpo = String(ra || "").trim();
    const idx = (this.dados.usuarios || []).findIndex((u) => String(u.ra || "").trim() === raLimpo);
    if (idx !== -1) {
      this.dados.usuarios[idx].xp = novoXP;
      this.dados.usuarios[idx].nivel = Math.max(1, Math.floor(novoXP / 100) + 1);
    }
    if (this.dados.usuarioAtivo && String(this.dados.usuarioAtivo.ra || "").trim() === raLimpo) {
      this.dados.usuarioAtivo.xp = novoXP;
      this.dados.usuarioAtivo.nivel = Math.max(1, Math.floor(novoXP / 100) + 1);
      try {
        localStorage.setItem("usuarioLogado", JSON.stringify(this.dados.usuarioAtivo));
        localStorage.setItem("perfilAluno", JSON.stringify(this.dados.usuarioAtivo));
      } catch (e) {}
    }
    this.salvar();
  }

  _aplicarXPGuildaLocal(nomeGuilda, novoXP = null, deltaXP = 0) {
    this.carregar();
    const idx = (this.dados.guildas || []).findIndex((g) =>
      String(g.nome || "").trim().toLowerCase() === String(nomeGuilda || "").trim().toLowerCase()
    );
    if (idx !== -1) {
      const xpCalculado = novoXP !== null ? novoXP : ((Number(this.dados.guildas[idx].pontos) || 0) + deltaXP);
      this.dados.guildas[idx].pontos = xpCalculado;
      this.dados.guildas[idx].xp = xpCalculado;
      this.salvar();
    }
  }

  // Compatibilidade legada redirecionada para busca em cache real (sem mocks)
  autenticarAluno(identificador) {
    this.carregar();
    const idLimpo = String(identificador || "").trim().toLowerCase();
    const encontrado = this.obterAlunos().find((a) =>
      String(a.ra || "").trim().toLowerCase() === idLimpo ||
      String(a.nome || "").trim().toLowerCase() === idLimpo
    );
    if (!encontrado) {
      throw new Error("Use o RA e a senha cadastrados na planilha oficial.");
    }
    this.definirUsuarioAtivo(encontrado);
    this.salvarPerfilAluno(encontrado);
    return encontrado;
  }

  autenticarResponsavel(email, senha = "", alunoRaOuId = "") {
    this.carregar();
    const emailLimpo = String(email || "").trim().toLowerCase();
    const alunos = this.obterAlunos();
    const alunoVinculado = alunos.find((a) =>
      a.id === alunoRaOuId || String(a.ra) === String(alunoRaOuId)
    ) || alunos[0];

    if (!alunoVinculado) {
      throw new Error("Nenhum estudante real encontrado na planilha para vincular.");
    }

    const responsavel = {
      id: `resp_${Date.now()}`,
      nome: `Responsável por ${alunoVinculado.nome}`,
      email: emailLimpo || `familia.${alunoVinculado.ra}@educacao.sp.gov.br`,
      tipo: "responsavel",
      alunoId: alunoVinculado.id,
      alunoNome: alunoVinculado.nome,
      alunoRA: alunoVinculado.ra,
      turma: alunoVinculado.turma || alunoVinculado.sala
    };

    this.definirUsuarioAtivo(responsavel);
    try {
      localStorage.setItem("usuarioLogado", JSON.stringify(responsavel));
    } catch (e) {}

    return responsavel;
  }

  // ====================================================
  // MÓDULO: ARQUITETURA OFFLINE-FIRST E FILA DE SINCRONIZAÇÃO
  // ====================================================

  obterFilaOffline() {
    try {
      const filaLocal = localStorage.getItem("sala_futuro_fila_offline");
      const entregasOff = filaLocal ? JSON.parse(filaLocal) : [];
      const apiOff = obterFilaOperacoesAPI();
      return [...(Array.isArray(entregasOff) ? entregasOff : []), ...apiOff];
    } catch (e) {
      return [];
    }
  }

  salvarEntregaOffline(entrega) {
    try {
      const filaRaw = localStorage.getItem("sala_futuro_fila_offline");
      const fila = filaRaw ? JSON.parse(filaRaw) : [];
      const idx = fila.findIndex((f) => f.id === entrega.id || (f.tarefaId === entrega.tarefaId && f.alunoId === entrega.alunoId));
      if (idx >= 0) {
        fila[idx] = { ...fila[idx], ...entrega, salvoEmOffline: new Date().toISOString() };
      } else {
        fila.push({ ...entrega, salvoEmOffline: new Date().toISOString() });
      }
      localStorage.setItem("sala_futuro_fila_offline", JSON.stringify(fila));
      this.salvarEntregaDocente(entrega);
      return fila;
    } catch (e) {
      console.warn("Erro ao salvar entrega offline:", e);
      return [];
    }
  }

  async sincronizarFilaOffline() {
    let cont = 0;
    try {
      const filaRaw = localStorage.getItem("sala_futuro_fila_offline");
      const fila = filaRaw ? JSON.parse(filaRaw) : [];
      if (Array.isArray(fila) && fila.length > 0) {
        fila.forEach((item) => {
          this.salvarEntregaDocente({ ...item, sincronizado: true });
          cont++;
        });
        localStorage.removeItem("sala_futuro_fila_offline");
      }
    } catch (e) {}

    const resAPI = await processarFilaOperacoesAPI().catch(() => ({ processados: 0, restantes: 0 }));
    if (resAPI.processados > 0) {
      await this.sincronizarComAPI({ forcar: true }).catch(() => {});
    }
    return { total: cont + resAPI.processados, sincronizados: cont + resAPI.processados };
  }

  fazerLogout() {
    this.definirUsuarioAtivo(null);
    try {
      localStorage.removeItem("usuarioLogado");
      localStorage.removeItem("perfilAluno");
      localStorage.removeItem("gestorAtivo");
    } catch (e) {}
    return true;
  }

  // --- USUÁRIO ATIVO ---
  obterUsuarioAtivo() {
    this.carregar();
    return this.dados.usuarioAtivo || null;
  }

  definirUsuarioAtivo(usuario) {
    this.carregar();
    this.dados.usuarioAtivo = usuario;
    this.salvar();
    return usuario;
  }

  // --- XP E PROGRESSO GAMIFICADO (CACHE LOCAL) ---
  adicionarXPAluno(alunoIdOuRA, pontos) {
    this.carregar();
    pontos = Number(pontos) || 0;
    if (pontos === 0) return null;

    let aluno = this.dados.usuarios.find((u) =>
      u.id === alunoIdOuRA ||
      (u.ra && String(u.ra) === String(alunoIdOuRA)) ||
      (this.dados.usuarioAtivo && this.dados.usuarioAtivo.id === alunoIdOuRA)
    );

    if (!aluno && this.dados.usuarioAtivo && (!this.dados.usuarioAtivo.tipo || this.dados.usuarioAtivo.tipo === "aluno")) {
      aluno = this.dados.usuarioAtivo;
    }

    if (aluno) {
      aluno.xp = Math.max(0, (Number(aluno.xp) || 0) + pontos);
      aluno.nivel = Math.max(1, Math.floor(aluno.xp / 100) + 1);

      if (aluno.guilda && this.dados.guildas) {
        const guilda = this.dados.guildas.find((g) =>
          g.nome.toLowerCase() === aluno.guilda.toLowerCase() ||
          g.id === aluno.guilda
        );
        if (guilda) {
          guilda.pontos = Math.max(0, (Number(guilda.pontos) || 0) + pontos);
        }
      }

      if (this.dados.usuarioAtivo && (this.dados.usuarioAtivo.id === aluno.id || this.dados.usuarioAtivo.ra === aluno.ra)) {
        this.dados.usuarioAtivo = { ...this.dados.usuarioAtivo, xp: aluno.xp, nivel: aluno.nivel };
        try {
          localStorage.setItem("usuarioLogado", JSON.stringify(this.dados.usuarioAtivo));
          localStorage.setItem("perfilAluno", JSON.stringify(this.dados.usuarioAtivo));
        } catch (e) {}
      }

      this.salvar();
      return aluno;
    }
    return null;
  }

  // --- REDAÇÕES SP ---
  obterRedacoes(alunoId = null) {
    this.carregar();
    if (!this.dados.redacoes) this.dados.redacoes = [];
    if (!alunoId) return this.dados.redacoes;
    return this.dados.redacoes.filter(r => r.alunoId === alunoId || r.alunoRA === alunoId);
  }

  salvarRedacao(redacao) {
    this.carregar();
    if (!this.dados.redacoes) this.dados.redacoes = [];
    const id = redacao.id || `red_${Date.now()}`;
    const idx = this.dados.redacoes.findIndex(r => r.id === id);
    const registro = {
      data: new Date().toISOString().split("T")[0],
      status: "Aguardando Correção",
      ...redacao,
      id
    };
    if (idx !== -1) {
      this.dados.redacoes[idx] = { ...this.dados.redacoes[idx], ...registro };
    } else {
      this.dados.redacoes.unshift(registro);
    }

    // Registra entrega institucional para visualização de professores e coordenação
    this.salvarEntrega({
      id: `ent_${registro.id}`,
      tarefaId: "tar_redacao_oficial",
      alunoId: registro.alunoId,
      alunoNome: registro.alunoNome,
      turma: registro.turma,
      tarefaTitulo: `Redação: ${registro.titulo || registro.tema}`,
      componente: "Língua Portuguesa",
      data: registro.data,
      status: registro.status,
      nota: registro.nota || null,
      devolutiva: registro.devolutiva || "Aguardando devolutiva pedagógica."
    });

    this.salvar();
    return registro;
  }

  // --- AVISOS E MURAL ---
  obterAvisos(turma = null) {
    this.carregar();
    const lista = this.dados.comunicados || [];
    if (!turma || turma === "TODOS" || turma === "GERAL") return lista;
    const turmaNorm = String(turma).trim().toUpperCase().replace(/[ºª°\s]/g, "");
    return lista.filter(a => {
      const destNorm = String(a.destino || a.turma || "TODOS").trim().toUpperCase().replace(/[ºª°\s]/g, "");
      return destNorm === "TODOS" || destNorm === turmaNorm || destNorm.includes(turmaNorm);
    });
  }

  salvarAviso(aviso) {
    return this.salvarComunicado(aviso);
  }

  // --- CHAMADAS E FREQUÊNCIA ---
  obterChamadas(turma = null) {
    this.carregar();
    if (!this.dados.chamadas) this.dados.chamadas = [];
    if (!turma) return this.dados.chamadas;
    const turmaNorm = String(turma).trim().toUpperCase().replace(/[ºª°\s]/g, "");
    return this.dados.chamadas.filter(c => {
      const cNorm = String(c.turma || "").trim().toUpperCase().replace(/[ºª°\s]/g, "");
      return cNorm === turmaNorm;
    });
  }

  salvarChamada(chamada) {
    this.carregar();
    if (!this.dados.chamadas) this.dados.chamadas = [];
    const id = chamada.id || `cham_${Date.now()}`;
    const idx = this.dados.chamadas.findIndex(c => c.id === id || (c.data === chamada.data && c.turma === chamada.turma && c.disciplina === chamada.disciplina));
    const registro = {
      data: new Date().toISOString().split("T")[0],
      ...chamada,
      id
    };
    if (idx !== -1) {
      this.dados.chamadas[idx] = { ...this.dados.chamadas[idx], ...registro };
    } else {
      this.dados.chamadas.unshift(registro);
    }
    this.salvar();
    return registro;
  }

  // --- MATERIAIS DE APOIO ---
  obterMateriais(turma = null) {
    this.carregar();
    if (!this.dados.materiais) this.dados.materiais = [];
    if (!turma) return this.dados.materiais;
    const turmaNorm = String(turma).trim().toUpperCase().replace(/[ºª°\s]/g, "");
    return this.dados.materiais.filter(m => {
      const mNorm = String(m.turma || "TODOS").trim().toUpperCase().replace(/[ºª°\s]/g, "");
      return mNorm === "TODOS" || mNorm === turmaNorm;
    });
  }

  salvarMaterial(material) {
    this.carregar();
    if (!this.dados.materiais) this.dados.materiais = [];
    const id = material.id || `mat_${Date.now()}`;
    const idx = this.dados.materiais.findIndex(m => m.id === id);
    const registro = {
      data: new Date().toISOString().split("T")[0],
      ...material,
      id
    };
    if (idx !== -1) {
      this.dados.materiais[idx] = { ...this.dados.materiais[idx], ...registro };
    } else {
      this.dados.materiais.unshift(registro);
    }
    this.salvar();
    return registro;
  }

  // --- ALIASES ADICIONAIS ---
  adicionarTarefa(tarefa) {
    return this.salvarTarefa(tarefa);
  }

  avaliarEntrega(entregaId, nota, devolutiva) {
    return this.salvarAvaliacaoDocente({
      id: entregaId,
      nota,
      devolutiva
    });
  }

  // --- EXPORTAR E IMPORTAR BANCO LOCAL ---
  exportarJSON() {
    this.carregar();
    return JSON.stringify(this.dados, null, 2);
  }

  importarJSON(conteudoJSON) {
    try {
      const parsed = typeof conteudoJSON === "string" ? JSON.parse(conteudoJSON) : conteudoJSON;
      if (parsed && typeof parsed === "object") {
        this.dados = {
          ...DADOS_INICIAIS,
          ...parsed,
          versao: DADOS_INICIAIS.versao
        };
        this.salvar();
        return { sucesso: true, mensagem: "Banco local restaurado com sucesso!" };
      }
      throw new Error("Formato inválido de JSON");
    } catch (e) {
      return { sucesso: false, erro: e.message };
    }
  }

  // --- INSTITUIÇÃO & TRANSIÇÃO GRÊMIO AEGRE 2027 ---
  obterInstituicao() {
    this.carregar();
    return {
      ...DADOS_INICIAIS.instituicao,
      ...(this.dados.instituicao || {})
    };
  }

  salvarInstituicao(info) {
    this.carregar();
    this.dados.instituicao = {
      ...DADOS_INICIAIS.instituicao,
      ...(this.dados.instituicao || {}),
      ...info,
      atualizadoEm: new Date().toISOString()
    };
    this.salvar();
    return this.dados.instituicao;
  }

  prepararCicloGremio2027({ zerarEntregas = false, zerarXP = false } = {}) {
    this.carregar();
    const chaveArquivo = "SALA_FUTURO_ARQUIVO_2026_MAURICIO_ANTUNES";
    try {
      localStorage.setItem(chaveArquivo, JSON.stringify({
        arquivadoEm: new Date().toISOString(),
        dados: this.dados
      }));
    } catch (e) {}

    this.dados.instituicao = {
      ...DADOS_INICIAIS.instituicao,
      ...(this.dados.instituicao || {}),
      nomeSistema: "Sala do Futuro Maurício Antunes",
      escola: "E.E. Maurício Antunes",
      anoLetivo: 2027,
      proximoCiclo: 2027,
      gremioResponsavel: "Grêmio Aegre",
      cicloReutilizacaoAtivo: true,
      reutilizadoEm: new Date().toISOString()
    };

    if (zerarEntregas) {
      this.dados.entregas = [];
      this.dados.entregasSP = [];
      this.dados.ocorrencias = [];
      this.dados.chamadas = [];
    }

    if (zerarXP) {
      this.dados.usuarios = (this.dados.usuarios || []).map(u =>
        u.tipo === "aluno" ? { ...u, xp: 100, nivel: 1 } : u
      );
      this.dados.guildas = (this.dados.guildas || []).map(g => ({
        ...g,
        pontos: 0
      }));
    }

    if (!this.dados.comunicados) this.dados.comunicados = [];
    this.dados.comunicados.unshift({
      id: `com_gremio_2027_${Date.now()}`,
      titulo: "🎉 Ciclo 2027 Ativado — Grêmio Aegre na E.E. Maurício Antunes!",
      mensagem: "A plataforma Sala do Futuro Maurício Antunes foi preparada para reutilização em 2027 pelo Grêmio Aegre, mantendo turmas, docentes e atividades interativas.",
      destino: "TODOS",
      autor: "Grêmio Aegre & Direção E.E. Maurício Antunes",
      data: new Date().toISOString().split("T")[0]
    });

    this.salvar();
    return {
      sucesso: true,
      instituicao: this.dados.instituicao,
      arquivoBackup: chaveArquivo
    };
  }

  // --- RESTAURAR DADOS PADRÃO ---
  resetarDados() {
    this.dados = JSON.parse(JSON.stringify(DADOS_INICIAIS));
    this.salvar();
    return this.dados;
  }

  resetarParaPadrao() {
    return this.resetarDados();
  }
}

// Instância global única
const DBLocal = new DBLocalMotor();

if (typeof window !== "undefined") {
  window.DBLocal = DBLocal;
}

export default DBLocal;
export { DBLocal };
