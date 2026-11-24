// Cliente oficial da API Google Apps Script (Google Sheets)
// Sala do Futuro Maurício Antunes • Grêmio Aegre 2027

export const API_BASE_URL =
  "https://script.google.com/macros/s/AKfycbwmm8KLg0KsHRPwq4VlKhG5jdDg10NaNAM3nnaBMOXW0KdVjl-bJ_ZNVP7gZzyISHEp/exec";

const CHAVE_FILA_API = "sala_futuro_fila_api_sheets_v1";

/**
 * Executa requisições POST seguindo a regra estrita de CORS do Google Apps Script:
 * Content-Type: text/plain;charset=utf-8 e corpo JSON stringificado.
 */
export async function chamarAPI(payload) {
  try {
    const response = await fetch(API_BASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      body: JSON.stringify(payload)
    });
    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch {
      return { ok: false, msg: "Resposta inválida do servidor." };
    }
  } catch (error) {
    console.error("Erro na API (POST):", error);
    return { ok: false, erroRede: true, msg: "Erro de rede" };
  }
}

/**
 * Executa requisições GET para leitura das abas da planilha.
 */
export async function buscarGET(action) {
  try {
    const url = `${API_BASE_URL}?action=${encodeURIComponent(action)}`;
    const response = await fetch(url, { method: "GET" });
    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch {
      return { ok: false, data: [], msg: "Resposta inválida do servidor." };
    }
  } catch (error) {
    console.error(`Erro na API (GET ${action}):`, error);
    return { ok: false, erroRede: true, data: [], msg: "Erro de rede" };
  }
}

function limparTexto(valor) {
  const s = String(valor ?? "").trim();
  if (!s || s.toLowerCase() === "null" || s.toLowerCase() === "undefined") return "";
  return s;
}

export function mapearAlunoAPI(item) {
  if (Array.isArray(item)) {
    const ra = limparTexto(item[0]);
    if (!ra || ra.toLowerCase() === "ra") return null;
    const nome = limparTexto(item[1]) || `Estudante ${ra}`;
    const sala = limparTexto(item[2]) || "Sem Sala";
    const xp = Number(item[3]) || 0;
    const faltas = Number(item[4]) || 0;
    const anotacao = limparTexto(item[5]) || "Nenhuma";
    return {
      id: `ra_${ra}`,
      ra,
      nome,
      sala,
      turma: sala,
      xp,
      nivel: Math.max(1, Math.floor(xp / 100) + 1),
      faltas,
      anotacao,
      tipo: "aluno",
      origemAPI: true
    };
  }

  if (!item || typeof item !== "object") return null;
  const ra = limparTexto(item.RA ?? item.ra);
  if (!ra) return null;
  const nome = limparTexto(item.Nome ?? item.nome) || `Estudante ${ra}`;
  const sala = limparTexto(item.Sala ?? item.sala ?? item.turma) || "Sem Sala";
  const xp = Number(item.XP ?? item.xp) || 0;
  const faltas = Number(item.Faltas ?? item.faltas) || 0;
  const anotacao = limparTexto(item.Anotacao ?? item.anotacao) || "Nenhuma";

  return {
    id: `ra_${ra}`,
    ra,
    nome,
    sala,
    turma: sala,
    xp,
    nivel: Math.max(1, Math.floor(xp / 100) + 1),
    faltas,
    anotacao,
    tipo: "aluno",
    origemAPI: true
  };
}

export function mapearQuestaoAPI(row) {
  if (!Array.isArray(row) || row.length < 7) return null;
  const codigo = limparTexto(row[0]);
  const questao = limparTexto(row[1]);
  if (!codigo || !questao) return null;
  if (codigo.toLowerCase() === "codigo" && questao.toLowerCase() === "questao") return null;

  const materia = limparTexto(row[2]) || "Geral";
  const opA = row[3] !== undefined && row[3] !== null ? String(row[3]).trim() : "";
  const opB = row[4] !== undefined && row[4] !== null ? String(row[4]).trim() : "";
  const opC = row[5] !== undefined && row[5] !== null ? String(row[5]).trim() : "";
  const opD = row[6] !== undefined && row[6] !== null ? String(row[6]).trim() : "";
  const task = limparTexto(row[7]) || `Task ${codigo}`;
  const alt = limparTexto(row[8]).toUpperCase();

  return {
    codigo,
    questao,
    materia,
    alternativas: [
      { id: "A", texto: opA },
      { id: "B", texto: opB },
      { id: "C", texto: opC },
      { id: "D", texto: opD }
    ].filter(o => o.texto !== ""),
    task,
    alt
  };
}

export function mapearGuildaAPI(row) {
  if (!Array.isArray(row) || row.length === 0) return null;
  const nome = limparTexto(row[0]);
  if (!nome) return null;
  if (nome.toLowerCase() === "guildas" && limparTexto(row[1]).toLowerCase() === "membro1") return null;

  const membrosLista = [];
  for (let i = 1; i <= 6; i++) {
    const m = limparTexto(row[i]);
    if (m) membrosLista.push(m);
  }

  const xpBruto = row[7];
  const xp = Number.isFinite(Number(xpBruto)) ? Number(xpBruto) : 0;
  const desafio = limparTexto(row[8]) || "Desafio em aberto";
  const status = limparTexto(row[9]) || "Ativa";

  return {
    id: `guilda_${nome.replace(/\s+/g, "_")}`,
    nome,
    membrosLista,
    membros: membrosLista.length,
    pontos: xp,
    xp,
    desafio,
    lema: desafio !== "Desafio em aberto" ? `Desafio: ${desafio}` : "União e protagonismo estudantil",
    status,
    cor: "#1d5a9e",
    icone: "🛡️",
    origemAPI: true
  };
}

export function mapearGestaoAPI(row) {
  if (!Array.isArray(row) || row.length === 0) return null;
  const cadastro = limparTexto(row[0]);
  if (!cadastro) return null;
  if (cadastro.toLowerCase() === "cadastro" && limparTexto(row[2]).toLowerCase() === "cargo") return null;

  // Regra de segurança: nunca armazenar ou expor a coluna Senha (row[1]) no estado local
  const cargo = limparTexto(row[2]) || "Gestor";
  return {
    id: `gestao_${cadastro.replace(/\s+/g, "_")}`,
    cadastro,
    nome: cadastro,
    cargo,
    tipo: cargo.toLowerCase().includes("docente") || cargo.toLowerCase().includes("prof") ? "professor" : "gestor",
    origemAPI: true
  };
}

// ====================================================
// ROTAS DE LEITURA (GET)
// ====================================================

export async function buscarAlunosAPI() {
  const res = await buscarGET("alunos");
  if (!res?.ok || !Array.isArray(res.data)) {
    return { ok: false, erroRede: Boolean(res?.erroRede), data: [], msg: res?.msg };
  }
  return {
    ok: true,
    data: res.data.map(mapearAlunoAPI).filter(Boolean)
  };
}

export async function buscarQuestoesAPI() {
  const res = await buscarGET("questoes");
  if (!res?.ok || !Array.isArray(res.data)) {
    return { ok: false, erroRede: Boolean(res?.erroRede), data: [], msg: res?.msg };
  }
  return {
    ok: true,
    data: res.data.map(mapearQuestaoAPI).filter(Boolean)
  };
}

export async function buscarGuildasAPI() {
  const res = await buscarGET("guildas");
  if (!res?.ok || !Array.isArray(res.data)) {
    return { ok: false, erroRede: Boolean(res?.erroRede), data: [], msg: res?.msg };
  }
  return {
    ok: true,
    data: res.data.map(mapearGuildaAPI).filter(Boolean)
  };
}

export async function buscarGestaoAPI() {
  const res = await buscarGET("gestao");
  if (!res?.ok || !Array.isArray(res.data)) {
    return { ok: false, erroRede: Boolean(res?.erroRede), data: [], msg: res?.msg };
  }
  return {
    ok: true,
    data: res.data.map(mapearGestaoAPI).filter(Boolean)
  };
}

// ====================================================
// ROTAS DE AÇÃO (POST)
// ====================================================

export async function loginAlunoAPI(ra, senha) {
  return chamarAPI({
    action: "loginAluno",
    ra: String(ra ?? "").trim(),
    senha: String(senha ?? "")
  });
}

export async function loginGestaoAPI(cadastro, senha) {
  return chamarAPI({
    action: "loginGestao",
    cadastro: String(cadastro ?? "").trim(),
    senha: String(senha ?? "")
  });
}

export async function responderQuestaoAPI(ra, codigo, resposta) {
  return chamarAPI({
    action: "responder",
    ra: String(ra ?? "").trim(),
    codigo: String(codigo ?? "").trim(),
    resposta: String(resposta ?? "").trim().toUpperCase()
  });
}

export async function adicionarXPAlunoAPI(ra, xp) {
  return chamarAPI({
    action: "addXP",
    ra: String(ra ?? "").trim(),
    xp: Number(xp) || 0
  });
}

export async function adicionarXPGuildaAPI(nome, xp) {
  return chamarAPI({
    action: "addXPGuilda",
    nome: String(nome ?? "").trim(),
    xp: Number(xp) || 0
  });
}

// ====================================================
// FILA OFFLINE PARA MUTAÇÕES DA API (RESPONDER / XP)
// ====================================================

export function obterFilaOperacoesAPI() {
  try {
    const raw = localStorage.getItem(CHAVE_FILA_API);
    const lista = raw ? JSON.parse(raw) : [];
    return Array.isArray(lista) ? lista : [];
  } catch {
    return [];
  }
}

export function enfileirarOperacaoAPI(payload) {
  const fila = obterFilaOperacoesAPI();
  fila.push({
    id: `apiq_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    payload,
    criadoEm: new Date().toISOString()
  });
  try {
    localStorage.setItem(CHAVE_FILA_API, JSON.stringify(fila));
  } catch {}
  return fila.length;
}

export async function processarFilaOperacoesAPI() {
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    return { processados: 0, restantes: obterFilaOperacoesAPI().length };
  }

  const fila = obterFilaOperacoesAPI();
  if (!fila.length) return { processados: 0, restantes: 0 };

  const restantes = [];
  let processados = 0;

  for (const item of fila) {
    const res = await chamarAPI(item.payload);
    if (res && !res.erroRede) {
      processados++;
    } else {
      restantes.push(item);
    }
  }

  try {
    localStorage.setItem(CHAVE_FILA_API, JSON.stringify(restantes));
  } catch {}

  return { processados, restantes: restantes.length };
}
