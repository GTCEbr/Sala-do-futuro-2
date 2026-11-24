/**
 * ====================================================
 * SALA DO FUTURO V2 - INTEGRAÇÃO OFICIAL FIREBASE
 * Projeto: sala-do-futuro-2-ofv
 * Firestore & Authentication (Modular SDK 13.1.0)
 * ====================================================
 * Suporta sincronização em tempo real e modo offline resiliente:
 * - Coleção Firestore 'Atividades' (organizada por disciplinas: Ciências, Geografia, História, Matemática, Português, etc.)
 * - Coleção Firestore 'usuarios' (documento 'professores' mapeado pelo nome do usuário)
 * - Firebase Authentication para login seguro de docentes e gestores
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  updateProfile,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js";
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  collection, 
  query, 
  where,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js";

export const firebaseConfig = {
  apiKey: "AIzaSyDQtPI3t7pyDGqEZADwzCh4AEJrKxtMS5A",
  authDomain: "sala-do-futuro-2-ofv.firebaseapp.com",
  projectId: "sala-do-futuro-2-ofv",
  storageBucket: "sala-do-futuro-2-ofv.firebasestorage.app",
  messagingSenderId: "900122004888",
  appId: "1:900122004888:web:50abd6a75e859caf982fed",
  measurementId: "G-YSDNW2WPFR"
};

// Inicialização segura com proteção contra falha de rede
let app = null;
let auth = null;
let db = null;
let firebasePronto = false;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  firebasePronto = true;
  console.log("🔥 [Firebase] Inicializado com sucesso para o projeto:", firebaseConfig.projectId);
} catch (e) {
  console.warn("⚠️ [Firebase] Inicialização operando em modo offline resiliente:", e.message);
}

export { app, auth, db, firebasePronto };

/**
 * Normaliza o nome da disciplina para corresponder exatamente
 * aos documentos criados no Firestore (História, Ciências, Geografia, Matematica, Portugues, etc.)
 */
export function normalizarNomeDisciplina(disciplina = "") {
  const d = String(disciplina).trim();
  if (/matem/i.test(d)) return "Matematica";
  if (/portug|l[ií]ngua port/i.test(d)) return "Portugues";
  if (/ci[êe]nc/i.test(d)) return "Ciências";
  if (/geog/i.test(d)) return "Geografia";
  if (/hist/i.test(d)) return "História";
  if (/ingl[êe]s/i.test(d)) return "Inglês";
  if (/f[ií]sica/i.test(d)) return "Educação Física";
  if (/financ/i.test(d)) return "Educação Financeira";
  if (/arte/i.test(d)) return "Arte";
  if (/vida/i.test(d)) return "Projeto de Vida";
  return d || "Geral";
}

/**
 * Salva usuário no Firebase Authentication e no Cloud Firestore
 * Regra do usuário: No Firestore, salvar na coleção 'usuarios',
 * documento 'professores', onde cada campo é o nome do usuário.
 */
export async function salvarUsuarioFirebase(usuario) {
  if (!usuario) return null;
  const resultado = {
    authCriado: false,
    firestoreCriado: false,
    uid: usuario.id || `usr_${Date.now()}`,
    erros: []
  };

  const email = usuario.email || `${String(usuario.nome || "usuario").toLowerCase().replace(/\s+/g, ".")}@escola.sp.gov.br`;
  const senhaPadrao = usuario.senha || "Seduc@2026";

  // 1. Firebase Authentication
  if (auth && navigator.onLine) {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, senhaPadrao);
      resultado.authCriado = true;
      resultado.uid = cred.user.uid;
      try {
        await updateProfile(cred.user, { displayName: usuario.nome });
      } catch (errPerfil) {}
    } catch (authErr) {
      // Se o e-mail já existe no Auth, não é erro fatal
      if (authErr.code === "auth/email-already-in-use") {
        resultado.authCriado = true;
        resultado.mensagemAuth = "Usuário já existente no Authentication.";
      } else {
        resultado.erros.push(`Auth: ${authErr.message}`);
      }
    }
  }

  // 2. Cloud Firestore (Coleção 'usuarios' -> Documento 'professores' com campo = nome do usuário)
  if (db && navigator.onLine) {
    try {
      const nomeCampo = usuario.nome || usuario.id || "Professor Sem Nome";
      const dadosProfessor = {
        id: usuario.id || resultado.uid,
        uid: resultado.uid,
        nome: usuario.nome,
        email: email,
        cargo: usuario.cargo || "Professor",
        disciplina: usuario.disciplina || "Geral",
        turmas: usuario.turmas || ["8º Ano A"],
        tipo: usuario.tipo || "professor",
        criadoEm: new Date().toISOString(),
        atualizadoEm: new Date().toISOString()
      };

      if (usuario.tipo === "professor" || !usuario.tipo || usuario.cargo?.toLowerCase().includes("prof")) {
        // Salva no documento 'professores' dentro da coleção 'usuarios' com a chave sendo o nome
        const docRefProfessores = doc(db, "usuarios", "professores");
        await setDoc(docRefProfessores, {
          [nomeCampo]: dadosProfessor
        }, { merge: true });
      } else {
        // Se for aluno ou gestor, salva no respectivo documento ou individual
        const docRefTipo = doc(db, "usuarios", usuario.tipo === "aluno" ? "alunos" : "gestores");
        await setDoc(docRefTipo, {
          [nomeCampo]: dadosProfessor
        }, { merge: true });
      }

      // Salva também documento individual por UID para consultas rápidas
      const docIndividual = doc(db, "usuarios", String(dadosProfessor.id));
      await setDoc(docIndividual, dadosProfessor, { merge: true });

      resultado.firestoreCriado = true;
    } catch (dbErr) {
      console.warn("⚠️ [Firebase Firestore] Falha ao salvar usuário:", dbErr);
      resultado.erros.push(`Firestore: ${dbErr.message}`);
    }
  }

  return resultado;
}

/**
 * Salva atividade lançada pelo professor no Cloud Firestore
 * Regra do usuário: Na coleção 'Atividades' dividida por disciplinas
 * (ex: Atividades/História/itens/{tarefaId})
 */
export async function salvarAtividadeFirestore(tarefa) {
  if (!tarefa) return null;
  const resultado = {
    firestoreSalvo: false,
    disciplinaDoc: "",
    id: tarefa.id || `tar_${Date.now()}`,
    erros: []
  };

  const disciplina = normalizarNomeDisciplina(tarefa.componente || tarefa.disciplina || "Geral");
  resultado.disciplinaDoc = disciplina;

  if (db && navigator.onLine) {
    try {
      // 1. Salva na subcoleção 'itens' da disciplina correspondente
      const tarefaRef = doc(db, "Atividades", disciplina, "itens", String(resultado.id));
      const dadosTarefa = {
        ...tarefa,
        id: resultado.id,
        componente: tarefa.componente || disciplina,
        disciplina: disciplina,
        status: tarefa.status || "ativa",
        pontosXP: Number(tarefa.pontosXP || tarefa.xp || 30),
        atualizadoEm: new Date().toISOString(),
        sincronizadoEm: new Date().toISOString()
      };

      await setDoc(tarefaRef, dadosTarefa, { merge: true });

      // 2. Atualiza os metadados do documento raiz da disciplina (História, Ciências, Matemática, etc.)
      const disciplinaDocRef = doc(db, "Atividades", disciplina);
      await setDoc(disciplinaDocRef, {
        disciplina: disciplina,
        ultimaAtividadeCriada: tarefa.titulo || "Atividade",
        ultimaAtualizacao: new Date().toISOString()
      }, { merge: true });

      resultado.firestoreSalvo = true;
      console.log(`✅ [Firestore] Atividade "${tarefa.titulo}" salva em Atividades/${disciplina}/itens/${resultado.id}`);
    } catch (err) {
      console.warn("⚠️ [Firestore] Falha ao salvar atividade na nuvem:", err);
      resultado.erros.push(err.message);
    }
  }

  return resultado;
}

/**
 * Busca atividades publicadas no Firestore para uma ou todas as disciplinas
 */
export async function buscarAtividadesFirestore(disciplinaFiltro = null) {
  if (!db || !navigator.onLine) return [];
  const atividades = [];

  const disciplinasAlvo = disciplinaFiltro 
    ? [normalizarNomeDisciplina(disciplinaFiltro)]
    : ["Ciências", "Geografia", "História", "Matematica", "Portugues", "Inglês", "Arte", "Educação Física", "Educação Financeira", "Projeto de Vida"];

  for (const disc of disciplinasAlvo) {
    try {
      const itensCol = collection(db, "Atividades", disc, "itens");
      const snap = await getDocs(itensCol);
      snap.forEach(docSnap => {
        atividades.push({ id: docSnap.id, ...docSnap.data() });
      });
    } catch (e) {
      // Ignora coleções ainda não criadas
    }
  }

  return atividades;
}

/**
 * Sincroniza fila offline local com o Firestore assim que a conexão for restabelecida
 */
export async function sincronizarFilaOfflineComFirebase(bancoLocal) {
  if (!navigator.onLine || !bancoLocal) return 0;
  let sincronizados = 0;

  try {
    const fila = bancoLocal.obterFilaOffline?.() || [];
    for (const item of fila) {
      if (item.tarefaId && item.respostas) {
        // Envia entrega para o Firestore
        if (db) {
          const entregaRef = doc(db, "entregas", item.id);
          await setDoc(entregaRef, {
            ...item,
            sincronizadoEm: new Date().toISOString()
          }, { merge: true });
          sincronizados++;
        }
      }
    }
  } catch (err) {
    console.warn("⚠️ [Firebase] Erro ao sincronizar fila offline:", err);
  }

  return sincronizados;
}
