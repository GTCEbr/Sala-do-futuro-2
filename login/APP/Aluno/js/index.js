// Sala do Futuro V2
// Area do aluno

/*========================================
VLIBRAS
========================================*/
if (window.VLibras) {
  new window.VLibras.Widget("https://vlibras.gov.br/app");
}

/*========================================
BANCO DE DADOS LOCAL (100% CONECTADO E PERSISTENTE)
========================================*/
import DBLocal from "../../../js/db-local.js";

let usuarioAtual = null;

let perfilAluno = null;

let tarefasCache = [];

let entregasCache = new Map();

let filtroTarefaAtual = "pendentes";


/*========================================
ROTAS
========================================*/

const rotas = {
  login: "../../loginal.html",
  redacaoSP: "Plataformas/redacaosp.html",
  matific: "https://www.matific.com/bra/pt-br/home/",
  ef: "https://www.ef.com.br/",
  elefante: "https://www.elefanteletrado.com.br/"
};


/*========================================
ATALHOS
========================================*/

function $(id) {

  return document.getElementById(id);

}


function normalizarTurma(valor) {

  return String(valor || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");

}


function textoSeguro(valor) {

  return String(valor ?? "")

    .replaceAll("&", "&amp;")

    .replaceAll("<", "&lt;")

    .replaceAll(">", "&gt;")

    .replaceAll('"', "&quot;")

    .replaceAll("'", "&#039;");

}


function dataLegivel(valor) {

  if (!valor) {

    return "Sem prazo";

  }


  if (typeof valor === "string") {

    const partes =
      valor.split("-");


    if (partes.length === 3) {

      return `${partes[2]}/${partes[1]}/${partes[0]}`;

    }

  }


  try {

    const data =
      valor?.toDate
        ? valor.toDate()
        : new Date(valor);


    return data.toLocaleDateString(
      "pt-BR"
    );

  }

  catch {

    return "-";

  }

}


function dataHoraLegivel(valor) {

  try {

    if (!valor) {

      return "";

    }


    const data =
      valor?.toDate
        ? valor.toDate()
        : new Date(valor);


    if (Number.isNaN(data.getTime())) {

      return "";

    }


    return data.toLocaleString(
      "pt-BR",
      {
        dateStyle: "short",
        timeStyle: "short"
      }
    );

  }

  catch {

    return "";

  }

}


function gerarIniciais(nome) {

  const partes =
    String(nome || "Aluno")
      .trim()
      .split(/\s+/)
      .filter(Boolean);


  if (partes.length <= 1) {

    return (
      partes[0] || "AL"
    )
      .substring(0, 2)
      .toUpperCase();

  }


  return (
    partes[0][0] +
    partes[partes.length - 1][0]
  ).toUpperCase();

}


function hojeISO() {

  const agora =
    new Date();


  const ano =
    agora.getFullYear();


  const mes =
    String(
      agora.getMonth() + 1
    ).padStart(2, "0");


  const dia =
    String(
      agora.getDate()
    ).padStart(2, "0");


  return `${ano}-${mes}-${dia}`;

}


/*========================================
MENU
========================================*/

function abrirPagina(nome) {

  document
    .querySelectorAll(".pagina")
    .forEach(pagina => {

      pagina.classList.remove("ativa");

    });


  $("pagina-" + nome)
    ?.classList
    .add("ativa");


  document
    .querySelectorAll(".menu-botao")
    .forEach(botao => {

      botao.classList.remove("ativo");

    });


  document
    .querySelector(
      `[data-pagina="${nome}"]`
    )
    ?.classList
    .add("ativo");


  if (nome === "notas") {

    carregarNotas();

  }


  if (nome === "agenda") {

    carregarAgenda();

  }


  if (nome === "mensagens") {

    carregarMensagens();

  }


  if (nome === "progresso") {
    atualizarProgresso();
  }

  if (nome === "tarefas") {

    renderizarTarefas();

  }

  if (nome === "executar-tarefa") {
    document.querySelector('[data-pagina="tarefas"]')?.classList.add("ativo");
  }


  $("menuLateral")
    ?.classList
    .remove("aberto");


  window.scrollTo({

    top: 0,

    behavior: "smooth"

  });

}


document
  .querySelectorAll("[data-pagina]")
  .forEach(botao => {

    botao.addEventListener(
      "click",
      () => {

        abrirPagina(
          botao.dataset.pagina
        );

      }
    );

  });


document
  .querySelectorAll(
    "[data-abrir-pagina]"
  )
  .forEach(botao => {

    botao.addEventListener(
      "click",
      () => {

        abrirPagina(
          botao.dataset.abrirPagina
        );

      }
    );

  });


$("voltarInicioBtn")
  ?.addEventListener(
    "click",
    () => abrirPagina("inicio")
  );


$("abrirNotasCard")
  ?.addEventListener(
    "click",
    () => abrirPagina("notas")
  );


$("abrirNotificacoesBtn")
  ?.addEventListener(
    "click",
    () => abrirPagina("mensagens")
  );


$("menuMobileBtn")
  ?.addEventListener(
    "click",
    () => {

      $("menuLateral")
        ?.classList
        .toggle("aberto");

    }
  );


/*========================================
LOGIN E PERFIL
========================================*/

async function carregarPerfilAlunoCompleto(user) {
  const usuarioAtivoLocal = DBLocal.obterUsuarioAtivo();

  if (usuarioAtivoLocal && usuarioAtivoLocal.tipo === "aluno") {
    usuarioAtual = {
      uid: usuarioAtivoLocal.id,
      email: usuarioAtivoLocal.email,
      displayName: usuarioAtivoLocal.nome
    };
    perfilAluno = { ...usuarioAtivoLocal };
  } else {
    usuarioAtual = user || {
      uid: "aluno_1",
      email: "guilherme.santos@aluno.sp.gov.br",
      displayName: "Guilherme Santos"
    };

    const alunosLocais = DBLocal.obterAlunos();
    const alunoEncontrado = alunosLocais.find(a => 
      a.id === usuarioAtual.uid || 
      (usuarioAtual.email && a.email && a.email.toLowerCase() === usuarioAtual.email.toLowerCase()) ||
      a.nome.toLowerCase().includes("guilherme")
    ) || alunosLocais[0];

    perfilAluno = {
      id: alunoEncontrado.id,
      nome: alunoEncontrado.nome || "Guilherme Santos",
      email: alunoEncontrado.email || usuarioAtual.email || "aluno@escola.sp.gov.br",
      turma: alunoEncontrado.sala || alunoEncontrado.turma || "8º Ano A",
      sala: alunoEncontrado.sala || alunoEncontrado.turma || "8º Ano A",
      guilda: alunoEncontrado.guilda || "Águias da Sabedoria",
      ra: alunoEncontrado.ra || "000.123.456-7 SP",
      xp: alunoEncontrado.xp || 420,
      nivel: alunoEncontrado.nivel || 4,
      tipo: "aluno"
    };
  }

  try {
    perfilAluno.tipo = "aluno";
    perfilAluno.turma = perfilAluno.turma || perfilAluno.sala || "8º Ano A";
    perfilAluno.sala = perfilAluno.turma;

    atualizarPerfilTela();
    atualizarProgresso();

    await Promise.allSettled([
      carregarTarefas(),
      carregarMensagens(),
      atualizarPublicacaoDiaria()
    ]);
  } catch (erro) {
    console.error("Falha na inicialização local do aluno:", erro);
  }
}

// Inicialização imediata 100% conectada ao Local Storage
carregarPerfilAlunoCompleto(null);
atualizarBarraConectividade();

// Sincronização em tempo real quando houver alterações em outras abas ou telas
window.addEventListener("banco-local-atualizado", () => {
  carregarPerfilAlunoCompleto(null);
  atualizarBarraConectividade();
});


function atualizarPerfilTela() {

  const nome =
    perfilAluno.nome
    || usuarioAtual.displayName
    || "Aluno";


  const email =
    usuarioAtual.email
    || perfilAluno.email
    || "-";


  const turma =
    perfilAluno.turma
    || "Turma não informada";


  const escola =
    perfilAluno.escolaNome
    || perfilAluno.escolaId
    || "Escola não informada";


  const iniciais =
    gerarIniciais(nome);


  const xp =
    Number(
      perfilAluno.xp || 0
    );


  const faltas =
    Number(
      perfilAluno.faltas || 0
    );


  const pares = {

    nomeAluno:
      nome,

    nomeTopo:
      nome,

    turmaAluno:
      turma,

    escolaAluno:
      escola,

    turmaPlataformas:
      "Visualizando " + turma,

    perfilNome:
      nome,

    perfilEmail:
      email,

    perfilTurma:
      turma,

    perfilEscola:
      escola,

    perfilXp:
      xp + " XP",

    carteirinhaNome:
      nome,

    carteirinhaTurma:
      turma,

    carteirinhaEscola:
      escola,

    carteirinhaId:
      "ID: " + usuarioAtual.uid,

    quantidadeFaltas:
      faltas,

    xpHome:
      xp + " XP"

  };


  Object
    .entries(pares)
    .forEach(
      ([id, valor]) => {

        if ($(id)) {

          $(id).textContent =
            valor;

        }

      }
    );


  [
    "avatarTopo",
    "avatarPrincipal",
    "avatarCarteirinha"
  ]
    .forEach(id => {

      if ($(id)) {

        $(id).textContent =
          iniciais;

      }

    });

}


/*=============================================================================
 * PROGRESSÃO, GAMIFICAÇÃO COOPERATIVA E RANKINGS
 * Calcula o nível do estudante, renderiza a guilda e os rankings (turma e geral).
 *============================================================================*/

/**
 * Atualiza os indicadores de nível e XP do estudante, calculando a barra percentual,
 * os pontos da guilda a que pertence e as tabelas de classificação (turma e escola).
 */
function atualizarProgresso() {

  const xp =
    Math.max(
      0,
      Number(
        perfilAluno?.xp || 0
      )
    );


  const porNivel =
    100;


  const nivel =
    Math.floor(
      xp / porNivel
    ) + 1;


  const xpNoNivel =
    xp % porNivel;


  const faltam =
    xpNoNivel === 0
    && xp > 0

      ? porNivel

      : porNivel - xpNoNivel;


  const porcentagem =
    Math.min(
      100,

      Math.max(
        0,
        (
          xpNoNivel
          / porNivel
        ) * 100
      )
    );


  if ($("xpProgresso")) {

    $("xpProgresso")
      .textContent =
      xp;

  }


  if ($("nivelProgresso")) {

    $("nivelProgresso")
      .textContent =
      nivel;

  }


  if ($("proximoNivelProgresso")) {

    $("proximoNivelProgresso")
      .textContent =
      `${faltam} XP`;

  }


  if ($("textoXp")) {

    $("textoXp")
      .textContent =
      `${xpNoNivel} de ${porNivel} XP no nível ${nivel}`;

  }


  if ($("barraXpPreenchida")) {
    $("barraXpPreenchida").style.width = porcentagem + "%";
  }

  // Renderiza Minha Guilda e Rankings (Tarefas SP)
  try {
    const guildas = (typeof DBLocal !== "undefined" && DBLocal.obterGuildas) ? DBLocal.obterGuildas() : [];
    const alunos = (typeof DBLocal !== "undefined" && DBLocal.obterAlunos) ? DBLocal.obterAlunos() : [];
    const nomeGuildaAluno = perfilAluno?.guilda || "Águias da Sabedoria";
    const minhaGuilda = guildas.find(g => (g.nome || "").toLowerCase() === nomeGuildaAluno.toLowerCase()) || guildas[0];

    const elMinhaGuilda = $("conteudoMinhaGuilda");
    if (elMinhaGuilda && minhaGuilda) {
      const membrosGuilda = alunos.filter(a => (a.guilda || "").toLowerCase() === (minhaGuilda.nome || "").toLowerCase());
      elMinhaGuilda.innerHTML = `
        <div style="display:flex; align-items:center; gap:16px; margin-bottom:12px;">
          <div style="font-size:38px; background:${minhaGuilda.cor || '#1d5a9e'}20; border-radius:12px; padding:6px 12px; border:2px solid ${minhaGuilda.cor || '#1d5a9e'}">
            ${minhaGuilda.icone || '🦅'}
          </div>
          <div>
            <h3 style="margin:0; font-size:17px; color:var(--texto-cor, #1e293b);">${minhaGuilda.nome}</h3>
            <p style="margin:3px 0 0 0; color:#64748b; font-size:12px; font-style:italic;">"${minhaGuilda.lema || 'União e sabedoria'}"</p>
          </div>
        </div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:12px;">
          <div style="background:#f1f5f9; padding:8px; border-radius:8px; text-align:center;">
            <small style="color:#64748b; display:block; font-size:11px;">Pontos da Guilda</small>
            <strong style="font-size:18px; color:${minhaGuilda.cor || '#1d5a9e'};">${minhaGuilda.pontos || 0} XP</strong>
          </div>
          <div style="background:#f1f5f9; padding:8px; border-radius:8px; text-align:center;">
            <small style="color:#64748b; display:block; font-size:11px;">Membros Ativos</small>
            <strong style="font-size:18px; color:#1e293b;">${Math.max(membrosGuilda.length, minhaGuilda.membros || 1)}</strong>
          </div>
        </div>
        <p style="font-size:12px; color:#64748b; margin-top:10px; border-top:1px dashed #e2e8f0; padding-top:8px;">
          ⚡ Cada atividade concluída no <strong>Tarefas SP</strong> soma XP diretamente ao placar da sua guilda!
        </p>
      `;
    }

    const elRankingGuildas = $("conteudoRankingGuildas");
    if (elRankingGuildas && guildas.length > 0) {
      const guildasOrdenadas = [...guildas].sort((a, b) => (Number(b.pontos) || 0) - (Number(a.pontos) || 0));
      elRankingGuildas.innerHTML = guildasOrdenadas.map((g, idx) => {
        const medalha = idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`;
        const eMinha = (g.nome || "").toLowerCase() === nomeGuildaAluno.toLowerCase();
        return `
          <div style="display:flex; justify-content:space-between; align-items:center; padding:8px 10px; margin-bottom:6px; border-radius:8px; background:${eMinha ? '#e0f2fe' : '#f8fafc'}; border:1px solid ${eMinha ? '#0284c7' : '#e2e8f0'};">
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="font-size:15px;">${medalha}</span>
              <span style="font-size:18px;">${g.icone || '🛡️'}</span>
              <strong style="font-size:13px; color:#1e293b;">${g.nome}</strong>
              ${eMinha ? '<span style="font-size:10px; background:#0284c7; color:#fff; padding:1px 5px; border-radius:10px; font-weight:bold;">Sua</span>' : ''}
            </div>
            <strong style="color:${g.cor || '#1d5a9e'}; font-size:13px;">${g.pontos || 0} XP</strong>
          </div>
        `;
      }).join("");
    }

    const elTabelaTurma = $("tabelaRankingTurma");
    if (elTabelaTurma && alunos.length > 0) {
      const turmaAluno = normalizarTurma(perfilAluno?.turma);
      const colegas = alunos
        .filter(a => !turmaAluno || normalizarTurma(a.sala || a.turma) === turmaAluno)
        .sort((a, b) => (Number(b.xp) || 0) - (Number(a.xp) || 0));

      elTabelaTurma.innerHTML = colegas.map((col, idx) => {
        const medalha = idx === 0 ? "🥇 1º" : idx === 1 ? "🥈 2º" : idx === 2 ? "🥉 3º" : `${idx + 1}º`;
        const eUsuarioAtual = col.ra === perfilAluno?.ra || col.email === perfilAluno?.email;
        return `
          <tr style="${eUsuarioAtual ? 'background:#e0f2fe; font-weight:bold;' : ''}">
            <td>${medalha}</td>
            <td>${col.nome} ${eUsuarioAtual ? '<span style="color:#0284c7; font-size:11px;">(Você)</span>' : ''}</td>
            <td><span style="display:inline-block; padding:2px 8px; border-radius:6px; background:#f1f5f9; font-size:12px;">${col.guilda || 'Geral'}</span></td>
            <td><strong style="color:#1d5a9e;">${col.xp || 0} XP</strong></td>
          </tr>
        `;
      }).join("");
    }
  } catch (err) {
    console.warn("Aviso ao atualizar rankings na tela do aluno:", err);
  }
}


/*========================================
TAREFAS E ENTREGAS
========================================*/

async function carregarTarefas() {

  if (
    !usuarioAtual
    || !perfilAluno
  ) {

    return;

  }


  try {
    // 1. Busca dados do banco local oficial (DBLocal)
    const tarefasLocais = DBLocal.obterTarefasDocentes();
    const entregasLocais = DBLocal.obterEntregasDocentes();

    entregasCache = new Map();
    entregasLocais.forEach(entrega => {
      if (entrega.tarefaId && (entrega.alunoId === usuarioAtual.uid || !entrega.alunoId || entrega.alunoNome === perfilAluno.nome)) {
        entregasCache.set(entrega.tarefaId, entrega);
      }
    });

    const turmaAluno = normalizarTurma(perfilAluno.turma);
    tarefasCache = [];

    tarefasLocais.forEach(tarefa => {
      const turmaTarefa = normalizarTurma(tarefa.turma);
      const mesmaTurma = !turmaTarefa || turmaTarefa === "TODOS" || turmaTarefa === "GERAL" || turmaTarefa === turmaAluno;
      const ativa = tarefa.ativa !== false;
      if (mesmaTurma && ativa) {
        tarefasCache.push(tarefa);
      }
    });


    tarefasCache.sort(
      (a, b) =>

        String(
          a.prazo || "9999-99-99"
        )
          .localeCompare(
            String(
              b.prazo
              || "9999-99-99"
            )
          )
    );


    const pendentes =
      tarefasCache
        .filter(
          tarefa =>
            !entregasCache.has(
              tarefa.id
            )
        );


    const quantidade =
      pendentes.length;


    [
      "quantidadePendencias",
      "contadorTarefas",
      "contadorTarefasMenu"
    ]
      .forEach(id => {

        if ($(id)) {

          $(id).textContent =
            quantidade;

        }

      });


    if ($("proximaTarefaHome")) {

      $("proximaTarefaHome")
        .textContent =

        pendentes[0]?.titulo
        || "Nenhuma pendência";

    }


    renderizarTarefas();

  }

  catch (erro) {

    console.error(
      "Erro ao carregar tarefas:",
      erro
    );


    if ($("listaTarefas")) {

      $("listaTarefas")
        .innerHTML =

        '<p class="erro-bloco">Erro ao carregar atividades.</p>';

    }

  }

}


function tarefaAtrasada(tarefa) {

  if (
    !tarefa.prazo
    || entregasCache.has(
      tarefa.id
    )
  ) {

    return false;

  }


  return tarefa.prazo < hojeISO();

}


let tarefaEmExecucao = null;
let questaoAtualIndex = 0;
let respostasTarefaAtual = {};
let modoRevisaoGabarito = false;

function obterQuestoesTarefa(tarefa) {
  if (tarefa && Array.isArray(tarefa.questoes) && tarefa.questoes.length > 0) {
    return tarefa.questoes;
  }

  // Se houver alternativas no próprio objeto raiz da tarefa
  if (tarefa && Array.isArray(tarefa.alternativas) && tarefa.alternativas.length > 0) {
    return [
      {
        id: "q1",
        tipo: "multiplaEscolha",
        enunciado: tarefa.enunciado || tarefa.descricao || "Assinale a alternativa correta:",
        alternativas: tarefa.alternativas,
        respostaCorreta: tarefa.respostaCorreta || (tarefa.alternativas.find(a => a.correta)?.id) || "a",
        pontos: Number(tarefa.pontosXP || tarefa.xp || 10),
        dica: tarefa.dicaPedagogica || tarefa.acessibilidade || "Leia com atenção o enunciado e elimine as opções incorretas.",
        explicacao: tarefa.explicacao || "Resposta oficial validada pelo currículo pedagógico."
      }
    ];
  }

  // Gera conjunto pedagógico estruturado caso a tarefa seja livre
  const titulo = tarefa?.titulo || "Atividade Escolar";
  const desc = tarefa?.descricao || "Resolva os exercícios propostos.";
  const comp = tarefa?.componente || "Geral";
  const xpTotal = Number(tarefa?.pontosXP || tarefa?.xp || 30);
  const pts = Math.max(5, Math.floor(xpTotal / 4));

  return [
    {
      id: "q1",
      tipo: "lacuna",
      enunciado: `Complete a afirmação conceitual sobre ${comp}:`,
      textoAntes: `No estudo prático de ${titulo}, a compreensão dos princípios fundamentais é`,
      textoDepois: `para solucionar os problemas propostos em aula.`,
      opcoes: ["essencial e determinante", "dispensável", "secundária", "irrelevante"],
      respostaCorreta: "essencial e determinante",
      pontos: pts,
      dica: "Pense na importância da base teórica para a prática pedagógica.",
      explicacao: "A base conceitual sólida permite a transferência do aprendizado para situações-problema complexas."
    },
    {
      id: "q2",
      tipo: "multiplaEscolha",
      enunciado: `Considerando o tema "${titulo}", qual é o objetivo pedagógico central desta atividade?`,
      alternativas: [
        { id: "a", texto: `Desenvolver competências e habilidades curriculares de ${comp} por meio da investigação e prática.` },
        { id: "b", texto: "Apenas memorizar fórmulas ou datas sem aplicabilidade prática." },
        { id: "c", texto: "Realizar leituras sem conexão com o cotidiano da comunidade escolar." },
        { id: "d", texto: "Substituir o trabalho colaborativo por exercícios puramente repetitivos." }
      ],
      respostaCorreta: "a",
      pontos: pts,
      dica: "O Currículo Paulista prioriza o protagonismo e o desenvolvimento de competências reflexivas.",
      explicacao: "O aprendizado significativo foca no desenvolvimento de competências duráveis e na capacidade crítica de resolução de problemas."
    },
    {
      id: "q3",
      tipo: "lacuna",
      enunciado: "Selecione o elemento de planejamento metodológico mais adequado:",
      textoAntes: "Ao analisar a proposta de trabalho,",
      textoDepois: "organizar as etapas de resolução antes de formular a conclusão.",
      opcoes: ["é fundamental", "é proibido", "não é recomendado", "é indiferente"],
      respostaCorreta: "é fundamental",
      pontos: pts,
      dica: "O planejamento prévio organiza o raciocínio investigativo.",
      explicacao: "A organização sistemática do método científico e da resolução de problemas previne equívocos e otimiza o tempo."
    },
    {
      id: "q4",
      tipo: "dissertativa",
      enunciado: `Com base em sua análise sobre "${titulo}" (${desc}), redija uma síntese explicativa (de 3 a 5 linhas) destacando as principais conclusões e aprendizados obtidos:`,
      criterios: "Pertinência ao tema, clareza expositiva e vocabulário formal adequado.",
      pontos: pts,
      dica: "Aborde o conceito principal trabalhado e cite um exemplo concreto de aplicação no cotidiano escolar.",
      explicacao: "A reflexão dissertativa consolida o raciocínio autônomo e a capacidade argumentativa do estudante."
    }
  ];
}

/*=============================================================================
 * MÓDULO DE OPERAÇÃO OFFLINE-FIRST E SINCRONIZAÇÃO RESILIENTE
 * Permite que o estudante resolva tarefas curriculares mesmo sem conexão à rede.
 * As entregas são enfileiradas localmente e transmitidas automaticamente ao reconectar.
 *============================================================================*/

/**
 * Flag booleana para simulação do modo offline em demonstrações presenciais.
 * @type {boolean}
 */
let modoOfflineSimulado = false;

/**
 * Verifica se a aplicação possui conectividade ativa com a internet.
 * Considera tanto o status nativo da API navigator.onLine quanto a simulação manual.
 * @returns {boolean} True se a aplicação estiver operando online.
 */
function estaOnline() {
  return (!modoOfflineSimulado) && (typeof navigator !== "undefined" ? navigator.onLine : true);
}

/**
 * Atualiza visualmente a barra superior de conectividade do estudante.
 * Exibe o status da rede (verde/amarelo), contador da fila e botões de ação offline.
 */
function atualizarBarraConectividade() {
  const ponto = $("pontoRedeAluno");
  const textoStatus = $("textoStatusRedeAluno");
  const badgeFila = $("badgeFilaOfflineAluno");
  const btnSync = $("btnSincronizarFilaManual");
  const contBtnSync = $("contBtnSync");
  const contFila = $("contFilaOffline");
  const btnToggle = $("btnToggleModoOffline");
  const bannerCmsp = $("bannerCmspOffline");

  const online = estaOnline();
  const fila = (typeof DBLocal !== "undefined" && DBLocal.obterFilaOffline) ? DBLocal.obterFilaOffline() : [];
  const qtdFila = fila.length;

  // Atualiza ponto indicador visual (verde = online, amarelo = offline)
  if (ponto) {
    ponto.style.background = online ? "#10b981" : "#f59e0b";
    ponto.style.boxShadow = online ? "0 0 0 3px rgba(16,185,129,0.2)" : "0 0 0 3px rgba(245,158,11,0.2)";
  }

  // Texto explicativo do status atual
  if (textoStatus) {
    if (online) {
      textoStatus.textContent = "Rede Conectada (Online)";
      textoStatus.style.color = "#0f172a";
    } else {
      textoStatus.textContent = modoOfflineSimulado 
        ? "Modo Offline Ativo (Simulado para Demonstração)" 
        : "Sem Conexão à Internet (Modo Offline Ativo)";
      textoStatus.style.color = "#b45309";
    }
  }

  // Contador de tarefas pendentes na fila de transmissão
  if (badgeFila) {
    badgeFila.textContent = qtdFila === 1 ? "1 tarefa na fila de sync" : `${qtdFila} tarefas na fila de sync`;
    badgeFila.style.background = qtdFila > 0 ? "#fef3c7" : "#f1f5f9";
    badgeFila.style.color = qtdFila > 0 ? "#92400e" : "#475569";
    badgeFila.style.fontWeight = qtdFila > 0 ? "700" : "600";
  }

  if (contFila) contFila.textContent = qtdFila;
  if (contBtnSync) contBtnSync.textContent = qtdFila;

  // Botão manual de sincronização (visível apenas quando há itens e a rede está online)
  if (btnSync) {
    btnSync.style.display = (qtdFila > 0 && online) ? "inline-flex" : "none";
  }

  // Alternador de estado do botão de simulação
  if (btnToggle) {
    if (modoOfflineSimulado) {
      btnToggle.innerHTML = "<span>🟢</span> Voltar ao Modo Online";
      btnToggle.style.background = "#dcfce7";
      btnToggle.style.borderColor = "#86efac";
      btnToggle.style.color = "#166534";
    } else {
      btnToggle.innerHTML = "<span>📡</span> Simular Modo Offline";
      btnToggle.style.background = "#eff6ff";
      btnToggle.style.borderColor = "#93c5fd";
      btnToggle.style.color = "#1d4ed8";
    }
  }

  // Banner explicativo exibido dentro do runner de atividades durante modo offline
  if (bannerCmsp) {
    bannerCmsp.style.display = online ? "none" : "flex";
  }
}

// Ouvintes nativos do navegador para detecção automática de reconexão
window.addEventListener("online", () => {
  atualizarBarraConectividade();
  sincronizarFilaAutomaticamente();
});

window.addEventListener("offline", () => {
  atualizarBarraConectividade();
});

// Manipulador do botão de simulação offline (essencial para bancas presenciais)
$("btnToggleModoOffline")?.addEventListener("click", () => {
  modoOfflineSimulado = !modoOfflineSimulado;
  atualizarBarraConectividade();
  renderizarTarefas();

  if (modoOfflineSimulado) {
    alert("📡 Modo Offline ATIVADO!\n\nO sistema do estudante agora está operando sem sinal de internet.\n\nVocê pode abrir qualquer atividade, responder as questões, ver gabaritos, acompanhar o boletim e carteirinha: tudo continua funcionando direto no seu dispositivo!");
  } else {
    alert("🟢 Modo Online RESTABELECIDO!\n\nConexão restabelecida. O sistema está verificando a fila de tarefas realizadas offline para sincronização...");
    sincronizarFilaAutomaticamente();
  }
});

// Manipulador para download antecipado de todas as atividades no armazenamento local do dispositivo
$("btnBaixarPacoteOffline")?.addEventListener("click", async () => {
  const btn = $("btnBaixarPacoteOffline");
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = "<span>⏳</span> Baixando pacote...";
  }

  try {
    await carregarTarefas();
    const todasTarefas = DBLocal.obterTarefasDocentes();
    const entregas = DBLocal.obterEntregasDocentes();
    localStorage.setItem("pacote_offline_aluno", JSON.stringify({
      tarefas: todasTarefas,
      entregas: entregas,
      baixadoEm: new Date().toISOString()
    }));

    setTimeout(() => {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = "<span>📥</span> Baixar Tarefas Offline";
      }
      alert(`📦 Pacote de Atividades Baixado com Sucesso!\n\nForam armazenadas ${todasTarefas.length} atividades interativas no armazenamento local do seu dispositivo.\n\nVocê pode estudar, responder exercícios e acumular XP mesmo sem nenhum sinal de Wi-Fi ou dados móveis.`);
    }, 500);
  } catch (e) {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = "<span>📥</span> Baixar Tarefas Offline";
    }
    alert("Pacote offline pronto e disponível.");
  }
});

// Disparo manual de sincronização pelo estudante
$("btnSincronizarFilaManual")?.addEventListener("click", () => {
  sincronizarFilaAutomaticamente(true);
});

/**
 * Transmite todas as entregas armazenadas na fila offline para o banco central do colégio.
 * @param {boolean} [manual=false] - Indica se o disparo foi por clique direto do aluno.
 */
function sincronizarFilaAutomaticamente(manual = false) {
  if (!estaOnline()) return;

  const resultado = (typeof DBLocal !== "undefined" && DBLocal.sincronizarFilaOffline) 
    ? DBLocal.sincronizarFilaOffline() 
    : { total: 0, sincronizados: 0 };

  atualizarBarraConectividade();
  renderizarTarefas();

  if (resultado.sincronizados > 0) {
    alert(`🚀 Sincronização Concluída!\n\n${resultado.sincronizados} atividade(s) realizada(s) offline foram transmitidas com sucesso para o diário de classe do professor e consolidadas no boletim escolar.`);
  } else if (manual) {
    alert("Todas as suas atividades já estão 100% sincronizadas com o banco escolar.");
  }
}

function renderizarTarefas() {
  const lista = $("listaTarefas");
  if (!lista) return;

  const filaOffline = (typeof DBLocal !== "undefined" && DBLocal.obterFilaOffline) ? DBLocal.obterFilaOffline() : [];
  const idsFila = new Set(filaOffline.map(f => f.tarefaId));

  let itens = tarefasCache;

  if (filtroTarefaAtual === "pendentes") {
    itens = tarefasCache.filter(t => !entregasCache.has(t.id));
  } else if (filtroTarefaAtual === "entregues") {
    itens = tarefasCache.filter(t => entregasCache.has(t.id));
  } else if (filtroTarefaAtual === "offline") {
    itens = tarefasCache; // Todas as tarefas estão disponíveis no cache offline
  } else if (filtroTarefaAtual === "fila") {
    itens = tarefasCache.filter(t => idsFila.has(t.id));
  }

  // Atualiza badge de contagem da fila no filtro
  const contFila = $("contFilaOffline");
  if (contFila) contFila.textContent = idsFila.size;

  if (!itens.length) {
    lista.innerHTML = '<p class="vazio">Nenhuma atividade nesta categoria.</p>';
    return;
  }

  lista.innerHTML = itens.map(tarefa => {
    const entrega = entregasCache.get(tarefa.id);
    const entregue = Boolean(entrega);
    const naFila = idsFila.has(tarefa.id);
    const atraso = tarefaAtrasada(tarefa);
    const descricao = tarefa.descricao || "Sem descrição adicional.";
    const questoes = obterQuestoesTarefa(tarefa);
    const qtdQuestoes = questoes.length;
    const componente = tarefa.componente || "Geral";
    const xp = Number(tarefa.pontosXP || tarefa.xp || 30);

    return `
      <article class="tarefa-card" data-card-id="${textoSeguro(tarefa.id)}">
        <div class="tarefa-topo">
          <div>
            <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 6px;">
              <span class="cmsp-badge disciplina">${textoSeguro(componente)}</span>
              <span class="cmsp-badge turma">${textoSeguro(tarefa.turma || perfilAluno?.turma || "Geral")}</span>
            </div>
            <h2>${textoSeguro(tarefa.titulo || "Atividade")}</h2>
            <p>${textoSeguro(descricao)}</p>
          </div>

          <div style="display:flex; flex-direction:column; align-items:flex-end; gap:4px;">
            <span class="etiqueta ${entregue ? "ok" : atraso ? "atrasada" : ""}">
              ${entregue ? "Entregue" : atraso ? "Prazo encerrado" : "Pendente"}
            </span>
            ${naFila ? `
              <span class="etiqueta" style="background:#fef3c7; color:#92400e; font-weight:bold; font-size:11px;">
                ⏳ Fila Offline (Sync pendente)
              </span>
            ` : ''}
          </div>
        </div>

        <div class="tarefa-meta">
          <span class="etiqueta">${xp} XP</span>
          <span class="etiqueta">Prazo: ${textoSeguro(dataLegivel(tarefa.prazo))}</span>
          <span class="etiqueta">${qtdQuestoes} ${qtdQuestoes === 1 ? "questão" : "questões"} interativas</span>
          <span class="etiqueta" style="background:#e0f2fe; color:#0369a1; font-weight:600;">💾 Disponível Offline</span>
        </div>

        <div class="tarefa-acoes-rodape">
          ${entregue ? `
            <div class="tarefa-status-entregue">
              <span>✓</span>
              <span>Atividade concluída ${entrega.acertos ? `• Acertos: ${textoSeguro(entrega.acertos)}` : ""}</span>
            </div>
            <button class="cmsp-btn-revisar" type="button" data-revisar-id="${textoSeguro(tarefa.id)}">
              <span>👁️</span> Ver Gabarito & Respostas
            </button>
          ` : `
            <span style="font-size: 13px; color: #64748b;">
              Padrão CMSP • Interatividade com seleção, lacunas e múltipla escolha
            </span>
            <button class="cmsp-btn-iniciar" type="button" data-iniciar-id="${textoSeguro(tarefa.id)}">
              <span>▶</span> Iniciar Atividade (${qtdQuestoes} ${qtdQuestoes === 1 ? "questão" : "questões"})
            </button>
          `}
        </div>
      </article>
    `;
  }).join("");

  // Eventos de clique para iniciar ou revisar tarefas
  lista.querySelectorAll("[data-iniciar-id]").forEach(btn => {
    btn.addEventListener("click", () => {
      iniciarAtividadeCMSP(btn.dataset.iniciarId, false);
    });
  });

  lista.querySelectorAll("[data-revisar-id]").forEach(btn => {
    btn.addEventListener("click", () => {
      iniciarAtividadeCMSP(btn.dataset.revisarId, true);
    });
  });
}

function iniciarAtividadeCMSP(tarefaId, forcarRevisao = false) {
  let tarefa = tarefasCache.find(t => t.id === tarefaId);
  if (!tarefa) {
    const locais = DBLocal.obterTarefasDocentes();
    tarefa = locais.find(t => t.id === tarefaId);
  }
  if (!tarefa) return;

  tarefaEmExecucao = tarefa;
  questaoAtualIndex = 0;
  respostasTarefaAtual = {};

  const entrega = entregasCache.get(tarefa.id);
  modoRevisaoGabarito = forcarRevisao || Boolean(entrega);

  if (entrega && entrega.respostas) {
    respostasTarefaAtual = { ...entrega.respostas };
  } else if (entrega && entrega.resposta) {
    respostasTarefaAtual = { 0: entrega.resposta };
  }

  // Preenche dados do topo da tarefa
  if ($("cmspTitulo")) $("cmspTitulo").textContent = tarefa.titulo || "Atividade CMSP";
  if ($("cmspDescricao")) $("cmspDescricao").textContent = tarefa.descricao || "Responda às questões com atenção.";
  if ($("cmspComponente")) $("cmspComponente").textContent = tarefa.componente || "Componente Curricular";
  if ($("cmspTurma")) $("cmspTurma").textContent = tarefa.turma || perfilAluno?.turma || "Turma";
  if ($("cmspXp")) $("cmspXp").textContent = `${Number(tarefa.pontosXP || tarefa.xp || 30)} XP`;
  if ($("cmspPrazo")) $("cmspPrazo").textContent = `Prazo: ${dataLegivel(tarefa.prazo)}`;

  // Botão voltar para lista de atividades
  if ($("cmspBtnVoltar")) {
    $("cmspBtnVoltar").onclick = () => {
      abrirPagina("tarefas");
    };
  }

  // Abre a página do runner
  abrirPagina("executar-tarefa");

  // Alerta de modo offline no runner
  const eOffline = (!estaOnline());
  if ($("bannerCmspOffline")) {
    $("bannerCmspOffline").style.display = eOffline ? "flex" : "none";
  }

  // Alterna views
  if (modoRevisaoGabarito) {
    if ($("cmspContainerResultado")) $("cmspContainerResultado").style.display = "block";
    if ($("cmspContainerQuestao")) $("cmspContainerQuestao").style.display = "block";
    renderizarReguaCMSP();
    renderizarQuestaoAtivaCMSP();
    renderizarResultadoCMSP(entrega || { acertos: "Gabarito Oficial", nota: 10, xpGanha: tarefa.pontosXP || 30 });
  } else {
    if ($("cmspContainerResultado")) $("cmspContainerResultado").style.display = "none";
    if ($("cmspContainerQuestao")) $("cmspContainerQuestao").style.display = "block";
    renderizarReguaCMSP();
    renderizarQuestaoAtivaCMSP();
  }
}

function renderizarReguaCMSP() {
  const regua = $("cmspReguaQuestoes");
  const progressoTexto = $("cmspProgressoTexto");
  if (!regua || !tarefaEmExecucao) return;

  const questoes = obterQuestoesTarefa(tarefaEmExecucao);
  const total = questoes.length;

  const respondidas = questoes.filter((q, i) => {
    const val = respostasTarefaAtual[i];
    return val !== undefined && val !== null && String(val).trim() !== "";
  }).length;

  if (progressoTexto) {
    progressoTexto.textContent = `${respondidas} de ${total} respondidas`;
  }

  regua.innerHTML = questoes.map((q, i) => {
    const respondida = respostasTarefaAtual[i] !== undefined && respostasTarefaAtual[i] !== null && String(respostasTarefaAtual[i]).trim() !== "";
    const ativa = i === questaoAtualIndex;
    const classeAtiva = ativa ? "ativa" : "";
    const classeRespondida = respondida ? "respondida" : "";
    const numeroFormatado = String(i + 1).padStart(2, "0");

    return `
      <button
        type="button"
        class="cmsp-regua-item ${classeAtiva} ${classeRespondida}"
        data-questao-indice="${i}"
        title="Questão ${numeroFormatado} - ${respondida ? "Respondida" : "Pendente"}"
        aria-selected="${ativa ? "true" : "false"}"
      >
        ${numeroFormatado}
      </button>
    `;
  }).join("");

  regua.querySelectorAll("[data-questao-indice]").forEach(btn => {
    btn.addEventListener("click", () => {
      const idx = Number(btn.dataset.questaoIndice);
      if (!isNaN(idx) && idx >= 0 && idx < total) {
        questaoAtualIndex = idx;
        renderizarReguaCMSP();
        renderizarQuestaoAtivaCMSP();
      }
    });
  });
}

function renderizarQuestaoAtivaCMSP() {
  const container = $("cmspContainerQuestao");
  if (!container || !tarefaEmExecucao) return;

  const questoes = obterQuestoesTarefa(tarefaEmExecucao);
  const total = questoes.length;
  if (questaoAtualIndex < 0 || questaoAtualIndex >= total) questaoAtualIndex = 0;

  const q = questoes[questaoAtualIndex];
  const respSalva = respostasTarefaAtual[questaoAtualIndex] ?? "";
  const numeroFormatado = String(questaoAtualIndex + 1).padStart(2, "0");
  const totalFormatado = String(total).padStart(2, "0");
  const pontos = q.pontos || 10;

  // Renderiza corpo da questão conforme o tipo
  let conteudoInterativoHtml = "";

  if (q.tipo === "lacuna") {
    // Dropdown interativo inline (exatamente como na imagem!)
    const opcoes = q.opcoes || [];
    const selectOptionsHtml = `
      <option value="">-- Selecione uma opção --</option>
      ${opcoes.map(op => `
        <option value="${textoSeguro(op)}" ${respSalva === op ? "selected" : ""}>
          ${textoSeguro(op)}
        </option>
      `).join("")}
    `;

    conteudoInterativoHtml = `
      <div class="cmsp-frase-lacuna-box">
        <span>${textoSeguro(q.textoAntes || "")}</span>
        <select class="cmsp-dropdown-lacuna ${respSalva ? "selecionado" : ""}" id="cmspDropdownLacuna" aria-label="Selecione a resposta para a lacuna">
          ${selectOptionsHtml}
        </select>
        <span>${textoSeguro(q.textoDepois || "")}</span>
      </div>
    `;
  } else if (q.tipo === "multiplaEscolha") {
    // Alternativas estruturadas A, B, C, D
    const alternativas = q.alternativas || [];
    conteudoInterativoHtml = `
      <div class="cmsp-alternativas-lista">
        ${alternativas.map(alt => {
          const letra = (alt.id || "A").toUpperCase();
          const selecionada = respSalva === alt.id;
          return `
            <div class="cmsp-alternativa-item ${selecionada ? "selecionada" : ""}" data-alt-id="${textoSeguro(alt.id)}" role="button" tabindex="0">
              <div class="cmsp-alt-letra">${letra}</div>
              <div class="cmsp-alt-texto">${textoSeguro(alt.texto || "")}</div>
            </div>
          `;
        }).join("")}
      </div>
    `;
  } else {
    // Dissertativa
    conteudoInterativoHtml = `
      <div class="cmsp-dissertativa-wrap">
        <textarea
          class="cmsp-dissertativa-input"
          id="cmspDissertativaInput"
          placeholder="Digite sua resposta estruturada com base nas orientações pedagógicas..."
          maxlength="2000"
        >${textoSeguro(respSalva)}</textarea>
        <div class="cmsp-caracteres-info">
          <span id="cmspCharCount">${String(respSalva).length}</span> / 2000 caracteres
        </div>
      </div>
    `;
  }

  // Dica pedagógica e acessibilidade
  let dicaHtml = "";
  if (q.dica || q.acessibilidade) {
    const textoDica = q.dica || q.acessibilidade;
    dicaHtml = `
      <div class="cmsp-dica-container">
        <button type="button" class="cmsp-btn-dica" id="cmspBtnToggleDica">
          <span>💡</span> Dica de estudo / Acessibilidade
        </button>
        <div class="cmsp-dica-texto" id="cmspDicaTexto" style="display: none;">
          ${textoSeguro(textoDica)}
        </div>
      </div>
    `;
  }

  // Se estiver em modo de revisão, exibe feedback pedagógico imediato
  let feedbackRevisaoHtml = "";
  if (modoRevisaoGabarito) {
    const corretaOficial = q.respostaCorreta || (q.alternativas?.find(a => a.correta)?.id) || "";
    let acertou = false;
    if (q.tipo === "lacuna") {
      acertou = String(respSalva).trim().toLowerCase() === String(corretaOficial).trim().toLowerCase();
    } else if (q.tipo === "multiplaEscolha") {
      acertou = String(respSalva).toLowerCase() === String(corretaOficial).toLowerCase();
    } else {
      acertou = Boolean(respSalva && String(respSalva).length >= 5);
    }

    feedbackRevisaoHtml = `
      <div style="margin: 18px 0; padding: 14px 18px; border-radius: 12px; background: ${acertou ? "#ecfdf5" : "#fee2e2"}; border-left: 5px solid ${acertou ? "#10b981" : "#ef4444"};">
        <strong style="color: ${acertou ? "#065f46" : "#991b1b"}; font-size: 15px;">
          ${acertou ? "✓ Você acertou esta questão!" : "✗ Resposta incorreta"}
        </strong>
        <p style="margin: 6px 0; font-size: 13px; color: #334155;">
          <strong>Sua resposta:</strong> ${textoSeguro(respSalva || "(Em branco)")}
          ${!acertou && corretaOficial ? ` | <strong>Resposta correta:</strong> ${textoSeguro(corretaOficial)}` : ""}
        </p>
        ${q.explicacao ? `
          <div style="margin-top: 8px; font-size: 13px; color: #475569; background: white; padding: 10px 14px; border-radius: 8px;">
            <strong>Gabarito Comentado SEDUC-SP:</strong> ${textoSeguro(q.explicacao)}
          </div>
        ` : ""}
      </div>
    `;
  }

  container.innerHTML = `
    <article class="cmsp-card-questao">
      <!-- Topo verde estilo CMSP -->
      <div class="cmsp-cabecalho-verde">
        <div class="cmsp-contador-questao">
          <span>Questão ${numeroFormatado} de ${totalFormatado}</span>
        </div>
        <div class="cmsp-badge-pontos">
          ${pontos} pontos
        </div>
      </div>

      <!-- Corpo da questão -->
      <div class="cmsp-corpo-questao">
        <div class="cmsp-meta-questao">
          <span class="cmsp-tag-habilidade">${textoSeguro(tarefaEmExecucao.componente || "Componente Curricular")}</span>
          ${q.habilidadeBNCC || tarefaEmExecucao.habilidadeBNCC ? `
            <span class="cmsp-tag-habilidade">${textoSeguro(q.habilidadeBNCC || tarefaEmExecucao.habilidadeBNCC)}</span>
          ` : ""}
        </div>

        <div class="cmsp-enunciado">
          ${textoSeguro(q.enunciado || "")}
        </div>

        ${conteudoInterativoHtml}
        ${dicaHtml}
        ${feedbackRevisaoHtml}
      </div>

      <!-- Rodapé de ações -->
      <div class="cmsp-rodape-acoes">
        <div>
          ${!modoRevisaoGabarito ? `
            <button type="button" class="cmsp-btn-limpar" id="cmspBtnLimpar">
              <span>🗑️</span> Limpar resposta
            </button>
          ` : `
            <button type="button" class="cmsp-btn-limpar" id="cmspBtnVerGabaritoGeral">
              <span>📊</span> Ver Resumo da Nota
            </button>
          `}
        </div>

        <div class="cmsp-acoes-navegacao">
          <button type="button" class="cmsp-btn-anterior" id="cmspBtnAnterior" ${questaoAtualIndex === 0 ? "disabled" : ""}>
            ‹ Anterior
          </button>

          ${questaoAtualIndex < total - 1 ? `
            <button type="button" class="cmsp-btn-proxima" id="cmspBtnProxima">
              Próxima ›
            </button>
          ` : ""}

          ${!modoRevisaoGabarito ? `
            <button type="button" class="cmsp-btn-finalizar" id="cmspBtnFinalizar">
              <span>✓</span> Finalizar e Entregar
            </button>
          ` : ""}
        </div>
      </div>
    </article>
  `;

  // Listeners de Interação

  // Dropdown de Lacuna
  const selectLacuna = $("cmspDropdownLacuna");
  if (selectLacuna) {
    selectLacuna.addEventListener("change", (e) => {
      const valor = e.target.value;
      if (valor) {
        respostasTarefaAtual[questaoAtualIndex] = valor;
        selectLacuna.classList.add("selecionado");
      } else {
        delete respostasTarefaAtual[questaoAtualIndex];
        selectLacuna.classList.remove("selecionado");
      }
      renderizarReguaCMSP();
    });
  }

  // Alternativas Múltipla Escolha
  container.querySelectorAll(".cmsp-alternativa-item").forEach(item => {
    item.addEventListener("click", () => {
      if (modoRevisaoGabarito) return;
      const altId = item.dataset.altId;
      respostasTarefaAtual[questaoAtualIndex] = altId;
      container.querySelectorAll(".cmsp-alternativa-item").forEach(el => el.classList.remove("selecionada"));
      item.classList.add("selecionada");
      renderizarReguaCMSP();
    });
  });

  // Dissertativa
  const inputDissertativa = $("cmspDissertativaInput");
  if (inputDissertativa) {
    inputDissertativa.addEventListener("input", (e) => {
      const val = e.target.value;
      respostasTarefaAtual[questaoAtualIndex] = val;
      const charCount = $("cmspCharCount");
      if (charCount) charCount.textContent = val.length;
      renderizarReguaCMSP();
    });
  }

  // Toggle Dica
  const btnDica = $("cmspBtnToggleDica");
  const textoDicaEl = $("cmspDicaTexto");
  if (btnDica && textoDicaEl) {
    btnDica.addEventListener("click", () => {
      const estaOculto = textoDicaEl.style.display === "none";
      textoDicaEl.style.display = estaOculto ? "block" : "none";
      btnDica.innerHTML = estaOculto ? "<span>💡</span> Ocultar dica" : "<span>💡</span> Dica de estudo / Acessibilidade";
    });
  }

  // Limpar Resposta
  const btnLimpar = $("cmspBtnLimpar");
  if (btnLimpar) {
    btnLimpar.addEventListener("click", () => {
      delete respostasTarefaAtual[questaoAtualIndex];
      renderizarReguaCMSP();
      renderizarQuestaoAtivaCMSP();
    });
  }

  // Botão Ver Resumo da Nota no modo revisão
  const btnVerGabaritoGeral = $("cmspBtnVerGabaritoGeral");
  if (btnVerGabaritoGeral) {
    btnVerGabaritoGeral.addEventListener("click", () => {
      const resContainer = $("cmspContainerResultado");
      if (resContainer) {
        resContainer.scrollIntoView({ behavior: "smooth" });
      }
    });
  }

  // Anterior
  const btnAnt = $("cmspBtnAnterior");
  if (btnAnt) {
    btnAnt.addEventListener("click", () => {
      if (questaoAtualIndex > 0) {
        questaoAtualIndex--;
        renderizarReguaCMSP();
        renderizarQuestaoAtivaCMSP();
        window.scrollTo({ top: 120, behavior: "smooth" });
      }
    });
  }

  // Próxima
  const btnProx = $("cmspBtnProxima");
  if (btnProx) {
    btnProx.addEventListener("click", () => {
      if (questaoAtualIndex < total - 1) {
        questaoAtualIndex++;
        renderizarReguaCMSP();
        renderizarQuestaoAtivaCMSP();
        window.scrollTo({ top: 120, behavior: "smooth" });
      }
    });
  }

  // Finalizar e Entregar
  const btnFin = $("cmspBtnFinalizar");
  if (btnFin) {
    btnFin.addEventListener("click", finalizarAtividadeCMSP);
  }
}

async function finalizarAtividadeCMSP() {
  if (!tarefaEmExecucao || !usuarioAtual) return;

  const questoes = obterQuestoesTarefa(tarefaEmExecucao);
  const total = questoes.length;

  const pendentes = questoes.filter((q, i) => {
    const val = respostasTarefaAtual[i];
    return val === undefined || val === null || String(val).trim() === "";
  }).length;

  if (pendentes > 0) {
    const confirma = confirm(`Atenção: Você ainda possui ${pendentes} questão(ões) em branco.\n\nDeseja finalizar e entregar a atividade mesmo assim?`);
    if (!confirma) return;
  }

  // Cálculo da pontuação e acertos
  let acertosCount = 0;
  questoes.forEach((q, i) => {
    const resp = respostasTarefaAtual[i];
    const corretaOficial = q.respostaCorreta || (q.alternativas?.find(a => a.correta)?.id) || "";
    if (q.tipo === "lacuna") {
      if (String(resp).trim().toLowerCase() === String(corretaOficial).trim().toLowerCase()) {
        acertosCount++;
      }
    } else if (q.tipo === "multiplaEscolha") {
      if (String(resp).toLowerCase() === String(corretaOficial).toLowerCase()) {
        acertosCount++;
      }
    } else {
      if (resp && String(resp).trim().length >= 10) {
        acertosCount++;
      }
    }
  });

  const xpGanho = Number(tarefaEmExecucao.pontosXP || tarefaEmExecucao.xp || 40);
  const notaCalculada = Math.round((acertosCount / Math.max(1, total)) * 10 * 10) / 10;
  const entregaId = `${usuarioAtual.uid}_${tarefaEmExecucao.id}`;

  const eOffline = (!estaOnline());

  const dadosEntrega = {
    id: entregaId,
    tarefaId: tarefaEmExecucao.id,
    alunoId: usuarioAtual.uid,
    alunoNome: perfilAluno?.nome || "Aluno",
    turma: perfilAluno?.turma || "",
    respostas: { ...respostasTarefaAtual },
    acertos: `${acertosCount}/${total}`,
    acertosCount: acertosCount,
    totalQuestoes: total,
    nota: notaCalculada,
    status: "entregue",
    xpGanha: xpGanho,
    modoOffline: eOffline,
    sincronizado: !eOffline,
    criadoEm: new Date().toISOString()
  };

  try {
    if (eOffline) {
      // Salva na fila offline com persistência
      DBLocal.salvarEntregaOffline(dadosEntrega);
    } else {
      // 1. Salva no banco local oficial (DBLocal)
      DBLocal.salvarEntregaDocente(dadosEntrega);
    }

    // 2. Concede XP e atualiza progresso
    if (perfilAluno) {
      perfilAluno.xp = (perfilAluno.xp || 420) + xpGanho;
      perfilAluno.nivel = Math.max(1, Math.floor(perfilAluno.xp / 100));
      DBLocal.salvarAluno(perfilAluno);
      DBLocal.adicionarXPAluno(perfilAluno.id, xpGanho);
      atualizarProgresso();
    }

    // 3. Atualiza cache de entregas
    entregasCache.set(tarefaEmExecucao.id, dadosEntrega);

    // Atualiza barra de conectividade e contadores
    atualizarBarraConectividade();

    // Recarrega tarefas em background para atualizar contadores
    await carregarTarefas();

    // Muda para modo de revisão e renderiza celebração
    modoRevisaoGabarito = true;
    renderizarReguaCMSP();
    renderizarQuestaoAtivaCMSP();
    renderizarResultadoCMSP(dadosEntrega);

    if (eOffline) {
      alert(`🎉 Atividade concluída em MODO OFFLINE!\n\nNota: ${notaCalculada} | XP Ganho: +${xpGanho} XP\n\nSua entrega foi salva com segurança no seu dispositivo e está na fila de sincronização. Assim que restabelecer a conexão, ela será enviada automaticamente para o diário do professor!`);
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  } catch (err) {
    console.error("Erro ao registrar entrega:", err);
    alert("Ocorreu um erro ao registrar sua entrega. Tente novamente.");
  }
}

function renderizarResultadoCMSP(entrega) {
  const container = $("cmspContainerResultado");
  if (!container || !tarefaEmExecucao) return;

  const questoes = obterQuestoesTarefa(tarefaEmExecucao);
  const total = questoes.length;
  const acertos = entrega.acertosCount ?? total;
  const nota = entrega.nota ?? 10;
  const xp = entrega.xpGanha ?? (tarefaEmExecucao.pontosXP || 40);
  const percentual = Math.round((acertos / Math.max(1, total)) * 100);

  const gabaritoHtml = questoes.map((q, i) => {
    const num = String(i + 1).padStart(2, "0");
    const respAluno = respostasTarefaAtual[i] ?? "";
    const corretaOficial = q.respostaCorreta || (q.alternativas?.find(a => a.correta)?.id) || "";
    let statusClasse = "incorreta";
    let badgeTexto = "Incorreta ✗";
    let badgeClasse = "errada";

    if (q.tipo === "dissertativa") {
      statusClasse = "dissertativa";
      badgeTexto = "Dissertativa 📝";
      badgeClasse = "info";
    } else {
      let correta = false;
      if (q.tipo === "lacuna") {
        correta = String(respAluno).trim().toLowerCase() === String(corretaOficial).trim().toLowerCase();
      } else {
        correta = String(respAluno).toLowerCase() === String(corretaOficial).toLowerCase();
      }

      if (correta) {
        statusClasse = "correta";
        badgeTexto = "Correta ✓";
        badgeClasse = "ok";
      }
    }

    return `
      <div class="cmsp-gabarito-item ${statusClasse}">
        <div class="cmsp-gabarito-header">
          <strong>Questão ${num} • ${textoSeguro(q.tipo === "lacuna" ? "Completar Frase (Dropdown)" : q.tipo === "multiplaEscolha" ? "Múltipla Escolha" : "Dissertativa")}</strong>
          <span class="cmsp-gabarito-badge ${badgeClasse}">${badgeTexto}</span>
        </div>
        <p style="margin: 6px 0; font-size: 14px; color: #1e293b;">${textoSeguro(q.enunciado || "")}</p>
        
        <div class="cmsp-gabarito-resposta">
          <div><strong>Sua resposta:</strong> <span style="color:#1d4ed8;">${textoSeguro(respAluno || "(Em branco)")}</span></div>
          ${corretaOficial && q.tipo !== "dissertativa" ? `
            <div><strong>Gabarito oficial:</strong> <span style="color:#059669; font-weight:700;">${textoSeguro(corretaOficial)}</span></div>
          ` : ""}
        </div>

        ${q.explicacao ? `
          <div class="cmsp-gabarito-explicacao">
            <strong>Explicação Pedagógica SEDUC-SP:</strong> ${textoSeguro(q.explicacao)}
          </div>
        ` : ""}
      </div>
    `;
  }).join("");

  container.innerHTML = `
    <div class="cmsp-resultado-card">
      <div class="cmsp-resultado-topo">
        <div class="cmsp-resultado-icone">🎉</div>
        <h2 class="cmsp-resultado-titulo">Atividade Concluída com Sucesso!</h2>
        <p class="cmsp-resultado-subtitulo">
          Sua entrega foi computada no sistema oficial. Confira seu aproveitamento e o gabarito comentado abaixo.
        </p>

        <div class="cmsp-grid-estatisticas">
          <div class="cmsp-stat-item destaque">
            <span class="numero">${acertos} de ${total}</span>
            <span class="rotulo">Acertos (${percentual}%)</span>
          </div>
          <div class="cmsp-stat-item">
            <span class="numero">${nota}</span>
            <span class="rotulo">Nota Oficial</span>
          </div>
          <div class="cmsp-stat-item">
            <span class="numero">+${xp} XP</span>
            <span class="rotulo">Pontos Conquistados</span>
          </div>
        </div>
      </div>

      <div class="cmsp-gabarito-secao">
        <h3 class="cmsp-gabarito-titulo">
          <span>📋</span> Gabarito Comentado e Correção Detalhada
        </h3>
        ${gabaritoHtml}
      </div>

      <div class="cmsp-resultado-acoes">
        <button type="button" class="botao-primario" id="cmspBtnVoltarLista">
          Voltar para Lista de Atividades
        </button>
      </div>
    </div>
  `;

  container.style.display = "block";

  const btnVoltar = $("cmspBtnVoltarLista");
  if (btnVoltar) {
    btnVoltar.addEventListener("click", () => {
      abrirPagina("tarefas");
    });
  }
}


document
  .querySelectorAll(
    "[data-filtro-tarefa]"
  )
  .forEach(botao => {

    botao.addEventListener(
      "click",
      () => {

        filtroTarefaAtual =
          botao.dataset.filtroTarefa;


        document
          .querySelectorAll(
            "[data-filtro-tarefa]"
          )
          .forEach(b => {

            b.classList.remove(
              "ativo"
            );

          });


        botao.classList.add(
          "ativo"
        );


        renderizarTarefas();

      }
    );

  });


/*========================================
MENSAGENS DO PROFESSOR E MURAL
========================================*/

async function carregarMensagens() {

  if (
    !usuarioAtual
    || !perfilAluno
  ) {

    return;

  }


  const lista =
    $("listaMensagens");


  if (!lista) {

    return;

  }


  lista.innerHTML =
    '<p class="vazio">Carregando mensagens...</p>';


  try {
    const turma = normalizarTurma(perfilAluno.turma);
    const email = usuarioAtual.email || "";

    // 1. Busca comunicados e avisos do banco local institucional (DBLocal)
    const comunicadosLocais = DBLocal.obterComunicados();
    const mensagens = comunicadosLocais.map(c => ({
      id: c.id,
      tipoMensagem: c.tipo || "Comunica SP",
      titulo: c.titulo,
      conteudo: c.conteudo || c.mensagem,
      criadoEm: c.data || c.criadoEm || new Date().toISOString(),
      autor: c.autor || "Coordenação Pedagógica",
      origem: "local"
    }));

    mensagens.sort(
      (a, b) => {

        const ta =
          a.criadoEm
            ?.toMillis?.()
          || 0;


        const tb =
          b.criadoEm
            ?.toMillis?.()
          || 0;


        return tb - ta;

      }
    );


    const total =
      mensagens.length;


    [
      "quantidadeMensagens",
      "contadorMensagensMenu",
      "contadorNotificacoes"
    ]
      .forEach(id => {

        if ($(id)) {

          $(id).textContent =
            total;

        }

      });


    if (!mensagens.length) {

      lista.innerHTML =
        '<p class="vazio">Nenhum comunicado disponível.</p>';

      return;

    }


    lista.innerHTML =
      mensagens.map(
        item => `

          <article class="mensagem-item">

            <span class="mensagem-tipo">

              ${textoSeguro(
                item.tipoMensagem
              )}

            </span>


            <h3>

              ${textoSeguro(
                item.titulo
                || "Comunicado"
              )}

            </h3>


            <p>

              ${textoSeguro(
                item.mensagem
                || item.texto
                || ""
              )}

            </p>


            <small>

              ${textoSeguro(
                dataHoraLegivel(
                  item.criadoEm
                )
              )}

            </small>

          </article>

        `
      )
      .join("");

  }

  catch (erro) {

    console.error(
      "Erro ao carregar mensagens:",
      erro
    );


    lista.innerHTML =
      '<p class="erro-bloco">Não foi possível carregar os comunicados. Se as regras são restritivas, confira se a consulta usa o mesmo destino permitido.</p>';

  }

}


/*========================================
PUBLICACAO DIARIA DO ALUNO
REALTIME DATABASE
========================================*/

/*========================================
PUBLICAÇÃO DIÁRIA & REFLEXÃO (LOCAL STORAGE)
========================================*/

if ($("avisoRealtime")) {
  $("avisoRealtime").hidden = true;
}

$("atividadeDiaForm")
  ?.addEventListener(
    "submit",
    async event => {
      event.preventDefault();

      const titulo = $("atividadeTitulo").value.trim();
      const mensagem = $("atividadeTexto").value.trim();
      const hoje = hojeISO();
      const chaveRegistro = `${usuarioAtual?.uid || "aluno"}_${hoje}`;

      try {
        const existente = DBLocal.obterDesafioDiario(chaveRegistro);
        if (existente) {
          mostrarStatusMensagem("erro", "Você já publicou a reflexão diária de hoje.");
          return;
        }

        const registro = {
          alunoId: usuarioAtual?.uid || "aluno_1",
          alunoNome: perfilAluno?.nome || "Aluno",
          email: usuarioAtual?.email || "",
          turma: perfilAluno?.turma || "",
          data: hoje,
          titulo: titulo,
          mensagem: mensagem
        };

        DBLocal.salvarDesafioDiario(chaveRegistro, registro);
        DBLocal.adicionarXPAluno(usuarioAtual?.uid || "aluno_1", 25);

        $("atividadeDiaForm").reset();
        mostrarStatusMensagem("ok", "🎉 Publicação diária registrada com sucesso! +25 XP ganhos.");
        atualizarProgresso();
        await atualizarPublicacaoDiaria();
      } catch (erro) {
        console.error("Erro ao salvar publicação diária:", erro);
        mostrarStatusMensagem("erro", "Não foi possível registrar a publicação diária.");
      }
    }
  );

function mostrarStatusMensagem(tipo, texto) {
  const elemento = $("atividadeMensagem");
  if (!elemento) return;
  elemento.className = "mensagem-status " + tipo;
  elemento.textContent = texto;
}

async function atualizarPublicacaoDiaria() {
  const hoje = hojeISO();
  const chaveRegistro = `${usuarioAtual?.uid || "aluno"}_${hoje}`;
  const resultado = DBLocal.obterDesafioDiario(chaveRegistro);

  if (resultado) {
    mostrarStatusMensagem("ok", "A reflexão de hoje já foi enviada e gravada no banco local.");
    const botao = $("atividadeDiaForm")?.querySelector('button[type="submit"]');
    if (botao) {
      botao.disabled = true;
      botao.textContent = "✓ Enviada Hoje (+25 XP)";
    }
  }
}


/*========================================
NOTAS
========================================*/

/*========================================
NOTAS
========================================*/

async function carregarNotas() {

  if (!usuarioAtual) {
    return;
  }

  const tabela = $("tabelaNotas");

  if (!tabela) {
    return;
  }

  tabela.innerHTML = `
    <tr>
      <td colspan="5">Carregando notas...</td>
    </tr>
  `;

  try {

    // ---------- Buscar notas do aluno ----------

    const notaRef = doc(
      db,
      "notas",
      usuarioAtual.uid
    );

    const notaDoc = await getDoc(notaRef);

    // ---------- Verificar documento ----------

    if (!notaDoc.exists()) {

      tabela.innerHTML = `
        <tr>
          <td colspan="5">
            Nenhuma nota registrada.
          </td>
        </tr>
      `;

      return;
    }

    const notas = notaDoc.data();

    // ---------- Matérias ----------

    const nomesMaterias = {
      portugues: "Português",
      arte: "Arte",
      matematica: "Matemática",
      ciencias: "Ciências",
      ingles: "Inglês",
      historia: "História",
      geografia: "Geografia",
      educacaoFisica: "Educação Física",
      tecnologia: "Tecnologia"
    };

    const ordemMaterias = [
      "portugues",
      "arte",
      "matematica",
      "ciencias",
      "ingles",
      "historia",
      "geografia",
      "educacaoFisica",
      "tecnologia"
    ];

    // ---------- Montar tabela ----------

    tabela.innerHTML = ordemMaterias
      .map(materia => {

        const dados = notas[materia] || {};

        const b1 = dados["1ºBimestre"] ?? "-";
        const b2 = dados["2ºBimestre"] ?? "-";
        const b3 = dados["3ºBimestre"] ?? "-";
        const b4 = dados["4ºBimestre"] ?? "-";

        return `
          <tr>
            <td>${textoSeguro(nomesMaterias[materia])}</td>
            <td>${textoSeguro(b1)}</td>
            <td>${textoSeguro(b2)}</td>
            <td>${textoSeguro(b3)}</td>
            <td>${textoSeguro(b4)}</td>
          </tr>
        `;

      })
      .join("");

  } catch (erro) {

    console.error(
      "Erro ao carregar notas:",
      erro
    );

    tabela.innerHTML = `
      <tr>
        <td colspan="5">
          Erro ao carregar notas.
        </td>
      </tr>
    `;

  }

}

/*========================================
AGENDA PELO DATA.JSON
========================================*/

async function carregarAgenda() {

  const alvo =
    $("agendaConteudo");


  if (!alvo) {

    return;

  }


  alvo.innerHTML =
    '<p class="vazio">Carregando agenda...</p>';


  try {

    const resposta =
      await fetch(
        "./data.json",
        {
          cache: "no-store"
        }
      );


    if (!resposta.ok) {

      throw new Error(
        `Agenda HTTP ${resposta.status}`
      );

    }


    const dados =
      await resposta.json();


    const meses =
      dados.ano
      || dados;


    const blocos = [];


    Object
      .entries(meses || {})
      .forEach(
        ([mes, eventos]) => {

          if (
            !Array.isArray(eventos)
            || eventos.length === 0
          ) {

            return;

          }


          const itens =
            eventos.map(
              evento => `

                <div class="agenda-item">

                  <strong>

                    ${textoSeguro(
                      evento.titulo
                      || "Evento"
                    )}

                  </strong>


                  <p>

                    ${textoSeguro(
                      evento.descricao
                      || ""
                    )}

                  </p>


                  <small>

                    ${textoSeguro(
                      evento.data
                      || ""
                    )}

                    ${
                      evento.hora
                        ? " | "
                          + textoSeguro(
                            evento.hora
                          )
                        : ""
                    }

                  </small>

                </div>

              `
            )
            .join("");


          blocos.push(

            `

              <section class="agenda-mes">

                <h2>

                  ${textoSeguro(
                    mes
                  )}

                </h2>

                ${itens}

              </section>

            `

          );

        }
      );


    alvo.innerHTML =

      blocos.length

        ? blocos.join("")

        : '<p class="vazio">Nenhum evento cadastrado na agenda.</p>';

  }

  catch (erro) {

    console.error(
      "Erro na agenda:",
      erro
    );


    alvo.innerHTML =
      '<p class="erro-bloco">A agenda não pôde ser carregada.</p>';

  }

}


/*========================================
PLATAFORMAS
========================================*/

document
  .querySelectorAll(
    "[data-plataforma]"
  )
  .forEach(botao => {

    botao.addEventListener(
      "click",
      () => {

        const plataforma =
          botao.dataset.plataforma;

        if (plataforma === "redacao-sp") {
          window.location.href = rotas.redacaoSP;
          return;
        }

        const url =
          rotas[plataforma];

        if (url) {

          window.open(
            url,
            "_blank",
            "noopener,noreferrer"
          );

        }

      }
    );

  });


/*========================================
SAIR
========================================*/

$("sairBtn")
  ?.addEventListener(
    "click",
    () => {
      DBLocal.fazerLogout();
      window.location.href = rotas.login;
    }
  );


/*========================================
WEB SPEECH API
========================================*/

function falar(texto) {

  if (
    !(
      "speechSynthesis"
      in window
    )
  ) {

    alert(
      "Leitura por voz não disponível neste navegador."
    );

    return;

  }


  window
    .speechSynthesis
    .cancel();


  const fala =
    new SpeechSynthesisUtterance(
      texto
    );


  fala.lang =
    "pt-BR";


  fala.rate =
    1;


  fala.pitch =
    1;


  window
    .speechSynthesis
    .speak(
      fala
    );

}


$("lerPagina")
  ?.addEventListener(
    "click",
    () => {

      falar(
        $("conteudo").innerText
      );

    }
  );


$("lerSelecionado")
  ?.addEventListener(
    "click",
    () => {

      const texto =
        window
          .getSelection()
          .toString()
          .trim();


      if (!texto) {

        alert(
          "Selecione algum texto primeiro."
        );

        return;

      }


      falar(texto);

    }
  );


$("pararLeitura")
  ?.addEventListener(
    "click",
    () => {

      window
        .speechSynthesis
        .cancel();

    }
  );
