/*====================================================
01 - FIREBASE E ARMAZENAMENTO LOCAL
====================================================*/

import DBLocal from "../../../js/db-local.js";

import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";

import {
  getAuth,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";

import {
  getFirestore,
  collection,
  getDocs,
  doc,
  getDoc,
  query,
  where,
  setDoc,
  runTransaction,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

import {
  getAI,
  getGenerativeModel,
  GoogleAIBackend,
  Schema
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-ai.js";


const firebaseConfig = {
  apiKey: "AIzaSyCey_SsTCeHuTKwBaZ-Eo6_7LRa4l-5A80",
  authDomain: "salafuturov2prot.firebaseapp.com",
  projectId: "salafuturov2prot",
  storageBucket: "salafuturov2prot.firebasestorage.app",
  messagingSenderId: "352042722106",
  appId: "1:352042722106:web:395ba7ef400d1421426603",
  measurementId: "G-LW16X3NHH8"
};


const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);


/*====================================================
02 - GEMINI PELO FIREBASE AI LOGIC
====================================================*/

const ai = getAI(
  app,
  {
    backend: new GoogleAIBackend()
  }
);


const schemaDesafio = Schema.object({
  properties: {
    titulo: Schema.string(),
    componente: Schema.string(),
    enunciado: Schema.string(),
    alternativas: Schema.array({
      items: Schema.string()
    }),
    respostaCorreta: Schema.number(),
    explicacao: Schema.string()
  }
});


const modeloDesafio = getGenerativeModel(
  ai,
  {
    model: "gemini-3.7-flash",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: schemaDesafio
    }
  }
);


/*====================================================
03 - ESTADO DO APP
====================================================*/

let usuarioAtual = null;
let perfilAluno = null;
let dadosJSON = null;
let atividades = [];
let entregas = new Map();
let ranking = [];
let guildas = [];
let trabalhosGuilda = [];
let premiacoes = [];
let atividadeAtual = null;
let desafioAtual = null;

let pontuacaoAtual = {
  pontosSemana: 0,
  pontosQuinzena: 0,
  pontosTotal: 0
};


/*====================================================
04 - ATALHOS
====================================================*/

function $(id) {
  return document.getElementById(id);
}


function textoSeguro(valor) {
  return String(valor ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


function normalizar(valor) {
  return String(valor || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");
}


function hojeISO() {
  const data = new Date();

  return [
    data.getFullYear(),
    String(data.getMonth() + 1).padStart(2, "0"),
    String(data.getDate()).padStart(2, "0")
  ].join("-");
}


function hojeLegivel() {
  return new Date().toLocaleDateString(
    "pt-BR",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    }
  );
}


function semanaId() {
  const hoje = new Date();
  const inicio = new Date(hoje);
  const dia = hoje.getDay();
  const ajuste = dia === 0 ? -6 : 1 - dia;

  inicio.setDate(
    hoje.getDate() + ajuste
  );

  return [
    inicio.getFullYear(),
    String(inicio.getMonth() + 1).padStart(2, "0"),
    String(inicio.getDate()).padStart(2, "0")
  ].join("-");
}


function aviso(texto) {
  if ($("avisoSistema")) {
    $("avisoSistema").textContent = texto;
  }
}


/*====================================================
05 - LOGIN
====================================================*/

onAuthStateChanged(
  auth,
  async user => {

    if (!user) {
      // Fallback para modo demonstração offline/local
      const perfilSalvo = DBLocal.obterPerfilAluno();
      usuarioAtual = {
        uid: perfilSalvo?.id || "aluno_demo_sp",
        email: perfilSalvo?.email || "aluno.demo@escola.sp.gov.br"
      };
    } else {
      usuarioAtual = user;
    }

    try {
      await carregarPerfil();
      await carregarJSON();

      // Entregas e pontuação são o núcleo do Tarefa SP.
      await Promise.all([
        carregarEntregas(),
        carregarPontuacao()
      ]);

      // Recursos sociais não podem derrubar a tela inteira se uma Rule bloquear leitura.
      const opcionais = await Promise.allSettled([
        carregarRanking(),
        carregarGuildas(),
        carregarTrabalhosGuilda(),
        carregarPremiacoes()
      ]);

      opcionais.forEach((resultado, indice) => {
        if (resultado.status === "rejected") {
          console.warn(
            ["Ranking", "Guildas", "Trabalhos de guilda", "Premiações"][indice]
            + " indisponível:",
            resultado.reason
          );
        }
      });

      prepararFiltros();
      renderizarTudo();

      // Se a IA falhar, o fallback local mantém a plataforma utilizável.
      await carregarDesafioDiario();
    }

    catch (erro) {
      console.error("Erro ao iniciar Tarefa SP:", erro);
      aviso("Iniciando Tarefa SP em modo demonstração local.");

      prepararFiltros();
      renderizarTudo();
    }
  }
);


/*====================================================
06 - PERFIL DO ALUNO
====================================================*/

async function carregarPerfil() {
  const local = DBLocal.obterPerfilAluno();
  if (local) {
    perfilAluno = local;
    const nome = perfilAluno.nome || "Aluno";
    if ($("nomeAlunoTopo")) $("nomeAlunoTopo").textContent = nome;
    if ($("avatarAluno")) $("avatarAluno").textContent = nome.charAt(0).toUpperCase();
    return;
  }

  const referencia = doc(
    db,
    "usuarios",
    usuarioAtual.uid
  );

  let resultado;
  try {
    resultado = await getDoc(referencia);
  } catch (e) {
    perfilAluno = DBLocal.obterPerfilAluno();
    const nome = perfilAluno?.nome || "Aluno";
    if ($("nomeAlunoTopo")) $("nomeAlunoTopo").textContent = nome;
    if ($("avatarAluno")) $("avatarAluno").textContent = nome.charAt(0).toUpperCase();
    return;
  }

  if (!resultado || !resultado.exists()) {
    perfilAluno = DBLocal.obterPerfilAluno();
    const nome = perfilAluno?.nome || "Aluno";
    if ($("nomeAlunoTopo")) $("nomeAlunoTopo").textContent = nome;
    if ($("avatarAluno")) $("avatarAluno").textContent = nome.charAt(0).toUpperCase();
    return;
  }

  perfilAluno = {
    id: resultado.id,
    ...resultado.data()
  };

  if (String(perfilAluno.tipo || "").toLowerCase() !== "aluno") {
    await signOut(auth);
    window.location.href = "../../../loginal.html";
    throw new Error("Conta sem permissão de aluno.");
  }

  const nome =
    perfilAluno.nome
    || usuarioAtual.email
    || "Aluno";

  $("nomeAlunoTopo").textContent = nome;
  $("avatarAluno").textContent = nome.charAt(0).toUpperCase();
}


/*====================================================
07 - CARREGAR JSON
====================================================*/

async function carregarJSON() {
  const resposta = await fetch(
    "./atividades.json",
    {
      cache: "no-store"
    }
  );

  if (!resposta.ok) {
    throw new Error(
      "Erro ao carregar atividades.json"
    );
  }

  dadosJSON = await resposta.json();

  atividades = Array.isArray(
    dadosJSON.atividades
  )
    ? dadosJSON.atividades
    : [];
}


/*====================================================
08 - ENTREGAS
====================================================*/

async function carregarEntregas() {
  entregas = new Map();

  // 1. Carrega do banco local
  const entregasLocais = DBLocal.obterEntregasOficiais();
  entregasLocais.forEach(item => {
    if (item.atividadeId) {
      entregas.set(item.atividadeId, item);
    }
  });

  try {
    const resultado = await getDocs(
      query(
        collection(
          db,
          "entregasTarefaSP"
        ),
        where(
          "alunoId",
          "==",
          usuarioAtual.uid
        )
      )
    );

    resultado.forEach(item => {
      const entrega = {
        id: item.id,
        ...item.data()
      };

      entregas.set(
        entrega.atividadeId,
        entrega
      );
    });
  } catch (e) {}
}


/*====================================================
09 - PONTUAÇÃO
====================================================*/

async function carregarPontuacao() {
  const pontuacaoLocal = DBLocal.obterPontuacaoOficial(usuarioAtual.uid);
  if (pontuacaoLocal) {
    pontuacaoAtual = pontuacaoLocal;
  } else {
    pontuacaoAtual = {
      pontosSemana: 0,
      pontosQuinzena: 0,
      pontosTotal: 0
    };
  }

  try {
    const referencia = doc(
      db,
      "pontuacaoTarefaSP",
      usuarioAtual.uid
    );

    const resultado = await getDoc(
      referencia
    );

    if (resultado.exists()) {
      const dados = resultado.data();
      pontuacaoAtual = {
        pontosSemana: Number(dados.pontosSemana || 0),
        pontosQuinzena: Number(dados.pontosQuinzena || 0),
        pontosTotal: Number(dados.pontosTotal || 0)
      };
      DBLocal.salvarPontuacaoOficial(usuarioAtual.uid, pontuacaoAtual);
    }
  } catch(e) {}
}


/*====================================================
10 - RANKING
====================================================*/

async function carregarRanking() {
  ranking = [];
  const alunos = DBLocal.obterAlunos();
  const mapa = new Map();

  alunos.forEach(aluno => {
    mapa.set(aluno.id, {
      id: aluno.id,
      alunoNome: aluno.nome,
      turma: aluno.turma,
      pontosSemana: Math.round(Number(aluno.xp || 0) * 0.4),
      pontosTotal: Number(aluno.xp || 0)
    });
  });

  if (usuarioAtual && perfilAluno) {
    mapa.set(usuarioAtual.uid, {
      id: usuarioAtual.uid,
      alunoNome: perfilAluno.nome || "Você",
      turma: perfilAluno.turma || "8º Ano A",
      pontosSemana: Number(pontuacaoAtual?.pontosSemana || 0),
      pontosTotal: Number(pontuacaoAtual?.pontosTotal || 0)
    });
  }

  try {
    const resultado = await getDocs(
      collection(
        db,
        "pontuacaoTarefaSP"
      )
    );

    resultado.forEach(item => {
      mapa.set(item.id, {
        id: item.id,
        ...item.data()
      });
    });
  } catch(e) {}

  ranking = Array.from(mapa.values());

  ranking.sort(
    (a, b) =>
      Number(b.pontosSemana || 0)
      -
      Number(a.pontosSemana || 0)
  );
}


/*====================================================
11 - GUILDAS
====================================================*/

async function carregarGuildas() {
  guildas = [];
  const guildasLocais = DBLocal.obterGuildas();
  const mapa = new Map();
  guildasLocais.forEach(g => mapa.set(g.id, g));

  try {
    const resultado = await getDocs(
      collection(
        db,
        "guildas"
      )
    );

    resultado.forEach(item => {
      mapa.set(item.id, {
        id: item.id,
        ...item.data()
      });
    });
  } catch(e) {}

  guildas = Array.from(mapa.values());
}


/*====================================================
12 - TRABALHOS DA GUILDA
====================================================*/

async function carregarTrabalhosGuilda() {
  trabalhosGuilda = [];
  const trabalhosLocais = DBLocal.obterTrabalhosGuilda();
  const mapa = new Map();
  trabalhosLocais.forEach(t => mapa.set(t.id, t));

  try {
    const resultado = await getDocs(
      collection(
        db,
        "trabalhosGuilda"
      )
    );

    resultado.forEach(item => {
      mapa.set(item.id, {
        id: item.id,
        ...item.data()
      });
    });
  } catch(e) {}

  trabalhosGuilda = Array.from(mapa.values());
}


/*====================================================
13 - PREMIAÇÕES
====================================================*/

async function carregarPremiacoes() {
  premiacoes = [];
  const premiacoesLocais = DBLocal.obterPremiacoes();
  const mapa = new Map();
  premiacoesLocais.forEach(p => mapa.set(p.id, p));

  try {
    const resultado = await getDocs(
      collection(
        db,
        "premiacoes"
      )
    );

    resultado.forEach(item => {
      const dados = item.data();

      if (dados.ativo !== false) {
        mapa.set(item.id, {
          id: item.id,
          ...dados
        });
      }
    });
  } catch(e) {}

  premiacoes = Array.from(mapa.values());
}


/*====================================================
14 - FILTROS
====================================================*/

function prepararFiltros() {
  const turmas = new Set();

  if (
    Array.isArray(
      perfilAluno.turmas
    )
  ) {
    perfilAluno.turmas.forEach(turma => {
      turmas.add(turma);
    });
  }

  if (perfilAluno.turma) {
    turmas.add(
      perfilAluno.turma
    );
  }

  turmas.forEach(turma => {
    const option = document.createElement(
      "option"
    );

    option.value = turma;
    option.textContent = turma;

    $("filtroTurma").appendChild(
      option
    );
  });

  const componentes =
    dadosJSON?.config?.componentes
    || [];

  componentes.forEach(componente => {
    const option = document.createElement(
      "option"
    );

    option.value = componente;
    option.textContent = componente;

    $("filtroComponente").appendChild(
      option
    );
  });

  $("filtroTurma").addEventListener(
    "change",
    renderizarAtividades
  );

  $("filtroStatus").addEventListener(
    "change",
    renderizarAtividades
  );

  $("filtroComponente").addEventListener(
    "change",
    renderizarAtividades
  );
}


/*====================================================
15 - QUINZENA ATUAL
====================================================*/

function quinzenaAtual() {
  const hoje = hojeISO();

  return dadosJSON
    ?.quinzenas
    ?.find(
      item =>
        hoje >= item.inicio
        &&
        hoje <= item.fim
    )
    || null;
}


/*====================================================
16 - ATIVIDADES DISPONÍVEIS
====================================================*/

function alunoPodeVerAtividade(atividade) {
  if (
    !atividade.turmas
    ||
    !atividade.turmas.length
  ) {
    return true;
  }

  const turmasAluno = new Set();

  if (
    Array.isArray(
      perfilAluno.turmas
    )
  ) {
    perfilAluno.turmas.forEach(turma => {
      turmasAluno.add(
        normalizar(turma)
      );
    });
  }

  if (perfilAluno.turma) {
    turmasAluno.add(
      normalizar(
        perfilAluno.turma
      )
    );
  }

  return atividade.turmas.some(
    turma =>
      turmasAluno.has(
        normalizar(turma)
      )
  );
}


/*====================================================
17 - FILTRAR ATIVIDADES
====================================================*/

function obterAtividadesFiltradas() {
  const turma = $("filtroTurma").value;
  const status = $("filtroStatus").value;
  const componente = $("filtroComponente").value;

  return atividades
    .filter(
      alunoPodeVerAtividade
    )
    .filter(atividade => {

      if (turma !== "todas") {
        const pertence = atividade.turmas?.some(
          item =>
            normalizar(item)
            ===
            normalizar(turma)
        );

        if (!pertence) {
          return false;
        }
      }

      if (
        componente !== "todos"
        &&
        atividade.componente !== componente
      ) {
        return false;
      }

      const entregue = entregas.has(
        atividade.id
      );

      if (
        status === "a-fazer"
        &&
        entregue
      ) {
        return false;
      }

      if (
        status === "entregues"
        &&
        !entregue
      ) {
        return false;
      }

      return true;
    });
}


/*====================================================
18 - RENDERIZAR ATIVIDADES
====================================================*/

function renderizarAtividades() {
  const lista = $("listaAtividades");
  const filtradas = obterAtividadesFiltradas();

  $("textoQuantidadeAtividades").textContent =
    `${filtradas.length} atividade(s)`;

  if (!filtradas.length) {
    lista.innerHTML = `
      <div class="vazio">
        <div style="font-size:60px;margin-bottom:15px;">☑</div>
        Nenhuma Tarefa encontrada
      </div>
    `;

    return;
  }

  lista.innerHTML = filtradas
    .map(atividade => {
      const entregue = entregas.has(
        atividade.id
      );

      return `
        <article class="atividade-card ${entregue ? "entregue" : ""}">
          <div>
            <span class="etiqueta">
              ${textoSeguro(atividade.componente)}
            </span>

            <h3>${textoSeguro(atividade.titulo)}</h3>

            <p>${textoSeguro(atividade.descricao)}</p>

            <p>
              <strong>
                ${Number(atividade.pontos || 0)} pontos
              </strong>
            </p>

            <span class="etiqueta ${entregue ? "status-entregue" : "status-pendente"}">
              ${entregue ? "Entregue" : "A fazer"}
            </span>
          </div>

          <div class="atividade-acoes">
            <button
              class="botao-principal"
              type="button"
              data-atividade="${textoSeguro(atividade.id)}"
            >
              ${entregue ? "Ver resultado" : "Fazer atividade"}
            </button>
          </div>
        </article>
      `;
    })
    .join("");

  lista
    .querySelectorAll(
      "[data-atividade]"
    )
    .forEach(botao => {
      botao.addEventListener(
        "click",
        () => {
          abrirAtividade(
            botao.dataset.atividade
          );
        }
      );
    });
}


/*====================================================
19 - ABRIR ATIVIDADE
====================================================*/

function abrirAtividade(id) {
  atividadeAtual = atividades.find(
    item => item.id === id
  );

  if (!atividadeAtual) {
    return;
  }

  const entrega = entregas.get(
    atividadeAtual.id
  );

  $("modalComponente").textContent =
    atividadeAtual.componente;

  $("modalTitulo").textContent =
    atividadeAtual.titulo;

  $("modalDescricao").textContent =
    atividadeAtual.descricao || "";

  $("modalEnunciado").textContent =
    atividadeAtual.enunciado || "";

  $("resultadoAtividade").className =
    "resultado";

  $("resultadoAtividade").innerHTML = "";
  $("areaResposta").innerHTML = "";
  $("botaoEntregar").hidden = false;

  if (entrega) {
    mostrarResultado(entrega);
  }
  else {
    montarResposta();
  }

  $("modalAtividade").hidden = false;

  document.body.style.overflow =
    "hidden";

  $("fecharModal").focus();
}


/*====================================================
20 - MONTAR CAMPO DE RESPOSTA
====================================================*/

function montarResposta() {
  const area = $("areaResposta");

  if (
    atividadeAtual.tipo
    ===
    "multiplaEscolha"
  ) {
    area.innerHTML = atividadeAtual
      .alternativas
      .map(alternativa => `
        <label class="alternativa">

          <input
            type="radio"
            name="resposta"
            value="${textoSeguro(alternativa.id)}"
            required
          >

          ${textoSeguro(alternativa.texto)}

        </label>
      `)
      .join("");

    return;
  }

  area.innerHTML = `

    <label for="respostaTexto">

      <strong>
        Sua resposta
      </strong>

    </label>

    <textarea
      id="respostaTexto"
      maxlength="${Number(
        atividadeAtual.maximoCaracteres
        || 2000
      )}"
      required
    ></textarea>

  `;
}


/*====================================================
21 - ENTREGAR ATIVIDADE
====================================================*/

$("formAtividade").addEventListener(
  "submit",
  async event => {

    event.preventDefault();

    if (
      !atividadeAtual
      ||
      entregas.has(
        atividadeAtual.id
      )
    ) {
      return;
    }

    let resposta = "";
    let resultado = "enviado";

    if (
      atividadeAtual.tipo
      ===
      "multiplaEscolha"
    ) {

      const selecionada =
        document.querySelector(
          'input[name="resposta"]:checked'
        );

      if (!selecionada) {

        aviso(
          "Escolha uma alternativa."
        );

        return;
      }

      resposta =
        selecionada.value;

      resultado =
        resposta
        ===
        atividadeAtual.respostaCorreta

          ? "correto"

          : "incorreto";
    }

    else {

      resposta =
        $("respostaTexto")
          ?.value
          .trim()
        || "";

      if (!resposta) {
        return;
      }

      resultado =
        "aguardando-correcao";
    }

    $("botaoEntregar").disabled =
      true;

    try {

      await registrarEntrega(
        resposta,
        resultado
      );

      await Promise.all([
        carregarEntregas(),
        carregarPontuacao(),
        carregarRanking()
      ]);

      renderizarTudo();

      const entrega =
        entregas.get(
          atividadeAtual.id
        );

      mostrarResultado(
        entrega
      );

      aviso(
        "Atividade entregue com sucesso."
      );
    }

    catch (erro) {
      console.error("Erro ao entregar atividade:", erro);
      aviso(
        erro?.message === "ATIVIDADE_JA_ENTREGUE"
          ? "Esta atividade já foi entregue."
          : "Não foi possível entregar a atividade."
      );
    }

    finally {
      $("botaoEntregar").disabled = false;
    }
  }
);


/*====================================================
22 - REGISTRAR ENTREGA
====================================================*/

async function registrarEntrega(resposta, resultado) {
  if (!usuarioAtual || !atividadeAtual) {
    throw new Error("Sessão ou atividade inválida.");
  }

  const pontosGanhos =
    resultado === "correto"
      ? Number(atividadeAtual.pontos || 0)
      : 0;

  const semanaAtual = semanaId();
  const quinzena = quinzenaAtual();
  const quinzenaId = quinzena?.id || "sem-quinzena";

  // 1. Salva no banco de dados local
  const novaEntregaLocal = {
    id: `${usuarioAtual.uid}_${atividadeAtual.id}`,
    atividadeId: atividadeAtual.id,
    atividadeTitulo: atividadeAtual.titulo || "Atividade",
    componente: atividadeAtual.componente || "",
    alunoId: usuarioAtual.uid,
    alunoNome: perfilAluno?.nome || usuarioAtual.email || "Aluno",
    turma: perfilAluno?.turma || "",
    resposta,
    resultado,
    pontosPossiveis: Number(atividadeAtual.pontos || 0),
    pontosRecebidos: pontosGanhos,
    quinzenaId,
    entregueEm: new Date().toISOString()
  };

  DBLocal.salvarEntregaOficial(novaEntregaLocal);
  entregas.set(atividadeAtual.id, novaEntregaLocal);

  const pontosSemanaAnteriores = Number(pontuacaoAtual?.pontosSemana || 0);
  const pontosQuinzenaAnteriores = Number(pontuacaoAtual?.pontosQuinzena || 0);
  const pontosTotalAnteriores = Number(pontuacaoAtual?.pontosTotal || 0);

  pontuacaoAtual = {
    alunoId: usuarioAtual.uid,
    alunoNome: perfilAluno?.nome || usuarioAtual.email || "Aluno",
    turma: perfilAluno?.turma || "",
    semanaId: semanaAtual,
    quinzenaId,
    pontosSemana: pontosSemanaAnteriores + pontosGanhos,
    pontosQuinzena: pontosQuinzenaAnteriores + pontosGanhos,
    pontosTotal: pontosTotalAnteriores + pontosGanhos
  };
  DBLocal.salvarPontuacaoOficial(usuarioAtual.uid, pontuacaoAtual);

  if (pontosGanhos > 0) {
    const p = DBLocal.obterPerfilAluno();
    if (p) {
      p.xp = Number(p.xp || 0) + pontosGanhos;
      p.nivel = Math.floor(p.xp / 100) + 1;
      DBLocal.salvarPerfilAluno(p);
    }
  }

  // 2. Sincroniza em segundo plano no Firestore se online
  try {
    const entregaRef = doc(
      db,
      "entregasTarefaSP",
      `${usuarioAtual.uid}_${atividadeAtual.id}`
    );

    const pontosRef = doc(
      db,
      "pontuacaoTarefaSP",
      usuarioAtual.uid
    );

    await runTransaction(db, async transaction => {
      const entregaExistente = await transaction.get(entregaRef);
      const pontosExistentes = await transaction.get(pontosRef);

      if (entregaExistente.exists()) {
        return;
      }

      const anteriores = pontosExistentes.exists()
        ? pontosExistentes.data()
        : {};

      transaction.set(entregaRef, {
        ...novaEntregaLocal,
        entregueEm: serverTimestamp()
      });

      transaction.set(
        pontosRef,
        {
          ...pontuacaoAtual,
          atualizadoEm: serverTimestamp()
        },
        { merge: true }
      );
    });
  } catch (errSync) {
    console.warn("Sincronização em nuvem Tarefa SP não disponível, mantendo local:", errSync);
  }
}


/*====================================================
23 - RESULTADO DA ATIVIDADE
====================================================*/

function mostrarResultado(entrega) {
  if (!entrega) {
    return;
  }

  $("botaoEntregar").hidden = true;

  const area = $("areaResposta");
  const resultado = $("resultadoAtividade");
  const resposta = textoSeguro(entrega.resposta || "");

  if (area) {
    area.innerHTML = resposta
      ? `<p><strong>Sua resposta:</strong> ${resposta}</p>`
      : "";
  }

  const status = entrega.resultado || entrega.status || "enviado";

  if (status === "correto") {
    resultado.className = "resultado ok";
    resultado.innerHTML = `
      <strong>Resposta correta.</strong>
      <p>${textoSeguro(
        atividadeAtual?.feedbackCorreto
        || `Você recebeu ${Number(entrega.pontosRecebidos || 0)} ponto(s).`
      )}</p>
    `;
    return;
  }

  if (status === "incorreto") {
    resultado.className = "resultado erro";
    resultado.innerHTML = `
      <strong>Resposta incorreta.</strong>
      <p>${textoSeguro(
        atividadeAtual?.feedbackErro
        || "Revise o conteúdo e confira a explicação do professor."
      )}</p>
    `;
    return;
  }

  resultado.className = "resultado ok";
  resultado.innerHTML = `
    <strong>Atividade entregue.</strong>
    <p>A resposta foi registrada e está aguardando correção.</p>
  `;
}


/*====================================================
24 - RESUMO, QUINZENA E RANKING
====================================================*/

function atividadesDoAluno() {
  return atividades.filter(alunoPodeVerAtividade);
}

function atividadesDaQuinzena() {
  const atual = quinzenaAtual();
  const visiveis = atividadesDoAluno();

  if (!atual) {
    return visiveis;
  }

  return visiveis.filter(
    atividade => !atividade.quinzena || atividade.quinzena === atual.id
  );
}

function renderizarResumo() {
  const visiveis = atividadesDoAluno();
  const concluidas = visiveis.filter(
    atividade => entregas.has(atividade.id)
  ).length;

  $("meusPontosSemana").textContent = Number(
    pontuacaoAtual.pontosSemana || 0
  );

  $("atividadesConcluidas").textContent = concluidas;
}

function renderizarQuinzena() {
  const atual = quinzenaAtual();
  const lista = atividadesDaQuinzena();
  const entreguesQuinzena = lista.filter(
    atividade => entregas.has(atividade.id)
  );

  const pontosPossiveis = lista.reduce(
    (soma, atividade) => soma + Number(atividade.pontos || 0),
    0
  );

  const pontosAcumulados = Number(
    pontuacaoAtual.pontosQuinzena || 0
  );

  const percentualConclusao = lista.length
    ? Math.round((entreguesQuinzena.length / lista.length) * 100)
    : 0;

  const percentualPontos = pontosPossiveis
    ? Math.round((pontosAcumulados / pontosPossiveis) * 100)
    : 0;

  const metaConclusao = Number(
    dadosJSON?.config?.metaConclusao || 75
  );

  const metaPontos = Number(
    dadosJSON?.config?.metaPontos || 90
  );

  const desbloqueada =
    lista.length > 0
    && percentualConclusao >= metaConclusao
    && percentualPontos >= metaPontos;

  $("periodoQuinzena").textContent = atual?.nome || "Período atual";
  $("turmaQuinzena").textContent = perfilAluno?.turma || "Turma";
  $("pontosAcumulados").textContent = pontosAcumulados;
  $("pontosPossiveis").textContent = pontosPossiveis;

  $("barraPontos").style.width =
    `${Math.min(100, Math.max(0, percentualPontos))}%`;

  $("metaConclusao").textContent = `${percentualConclusao}%`;
  $("metaConclusaoTexto").textContent =
    `${entreguesQuinzena.length} de ${lista.length} concluída(s)`;

  $("metaPontos").textContent = `${percentualPontos}%`;
  $("metaPontosTexto").textContent =
    `${pontosAcumulados} de ${pontosPossiveis} pontos`;

  $("statusMedalha").textContent =
    desbloqueada ? "Desbloqueada" : "Bloqueada";

  $("textoMedalha").textContent = desbloqueada
    ? "Metas da quinzena concluídas"
    : `Meta: ${metaConclusao}% das tarefas e ${metaPontos}% dos pontos`;

  $("medalhaQuinzena").classList.toggle(
    "desbloqueada",
    desbloqueada
  );

  $("tituloPremiacaoQuinzena").textContent = desbloqueada
    ? "Medalha da Quinzena conquistada"
    : "Medalha da Quinzena";

  $("descricaoPremiacaoQuinzena").textContent = desbloqueada
    ? "Você cumpriu as duas metas desta quinzena."
    : "Cumpra as metas para conquistar a medalha.";
}

function renderizarRanking() {
  const corpo = $("rankingCorpo");

  if (!ranking.length) {
    corpo.innerHTML = `
      <tr><td colspan="4">Ranking indisponível ou ainda sem pontuação.</td></tr>
    `;
    return;
  }

  corpo.innerHTML = ranking
    .slice(0, 30)
    .map((item, indice) => `
      <tr class="${item.id === usuarioAtual?.uid ? "usuario-atual" : ""}">
        <td>${indice + 1}</td>
        <td>${textoSeguro(item.alunoNome || item.nome || "Aluno")}</td>
        <td>${textoSeguro(item.turma || "-")}</td>
        <td>${Number(item.pontosSemana || 0)}</td>
      </tr>
    `)
    .join("");
}


/*====================================================
25 - GUILDAS E PREMIAÇÕES
====================================================*/

function guildaPertenceAoAluno(guilda) {
  if (guilda.status && guilda.status !== "aprovada") {
    return false;
  }

  const turmaAluno = normalizar(perfilAluno?.turma);
  const turmaGuilda = normalizar(guilda.turma);

  if (turmaGuilda && turmaAluno && turmaGuilda !== turmaAluno) {
    return false;
  }

  const membros = Array.isArray(guilda.membros) ? guilda.membros : [];

  if (!membros.length) {
    return true;
  }

  return membros.some(membro => {
    if (typeof membro === "string") {
      return membro === usuarioAtual?.uid
        || normalizar(membro) === normalizar(perfilAluno?.nome);
    }

    return membro?.id === usuarioAtual?.uid
      || membro?.uid === usuarioAtual?.uid
      || normalizar(membro?.nome) === normalizar(perfilAluno?.nome);
  });
}

function renderizarGuildas() {
  const alvo = $("listaGuildas");
  const visiveis = guildas.filter(guildaPertenceAoAluno);

  if (!visiveis.length) {
    alvo.innerHTML = `
      <div class="vazio">Nenhuma guilda aprovada para sua turma.</div>
    `;
    return;
  }

  alvo.innerHTML = visiveis.map(guilda => {
    const membros = Array.isArray(guilda.membros) ? guilda.membros : [];
    const trabalhos = trabalhosGuilda.filter(
      trabalho => trabalho.guildaId === guilda.id
    );

    const membrosHTML = membros.length
      ? membros.map(membro => {
          const nome = typeof membro === "string"
            ? membro
            : membro?.nome || membro?.email || "Membro";

          const pontos = typeof membro === "object"
            ? Number(membro?.pontos || 0)
            : 0;

          return `
            <div class="guilda-membro">
              <span>${textoSeguro(nome)}</span>
              <strong>${pontos} pts</strong>
            </div>
          `;
        }).join("")
      : '<div class="vazio">Membros não informados.</div>';

    const trabalhosHTML = trabalhos.length
      ? trabalhos.map(trabalho => `
          <div class="trabalho-guilda">
            <strong>${textoSeguro(trabalho.titulo || "Trabalho")}</strong>
            <div>${textoSeguro(trabalho.descricao || trabalho.status || "")}</div>
          </div>
        `).join("")
      : '<div class="vazio">Nenhum trabalho de guilda publicado.</div>';

    return `
      <article class="guilda-card">
        <div class="guilda-topo">
          <div>
            <span class="etiqueta">${textoSeguro(guilda.categoria || "Guilda")}</span>
            <h3>${textoSeguro(guilda.nome || "Guilda")}</h3>
            <p>${textoSeguro(guilda.descricao || "")}</p>
          </div>
          <div class="guilda-pontos">${Number(guilda.pontos || 0)} pts</div>
        </div>
        <div class="guilda-membros">${membrosHTML}</div>
        <div class="trabalhos-guilda">
          <strong>Trabalhos</strong>
          ${trabalhosHTML}
        </div>
      </article>
    `;
  }).join("");
}

function renderizarPremiacoes() {
  const alvo = $("listaPremiacoes");

  if (!premiacoes.length) {
    alvo.innerHTML = `
      <div class="vazio">Nenhuma premiação ativa no momento.</div>
    `;
    return;
  }

  alvo.innerHTML = premiacoes.map(premio => {
    const minimo = Number(
      premio.pontosMinimos
      ?? premio.metaPontos
      ?? premio.pontos
      ?? 0
    );

    const desbloqueada = Number(pontuacaoAtual.pontosTotal || 0) >= minimo;

    return `
      <article class="premiacao-card ${desbloqueada ? "desbloqueada" : ""}">
        <span class="etiqueta">${desbloqueada ? "Desbloqueada" : "Bloqueada"}</span>
        <h3>${textoSeguro(premio.titulo || premio.nome || "Premiação")}</h3>
        <p>${textoSeguro(premio.descricao || "")}</p>
        ${minimo ? `<small>Requisito: ${minimo} pontos totais</small>` : ""}
      </article>
    `;
  }).join("");
}

function renderizarTudo() {
  renderizarResumo();
  renderizarAtividades();
  renderizarQuinzena();
  renderizarRanking();
  renderizarGuildas();
  renderizarPremiacoes();
}


/*====================================================
26 - DESAFIO DIÁRIO
====================================================*/

function validarDesafio(dados) {
  return dados
    && typeof dados.titulo === "string"
    && typeof dados.componente === "string"
    && typeof dados.enunciado === "string"
    && Array.isArray(dados.alternativas)
    && dados.alternativas.length >= 2
    && Number.isInteger(Number(dados.respostaCorreta));
}

function desafioFallback() {
  const lista = Array.isArray(dadosJSON?.desafiosFallback)
    ? dadosJSON.desafiosFallback
    : [];

  if (!lista.length) {
    return {
      titulo: "Desafio rápido",
      componente: "Conhecimentos gerais",
      enunciado: "Qual é o resultado de 2 + 2?",
      alternativas: ["4", "5", "3", "2"],
      respostaCorreta: 0,
      explicacao: "2 + 2 = 4.",
      fonte: "fallback"
    };
  }

  const indice = Math.abs(
    hojeISO().split("").reduce((soma, caractere) => soma + caractere.charCodeAt(0), 0)
  ) % lista.length;

  return {
    ...lista[indice],
    fonte: "fallback"
  };
}

async function gerarDesafioComIA() {
  const prompt = `
Crie UMA questão escolar curta para um aluno do ensino fundamental.
Turma: ${perfilAluno?.turma || "8A"}.
Use um dos componentes: ${(dadosJSON?.config?.componentes || []).join(", ")}.
A questão deve ter exatamente 4 alternativas, apenas uma correta, linguagem clara e uma explicação curta.
Não inclua pegadinhas e não dependa de fatos muito recentes.
`;

  const resultado = await modeloDesafio.generateContent(prompt);
  const texto = resultado.response.text();
  const desafio = JSON.parse(texto);

  if (!validarDesafio(desafio)) {
    throw new Error("Resposta da IA em formato inválido.");
  }

  return {
    titulo: desafio.titulo,
    componente: desafio.componente,
    enunciado: desafio.enunciado,
    alternativas: desafio.alternativas.slice(0, 4),
    respostaCorreta: Number(desafio.respostaCorreta),
    explicacao: desafio.explicacao || "",
    fonte: "Gemini"
  };
}

async function carregarDesafioDiario() {
  const alvo = $("desafioDiario");
  const data = hojeISO();

  $("desafioData").textContent = hojeLegivel();

  try {
    const referencia = doc(
      db,
      "desafiosDiariosTarefaSP",
      data
    );

    const salvo = await getDoc(referencia);

    if (salvo.exists() && validarDesafio(salvo.data())) {
      desafioAtual = {
        ...salvo.data(),
        id: data
      };
    }
    else {
      try {
        desafioAtual = {
          ...(await gerarDesafioComIA()),
          id: data
        };
      }
      catch (erroIA) {
        console.warn("Gemini indisponível, usando fallback:", erroIA);
        desafioAtual = {
          ...desafioFallback(),
          id: data
        };
      }

      try {
        await setDoc(
          referencia,
          {
            ...desafioAtual,
            criadoEm: serverTimestamp()
          },
          { merge: true }
        );
      }
      catch (erroSalvar) {
        console.warn("Não foi possível salvar o desafio diário:", erroSalvar);
      }
    }

    await renderizarDesafioDiario();
  }

  catch (erro) {
    console.error("Erro no desafio diário:", erro);
    desafioAtual = {
      ...desafioFallback(),
      id: data
    };
    await renderizarDesafioDiario();
  }
}

async function renderizarDesafioDiario() {
  const alvo = $("desafioDiario");

  if (!desafioAtual) {
    alvo.innerHTML = '<div class="vazio">Desafio indisponível.</div>';
    return;
  }

  const respostaId = `${desafioAtual.id}_${usuarioAtual.uid}`;
  let respostaSalva = DBLocal.obterDesafioDiario(respostaId);

  if (!respostaSalva) {
    try {
      const respostaDoc = await getDoc(
        doc(db, "respostasDesafioTarefaSP", respostaId)
      );

      if (respostaDoc.exists()) {
        respostaSalva = respostaDoc.data();
        DBLocal.salvarDesafioDiario(respostaId, respostaSalva);
      }
    }
    catch (erro) {
      console.warn("Resposta do desafio não pôde ser consultada:", erro);
    }
  }

  const alternativas = desafioAtual.alternativas
    .map((alternativa, indice) => `
      <label class="desafio-alternativa">
        <input
          type="radio"
          name="desafioResposta"
          value="${indice}"
          ${respostaSalva ? "disabled" : ""}
        >
        <span>${textoSeguro(alternativa)}</span>
      </label>
    `)
    .join("");

  const resultadoHTML = respostaSalva
    ? `
      <div class="desafio-resultado ${respostaSalva.correta ? "ok" : "erro"}">
        <strong>${respostaSalva.correta ? "Resposta correta." : "Resposta registrada."}</strong>
        <p>${textoSeguro(desafioAtual.explicacao || "")}</p>
      </div>
    `
    : "";

  alvo.innerHTML = `
    <article class="desafio-card">
      <div class="desafio-meta">
        <span class="etiqueta">${textoSeguro(desafioAtual.componente)}</span>
        <span class="etiqueta">+${Number(dadosJSON?.config?.pontosDesafioDiario || 10)} pts</span>
      </div>
      <h3>${textoSeguro(desafioAtual.titulo)}</h3>
      <p>${textoSeguro(desafioAtual.enunciado)}</p>
      <div class="desafio-alternativas">${alternativas}</div>
      ${respostaSalva ? "" : `
        <div class="desafio-acoes">
          <button id="responderDesafioBtn" class="botao-principal" type="button">
            Responder desafio
          </button>
        </div>
      `}
      ${resultadoHTML}
      <p class="desafio-fonte">Fonte: ${textoSeguro(desafioAtual.fonte || "desafio diário")}</p>
    </article>
  `;

  $("responderDesafioBtn")?.addEventListener(
    "click",
    responderDesafioDiario
  );
}

async function responderDesafioDiario() {
  const selecionada = document.querySelector(
    'input[name="desafioResposta"]:checked'
  );

  if (!selecionada || !desafioAtual) {
    aviso("Escolha uma alternativa no desafio diário.");
    return;
  }

  const botao = $("responderDesafioBtn");
  if (botao) botao.disabled = true;

  const indice = Number(selecionada.value);
  const correta = indice === Number(desafioAtual.respostaCorreta);
  const pontosGanhos = correta
    ? Number(dadosJSON?.config?.pontosDesafioDiario || 10)
    : 0;

  const respostaId = `${desafioAtual.id}_${usuarioAtual.uid}`;
  const semanaAtual = semanaId();
  const quinzena = quinzenaAtual();
  const quinzenaId = quinzena?.id || "sem-quinzena";

  // 1. Salva localmente
  const respostaLocal = {
    alunoId: usuarioAtual.uid,
    data: desafioAtual.id,
    alternativa: indice,
    correta,
    pontosRecebidos: pontosGanhos,
    respondidoEm: new Date().toISOString()
  };
  DBLocal.salvarDesafioDiario(respostaId, respostaLocal);

  const semanaAnterior = Number(pontuacaoAtual?.pontosSemana || 0);
  const quinzenaAnterior = Number(pontuacaoAtual?.pontosQuinzena || 0);
  const pontosTotalAnterior = Number(pontuacaoAtual?.pontosTotal || 0);

  pontuacaoAtual = {
    alunoId: usuarioAtual.uid,
    alunoNome: perfilAluno?.nome || usuarioAtual.email || "Aluno",
    turma: perfilAluno?.turma || "",
    semanaId: semanaAtual,
    quinzenaId,
    pontosSemana: semanaAnterior + pontosGanhos,
    pontosQuinzena: quinzenaAnterior + pontosGanhos,
    pontosTotal: pontosTotalAnterior + pontosGanhos
  };
  DBLocal.salvarPontuacaoOficial(usuarioAtual.uid, pontuacaoAtual);

  if (pontosGanhos > 0) {
    const p = DBLocal.obterPerfilAluno();
    if (p) {
      p.xp = Number(p.xp || 0) + pontosGanhos;
      p.nivel = Math.floor(p.xp / 100) + 1;
      DBLocal.salvarPerfilAluno(p);
    }
  }

  // 2. Tenta sincronizar com Firestore em segundo plano
  try {
    const respostaRef = doc(
      db,
      "respostasDesafioTarefaSP",
      respostaId
    );

    const pontosRef = doc(
      db,
      "pontuacaoTarefaSP",
      usuarioAtual.uid
    );

    await runTransaction(db, async transaction => {
      const respostaExistente = await transaction.get(respostaRef);
      if (respostaExistente.exists()) return;

      transaction.set(respostaRef, {
        ...respostaLocal,
        respondidoEm: serverTimestamp()
      });

      transaction.set(
        pontosRef,
        {
          ...pontuacaoAtual,
          atualizadoEm: serverTimestamp()
        },
        { merge: true }
      );
    });
  } catch (errSync) {
    console.warn("Sincronização em nuvem do desafio indisponível, salvo localmente:", errSync);
  }

  await Promise.all([
    carregarPontuacao(),
    carregarRanking().catch(erro => {
      console.warn("Ranking não pôde ser atualizado:", erro);
    })
  ]);

  renderizarTudo();
  await renderizarDesafioDiario();
  aviso(correta ? "Desafio correto. Pontos adicionados." : "Resposta registrada.");

  if (botao) botao.disabled = false;
}


/*====================================================
27 - MODAL E ACESSIBILIDADE
====================================================*/

function fecharModalAtividade() {
  $("modalAtividade").hidden = true;
  document.body.style.overflow = "";
  atividadeAtual = null;
}

$("fecharModal")?.addEventListener(
  "click",
  fecharModalAtividade
);

document
  .querySelectorAll("[data-fechar-modal]")
  .forEach(elemento => {
    elemento.addEventListener(
      "click",
      fecharModalAtividade
    );
  });

document.addEventListener("keydown", event => {
  if (event.key === "Escape" && !$("modalAtividade").hidden) {
    fecharModalAtividade();
  }
});

$("btnContraste")?.addEventListener("click", () => {
  document.body.classList.toggle("alto-contraste");
});

let vlibrasIniciado = false;

$("btnLibras")?.addEventListener("click", () => {
  const container = document.querySelector("[vw]");

  if (container) {
    container.hidden = false;
  }

  if (!vlibrasIniciado && window.VLibras) {
    try {
      new window.VLibras.Widget("https://vlibras.gov.br/app");
      vlibrasIniciado = true;
    }
    catch (erro) {
      console.warn("VLibras não pôde ser iniciado:", erro);
    }
  }

  document.querySelector("[vw-access-button]")?.click();
});

/*====================================================
TUTOR PEDAGÓGICO ACESSÍVEL (GEMINI) & LEITURA DE VOZ
====================================================*/
$("btnOuvirAtividadeAluno")?.addEventListener("click", () => {
  if (!atividadeAtual) return;
  const textoParaLer = `${atividadeAtual.titulo}. Componente ${atividadeAtual.componente}. ${atividadeAtual.enunciado || atividadeAtual.descricao || ""}`;
  if (window.AcessibilidadeSP && window.AcessibilidadeSP.falarTexto) {
    window.AcessibilidadeSP.falarTexto(textoParaLer, $("modalAtividade"));
  }
});

$("btnTutorIAAtividade")?.addEventListener("click", async () => {
  if (!atividadeAtual) return;
  const painel = $("painelTutorIA");
  const respostaEl = $("tutorIAResposta");
  const badgeEl = $("badgeTutorIAStatus");
  const btn = $("btnTutorIAAtividade");

  if (painel) painel.style.display = "block";
  if (btn) btn.disabled = true;
  if (badgeEl) badgeEl.textContent = "Consultando IA...";
  if (respostaEl) respostaEl.innerHTML = `<span style="color:#0284c7;">Pensando em uma dica pedagógica acessível para você...</span>`;

  try {
    const res = await fetch("/api/ai/tutor-acessivel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        duvida: "Explique como pensar para resolver este exercício de forma simples e inclusiva",
        atividadeEnunciado: atividadeAtual.enunciado || atividadeAtual.descricao || atividadeAtual.titulo,
        componente: atividadeAtual.componente,
        nivel: "Ensino Fundamental II / Médio"
      })
    });
    const dados = await res.json();
    if (dados.sucesso && dados.dica) {
      if (respostaEl) respostaEl.textContent = dados.dica;
      if (badgeEl) badgeEl.textContent = dados.motor || "Gemini 3.8 Flash";
    } else {
      if (respostaEl) respostaEl.textContent = "Dica: Leia atentamente os dados do problema, identifique as palavras-chave e tente relacioná-las com o que aprendemos em aula!";
      if (badgeEl) badgeEl.textContent = "Dica Pedagógica";
    }
  } catch (err) {
    console.error("Erro no tutor IA:", err);
    if (respostaEl) respostaEl.textContent = "Dica inclusiva: Respire fundo, leia cada alternativa com calma e elimine primeiro as opções que claramente não fazem sentido.";
    if (badgeEl) badgeEl.textContent = "Dica Inclusiva";
  } finally {
    if (btn) btn.disabled = false;
  }
});
