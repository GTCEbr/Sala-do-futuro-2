// Sala do Futuro V2
// Area do aluno

/*========================================
VLIBRAS
========================================*/
if (window.VLibras) {
  new window.VLibras.Widget("https://vlibras.gov.br/app");
}

/*========================================
FIREBASE & LOCAL DB
========================================*/
import DBLocal from "../../../js/db-local.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";

import {
  getAuth,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";

import {
  getFirestore,
  collection,
  getDocs,
  getDoc,
  doc,
  query,
  where,
  setDoc,
  serverTimestamp as firestoreTimestamp
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

import {
  getDatabase,
  ref,
  set,
  get,
  serverTimestamp as realtimeTimestamp
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-database.js";


const firebaseConfig = {
  apiKey: "AIzaSyCey_SsTCeHuTKwBaZ-Eo6_7LRa4l-5A80",
  authDomain: "salafuturov2prot.firebaseapp.com",
  projectId: "salafuturov2prot",
  storageBucket: "salafuturov2prot.firebasestorage.app",
  messagingSenderId: "352042722106",
  appId: "1:352042722106:web:395ba7ef400d1421426603",
  measurementId: "G-LW16X3NHH8"
};


// Se for usar a publicação diária,
// cole aqui a URL EXATA do Realtime Database.
//
// O restante do protótipo funciona sem ela.
const realtimeDatabaseURL =
  "https://salafuturov2prot-default-rtdb.firebaseio.com/";


/*========================================
INICIAR
========================================*/

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getFirestore(app);


const realtimeConfigurado =
  /^https:\/\//i.test(realtimeDatabaseURL);


const realtime =
  realtimeConfigurado
    ? getDatabase(app, realtimeDatabaseURL)
    : null;


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


  if (nome === "tarefas") {

    renderizarTarefas();

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

// Inicialização imediata 100% offline
carregarPerfilAlunoCompleto(null);

onAuthStateChanged(
  auth,
  async user => {
    if (user) {
      await carregarPerfilAlunoCompleto(user);
    }
  }
);


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


/*========================================
PROGRESSAO
========================================*/

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

    $("barraXpPreenchida")
      .style
      .width =
      porcentagem + "%";

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

    // Se houver tarefas no Firestore, mescla também em modo resiliente
    try {
      const [tarefasResultado, entregasResultado] = await Promise.allSettled([
        getDocs(collection(db, "tarefas")),
        getDocs(query(collection(db, "entregas"), where("alunoId", "==", usuarioAtual.uid)))
      ]);

      if (entregasResultado.status === "fulfilled") {
        entregasResultado.value.forEach(item => {
          const entrega = item.data();
          if (entrega.tarefaId) {
            entregasCache.set(entrega.tarefaId, { id: item.id, ...entrega });
          }
        });
      }

      if (tarefasResultado.status === "fulfilled") {
        tarefasResultado.value.forEach(item => {
          if (!tarefasCache.some(t => t.id === item.id)) {
            const tarefa = { id: item.id, ...item.data() };
            const turmaTarefa = normalizarTurma(tarefa.turma);
            const mesmaTurma = !turmaTarefa || turmaTarefa === "TODOS" || turmaTarefa === "GERAL" || turmaTarefa === turmaAluno;
            if (mesmaTurma && tarefa.ativa !== false) {
              tarefasCache.push(tarefa);
            }
          }
        });
      }
    } catch(e) {}


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


function renderizarTarefas() {

  const lista =
    $("listaTarefas");


  if (!lista) {

    return;

  }


  let itens =
    tarefasCache;


  if (
    filtroTarefaAtual
    === "pendentes"
  ) {

    itens =
      tarefasCache.filter(
        tarefa =>
          !entregasCache.has(
            tarefa.id
          )
      );

  }


  if (
    filtroTarefaAtual
    === "entregues"
  ) {

    itens =
      tarefasCache.filter(
        tarefa =>
          entregasCache.has(
            tarefa.id
          )
      );

  }


  if (!itens.length) {

    lista.innerHTML =
      '<p class="vazio">Nenhuma atividade nesta categoria.</p>';

    return;

  }


  lista.innerHTML =
    itens.map(
      tarefa => {

        const entregue =
          entregasCache.has(
            tarefa.id
          );


        const atraso =
          tarefaAtrasada(
            tarefa
          );


        const descricao =
          tarefa.descricao
          || "Sem descrição adicional.";


        return `

          <article class="tarefa-card">

            <div class="tarefa-topo">

              <div>

                <h2>
                  ${textoSeguro(
                    tarefa.titulo
                    || "Atividade"
                  )}
                </h2>

                <p>
                  ${textoSeguro(
                    descricao
                  )}
                </p>

              </div>


              <span
                class="etiqueta ${
                  entregue
                    ? "ok"
                    : atraso
                      ? "atrasada"
                      : ""
                }"
              >
                ${
                  entregue
                    ? "Entregue"
                    : atraso
                      ? "Prazo encerrado"
                      : "Pendente"
                }
              </span>

            </div>


            <div class="tarefa-meta">

              <span class="etiqueta">

                ${textoSeguro(
                  tarefa.turma
                  || perfilAluno.turma
                  || "Turma"
                )}

              </span>


              <span class="etiqueta">

                ${Number(
                  tarefa.xp || 0
                )} XP

              </span>


              <span class="etiqueta">

                Prazo:
                ${textoSeguro(
                  dataLegivel(
                    tarefa.prazo
                  )
                )}

              </span>


              <span class="etiqueta">

                ID:
                ${textoSeguro(
                  tarefa.id
                )}

              </span>

            </div>


            ${
              entregue

              ? `

                <div class="entrega-ja-feita">

                  Entrega registrada.

                  Status:

                  ${textoSeguro(
                    entregasCache
                      .get(tarefa.id)
                      .status
                    || "entregue"
                  )}.

                </div>

              `

              : `

                <form
                  class="form-entrega"
                  data-tarefa-id="${textoSeguro(
                    tarefa.id
                  )}"
                >

                  <label
                    for="resposta-${textoSeguro(
                      tarefa.id
                    )}"
                  >

                    <strong>
                      Resposta / observação
                    </strong>

                  </label>


                  <textarea
                    id="resposta-${textoSeguro(
                      tarefa.id
                    )}"
                    maxlength="3000"
                    required
                    placeholder="Digite sua resposta ou observação"
                  ></textarea>


                  <button
                    class="botao-primario"
                    type="submit"
                  >

                    Entregar atividade

                  </button>


                  <div
                    class="mensagem-status"
                    aria-live="polite"
                  ></div>

                </form>

              `
            }

          </article>

        `;

      }
    )
    .join("");


  lista
    .querySelectorAll(
      ".form-entrega"
    )
    .forEach(form => {

      form.addEventListener(
        "submit",
        enviarEntrega
      );

    });

}


async function enviarEntrega(event) {

  event.preventDefault();


  const form =
    event.currentTarget;


  const tarefaId =
    form.dataset.tarefaId;


  const textarea =
    form.querySelector(
      "textarea"
    );


  const botao =
    form.querySelector(
      "button"
    );


  const status =
    form.querySelector(
      ".mensagem-status"
    );


  const resposta =
    textarea.value.trim();


  if (
    !resposta
    || !tarefaId
    || !usuarioAtual
  ) {

    return;

  }


  botao.disabled =
    true;


  status.className =
    "mensagem-status info";


  status.textContent =
    "Enviando...";


  try {

    const entregaId =
      `${usuarioAtual.uid}_${tarefaId}`;


    const entregaRef =
      doc(
        db,
        "entregas",
        entregaId
      );


    const existente =
      await getDoc(
        entregaRef
      );


    if (existente.exists()) {

      status.className =
        "mensagem-status erro";


      status.textContent =
        "Esta atividade já foi entregue.";


      await carregarTarefas();


      return;

    }


    // 1. Salva diretamente no DBLocal oficial de demonstração
    const dadosEntrega = {
      id: entregaId,
      tarefaId: tarefaId,
      alunoId: usuarioAtual.uid,
      alunoNome: perfilAluno.nome || "Aluno",
      turma: perfilAluno.turma || "",
      resposta: resposta,
      status: "entregue",
      xpGanha: 50,
      criadoEm: new Date().toISOString()
    };
    DBLocal.salvarEntregaDocente(dadosEntrega);

    // Concede XP e atualiza localmente
    perfilAluno.xp = (perfilAluno.xp || 420) + 50;
    perfilAluno.nivel = Math.max(1, Math.floor(perfilAluno.xp / 100));
    DBLocal.salvarAluno(perfilAluno);
    atualizarProgresso();

    // Sincronização secundária não bloqueante com Firestore
    try {
      setDoc(entregaRef, {
        ...dadosEntrega,
        entregueEm: firestoreTimestamp()
      }).catch(() => {});
    } catch(errSync) {}

    status.className =
      "mensagem-status ok";

    status.textContent =
      "Atividade entregue com sucesso! +50 XP ganhos.";

    await carregarTarefas();

  }

  catch (erro) {

    console.error(
      "Erro na entrega:",
      erro
    );


    status.className =
      "mensagem-status erro";


    status.textContent =
      "Não foi possível entregar. Confira as regras do Firestore.";

  }

  finally {

    botao.disabled =
      false;

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

    // Sincronização secundária não bloqueante com Firestore
    try {
      const destinos = [...new Set([turma, "todos", "TODOS", email].filter(Boolean))];
      const consultas = [];
      if (destinos.length) {
        consultas.push(getDocs(query(collection(db, "comunicacoes"), where("destino", "in", destinos))));
      }
      consultas.push(getDocs(query(collection(db, "avisos"), where("turma", "in", [turma || "SEM_TURMA", "TODOS"]))));
      const resultados = await Promise.allSettled(consultas);
      resultados.forEach(res => {
        if (res.status === "fulfilled") {
          res.value.forEach(item => {
            if (!mensagens.some(m => m.id === item.id)) {
              mensagens.push({ id: item.id, tipoMensagem: "Mural", ...item.data() });
            }
          });
        }
      });
    } catch(errSync) {}


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

if (
  !realtimeConfigurado
  && $("avisoRealtime")
) {

  $("avisoRealtime").hidden =
    false;

}


$("atividadeDiaForm")
  ?.addEventListener(
    "submit",
    async event => {

      event.preventDefault();


      if (
        !usuarioAtual
        || !realtime
      ) {

        mostrarStatusMensagem(
          "erro",
          "Realtime Database ainda não foi configurado."
        );

        return;

      }


      const titulo =
        $("atividadeTitulo")
          .value
          .trim();


      const mensagem =
        $("atividadeTexto")
          .value
          .trim();


      const hoje =
        hojeISO();


      const referencia =
        ref(
          realtime,
          `mensagensAlunos/${usuarioAtual.uid}/${hoje}`
        );


      try {

        const resultado =
          await get(
            referencia
          );


        if (resultado.exists()) {

          mostrarStatusMensagem(
            "erro",
            "Você já publicou a mensagem de hoje."
          );

          return;

        }


        await set(
          referencia,
          {

            alunoId:
              usuarioAtual.uid,

            alunoNome:
              perfilAluno.nome
              || "Aluno",

            email:
              usuarioAtual.email
              || "",

            turma:
              perfilAluno.turma
              || "",

            escolaId:
              perfilAluno.escolaId
              || "",

            data:
              hoje,

            titulo:
              titulo,

            mensagem:
              mensagem,

            criadoEm:
              realtimeTimestamp()

          }
        );


        $("atividadeDiaForm")
          .reset();


        mostrarStatusMensagem(
          "ok",
          "Publicação diária registrada."
        );


        await atualizarPublicacaoDiaria();

      }

      catch (erro) {

        console.error(
          "Erro no Realtime Database:",
          erro
        );


        mostrarStatusMensagem(
          "erro",
          "Não foi possível publicar. Confira a URL e as regras do Realtime Database."
        );

      }

    }
  );


function mostrarStatusMensagem(
  tipo,
  texto
) {

  const elemento =
    $("atividadeMensagem");


  if (!elemento) {

    return;

  }


  elemento.className =
    "mensagem-status " + tipo;


  elemento.textContent =
    texto;

}


async function atualizarPublicacaoDiaria() {

  if (
    !usuarioAtual
    || !realtime
  ) {

    return;

  }


  try {

    const referencia =
      ref(
        realtime,
        `mensagensAlunos/${usuarioAtual.uid}/${hojeISO()}`
      );


    const resultado =
      await get(
        referencia
      );


    if (resultado.exists()) {

      mostrarStatusMensagem(
        "ok",
        "A publicação de hoje já foi enviada."
      );


      const botao =
        $("atividadeDiaForm")
          ?.querySelector(
            'button[type="submit"]'
          );


      if (botao) {

        botao.disabled =
          true;

      }

    }

  }

  catch (erro) {

    console.error(
      "Falha ao verificar publicação diária:",
      erro
    );

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
    async () => {
      DBLocal.fazerLogout();
      try {
        await signOut(auth);
      } catch (e) {}

      window.location.href =
        rotas.login;
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
