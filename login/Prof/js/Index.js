// professor.js
// Sala do Futuro V2

import DBLocal from "../../js/db-local.js";
import { initializeApp }
from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";

import {
  getAuth,
  onAuthStateChanged,
  signOut
}
from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";

import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  query,
  where,
  serverTimestamp,
  increment
}
from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";


/*----------Firebase----------*/

const firebaseConfig = {

  apiKey:
  "AIzaSyCey_SsTCeHuTKwBaZ-Eo6_7LRa4l-5A80",

  authDomain:
  "salafuturov2prot.firebaseapp.com",

  projectId:
  "salafuturov2prot",

  storageBucket:
  "salafuturov2prot.firebasestorage.app",

  messagingSenderId:
  "352042722106",

  appId:
  "1:352042722106:web:395ba7ef400d1421426603",

  measurementId:
  "G-LW16X3NHH8"

};


const app =
initializeApp(firebaseConfig);

const auth =
getAuth(app);

const db =
getFirestore(app);

let usuarioAtual = null;


/*----------Atalho----------*/

function $(id) {

  return document
  .getElementById(id);

}


/*----------Mensagem----------*/

function mensagem(
  id,
  tipo,
  texto
) {

  const elemento = $(id);

  if (!elemento) {
    return;
  }

  elemento.className =
  "mensagem mostrar " + tipo;

  elemento.textContent =
  texto;

}


/*----------Turma----------*/

function turma(valor) {

  return String(valor || "")
  .trim()
  .toUpperCase()
  .replace(/\s+/g, "");

}


/*----------Segurança do texto----------*/

function textoSeguro(valor) {

  return String(valor ?? "")

  .replaceAll(
    "&",
    "&amp;"
  )

  .replaceAll(
    "<",
    "&lt;"
  )

  .replaceAll(
    ">",
    "&gt;"
  );

}


/*----------Gerar codigo----------*/

function gerarCodigo(
  tamanho = 10
) {

  const letras =
  "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  const numeros =
  new Uint32Array(tamanho);

  crypto.getRandomValues(
    numeros
  );

  let codigo = "";

  for (
    let i = 0;
    i < tamanho;
    i++
  ) {

    codigo +=
    letras[
      numeros[i] %
      letras.length
    ];

  }

  return codigo;

}


/*========================================
LOGIN E INICIALIZAÇÃO OFFLINE
========================================*/

function inicializarPerfilDocenteLocal() {
  const ativo = DBLocal.obterUsuarioAtivo();
  if (ativo && (ativo.tipo === "professor" || ativo.tipo === "docente")) {
    usuarioAtual = {
      uid: ativo.id,
      email: ativo.email || "professor@escola.sp.gov.br",
      nome: ativo.nome || "Prof. Carlos Eduardo Silva"
    };
  } else {
    usuarioAtual = {
      uid: "prof_1",
      email: "professor@escola.sp.gov.br",
      nome: "Prof. Carlos Eduardo Silva"
    };
  }

  if ($("professorEmail")) {
    $("professorEmail").textContent = `${usuarioAtual.nome} | ${usuarioAtual.email}`;
  }

  if ($("statusFirebase")) {
    $("statusFirebase").textContent = "Painel do Docente Conectado (100% Offline)";
  }

  atualizarPainel();
}

// Inicialização imediata offline
inicializarPerfilDocenteLocal();

onAuthStateChanged(
auth,
async function(user) {
  if (user) {
    usuarioAtual = user;
    if ($("professorEmail")) {
      $("professorEmail").textContent = user.email || user.uid;
    }
    if ($("statusFirebase")) {
      $("statusFirebase").textContent = "Docente Conectado";
    }

    try {
      const perfil = await getDoc(doc(db, "usuarios", user.uid));
      if (perfil.exists()) {
        const dados = perfil.data();
        if (dados.nome && $("professorEmail")) {
          $("professorEmail").textContent = dados.nome + " | " + user.email;
        }
      }
    } catch (erro) {
      console.warn("Sincronização em nuvem não disponível, operando em modo offline.");
    }
    atualizarPainel();
  }
});


/*----------Sair----------*/

if ($("sairBtn")) {
  $("sairBtn").addEventListener("click", async function() {
    DBLocal.fazerLogout();
    try {
      await signOut(auth);
    } catch(e) {}
    window.location.href = "../logingov.html";
  });
}


/*========================================
MENU
========================================*/

function abrirPagina(nome) {

  document
  .querySelectorAll(
    ".pagina"
  )

  .forEach(
  function(pagina) {

    pagina.classList
    .remove("ativa");

  });


  const pagina =
  $("pagina-" + nome);


  if (pagina) {

    pagina.classList
    .add("ativa");

  }


  document
  .querySelectorAll(
    ".menu-botao"
  )

  .forEach(
  function(botao) {

    botao.classList
    .remove("ativo");

  });


  const botao =

  document
  .querySelector(

    '[data-pagina="' +
    nome +
    '"]'

  );


  if (botao) {

    botao.classList
    .add("ativo");

  }

}


document
.querySelectorAll(
  "[data-pagina]"
)

.forEach(
function(botao) {

  botao
  .addEventListener(
  "click",
  function() {

    abrirPagina(
      botao.dataset.pagina
    );

  });

});


/*----------Documentos----------*/

if ($("documentosBtn")) {

  $("documentosBtn")
  .addEventListener(
  "click",
  function() {

    alert(
      "Documentos ainda não disponível."
    );

  });

}


/*========================================
REGISTRAR AULA
========================================*/

if ($("aulaForm")) {

  $("aulaForm")
  .addEventListener(
  "submit",
  async function(event) {

    event.preventDefault();


    const titulo =
    $("aulaTitulo")
    .value
    .trim();


    const classe =
    turma(
      $("aulaTurma").value
    );


    const data =
    $("aulaData").value;


    const conteudo =
    $("aulaConteudo")
    .value
    .trim();


    const xp =
    Number(
      $("aulaXp").value
    );


    const prazo =
    $("aulaPrazo").value;


    const tarefas =

    $("aulaTarefas")
    .value

    .split("\n")

    .map(
      item =>
      item.trim()
    )

    .filter(Boolean);


    try {

      mensagem(
        "aulaMensagem",
        "info",
        "Registrando aula..."
      );


      const aula =

      await addDoc(

        collection(
          db,
          "aulas"
        ),

        {

          titulo:
          titulo,

          turma:
          classe,

          data:
          data,

          conteudo:
          conteudo,

          professorId:
          usuarioAtual.uid,

          criadoEm:
          serverTimestamp()

        }

      );


/*----------Criar tarefas automaticas----------*/

      const ids = [];

      for (let i = 0; i < tarefas.length; i++) {
        const tarefa = tarefas[i];
        const novaTarefaLocal = {
          id: "aula_tar_" + Date.now() + "_" + i,
          titulo: tarefa,
          turma: classe,
          xp: xp,
          prazo: prazo || null,
          aulaId: aula.id,
          professorId: usuarioAtual?.uid || "prof_seduc",
          ativa: true,
          criadoEm: new Date().toISOString()
        };

        DBLocal.salvarTarefaDocente(novaTarefaLocal);
        ids.push(novaTarefaLocal.id);

        try {
          addDoc(collection(db, "tarefas"), {
            titulo: tarefa,
            turma: classe,
            xp: xp,
            prazo: prazo || null,
            aulaId: aula.id,
            professorId: usuarioAtual?.uid || "prof_seduc",
            ativa: true,
            criadoEm: serverTimestamp()
          }).catch(() => {});
        } catch(eTar) {}
      }


      mensagem(

        "aulaMensagem",

        "ok",

        "Aula registrada. " +
        tarefas.length +
        " tarefa(s) criada(s)."

      );


      console.log(
        "IDs:",
        ids
      );


      $("aulaForm")
      .reset();


      $("aulaXp")
      .value = 10;


      carregarTarefas();

      atualizarPainel();

    }


    catch(erro) {

      console.error(
        erro
      );


      mensagem(

        "aulaMensagem",

        "erro",

        "Erro ao registrar aula."

      );

    }

  });

}


/*========================================
CRIAR TAREFA MANUAL
========================================*/

if ($("tarefaForm")) {

  $("tarefaForm")
  .addEventListener(
  "submit",
  async function(event) {

    event.preventDefault();


    try {
      const novaTarefaLocal = {
        id: "tar_man_" + Date.now(),
        titulo: $("tarefaTitulo").value.trim(),
        turma: turma($("tarefaTurma").value),
        xp: Number($("tarefaXp").value),
        prazo: $("tarefaPrazo").value || null,
        descricao: $("tarefaDescricao").value.trim(),
        professorId: usuarioAtual?.uid || "prof_seduc",
        ativa: true,
        criadoEm: new Date().toISOString()
      };

      DBLocal.salvarTarefaDocente(novaTarefaLocal);

      try {
        addDoc(collection(db, "tarefas"), {
          ...novaTarefaLocal,
          criadoEm: serverTimestamp()
        }).catch(() => {});
      } catch(eSync) {}

      mensagem(
        "tarefaMensagem",
        "ok",
        "Tarefa criada com sucesso no banco local. ID: " + novaTarefaLocal.id
      );


      $("tarefaForm")
      .reset();


      $("tarefaXp")
      .value = 10;


      carregarTarefas();

      atualizarPainel();

    }


    catch(erro) {

      console.error(
        erro
      );


      mensagem(

        "tarefaMensagem",

        "erro",

        "Erro ao criar tarefa."

      );

    }

  });

}


/*========================================
LISTAR TAREFAS
========================================*/

async function carregarTarefas() {
  const tabela = $("tarefasTabela");
  if (!tabela) return;

  tabela.innerHTML = "";

  try {
    const tarefasLocais = DBLocal.obterTarefasDocentes();
    const mapaTarefas = new Map();
    tarefasLocais.forEach(t => mapaTarefas.set(t.id, t));

    try {
      const resultado = await getDocs(collection(db, "tarefas"));
      resultado.forEach(doc => {
        if (!mapaTarefas.has(doc.id)) {
          mapaTarefas.set(doc.id, { id: doc.id, ...doc.data() });
        }
      });
    } catch (eSync) {}

    const lista = Array.from(mapaTarefas.values());

    lista.forEach(function(tarefa) {
      tabela.insertAdjacentHTML(
        "beforeend",
        `
        <tr>
          <td>${textoSeguro(tarefa.id)}</td>
          <td>${textoSeguro(tarefa.titulo)}</td>
          <td>${textoSeguro(tarefa.turma)}</td>
          <td>${textoSeguro(tarefa.xp || 0)}</td>
          <td>${textoSeguro(tarefa.prazo || "-")}</td>
        </tr>
        `
      );
    });

    if (lista.length === 0) {
      tabela.innerHTML = `<tr><td colspan="5">Nenhuma tarefa cadastrada.</td></tr>`;
    }
  } catch(erro) {
    console.error("Erro ao carregar tarefas:", erro);
  }
}


if ($("carregarTarefasBtn")) {

  $("carregarTarefasBtn")
  .addEventListener(

    "click",

    carregarTarefas

  );

}


/*========================================
ENTREGAS POR ID
========================================*/

if ($("buscarEntregasBtn")) {

  $("buscarEntregasBtn")
  .addEventListener(
  "click",
  async function() {

    const tarefaId =

    $("entregaTarefaId")
    .value
    .trim();


    const tabela =
    $("entregasTabela");


    try {
      const entregasLocais = DBLocal.obterEntregasDocentes();
      const entregasFiltradas = entregasLocais.filter(e => !tarefaId || e.tarefaId === tarefaId);

      const mapaEntregas = new Map();
      entregasFiltradas.forEach(e => mapaEntregas.set(e.id, e));

      try {
        const pesquisa = tarefaId
          ? query(collection(db, "entregas"), where("tarefaId", "==", tarefaId))
          : collection(db, "entregas");
        const resultado = await getDocs(pesquisa);
        resultado.forEach(doc => {
          if (!mapaEntregas.has(doc.id)) {
            mapaEntregas.set(doc.id, { id: doc.id, ...doc.data() });
          }
        });
      } catch (eSync) {}

      tabela.innerHTML = "";
      const lista = Array.from(mapaEntregas.values());

      lista.forEach(function(entrega) {
        tabela.insertAdjacentHTML(
          "beforeend",
          `
          <tr>
            <td>${textoSeguro(entrega.alunoNome || entrega.alunoEmail || "-")}</td>
            <td>${textoSeguro(entrega.alunoId || "-")}</td>
            <td>${textoSeguro(entrega.status || "entregue")}</td>
          </tr>
          `
        );
      });

      if (lista.length === 0) {
        tabela.innerHTML = `<tr><td colspan="3">Nenhuma entrega registrada para esta tarefa.</td></tr>`;
      }

      mensagem(
        "entregaMensagem",
        "ok",
        lista.length + " entrega(s) encontrada(s)."
      );
    }


    catch(erro) {

      console.error(
        erro
      );

    }

  });

}


/*========================================
BUSCAR ALUNOS
========================================*/

async function buscarAlunos() {
  const locais = DBLocal.obterAlunos();
  if (locais && locais.length > 0) {
    return locais;
  }

  try {
    const resultado = await getDocs(
      collection(
        db,
        "usuarios"
      )
    );

    const alunos = [];
    resultado.forEach(function(documento) {
      const dados = documento.data();
      if (dados.tipo === "aluno") {
        alunos.push({
          id: documento.id,
          ...dados
        });
      }
    });

    return alunos.length > 0 ? alunos : DBLocal.obterAlunos();
  } catch(e) {
    return DBLocal.obterAlunos();
  }
}


/*========================================
CHAMADA
========================================*/

if ($("carregarChamadaBtn")) {

  $("carregarChamadaBtn")
  .addEventListener(
  "click",
  async function() {

    const classe =

    turma(
      $("chamadaTurma")
      .value
    );


    const alunos =
    await buscarAlunos();


    const lista =
    $("listaChamada");


    lista.innerHTML =
    "";


    alunos

    .filter(
      aluno =>
      turma(aluno.turma)
      === classe
    )

    .forEach(
    function(aluno) {


      lista
      .insertAdjacentHTML(

      "beforeend",

      `

      <div
        class="aluno-chamada"
        data-id="${aluno.id}"
      >

        <strong>
          ${textoSeguro(
            aluno.nome
          )}
        </strong>


        <select
          class="presenca"
        >

          <option value="presente">
            Presente
          </option>

          <option value="ausente">
            Ausente
          </option>

          <option value="justificado">
            Justificado
          </option>

        </select>


        <input
          class="comportamento"
          placeholder="Comportamento"
        >

      </div>

      `

      );

    });

  });

}


/*----------Salvar chamada----------*/

if ($("salvarChamadaBtn")) {

  $("salvarChamadaBtn")
  .addEventListener(
  "click",
  async function() {

    const registros = [];


    document
    .querySelectorAll(
      ".aluno-chamada"
    )

    .forEach(
    function(aluno) {

      registros.push({

        alunoId:
        aluno.dataset.id,

        presenca:
        aluno
        .querySelector(
          ".presenca"
        )
        .value,

        comportamento:
        aluno
        .querySelector(
          ".comportamento"
        )
        .value

      });

    });


    try {

      await addDoc(

        collection(
          db,
          "chamadas"
        ),

        {

          turma:
          turma(
            $("chamadaTurma")
            .value
          ),

          data:
          $("chamadaData")
          .value,

          registros:
          registros,

          professorId:
          usuarioAtual.uid,

          criadoEm:
          serverTimestamp()

        }

      );


      mensagem(

        "chamadaMensagem",

        "ok",

        "Chamada salva."

      );

    }


    catch(erro) {

      console.error(
        erro
      );

    }

  });

}


/*========================================
GUILDAS
========================================*/

async function carregarGuildas() {

  const tabela =
  $("guildasTabela");


  if (!tabela) {
    return;
  }


  tabela.innerHTML = "";

  try {
    const guildasLocais = DBLocal.obterGuildas();
    const mapaGuildas = new Map();
    guildasLocais.forEach(g => mapaGuildas.set(g.id, g));

    try {
      const resultado = await getDocs(collection(db, "guildas"));
      resultado.forEach(doc => {
        if (!mapaGuildas.has(doc.id)) {
          mapaGuildas.set(doc.id, { id: doc.id, ...doc.data() });
        }
      });
    } catch (eSync) {}

    const lista = Array.from(mapaGuildas.values());

    lista.forEach(function(guilda) {
      tabela.insertAdjacentHTML(
        "beforeend",
        `
        <tr>
          <td>${textoSeguro(guilda.nome || guilda.id)}</td>
          <td>${textoSeguro(guilda.turma || "-")}</td>
          <td>${textoSeguro(guilda.status || "pendente")}</td>
          <td>
            <button class="aprovarGuilda" data-id="${guilda.id}">Aprovar</button>
            <button class="rejeitarGuilda" data-id="${guilda.id}">Rejeitar</button>
          </td>
        </tr>
        `
      );
    });

    if (lista.length === 0) {
      tabela.innerHTML = `<tr><td colspan="4">Nenhuma guilda cadastrada.</td></tr>`;
    }

    /*----------Aprovar----------*/
    document.querySelectorAll(".aprovarGuilda").forEach(function(botao) {
      botao.addEventListener("click", async function() {
        const id = botao.dataset.id;
        const guilda = mapaGuildas.get(id) || { id, status: "aprovada" };
        guilda.status = "aprovada";
        DBLocal.salvarGuilda(guilda);

        try {
          await updateDoc(doc(db, "guildas", id), { status: "aprovada" });
        } catch (e) {}

        carregarGuildas();
      });
    });

    /*----------Rejeitar----------*/
    document.querySelectorAll(".rejeitarGuilda").forEach(function(botao) {
      botao.addEventListener("click", async function() {
        const id = botao.dataset.id;
        const guilda = mapaGuildas.get(id) || { id, status: "rejeitada" };
        guilda.status = "rejeitada";
        DBLocal.salvarGuilda(guilda);

        try {
          await updateDoc(doc(db, "guildas", id), { status: "rejeitada" });
        } catch (e) {}

        carregarGuildas();
      });
    });
  } catch(erro) {
    console.error("Erro ao carregar guildas:", erro);
  }

}


if ($("carregarGuildasBtn")) {

  $("carregarGuildasBtn")
  .addEventListener(

    "click",

    carregarGuildas

  );

}


/*========================================
RANKING
========================================*/

async function carregarRanking() {

  const tabela =
  $("rankingTabela");


  if (!tabela) {
    return;
  }


  const alunos =
  await buscarAlunos();


  alunos.sort(

    (a,b) =>

    Number(b.xp || 0) -
    Number(a.xp || 0)

  );


  tabela.innerHTML =
  "";


  alunos
  .forEach(
  function(aluno, posicao) {


    tabela
    .insertAdjacentHTML(

    "beforeend",

    `

    <tr>

      <td>
        ${posicao + 1}
      </td>

      <td>
        ${textoSeguro(
          aluno.nome ||
          aluno.id
        )}
      </td>

      <td>
        ${textoSeguro(
          aluno.turma ||
          "-"
        )}
      </td>

      <td>
        ${aluno.xp || 0}
      </td>

      <td>

        <input
          id="xp-${aluno.id}"
          type="number"
          min="1"
          max="50"
          value="10"
        >

        <button
          class="darXp"
          data-id="${aluno.id}"
        >
          Dar XP
        </button>

      </td>

    </tr>

    `

    );

  });


  document
  .querySelectorAll(
    ".darXp"
  )

  .forEach(
  function(botao) {

    botao
    .addEventListener(
    "click",
    async function() {

      const alunoId =
      botao.dataset.id;


      const xp =

      Number(

        $("xp-" + alunoId)
        .value

      );


      if (
        xp < 1 ||
        xp > 50
      ) {

        alert(
          "Máximo de 50 XP."
        );

        return;

      }


      await updateDoc(

        doc(
          db,
          "usuarios",
          alunoId
        ),

        {

          xp:
          increment(xp)

        }

      );


      carregarRanking();

    });

  });

}


if ($("carregarRankingBtn")) {

  $("carregarRankingBtn")
  .addEventListener(

    "click",

    carregarRanking

  );

}


/*========================================
COMUNICA SP
========================================*/

if ($("comunicaForm")) {

  $("comunicaForm")
  .addEventListener(
  "submit",
  async function(event) {

    event.preventDefault();


    await addDoc(

      collection(
        db,
        "comunicacoes"
      ),

      {

        destino:
        $("comunicaDestino")
        .value,

        titulo:
        $("comunicaTitulo")
        .value,

        mensagem:
        $("comunicaMensagemTexto")
        .value,

        professorId:
        usuarioAtual.uid,

        criadoEm:
        serverTimestamp()

      }

    );


    mensagem(

      "comunicaMensagem",

      "ok",

      "Mensagem enviada."

    );


    $("comunicaForm")
    .reset();

  });

}


/*========================================
TOTENS
========================================*/

if ($("totemForm")) {

  $("totemForm")
  .addEventListener(
  "submit",
  async function(event) {

    event.preventDefault();


    const codigo =
    gerarCodigo(8);


    await addDoc(

      collection(
        db,
        "totens"
      ),

      {

        titulo:
        $("totemTitulo")
        .value,

        turma:
        turma(
          $("totemTurma")
          .value
        ),

        tarefaId:
        $("totemTarefaId")
        .value || null,

        tipo:
        $("totemTipo")
        .value,

        codigo:
        codigo,

        professorId:
        usuarioAtual.uid,

        criadoEm:
        serverTimestamp()

      }

    );


    mensagem(

      "totemMensagem",

      "ok",

      "Totem criado: " +
      codigo

    );

  });

}


/*========================================
TOKENS
========================================*/

if ($("gerarTokenBtn")) {

  $("gerarTokenBtn")
  .addEventListener(
  "click",
  async function() {


    const token =
    gerarCodigo(12);


    const validade =

    Number(
      $("tokenValidade")
      .value
    );


    await addDoc(

      collection(
        db,
        "tokens"
      ),

      {

        token:
        token,

        tipo:
        $("tokenTipo")
        .value,

        expiraEm:

        Date.now() +
        validade *
        60000,

        usado:
        false,

        professorId:
        usuarioAtual.uid,

        criadoEm:
        serverTimestamp()

      }

    );


    mensagem(

      "tokenMensagem",

      "ok",

      "Token: " +
      token

    );

  });

}


/*========================================
RELATORIOS
========================================*/

if ($("relatorioForm")) {

  $("relatorioForm")
  .addEventListener(
  "submit",
  async function(event) {

    event.preventDefault();


    await addDoc(

      collection(
        db,
        "relatorios"
      ),

      {

        tipo:
        $("relatorioTipo")
        .value,

        referencia:
        $("relatorioTurma")
        .value,

        texto:
        $("relatorioTexto")
        .value,

        professorId:
        usuarioAtual.uid,

        criadoEm:
        serverTimestamp()

      }

    );


    mensagem(

      "relatorioMensagem",

      "ok",

      "Relatório enviado."

    );


    $("relatorioForm")
    .reset();

  });

}


/*========================================
MURAL
========================================*/

if ($("avisoForm")) {

  $("avisoForm")
  .addEventListener(
  "submit",
  async function(event) {

    event.preventDefault();


    await addDoc(

      collection(
        db,
        "avisos"
      ),

      {

        titulo:
        $("avisoTitulo")
        .value,

        turma:
        turma(
          $("avisoTurma")
          .value
        ) || "TODOS",

        mensagem:
        $("avisoTexto")
        .value,

        notificar:
        true,

        professorId:
        usuarioAtual.uid,

        criadoEm:
        serverTimestamp()

      }

    );


    mensagem(

      "avisoMensagem",

      "ok",

      "Aviso publicado."

    );


    $("avisoForm")
    .reset();


    atualizarPainel();

  });

}


/*========================================
PAINEL
========================================*/

async function atualizarPainel() {
  try {
    const tarefasLocais = DBLocal.obterTarefasDocentes();
    const avisosLocais = DBLocal.obterComunicados();
    const alunos = await buscarAlunos();

    let totalTarefas = tarefasLocais.length;
    let totalAvisos = avisosLocais.length;

    try {
      const tarefasDocs = await getDocs(collection(db, "tarefas"));
      if (tarefasDocs.size > totalTarefas) totalTarefas = tarefasDocs.size;
    } catch(e) {}

    try {
      const avisosDocs = await getDocs(collection(db, "avisos"));
      if (avisosDocs.size > totalAvisos) totalAvisos = avisosDocs.size;
    } catch(e) {}

    if ($("metricaTarefas")) {
      $("metricaTarefas").textContent = totalTarefas;
    }

    if ($("metricaAlunos")) {
      $("metricaAlunos").textContent = alunos.length;
    }

    if ($("metricaAvisos")) {
      $("metricaAvisos").textContent = totalAvisos;
    }
  }
  catch(erro) {
    console.error("Erro ao atualizar métricas:", erro);
  }
}


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
      "Leitura por voz não disponível."
    );

    return;

  }


  speechSynthesis
  .cancel();


  const fala =

  new SpeechSynthesisUtterance(
    texto
  );


  fala.lang =
  "pt-BR";


  speechSynthesis
  .speak(
    fala
  );

}


if ($("lerPagina")) {

  $("lerPagina")
  .addEventListener(
  "click",
  function() {

    falar(

      $("conteudo")
      .innerText

    );

  });

}


if ($("lerSelecionado")) {

  $("lerSelecionado")
  .addEventListener(
  "click",
  function() {

    const texto =

    window
    .getSelection()
    .toString()
    .trim();


    if (!texto) {

      alert(
        "Selecione um texto."
      );

      return;

    }


    falar(
      texto
    );

  });

}


if ($("pararLeitura")) {

  $("pararLeitura")
  .addEventListener(
  "click",
  function() {

    speechSynthesis
    .cancel();

  });

}


/*----------Data atual----------*/

if ($("aulaData")) {

  $("aulaData")
  .valueAsDate =
  new Date();

}


if ($("chamadaData")) {

  $("chamadaData")
  .valueAsDate =
  new Date();

}


/*========================================
LANÇAMENTO DE NOTAS DAS AVALIAÇÕES
========================================*/

const CHAVE_AVALIACOES = "SALA_FUTURO_AVALIACOES_NOTAS_V2";

const avaliacoesIniciais = [
  {
    id: "av_1",
    data: "2026-09-12",
    turma: "8º Ano A",
    disciplina: "Matemática",
    instrumento: "Prova Paulista Bimestral",
    bimestre: "3º Bimestre",
    peso: 10,
    media: 7.8,
    totalAlunos: 2,
    notas: [
      { nome: "Guilherme Santos", ra: "000.123.456-7 SP", guilda: "Águias da Sabedoria", nota: 8.5, status: "Aprovado", obs: "Excelente raciocínio algébrico" },
      { nome: "Beatriz Lima", ra: "000.234.567-8 SP", guilda: "Fênix da Criação", nota: 7.2, status: "Aprovado", obs: "Bom desempenho em equações" }
    ]
  },
  {
    id: "av_2",
    data: "2026-09-14",
    turma: "8º Ano A",
    disciplina: "Língua Portuguesa",
    instrumento: "Redação Paulista SP",
    bimestre: "3º Bimestre",
    peso: 10,
    media: 8.2,
    totalAlunos: 2,
    notas: [
      { nome: "Guilherme Santos", ra: "000.123.456-7 SP", guilda: "Águias da Sabedoria", nota: 9.0, status: "Destaque", obs: "Texto com excelente coesão" },
      { nome: "Beatriz Lima", ra: "000.234.567-8 SP", guilda: "Fênix da Criação", nota: 7.5, status: "Aprovado", obs: "Argumentação consistente" }
    ]
  }
];

function obterAvaliacoesArmazenadas() {
  const dados = localStorage.getItem(CHAVE_AVALIACOES);
  if (dados) {
    try {
      return JSON.parse(dados);
    } catch(e) {
      console.warn("Erro ao parsear avaliações:", e);
    }
  }
  localStorage.setItem(CHAVE_AVALIACOES, JSON.stringify(avaliacoesIniciais));
  return avaliacoesIniciais;
}

function salvarAvaliacoesArmazenadas(lista) {
  localStorage.setItem(CHAVE_AVALIACOES, JSON.stringify(lista));
}

let avaliacoesCadastradas = obterAvaliacoesArmazenadas();

// Recupera alunos reais do Firestore (coleção usuarios) ou da base institucional
async function obterAlunosTurma(turmaAlvo) {
  let todosAlunos = [];

  // Tenta buscar diretamente do Firestore usuarios
  try {
    const alunosDoBanco = await buscarAlunos();
    if (Array.isArray(alunosDoBanco) && alunosDoBanco.length > 0) {
      todosAlunos = alunosDoBanco.map(u => ({
        id: u.id,
        nome: u.nome ? (u.nome + (u.sobrenome ? " " + u.sobrenome : "")) : (u.email || "Estudante"),
        ra: u.ra || "000.123.456-7 SP",
        sala: u.turma || u.sala || "8º Ano A",
        guilda: u.guilda || "Águias da Sabedoria"
      }));
    }
  } catch (e) {
    console.warn("Erro ao buscar alunos do Firestore para pauta de notas:", e);
  }

  // Se não obteve do Firestore, busca do cache sincronizado pelo ADM
  if (todosAlunos.length === 0) {
    const admDataStr = localStorage.getItem("SALA_FUTURO_ADM_DADOS_V2");
    if (admDataStr) {
      try {
        const parsed = JSON.parse(admDataStr);
        if (Array.isArray(parsed.alunos) && parsed.alunos.length > 0) {
          todosAlunos = parsed.alunos;
        }
      } catch(e) {
        console.warn("Erro ao ler alunos do ADM:", e);
      }
    }
  }

  // Base padrão de segurança institucional
  if (todosAlunos.length === 0) {
    todosAlunos = [
      { nome: "Guilherme Santos", ra: "000.123.456-7 SP", sala: "8º Ano A", guilda: "Águias da Sabedoria" },
      { nome: "Beatriz Lima", ra: "000.234.567-8 SP", sala: "8º Ano A", guilda: "Fênix da Criação" },
      { nome: "Lucas Martins", ra: "000.345.678-9 SP", sala: "8º Ano B", guilda: "Sentinelas do Futuro" },
      { nome: "Mariana Costa", ra: "000.456.789-0 SP", sala: "9º Ano A", guilda: "Águias da Sabedoria" },
      { nome: "Rafael Oliveira", ra: "000.567.890-1 SP", sala: "1º Ano EM", guilda: "Fênix da Criação" }
    ];
  }

  const alvoNorm = String(turmaAlvo || "").trim().toUpperCase().replace(/[ºª°\s]/g, "");
  return todosAlunos.filter(a => {
    const salaNorm = String(a.sala || a.turma || "").trim().toUpperCase().replace(/[ºª°\s]/g, "");
    return salaNorm === alvoNorm || salaNorm.includes(alvoNorm) || alvoNorm.includes(salaNorm);
  });
}

function calcularStatusNota(nota) {
  if (isNaN(nota) || nota === null || nota === "") {
    return { rotulo: "Não lançada", classe: "badge pendente" };
  }
  const n = parseFloat(nota);
  if (n >= 9.0) return { rotulo: "Destaque ⭐", classe: "badge aprovada" };
  if (n >= 7.0) return { rotulo: "Aprovado ✔", classe: "badge aprovada" };
  if (n >= 5.0) return { rotulo: "Em Atenção ⚠️", classe: "badge pendente" };
  return { rotulo: "Recuperação ❌", classe: "badge rejeitada" };
}

function atualizarCabecalhoNotas() {
  const turmaSel = $("notaTurmaSelect")?.value || "8º Ano A";
  const discSel = $("notaDisciplinaSelect")?.value || "Matemática";
  const tipoSel = $("notaTipoAvaliacao")?.value || "Prova Paulista Bimestral";
  const bimSel = $("notaBimestreSelect")?.value || "3º Bimestre";

  if ($("resumoTurmaTitulo")) {
    $("resumoTurmaTitulo").textContent = `${turmaSel} • ${discSel} • ${tipoSel} (${bimSel})`;
  }
}

async function carregarAlunosPautaNotas() {
  atualizarCabecalhoNotas();
  const turmaSel = $("notaTurmaSelect")?.value || "8º Ano A";
  const alunos = await obterAlunosTurma(turmaSel);
  const corpo = $("corpoTabelaLancamentoNotas");

  if (!corpo) return;

  if (alunos.length === 0) {
    corpo.innerHTML = `<tr><td colspan="7" class="vazio">Nenhum estudante matriculado na turma "${turmaSel}". Cadastre estudantes na Área ADM.</td></tr>`;
    if ($("contadorAlunosPauta")) $("contadorAlunosPauta").textContent = "0 estudantes encontrados";
    if ($("mediaTurmaValor")) $("mediaTurmaValor").textContent = "--";
    return;
  }

  let html = "";
  alunos.forEach((aluno, index) => {
    // Busca se já existe nota prévia cadastrada para essa avaliação e aluno
    const statusInicial = calcularStatusNota(null);

    html += `
      <tr data-aluno-nome="${aluno.nome}" data-aluno-ra="${aluno.ra}">
        <td><strong>${index + 1}</strong></td>
        <td>
          <strong>${aluno.nome}</strong>
        </td>
        <td><span class="codigo">${aluno.ra}</span></td>
        <td><span class="badge">${aluno.guilda || "Geral"}</span></td>
        <td>
          <input
            type="number"
            class="input-nota-aluno"
            min="0"
            max="10"
            step="0.1"
            placeholder="0.0 a 10"
            style="width:105px; padding:7px 9px; border:1px solid var(--borda); border-radius:8px; font-weight:bold; font-size:14px;"
            data-index="${index}"
          >
        </td>
        <td>
          <span class="${statusInicial.classe}" id="status-badge-${index}">${statusInicial.rotulo}</span>
        </td>
        <td>
          <input
            type="text"
            class="input-obs-aluno"
            placeholder="Feedback ou anotação pedagógica..."
            style="width:100%; padding:7px 9px; border:1px solid var(--borda); border-radius:8px; font-size:13px;"
            data-index="${index}"
          >
        </td>
      </tr>
    `;
  });

  corpo.innerHTML = html;
  if ($("contadorAlunosPauta")) {
    $("contadorAlunosPauta").textContent = `${alunos.length} estudantes prontos para avaliação`;
  }

  // Adiciona listeners para atualizar os status e calcular a média em tempo real
  const inputsNota = corpo.querySelectorAll(".input-nota-aluno");
  inputsNota.forEach(input => {
    input.addEventListener("input", () => {
      const idx = input.dataset.index;
      const val = input.value;
      const statusObj = calcularStatusNota(val);
      const badge = $("status-badge-" + idx);
      if (badge) {
        badge.className = statusObj.classe;
        badge.textContent = statusObj.rotulo;
      }
      recalcularMediaTurma();
    });
  });

  recalcularMediaTurma();
}

function recalcularMediaTurma() {
  const inputsNota = document.querySelectorAll(".input-nota-aluno");
  let soma = 0;
  let preenchidos = 0;

  inputsNota.forEach(inp => {
    const val = parseFloat(inp.value);
    if (!isNaN(val)) {
      soma += val;
      preenchidos++;
    }
  });

  if ($("mediaTurmaValor")) {
    if (preenchidos > 0) {
      const media = (soma / preenchidos).toFixed(1);
      $("mediaTurmaValor").textContent = media;
    } else {
      $("mediaTurmaValor").textContent = "--";
    }
  }
}

function renderizarHistoricoAvaliacoes() {
  const corpo = $("corpoHistoricoNotasTabela");
  if (!corpo) return;

  if (avaliacoesCadastradas.length === 0) {
    corpo.innerHTML = `<tr><td colspan="8" class="vazio">Nenhuma avaliação salva até o momento.</td></tr>`;
    return;
  }

  corpo.innerHTML = avaliacoesCadastradas.map(av => {
    return `
      <tr>
        <td>${av.data || "2026-09-16"}</td>
        <td><strong>${av.turma}</strong></td>
        <td>${av.disciplina}</td>
        <td>${av.instrumento}</td>
        <td><span class="badge">${av.bimestre}</span></td>
        <td><strong style="color:var(--azul);">${av.media}</strong></td>
        <td>${av.totalAlunos} alunos</td>
        <td>
          <button type="button" class="botao" style="padding:4px 8px; font-size:12px;" onclick="window.imprimirBoletimAvaliacao('${av.id}')">
            Imprimir
          </button>
        </td>
      </tr>
    `;
  }).join("");
}

window.imprimirBoletimAvaliacao = function(id) {
  const av = avaliacoesCadastradas.find(item => item.id === id);
  if (av) {
    alert(`Avaliação: ${av.instrumento}\nTurma: ${av.turma}\nDisciplina: ${av.disciplina}\nMédia da Turma: ${av.media}\nRegistros salvos.`);
  }
};

// Configura eventos da tela de notas
if ($("notaTurmaSelect")) {
  $("notaTurmaSelect").addEventListener("change", carregarAlunosPautaNotas);
}
if ($("notaDisciplinaSelect")) {
  $("notaDisciplinaSelect").addEventListener("change", atualizarCabecalhoNotas);
}
if ($("notaTipoAvaliacao")) {
  $("notaTipoAvaliacao").addEventListener("change", atualizarCabecalhoNotas);
}
if ($("notaBimestreSelect")) {
  $("notaBimestreSelect").addEventListener("change", atualizarCabecalhoNotas);
}

if ($("notaData")) {
  $("notaData").valueAsDate = new Date();
}

// Botão para preencher padrão 7.0
if ($("btnAtribuirMediaGeral")) {
  $("btnAtribuirMediaGeral").addEventListener("click", () => {
    const inputsNota = document.querySelectorAll(".input-nota-aluno");
    inputsNota.forEach(inp => {
      if (!inp.value) {
        inp.value = "7.0";
        inp.dispatchEvent(new Event("input"));
      }
    });
    mensagem("mensagemNotasFeedback", "ok", "Notas atribuídas com base 7.0 para conferência!");
  });
}

// Botão de salvar notas da avaliação
if ($("btnSalvarNotasDocente")) {
  $("btnSalvarNotasDocente").addEventListener("click", async () => {
    const turmaSel = $("notaTurmaSelect")?.value || "8º Ano A";
    const discSel = $("notaDisciplinaSelect")?.value || "Matemática";
    const tipoSel = $("notaTipoAvaliacao")?.value || "Prova Paulista Bimestral";
    const bimSel = $("notaBimestreSelect")?.value || "3º Bimestre";
    const peso = parseInt($("notaPeso")?.value, 10) || 10;
    const dataAv = $("notaData")?.value || new Date().toISOString().split("T")[0];

    const linhas = document.querySelectorAll("#corpoTabelaLancamentoNotas tr");
    if (linhas.length === 0) {
      mensagem("mensagemNotasFeedback", "erro", "Não há estudantes para salvar.");
      return;
    }

    const notasAlunos = [];
    let somaNotas = 0;
    let countNotas = 0;

    linhas.forEach(linha => {
      const nome = linha.getAttribute("data-aluno-nome");
      const ra = linha.getAttribute("data-aluno-ra");
      const notaInput = linha.querySelector(".input-nota-aluno");
      const obsInput = linha.querySelector(".input-obs-aluno");

      const valorNota = notaInput && notaInput.value !== "" ? parseFloat(notaInput.value) : 7.0;
      const obs = obsInput ? obsInput.value : "";
      const statusCalculado = calcularStatusNota(valorNota).rotulo;

      notasAlunos.push({
        nome,
        ra,
        nota: valorNota,
        status: statusCalculado,
        obs
      });

      somaNotas += valorNota;
      countNotas++;
    });

    const mediaFinal = countNotas > 0 ? (somaNotas / countNotas).toFixed(1) : "0.0";

    const novaAvaliacao = {
      id: "av_" + Date.now(),
      data: dataAv,
      turma: turmaSel,
      disciplina: discSel,
      instrumento: tipoSel,
      bimestre: bimSel,
      peso,
      media: parseFloat(mediaFinal),
      totalAlunos: countNotas,
      notas: notasAlunos
    };

    avaliacoesCadastradas.unshift(novaAvaliacao);
    salvarAvaliacoesArmazenadas(avaliacoesCadastradas);
    renderizarHistoricoAvaliacoes();

    // 1. Salva no banco local oficial (DBLocal)
    DBLocal.salvarAvaliacaoDocente(novaAvaliacao);
    notasAlunos.forEach(item => {
      DBLocal.salvarNota({
        id: `nota_${item.ra || item.nome}_${discSel}`,
        alunoNome: item.nome,
        alunoRa: item.ra,
        turma: turmaSel,
        componente: discSel,
        nota1Bim: item.nota,
        nota2Bim: item.nota,
        mediaFinal: item.nota,
        situacao: item.status?.rotulo || "Avaliado"
      });
    });

    // Sincroniza em segundo plano se online
    try {
      addDoc(collection(db, "avaliacoes_notas"), {
        ...novaAvaliacao,
        criadoEm: serverTimestamp()
      }).catch(() => {});
    } catch(err) {}

    mensagem("mensagemNotasFeedback", "ok", `Notas salvas no banco local! Avaliação registrada com média ${mediaFinal}.`);
  });
}

// Botões de exportação e impressão
if ($("btnImprimirPautaNotas")) {
  $("btnImprimirPautaNotas").addEventListener("click", () => {
    window.print();
  });
}

if ($("btnExportarPautaCSV")) {
  $("btnExportarPautaCSV").addEventListener("click", () => {
    const turmaSel = $("notaTurmaSelect")?.value || "Turma";
    const discSel = $("notaDisciplinaSelect")?.value || "Disciplina";
    const linhas = document.querySelectorAll("#corpoTabelaLancamentoNotas tr");

    let csv = "Nº;Nome;RA;Nota;Status;Observacao\n";
    linhas.forEach((linha, i) => {
      const nome = linha.getAttribute("data-aluno-nome") || "";
      const ra = linha.getAttribute("data-aluno-ra") || "";
      const nota = linha.querySelector(".input-nota-aluno")?.value || "";
      const obs = linha.querySelector(".input-obs-aluno")?.value || "";
      const status = calcularStatusNota(nota).rotulo;
      csv += `${i + 1};"${nome}";"${ra}";${nota};"${status}";"${obs}"\n`;
    });

    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `pauta_notas_${turmaSel.replace(/\s+/g, "_")}_${discSel}.csv`;
    link.click();
  });
}

// Inicializa o módulo de notas
carregarAlunosPautaNotas();
renderizarHistoricoAvaliacoes();

/*========================================
GERADOR DE ATIVIDADES COM IA (GEMINI)
========================================*/
let atividadeIAGeradaAtual = null;

// Tags de sugestão rápida
document.querySelectorAll(".btn-tag-sugestao").forEach(btn => {
  btn.addEventListener("click", () => {
    const tema = btn.getAttribute("data-tema");
    if (tema && $("iaTema")) {
      $("iaTema").value = tema;
    }
  });
});

if ($("btnGerarAtividadeIA")) {
  $("btnGerarAtividadeIA").addEventListener("click", async () => {
    const componente = $("iaComponente")?.value || "Matemática";
    const turmaEscolhida = $("iaTurma")?.value || "8º Ano A";
    const tema = $("iaTema")?.value?.trim() || "Atividade Curricular";
    const dificuldade = $("iaDificuldade")?.value || "Médio";
    const acessibilidade = $("iaAcessibilidade")?.value || "padrao";

    const statusEl = $("iaStatusMensagem");
    const btnGerar = $("btnGerarAtividadeIA");

    try {
      btnGerar.disabled = true;
      btnGerar.innerHTML = `<span>⏳</span> Gerando atividade com IA...`;
      if (statusEl) {
        statusEl.innerHTML = `<span style="color:#0284c7;">Conectando ao modelo Gemini 3.8 Flash e aplicando adaptações de acessibilidade...</span>`;
      }

      const res = await fetch("/api/ai/gerar-atividade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          componente,
          ano: turmaEscolhida,
          tema,
          dificuldade,
          acessibilidade
        })
      });

      const json = await res.json();
      if (!json.sucesso || !json.dados) {
        throw new Error(json.erro || "Não foi possível gerar a atividade.");
      }

      atividadeIAGeradaAtual = json.dados;
      renderizarAtividadeIAPreview(json.dados, json.motor);

      if (statusEl) {
        statusEl.innerHTML = `<span style="color:#16a34a; font-weight:bold;">✅ Atividade gerada com sucesso via ${json.motor}!</span>`;
      }
    } catch (erro) {
      console.error("Erro na geração por IA:", erro);
      if (statusEl) {
        statusEl.innerHTML = `<span style="color:#dc2626;">Erro ao gerar com IA: ${erro.message || "Tente novamente."}</span>`;
      }
    } finally {
      btnGerar.disabled = false;
      btnGerar.innerHTML = `<span>✨</span> Gerar Atividade com IA (Gemini)`;
    }
  });
}

function renderizarAtividadeIAPreview(dados, motor) {
  const card = $("iaCardResultado");
  if (!card) return;

  card.style.display = "block";
  if ($("iaPreviewHabilidade")) $("iaPreviewHabilidade").textContent = dados.habilidadeBNCC || "BNCC / SEDUC-SP";
  if ($("iaPreviewXP")) $("iaPreviewXP").textContent = `+${dados.pontosXP || 30} XP`;
  if ($("iaPreviewTitulo")) $("iaPreviewTitulo").textContent = dados.titulo || "Atividade Avaliativa";
  if ($("iaPreviewEnunciado")) $("iaPreviewEnunciado").textContent = dados.enunciado || "";
  if ($("iaPreviewAcessivel")) $("iaPreviewAcessivel").textContent = dados.versaoAcessivel || dados.enunciado || "";
  if ($("iaPreviewDica")) $("iaPreviewDica").textContent = dados.dicaPedagogica || "Leia com calma e elimine as opções incorretas.";

  const containerAlts = $("iaPreviewAlternativas");
  if (containerAlts && Array.isArray(dados.alternativas)) {
    containerAlts.innerHTML = dados.alternativas.map(alt => {
      const estilo = alt.correta 
        ? "background:#f0fdf4; border:1.5px solid #86efac; color:#166534;" 
        : "background:#f8fafc; border:1px solid #cbd5e1; color:#334155;";
      const badge = alt.correta 
        ? `<span style="background:#16a34a; color:#fff; font-size:0.75rem; font-weight:bold; padding:2px 8px; border-radius:12px;">Gabarito Correto</span>` 
        : "";
      return `
        <div style="padding:10px; border-radius:8px; ${estilo}">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
            <strong>(${alt.id}) ${alt.texto}</strong>
            ${badge}
          </div>
          <small style="display:block; opacity:0.85; font-size:0.8rem;">
            ${alt.explicacao || ""}
          </small>
        </div>
      `;
    }).join("");
  }

  card.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

// Botão para ouvir atividade por voz (Acessibilidade)
if ($("iaBtnOuvirAtividade")) {
  $("iaBtnOuvirAtividade").addEventListener("click", () => {
    if (!atividadeIAGeradaAtual) return;
    const textoParaVoz = atividadeIAGeradaAtual.instrucaoAudio || `${atividadeIAGeradaAtual.titulo}. ${atividadeIAGeradaAtual.enunciado}`;
    if (window.AcessibilidadeSP && window.AcessibilidadeSP.falarTexto) {
      window.AcessibilidadeSP.falarTexto(textoParaVoz, $("iaCardResultado"));
    }
  });
}

// Botão para copiar texto
if ($("iaBtnCopiarTexto")) {
  $("iaBtnCopiarTexto").addEventListener("click", () => {
    if (!atividadeIAGeradaAtual) return;
    let texto = `${atividadeIAGeradaAtual.titulo} (${atividadeIAGeradaAtual.componente} - ${atividadeIAGeradaAtual.turma})\nHabilidade: ${atividadeIAGeradaAtual.habilidadeBNCC}\n\nEnunciado:\n${atividadeIAGeradaAtual.enunciado}\n\nAlternativas:\n`;
    (atividadeIAGeradaAtual.alternativas || []).forEach(a => {
      texto += `${a.id}) ${a.texto}${a.correta ? " [CORRETA]" : ""}\n`;
    });
    texto += `\nDica: ${atividadeIAGeradaAtual.dicaPedagogica}`;
    navigator.clipboard.writeText(texto).then(() => {
      alert("Atividade copiada para a área de transferência!");
    });
  });
}

// Botão para salvar e disponibilizar tarefa gerada pela IA
if ($("iaBtnSalvarFirestore")) {
  $("iaBtnSalvarFirestore").addEventListener("click", async () => {
    if (!atividadeIAGeradaAtual) return;
    const btn = $("iaBtnSalvarFirestore");

    try {
      btn.disabled = true;
      btn.innerHTML = `<span>⏳</span> Publicando atividade...`;

      const turmaClasse = turma($("iaTurma")?.value || "8º Ano A");
      const novaTarefa = {
        id: "ia_" + Date.now(),
        titulo: atividadeIAGeradaAtual.titulo,
        turma: turmaClasse,
        componente: atividadeIAGeradaAtual.componente,
        xp: Number(atividadeIAGeradaAtual.pontosXP || 30),
        enunciado: atividadeIAGeradaAtual.enunciado,
        versaoAcessivel: atividadeIAGeradaAtual.versaoAcessivel || "",
        instrucaoAudio: atividadeIAGeradaAtual.instrucaoAudio || "",
        habilidadeBNCC: atividadeIAGeradaAtual.habilidadeBNCC || "",
        alternativas: atividadeIAGeradaAtual.alternativas || [],
        dicaPedagogica: atividadeIAGeradaAtual.dicaPedagogica || "",
        origem: "IA_GEMINI",
        ativa: true,
        professorId: usuarioAtual?.uid || "prof_seduc",
        criadoEm: new Date().toISOString()
      };

      // 1. Salva no DBLocal institucional
      DBLocal.salvarTarefaDocente(novaTarefa);

      // Sincroniza em segundo plano no Firestore se online
      try {
        addDoc(collection(db, "tarefas"), {
          ...novaTarefa,
          criadoEm: serverTimestamp()
        }).catch(() => {});
      } catch (errSync) {}

      alert(`✅ Atividade publicada com sucesso no banco de dados da Sala do Futuro!\nTurma: ${turmaClasse}\nOs estudantes já podem visualizar e responder no portal.`);
      atualizarPainel();
    } catch (e) {
      console.error("Erro ao salvar atividade:", e);
      alert("Erro ao salvar atividade: " + e.message);
    } finally {
      btn.disabled = false;
      btn.innerHTML = `<span>💾</span> Publicar e Disponibilizar no Portal para Alunos`;
    }
  });
}

/* ====================================================
   IMPORTAÇÃO EM LOTE DE ATIVIDADES EM JSON (CURRÍCULO PAULISTA)
   ==================================================== */
let listaAtividadesJsonCarregadas = [];

function parseAtividadesJsonContent(conteudoTexto) {
  try {
    const parsed = JSON.parse(conteudoTexto);
    let itens = [];
    if (Array.isArray(parsed)) {
      itens = parsed;
    } else if (parsed && Array.isArray(parsed.atividades)) {
      itens = parsed.atividades;
    } else if (parsed && typeof parsed === "object") {
      itens = [parsed];
    }
    return itens;
  } catch (err) {
    throw new Error("Arquivo JSON inválido. Verifique a formatação do arquivo.");
  }
}

function renderizarPreviaAtividadesJson(itens) {
  listaAtividadesJsonCarregadas = itens;
  const painel = $("painelPreviaJson");
  const listaContainer = $("listaPreviaJsonCards");
  const contador = $("contadorAtividadesJson");
  if (!painel || !listaContainer) return;

  if (!itens || itens.length === 0) {
    painel.style.display = "none";
    alert("Nenhuma atividade válida foi encontrada no JSON.");
    return;
  }

  painel.style.display = "block";
  if (contador) {
    contador.textContent = `📋 ${itens.length} atividade(s) pronta(s) para publicação:`;
  }

  listaContainer.innerHTML = itens.map((atv, idx) => {
    const titulo = atv.titulo || `Atividade #${idx + 1}`;
    const comp = atv.componente || "Geral";
    const turmaAtv = atv.turma || "Todas as turmas";
    const hab = atv.habilidadeBNCC || atv.habilidade || "BNCC SP";
    const enunciado = (atv.enunciado || atv.descricao || "").slice(0, 160) + "...";
    const xp = atv.pontosXP || atv.xp || 30;

    return `
      <div style="background:#ffffff; border:1.5px solid #cbd5e1; border-radius:10px; padding:14px; display:flex; flex-direction:column; justify-content:space-between; box-shadow:0 1px 4px rgba(0,0,0,0.04);">
        <div>
          <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px;">
            <label style="display:flex; align-items:center; gap:8px; cursor:pointer; font-weight:700; color:#0f172a; font-size:0.95rem;">
              <input type="checkbox" class="chk-item-json" data-idx="${idx}" checked style="width:18px; height:18px;">
              <span>${titulo}</span>
            </label>
            <span style="background:#e0f2fe; color:#0369a1; font-size:0.75rem; font-weight:bold; padding:2px 8px; border-radius:10px;">${comp}</span>
          </div>
          <div style="display:flex; gap:6px; flex-wrap:wrap; margin-bottom:8px;">
            <span style="background:#f1f5f9; color:#475569; font-size:0.75rem; padding:2px 6px; border-radius:4px;">Turma: <strong>${turmaAtv}</strong></span>
            <span style="background:#f1f5f9; color:#475569; font-size:0.75rem; padding:2px 6px; border-radius:4px;">Hab: <strong>${hab}</strong></span>
            <span style="background:#fef3c7; color:#92400e; font-size:0.75rem; padding:2px 6px; border-radius:4px;">XP: <strong>+${xp}</strong></span>
          </div>
          <p style="font-size:0.85rem; color:#475569; line-height:1.4; margin:0 0 10px 0;">${enunciado}</p>
        </div>
        <div style="font-size:0.75rem; color:#64748b; border-top:1px solid #f1f5f9; padding-top:6px;">
          ${Array.isArray(atv.alternativas) ? `${atv.alternativas.length} alternativas cadastradas` : 'Atividade dissertativa / prática'}
        </div>
      </div>
    `;
  }).join("");

  painel.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

// Botão carregar catálogo oficial padrão
if ($("btnCarregarCatalogoPadrao")) {
  $("btnCarregarCatalogoPadrao").addEventListener("click", async () => {
    const btn = $("btnCarregarCatalogoPadrao");
    const status = $("uploadJsonStatus");
    try {
      btn.disabled = true;
      btn.textContent = "Carregando catálogo...";
      if (status) status.innerHTML = `<span style="color:#0284c7;">Buscando atividades curriculares padrão SEDUC-SP...</span>`;

      const res = await fetch("/api/atividades-padrao");
      const json = await res.json();

      if (!json.sucesso || !json.dados) {
        throw new Error(json.erro || "Não foi possível carregar o catálogo.");
      }

      renderizarPreviaAtividadesJson(json.dados.atividades || []);
      if (status) status.innerHTML = `<span style="color:#16a34a;">✅ Catálogo oficial do Currículo Paulista carregado com sucesso (${json.dados.atividades.length} atividades)!</span>`;
    } catch (e) {
      console.error(e);
      if (status) status.innerHTML = `<span style="color:#dc2626;">Erro: ${e.message}</span>`;
    } finally {
      btn.disabled = false;
      btn.textContent = "📚 Carregar Catálogo Padrão SP";
    }
  });
}

// Botão baixar modelo JSON
if ($("btnBaixarModeloJson")) {
  $("btnBaixarModeloJson").addEventListener("click", () => {
    const modelo = {
      escola: "Escola Estadual SEDUC-SP",
      descricao: "Modelo de importação de atividades para o Sala do Futuro V2",
      atividades: [
        {
          titulo: "Exemplo: Teorema de Pitágoras no Cotidiano",
          componente: "Matemática",
          turma: "9º Ano A",
          habilidadeBNCC: "EF09MA13",
          pontosXP: 30,
          enunciado: "Em um terreno retangular com dimensões de 30m por 40m, qual é a distância em linha reta entre vértices opostos (diagonal)?",
          versaoAcessivel: "Qual é o valor da diagonal em um retângulo de 30 metros por 40 metros?",
          instrucaoAudio: "Questão de Matemática. Em um retângulo com lados 30 e 40 metros, qual o comprimento da diagonal?",
          dicaPedagogica: "Use o Teorema de Pitágoras: a soma dos quadrados dos catetos é igual ao quadrado da hipotenusa.",
          alternativas: [
            { id: "A", texto: "50 metros", correta: true, explicacao: "Correto! 30² + 40² = 900 + 1600 = 2500. A raiz de 2500 é 50." },
            { id: "B", texto: "70 metros", correta: false, explicacao: "70 é a soma simples dos dois lados (30 + 40), não a diagonal." },
            { id: "C", texto: "60 metros", correta: false, explicacao: "Valor aproximado incorreto." },
            { id: "D", texto: "45 metros", correta: false, explicacao: "Incorreto." }
          ]
        }
      ]
    };

    const blob = new Blob([JSON.stringify(modelo, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "modelo-atividades-seduc.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });
}

// Upload de arquivo JSON
if ($("inputUploadJsonAtividades")) {
  $("inputUploadJsonAtividades").addEventListener("change", (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    const status = $("uploadJsonStatus");

    reader.onload = (event) => {
      try {
        const itens = parseAtividadesJsonContent(event.target.result);
        renderizarPreviaAtividadesJson(itens);
        if (status) status.innerHTML = `<span style="color:#16a34a;">✅ Arquivo "${file.name}" carregado com sucesso (${itens.length} atividades)!</span>`;
      } catch (err) {
        if (status) status.innerHTML = `<span style="color:#dc2626;">❌ ${err.message}</span>`;
      }
    };
    reader.readAsText(file);
  });
}

// Drag and drop no dropzone
const dropzone = $("dropzoneJsonAtividades");
if (dropzone) {
  ["dragenter", "dragover"].forEach(evt => {
    dropzone.addEventListener(evt, (e) => {
      e.preventDefault();
      dropzone.style.background = "#e0f2fe";
      dropzone.style.borderColor = "#0284c7";
    });
  });
  ["dragleave", "drop"].forEach(evt => {
    dropzone.addEventListener(evt, (e) => {
      e.preventDefault();
      dropzone.style.background = "#ffffff";
      dropzone.style.borderColor = "#bae6fd";
    });
  });
  dropzone.addEventListener("drop", (e) => {
    const file = e.dataTransfer?.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    const status = $("uploadJsonStatus");
    reader.onload = (event) => {
      try {
        const itens = parseAtividadesJsonContent(event.target.result);
        renderizarPreviaAtividadesJson(itens);
        if (status) status.innerHTML = `<span style="color:#16a34a;">✅ Arquivo "${file.name}" importado (${itens.length} atividades)!</span>`;
      } catch (err) {
        if (status) status.innerHTML = `<span style="color:#dc2626;">❌ ${err.message}</span>`;
      }
    };
    reader.readAsText(file);
  });
}

// Selecionar/desmarcar todas
if ($("btnSelecionarTodasJson")) {
  $("btnSelecionarTodasJson").addEventListener("click", () => {
    const chks = document.querySelectorAll(".chk-item-json");
    const todosMarcados = Array.from(chks).every(c => c.checked);
    chks.forEach(c => c.checked = !todosMarcados);
    $("btnSelecionarTodasJson").textContent = todosMarcados ? "Selecionar Todas" : "Desmarcar Todas";
  });
}

// Publicar em lote no Firestore
if ($("btnPublicarJsonFirestore")) {
  $("btnPublicarJsonFirestore").addEventListener("click", async () => {
    const chks = document.querySelectorAll(".chk-item-json:checked");
    if (chks.length === 0) {
      alert("Selecione pelo menos uma atividade na prévia para publicar.");
      return;
    }

    const indices = Array.from(chks).map(c => Number(c.getAttribute("data-idx")));
    const selecionadas = indices.map(i => listaAtividadesJsonCarregadas[i]).filter(Boolean);

    const btn = $("btnPublicarJsonFirestore");
    try {
      btn.disabled = true;
      btn.textContent = `⏳ Publicando ${selecionadas.length} atividades...`;

      let salvasComSucesso = 0;

      for (const atv of selecionadas) {
        const turmaClasse = turma(atv.turma || "8º Ano A");
        const novaAtv = {
          id: "json_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4),
          titulo: atv.titulo || "Atividade Curricular",
          turma: turmaClasse,
          componente: atv.componente || "Geral",
          xp: Number(atv.pontosXP || atv.xp || 30),
          enunciado: atv.enunciado || atv.descricao || "",
          versaoAcessivel: atv.versaoAcessivel || "",
          instrucaoAudio: atv.instrucaoAudio || "",
          habilidadeBNCC: atv.habilidadeBNCC || atv.habilidade || "",
          alternativas: atv.alternativas || [],
          dicaPedagogica: atv.dicaPedagogica || "",
          origem: "IMPORTACAO_JSON",
          ativa: true,
          professorId: usuarioAtual?.uid || "prof_seduc",
          criadoEm: new Date().toISOString()
        };

        // Salva no banco local oficial
        DBLocal.salvarTarefaDocente(novaAtv);

        // Sincroniza em segundo plano no Firestore
        try {
          addDoc(collection(db, "tarefas"), {
            ...novaAtv,
            criadoEm: serverTimestamp()
          }).catch(() => {});
        } catch (errSync) {}

        salvasComSucesso++;
      }

      alert(`🎉 Sucesso! ${salvasComSucesso} atividade(s) foram salvas no banco da Sala do Futuro e já estão disponíveis para os alunos realizarem.`);
      $("painelPreviaJson").style.display = "none";
      if ($("uploadJsonStatus")) $("uploadJsonStatus").innerHTML = "";
      atualizarPainel();
    } catch (e) {
      console.error("Erro ao publicar atividades em lote:", e);
      alert("Erro ao publicar atividades: " + e.message);
    } finally {
      btn.disabled = false;
      btn.textContent = "🚀 Publicar Selecionadas no Firestore";
    }
  });
}


