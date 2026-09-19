/**
 * ====================================================
 * SALA DO FUTURO V2 - MOTOR DE BANCO DE DADOS LOCAL (LOCALSTORAGE)
 * Modo Demonstração Institucional 100% Autônomo e Persistente
 * ====================================================
 * Armazena e sincroniza todos os dados da escola localmente no navegador:
 * Estudantes, Salas, Guildas, Tarefas, Entregas, Notas Oficiais e Livro de Ocorrências.
 * Mantém total integração com os modelos do Google Gemini via /api/ai/*.
 */

const CHAVE_STORAGE = "SALA_DO_FUTURO_BANCO_LOCAL_V2";

const DADOS_INICIAIS = {
  versao: "2.5-local-demo",
  atualizadoEm: new Date().toISOString(),
  
  usuarios: [
    {
      id: "aluno_1",
      nome: "Guilherme Santos",
      email: "guilherme.santos@aluno.sp.gov.br",
      ra: "000.123.456-7 SP",
      turma: "8º Ano A",
      sala: "8º Ano A",
      guilda: "Águias da Sabedoria",
      xp: 580,
      nivel: 5,
      tipo: "aluno",
      foto: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=faces"
    },
    {
      id: "aluno_2",
      nome: "Beatriz Lima",
      email: "beatriz.lima@aluno.sp.gov.br",
      ra: "000.234.567-8 SP",
      turma: "8º Ano A",
      sala: "8º Ano A",
      guilda: "Fênix da Criação",
      xp: 640,
      nivel: 6,
      tipo: "aluno",
      foto: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=faces"
    },
    {
      id: "aluno_3",
      nome: "Lucas Martins",
      email: "lucas.martins@aluno.sp.gov.br",
      ra: "000.345.678-9 SP",
      turma: "8º Ano B",
      sala: "8º Ano B",
      guilda: "Sentinelas do Futuro",
      xp: 490,
      nivel: 4,
      tipo: "aluno"
    },
    {
      id: "aluno_4",
      nome: "Mariana Costa",
      email: "mariana.costa@aluno.sp.gov.br",
      ra: "000.456.789-0 SP",
      turma: "8º Ano B",
      sala: "8º Ano B",
      guilda: "Águias da Sabedoria",
      xp: 520,
      nivel: 5,
      tipo: "aluno"
    },
    {
      id: "aluno_5",
      nome: "Rafael Oliveira",
      email: "rafael.oliveira@aluno.sp.gov.br",
      ra: "000.567.890-1 SP",
      turma: "9º Ano A",
      sala: "9º Ano A",
      guilda: "Fênix da Criação",
      xp: 430,
      nivel: 4,
      tipo: "aluno"
    },
    {
      id: "prof_1",
      nome: "Prof. Carlos Eduardo Silva",
      email: "professor@escola.sp.gov.br",
      disciplina: "Matemática",
      cargo: "Docente e Coordenador",
      tipo: "professor"
    },
    {
      id: "adm_1",
      nome: "Direção & Coordenação Escolar",
      email: "gestao@escola.sp.gov.br",
      cargo: "Equipe Gestora SEDUC-SP",
      tipo: "admin"
    }
  ],

  salas: [
    { id: "sala_1", nome: "8º Ano A", ano: "8º Ano", turno: "Manhã", professor: "Prof. Carlos Eduardo Silva", totalAlunos: 32 },
    { id: "sala_2", nome: "8º Ano B", ano: "8º Ano", turno: "Manhã", professor: "Profª Helena Ramos", totalAlunos: 29 },
    { id: "sala_3", nome: "9º Ano A", ano: "9º Ano", turno: "Tarde", professor: "Prof. Marcos Souza", totalAlunos: 31 },
    { id: "sala_4", nome: "1º Ano EM", ano: "1º Ensino Médio", turno: "Manhã", professor: "Profª Juliana Paes", totalAlunos: 35 }
  ],

  guildas: [
    { id: "guilda_1", nome: "Águias da Sabedoria", lema: "Conhecimento que voa alto", cor: "#1d5a9e", icone: "🦅", pontos: 3420, membros: 18 },
    { id: "guilda_2", nome: "Fênix da Criação", lema: "Renascer e inovar sempre", cor: "#ea580c", icone: "🔥", pontos: 3180, membros: 16 },
    { id: "guilda_3", nome: "Sentinelas do Futuro", lema: "União, foco e tecnologia", cor: "#059669", icone: "🛡️", pontos: 2950, membros: 15 }
  ],

  tarefas: [
    {
      id: "tar_1",
      titulo: "Equações do 1º Grau no Cotidiano",
      componente: "Matemática",
      turma: "8º Ano A",
      prazo: "2026-09-25",
      pontosXP: 40,
      status: "ativa",
      descricao: "Resolva os 4 desafios práticos envolvendo proporcionalidade e equações lineares no cotidiano da escola e do comércio local.",
      anexos: []
    },
    {
      id: "tar_2",
      titulo: "Crônica Escolar e Recursos Expressivos",
      componente: "Língua Portuguesa",
      turma: "8º Ano A",
      prazo: "2026-09-28",
      pontosXP: 45,
      status: "ativa",
      descricao: "Produza uma crônica breve sobre um momento marcante do dia a dia escolar utilizando figuras de linguagem como metáfora, personificação e ironia.",
      anexos: []
    },
    {
      id: "tar_3",
      titulo: "Transformações Químicas e Evidências Práticas",
      componente: "Ciências",
      turma: "8º Ano A",
      prazo: "2026-09-30",
      pontosXP: 50,
      status: "ativa",
      descricao: "Descreva a evidência de reação química no experimento com bicarbonato de sódio e vinagre (liberação de CO2, variação de temperatura e coloração).",
      anexos: []
    },
    {
      id: "tar_4",
      titulo: "Revolução Constitucionalista de 1932 em SP",
      componente: "História",
      turma: "8º Ano A",
      prazo: "2026-10-02",
      pontosXP: 40,
      status: "ativa",
      descricao: "Analise cartazes de mobilização popular e cartas históricas de voluntários paulistas durante o movimento cívico de 1932.",
      anexos: []
    },
    {
      id: "tar_5",
      titulo: "Bacias Hidrográficas e Urbanização Paulistana",
      componente: "Geografia",
      turma: "8º Ano A",
      prazo: "2026-10-05",
      pontosXP: 40,
      status: "ativa",
      descricao: "Mapeie os principais afluentes do Rio Tietê e discuta os impactos da impermeabilização do solo nas enchentes urbanas de São Paulo.",
      anexos: []
    },
    {
      id: "tar_6",
      titulo: "Climate Change & Sustainable School Actions",
      componente: "Inglês",
      turma: "8º Ano A",
      prazo: "2026-10-08",
      pontosXP: 35,
      status: "ativa",
      descricao: "Read the article about renewable energy and write a 5-point action plan in English for energy conservation in your school.",
      anexos: []
    },
    {
      id: "tar_7",
      titulo: "Semana de Arte Moderna e Antropofagia Cultural",
      componente: "Arte",
      turma: "8º Ano A",
      prazo: "2026-10-10",
      pontosXP: 35,
      status: "ativa",
      descricao: "Crie um esboço visual ou releitura artística inspirada no Abaporu de Tarsila do Amaral e comente suas cores, linhas e formas.",
      anexos: []
    },
    {
      id: "tar_8",
      titulo: "Educação Financeira: Orçamento Familiar Consciente",
      componente: "Educação Financeira",
      turma: "8º Ano A",
      prazo: "2026-10-12",
      pontosXP: 45,
      status: "ativa",
      descricao: "Elabore uma planilha prática simulada com a regra 50-30-20 (gastos essenciais, desejos e poupança) para uma renda hipotética familiar.",
      anexos: []
    },
    {
      id: "tar_9",
      titulo: "Geometria Espacial: Prismas e Cilindros no Mundo Real",
      componente: "Matemática",
      turma: "8º Ano B",
      prazo: "2026-09-29",
      pontosXP: 45,
      status: "ativa",
      descricao: "Identifique embalagens cilíndricas e prismáticas em sua rotina e calcule suas áreas laterais e capacidades volumétricas aproximadas.",
      anexos: []
    },
    {
      id: "tar_10",
      titulo: "Genética Básica: Leis de Mendel e Hereditariedade",
      componente: "Ciências",
      turma: "9º Ano A",
      prazo: "2026-10-03",
      pontosXP: 50,
      status: "ativa",
      descricao: "Resolva cruzamentos genéticos utilizando o Quadro de Punnett para alelos dominantes e recessivos determinantes de características físicas.",
      anexos: []
    }
  ],

  entregas: [
    {
      id: "ent_1",
      tarefaId: "tar_1",
      alunoId: "aluno_1",
      alunoNome: "Guilherme Santos",
      turma: "8º Ano A",
      data: "2026-09-17",
      status: "Avaliação",
      nota: 9.0,
      devolutiva: "Excelente raciocínio e organização das etapas do cálculo!"
    },
    {
      id: "ent_2",
      tarefaId: "tar_1",
      alunoId: "aluno_2",
      alunoNome: "Beatriz Lima",
      turma: "8º Ano A",
      data: "2026-09-17",
      status: "Avaliação",
      nota: 9.5,
      devolutiva: "Resolução clara e precisa com justificativa completa."
    },
    {
      id: "ent_3",
      tarefaId: "tar_2",
      alunoId: "aluno_1",
      alunoNome: "Guilherme Santos",
      turma: "8º Ano A",
      data: "2026-09-18",
      status: "Avaliação",
      nota: 8.5,
      devolutiva: "Ótima narrativa, personagens expressivos e uso coerente das figuras de linguagem."
    },
    {
      id: "ent_4",
      tarefaId: "tar_3",
      alunoId: "aluno_1",
      alunoNome: "Guilherme Santos",
      turma: "8º Ano A",
      data: "2026-09-18",
      status: "Entregue",
      nota: null,
      devolutiva: "Aguardando devolutiva pedagógica do professor."
    },
    {
      id: "ent_5",
      tarefaId: "tar_2",
      alunoId: "aluno_2",
      alunoNome: "Beatriz Lima",
      turma: "8º Ano A",
      data: "2026-09-18",
      status: "Avaliação",
      nota: 9.0,
      devolutiva: "Sensibilidade admirável e excelente riqueza de vocabulário."
    }
  ],

  entregasSP: [
    {
      id: "esp_1",
      atividadeId: "SP-01",
      titulo: "Álgebra e Proporções Cotidianas",
      componente: "Matemática",
      alunoId: "aluno_1",
      alunoNome: "Guilherme Santos",
      turma: "8º Ano A",
      acertos: 4,
      total: 4,
      data: "2026-09-17",
      status: "Entregue"
    },
    {
      id: "esp_2",
      atividadeId: "SP-02",
      titulo: "Leitura Crítica e Coesão",
      componente: "Língua Portuguesa",
      alunoId: "aluno_2",
      alunoNome: "Beatriz Lima",
      turma: "8º Ano A",
      acertos: 3,
      total: 4,
      data: "2026-09-17",
      status: "Entregue"
    }
  ],

  notas: [
    {
      id: "not_1",
      alunoId: "aluno_1",
      alunoNome: "Guilherme Santos",
      alunoRA: "000.123.456-7 SP",
      turma: "8º Ano A",
      componente: "Matemática",
      bimestre: "1º Bimestre",
      notaProva: 8.5,
      notaTarefas: 9.0,
      notaParticipacao: 9.5,
      media: 8.9,
      situacao: "Aprovado",
      observacoes: "Excelente assiduidade e dedicação contínua às tarefas."
    },
    {
      id: "not_2",
      alunoId: "aluno_1",
      alunoNome: "Guilherme Santos",
      alunoRA: "000.123.456-7 SP",
      turma: "8º Ano A",
      componente: "Língua Portuguesa",
      bimestre: "1º Bimestre",
      notaProva: 8.0,
      notaTarefas: 8.5,
      notaParticipacao: 9.0,
      media: 8.4,
      situacao: "Aprovado",
      observacoes: "Boa leitura, redação e participação nos debates."
    },
    {
      id: "not_3",
      alunoId: "aluno_2",
      alunoNome: "Beatriz Lima",
      alunoRA: "000.234.567-8 SP",
      turma: "8º Ano A",
      componente: "Matemática",
      bimestre: "1º Bimestre",
      notaProva: 9.5,
      notaTarefas: 9.5,
      notaParticipacao: 10.0,
      media: 9.6,
      situacao: "Aprovado",
      observacoes: "Desempenho acadêmico e liderança exemplar."
    },
    {
      id: "not_4",
      alunoId: "aluno_3",
      alunoNome: "Lucas Martins",
      alunoRA: "000.345.678-9 SP",
      turma: "8º Ano B",
      componente: "Matemática",
      bimestre: "1º Bimestre",
      notaProva: 5.5,
      notaTarefas: 6.0,
      notaParticipacao: 7.0,
      media: 6.0,
      situacao: "Aprovado",
      observacoes: "Recomenda-se apoio em resolução de equações e frações."
    },
    {
      id: "not_5",
      alunoId: "aluno_4",
      alunoNome: "Mariana Costa",
      alunoRA: "000.456.789-0 SP",
      turma: "8º Ano B",
      componente: "Ciências",
      bimestre: "1º Bimestre",
      notaProva: 7.5,
      notaTarefas: 8.0,
      notaParticipacao: 8.5,
      media: 7.9,
      situacao: "Aprovado",
      observacoes: "Muito participativa nas aulas práticas do laboratório."
    }
  ],

  ocorrencias: [
    {
      id: "oc_1",
      alunoId: "aluno_3",
      alunoNome: "Lucas Martins",
      alunoRA: "000.345.678-9 SP",
      turma: "8º Ano B",
      data: "2026-09-15",
      gravidade: "Leve",
      tipo: "Atraso no início do período",
      status: "Resolvida",
      descricao: "Estudante chegou após o término do primeiro horário da aula de Matemática.",
      providencias: "Orientado pela equipe de mediação pedagógica quanto ao cumprimento dos horários.",
      registradoPor: "Coordenação Pedagógica"
    },
    {
      id: "oc_2",
      alunoId: "aluno_2",
      alunoNome: "Beatriz Lima",
      alunoRA: "000.234.567-8 SP",
      turma: "8º Ano A",
      data: "2026-09-16",
      gravidade: "Elogio",
      tipo: "Elogio e Mérito Cidadão",
      status: "Arquivada",
      descricao: "Auxiliou colegas com empatia durante a oficina de robótica e tutoria inclusiva.",
      providencias: "Registro em ata de mérito escolar e parabenização pública junto à guilda.",
      registradoPor: "Prof. Carlos Eduardo Silva"
    },
    {
      id: "oc_3",
      alunoId: "aluno_5",
      alunoNome: "Rafael Oliveira",
      alunoRA: "000.567.890-1 SP",
      turma: "9º Ano A",
      data: "2026-09-17",
      gravidade: "Média",
      tipo: "Uso indevido de aparelho celular",
      status: "Em Acompanhamento",
      descricao: "Uso de fones e aparelho durante momento de instrução coletiva sem finalidade pedagógica.",
      providencias: "Notificação registrada no sistema e advertência pedagógica reflexiva.",
      registradoPor: "Gestão Escolar"
    }
  ],

  comunicados: [
    {
      id: "com_1",
      tipo: "Comunica SP",
      titulo: "Reunião Pedagógica Bimestral",
      conteudo: "Convidamos todos os estudantes e familiares para a devolutiva pedagógica e alinhamento das metas de aprendizagem na próxima sexta-feira.",
      mensagem: "Convidamos todos os estudantes e familiares para a devolutiva pedagógica e alinhamento das metas de aprendizagem na próxima sexta-feira.",
      autor: "Coordenação Pedagógica",
      destino: "TODOS",
      data: "2026-09-17"
    },
    {
      id: "com_2",
      tipo: "Aviso da Escola",
      titulo: "Olimpíada de Robótica e Gamificação",
      conteudo: "As inscrições para a Maratona de Guildas e Programação estão abertas. Procure o coordenador da sua guilda.",
      mensagem: "As inscrições para a Maratona de Guildas e Programação estão abertas. Procure o coordenador da sua guilda.",
      autor: "Prof. Carlos Eduardo Silva",
      destino: "8º Ano A",
      data: "2026-09-18"
    }
  ],

  usuarioAtivo: {
    id: "aluno_1",
    nome: "Guilherme Santos",
    email: "guilherme.santos@aluno.sp.gov.br",
    ra: "000.123.456-7 SP",
    turma: "8º Ano A",
    sala: "8º Ano A",
    guilda: "Águias da Sabedoria",
    xp: 580,
    nivel: 5,
    tipo: "aluno"
  }
};

class DBLocalMotor {
  constructor() {
    this.carregar();
  }

  carregar() {
    try {
      const raw = localStorage.getItem(CHAVE_STORAGE);
      if (!raw) {
        this.dados = JSON.parse(JSON.stringify(DADOS_INICIAIS));
        this.salvar();
      } else {
        const parsed = JSON.parse(raw);
        // Garantir retrocompatibilidade com todas as coleções
        this.dados = {
          ...DADOS_INICIAIS,
          ...parsed,
          usuarios: parsed.usuarios?.length ? parsed.usuarios : DADOS_INICIAIS.usuarios,
          salas: parsed.salas?.length ? parsed.salas : DADOS_INICIAIS.salas,
          guildas: parsed.guildas?.length ? parsed.guildas : DADOS_INICIAIS.guildas,
          tarefas: parsed.tarefas || DADOS_INICIAIS.tarefas,
          entregas: parsed.entregas || DADOS_INICIAIS.entregas,
          entregasSP: parsed.entregasSP || DADOS_INICIAIS.entregasSP,
          notas: parsed.notas || DADOS_INICIAIS.notas,
          ocorrencias: parsed.ocorrencias || DADOS_INICIAIS.ocorrencias,
          comunicados: parsed.comunicados || DADOS_INICIAIS.comunicados,
          usuarioAtivo: parsed.usuarioAtivo || DADOS_INICIAIS.usuarioAtivo
        };
      }
    } catch (e) {
      console.warn("Erro ao ler banco local, restaurando dados padrão de demonstração:", e);
      this.dados = JSON.parse(JSON.stringify(DADOS_INICIAIS));
      this.salvar();
    }
  }

  salvar() {
    try {
      this.dados.atualizadoEm = new Date().toISOString();
      localStorage.setItem(CHAVE_STORAGE, JSON.stringify(this.dados));
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
    return registro;
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
    return registro;
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
    return this.dados.trabalhosGuilda || [
      {
        id: "trab_1",
        guildaId: "guilda_1",
        titulo: "Jornal Escolar Digital",
        descricao: "Criação da primeira edição do informativo mensal dos estudantes.",
        status: "Em Andamento",
        prazo: "2026-10-15"
      },
      {
        id: "trab_2",
        guildaId: "guilda_2",
        titulo: "Robô Seguidor de Linha",
        descricao: "Montagem do circuito com sensores ópticos para a feira de ciências.",
        status: "Concluído",
        prazo: "2026-09-20"
      }
    ];
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
    return this.dados.premiacoes || [
      {
        id: "prem_1",
        titulo: "Certificado Mestre do Conhecimento",
        descricao: "Concedido ao atingir 500 pontos em atividades bimestrais.",
        pontosMinimos: 500,
        ativo: true
      },
      {
        id: "prem_2",
        titulo: "Emblema Guardião da Sala",
        descricao: "Reconhecimento por liderança e assiduidade impecável.",
        pontosMinimos: 800,
        ativo: true
      }
    ];
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
  obterOcorrencias() {
    this.carregar();
    return this.dados.ocorrencias;
  }

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

  // --- AUTENTICAÇÃO SIMULADA 100% OFFLINE ---
  autenticarAluno(identificador, senha = "") {
    this.carregar();
    const idLimpo = String(identificador || "").trim().toLowerCase();
    if (!idLimpo) throw new Error("Por favor, informe seu e-mail institucional ou RA.");

    const alunos = this.obterAlunos();
    let encontrado = alunos.find(a => 
      (a.email && a.email.toLowerCase() === idLimpo) ||
      (a.ra && a.ra.toLowerCase().replace(/[^a-z0-9]/g, "") === idLimpo.replace(/[^a-z0-9]/g, "")) ||
      (a.nome && a.nome.toLowerCase() === idLimpo) ||
      (a.id && a.id.toLowerCase() === idLimpo)
    );

    if (!encontrado) {
      // Auto-cadastro local para simulação imediata com qualquer e-mail/RA
      const pedacos = idLimpo.split("@")[0].split(/[._-]/);
      const primeiroNome = pedacos[0] ? pedacos[0].charAt(0).toUpperCase() + pedacos[0].slice(1) : "Estudante";
      const sobrenome = pedacos[1] ? pedacos[1].charAt(0).toUpperCase() + pedacos[1].slice(1) : "Paulista";
      
      encontrado = {
        id: `aluno_${Date.now()}`,
        nome: `${primeiroNome} ${sobrenome}`,
        email: idLimpo.includes("@") ? idLimpo : `${idLimpo}@aluno.sp.gov.br`,
        ra: idLimpo.includes("@") ? `000.${Math.floor(100+Math.random()*900)}.${Math.floor(100+Math.random()*900)}-0 SP` : idLimpo,
        turma: "8º Ano A",
        sala: "8º Ano A",
        guilda: "Águias da Sabedoria",
        xp: 380,
        nivel: 3,
        tipo: "aluno",
        ano: 2026
      };
      this.salvarAluno(encontrado);
    }

    this.definirUsuarioAtivo(encontrado);
    this.salvarPerfilAluno(encontrado);
    try {
      localStorage.setItem("usuarioLogado", JSON.stringify(encontrado));
    } catch (e) {}

    return encontrado;
  }

  autenticarProfessor(email, senha = "") {
    this.carregar();
    const emailLimpo = String(email || "").trim().toLowerCase();
    const usuarios = this.dados.usuarios || [];
    let prof = usuarios.find(u => 
      u.tipo === "professor" && 
      ((u.email && u.email.toLowerCase() === emailLimpo) || (u.nome && u.nome.toLowerCase().includes(emailLimpo)))
    );

    if (!prof) {
      prof = usuarios.find(u => u.tipo === "professor") || {
        id: "prof_1",
        nome: "Prof. Carlos Eduardo Silva",
        email: emailLimpo || "professor@escola.sp.gov.br",
        disciplina: "Matemática",
        cargo: "Docente e Coordenador",
        tipo: "professor"
      };
    }

    this.definirUsuarioAtivo(prof);
    try {
      localStorage.setItem("usuarioLogado", JSON.stringify(prof));
    } catch (e) {}

    return prof;
  }

  autenticarResponsavel(email, senha = "", alunoId = "aluno_1") {
    this.carregar();
    const emailLimpo = String(email || "").trim().toLowerCase();
    const alunos = this.obterAlunos();
    const alunoVinculado = alunos.find(a => a.id === alunoId) || alunos[0];

    const responsavel = {
      id: `resp_${Date.now()}`,
      nome: `Responsável por ${alunoVinculado.nome}`,
      email: emailLimpo || `responsavel.${alunoVinculado.id}@familia.sp.gov.br`,
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

  fazerLogout() {
    this.definirUsuarioAtivo(null);
    try {
      localStorage.removeItem("usuarioLogado");
    } catch (e) {}
    return true;
  }

  // --- USUÁRIO ATIVO ---
  obterUsuarioAtivo() {
    this.carregar();
    return this.dados.usuarioAtivo || this.dados.usuarios[0];
  }

  definirUsuarioAtivo(usuario) {
    this.carregar();
    this.dados.usuarioAtivo = usuario;
    this.salvar();
    return usuario;
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
