/**
 * ACESSIBILIDADE UNIVERSAL SP - SALA DO FUTURO V2
 * Motor de Acessibilidade Digital e Apoio Cognitivo / Sensorial
 * Compatível com WCAG 2.2 AAA e Web Speech API
 */

(function () {
  'use strict';

  const CHAVE_STORAGE = 'SALA_FUTURO_ACESSIBILIDADE_PREFS';

  const estadoPadrao = {
    altoContraste: false,
    modoEscuro: false,
    fonteDislexia: false,
    fatorFonte: 1, // 1, 1.15, 1.3, 1.45
    espacamentoAmpliado: false,
    semAnimacao: false,
    filtroDaltonismo: 'nenhum', // 'nenhum', 'protanopia', 'deuteranopia', 'tritanopia', 'monocromatico'
    reguaLeitura: false,
    mascaraFoco: false,
    velocidadeVoz: 1, // 0.8, 1, 1.25
  };

  let estado = carregarEstado();
  let sintetizador = window.speechSynthesis;
  let locutorAtual = null;
  let elementoFalando = null;

  function carregarEstado() {
    try {
      const salvo = localStorage.getItem(CHAVE_STORAGE);
      return salvo ? { ...estadoPadrao, ...JSON.parse(salvo) } : { ...estadoPadrao };
    } catch (e) {
      return { ...estadoPadrao };
    }
  }

  function salvarEstado() {
    try {
      localStorage.setItem(CHAVE_STORAGE, JSON.stringify(estado));
    } catch (e) {
      console.warn('Erro ao salvar preferências de acessibilidade:', e);
    }
  }

  // Injetar filtros SVG para daltonismo
  function injetarFiltrosSVG() {
    if (document.getElementById('filtrosSvgAcessibilidade')) return;

    const svg = document.createElement('div');
    svg.id = 'filtrosSvgAcessibilidade';
    svg.style.position = 'absolute';
    svg.style.height = '0';
    svg.style.width = '0';
    svg.style.overflow = 'hidden';
    svg.innerHTML = `
      <svg aria-hidden="true">
        <defs>
          <filter id="filtro-protanopia">
            <feColorMatrix type="matrix" values="0.567, 0.433, 0, 0, 0 0.558, 0.442, 0, 0, 0 0, 0.242, 0.758, 0, 0 0, 0, 0, 1, 0"/>
          </filter>
          <filter id="filtro-deuteranopia">
            <feColorMatrix type="matrix" values="0.625, 0.375, 0, 0, 0 0.7, 0.3, 0, 0, 0 0, 0.3, 0.7, 0, 0 0, 0, 0, 1, 0"/>
          </filter>
          <filter id="filtro-tritanopia">
            <feColorMatrix type="matrix" values="0.95, 0.05, 0, 0, 0 0, 0.433, 0.567, 0, 0 0, 0.475, 0.525, 0, 0 0, 0, 0, 1, 0"/>
          </filter>
        </defs>
      </svg>
    `;
    document.body.appendChild(svg);
  }

  // Injetar elementos visuais (régua, máscara e widget)
  function injetarComponentesVisuais() {
    // Skip link (pular para conteúdo principal)
    if (!document.querySelector('.link-pular-conteudo')) {
      const skipLink = document.createElement('a');
      skipLink.href = '#conteudo';
      skipLink.className = 'link-pular-conteudo';
      skipLink.textContent = 'Pular para o conteúdo principal (Alt + 1)';
      skipLink.setAttribute('aria-label', 'Pular para o conteúdo principal da página');
      document.body.insertBefore(skipLink, document.body.firstChild);
    }

    // Régua de Leitura
    if (!document.getElementById('reguaLeituraVisual')) {
      const regua = document.createElement('div');
      regua.id = 'reguaLeituraVisual';
      regua.setAttribute('aria-hidden', 'true');
      document.body.appendChild(regua);
    }

    // Máscaras de Foco
    if (!document.getElementById('mascaraFocoTopo')) {
      const maskTop = document.createElement('div');
      maskTop.id = 'mascaraFocoTopo';
      maskTop.setAttribute('aria-hidden', 'true');
      const maskBot = document.createElement('div');
      maskBot.id = 'mascaraFocoBase';
      maskBot.setAttribute('aria-hidden', 'true');
      document.body.appendChild(maskTop);
      document.body.appendChild(maskBot);
    }

    // Botão flutuante e painel modal
    if (!document.getElementById('widgetAcessibilidadeUniversal')) {
      const wrapper = document.createElement('div');
      wrapper.id = 'widgetAcessibilidadeUniversal';
      wrapper.className = 'widget-acessibilidade-wrapper';
      wrapper.innerHTML = `
        <button id="btnAbrirAcessibilidade" class="btn-gatilho-acessibilidade" aria-label="Abrir recursos de acessibilidade (Atalho: Alt + A)" title="Menu de Acessibilidade Universal">
          <span class="icone-acess" aria-hidden="true">♿</span>
          <span class="rotulo-acess">Acessibilidade</span>
        </button>

        <div id="backdropAcessibilidade" class="painel-acessibilidade-backdrop"></div>

        <section id="painelAcessibilidade" class="painel-acessibilidade-modal" role="dialog" aria-modal="true" aria-labelledby="tituloAcessibilidade">
          <div class="painel-cabecalho">
            <h2 id="tituloAcessibilidade">
              <span aria-hidden="true">♿</span> Acessibilidade Universal
            </h2>
            <button id="btnFecharAcessibilidade" class="btn-fechar-painel" aria-label="Fechar painel de acessibilidade (Esc)">✕</button>
          </div>

          <!-- 1. VISÃO E CONTRASTE -->
          <div class="secao-recurso-acess">
            <h3>👁️ Visão e Contraste</h3>
            <div class="grade-botoes-acess">
              <button class="btn-opcao-acess" id="btnAltoContraste" aria-pressed="false">
                <span>⚡</span> Alto Contraste
              </button>
              <button class="btn-opcao-acess" id="btnModoEscuro" aria-pressed="false">
                <span>🌙</span> Modo Escuro
              </button>
            </div>
            <div style="margin-top: 10px;">
              <label for="seletorDaltonismo" style="font-size:0.85rem; font-weight:600; display:block; margin-bottom:4px;">Filtro de Daltonismo:</label>
              <select id="seletorDaltonismo" style="width:100%; padding:8px; border-radius:6px; border:1px solid #cbd5e1; font-size:0.85rem;">
                <option value="nenhum">Nenhum (Padrão)</option>
                <option value="protanopia">Protanopia (Dificuldade com Vermelho)</option>
                <option value="deuteranopia">Deuteranopia (Dificuldade com Verde)</option>
                <option value="tritanopia">Tritanopia (Dificuldade com Azul)</option>
                <option value="monocromatico">Monocromático (Escala de Cinza)</option>
              </select>
            </div>
          </div>

          <!-- 2. LEITURA E TIPOGRAFIA -->
          <div class="secao-recurso-acess">
            <h3>🔤 Leitura e Tipografia</h3>
            <div class="grade-botoes-acess" style="margin-bottom: 10px;">
              <button class="btn-opcao-acess" id="btnAumentarFonte" title="Aumentar texto">
                <span>A+</span> Aumentar
              </button>
              <button class="btn-opcao-acess" id="btnDiminuirFonte" title="Diminuir texto">
                <span>A-</span> Diminuir
              </button>
            </div>
            <div class="grade-botoes-acess">
              <button class="btn-opcao-acess" id="btnFonteDislexia" aria-pressed="false">
                <span>📖</span> Fonte Dislexia
              </button>
              <button class="btn-opcao-acess" id="btnEspacamento" aria-pressed="false">
                <span>↔️</span> Espaçamento
              </button>
            </div>
          </div>

          <!-- 3. FOCO COGNITIVO E TDAH -->
          <div class="secao-recurso-acess">
            <h3>🎯 Foco Cognitivo e TDAH</h3>
            <div class="grade-botoes-acess">
              <button class="btn-opcao-acess" id="btnReguaLeitura" aria-pressed="false">
                <span>📏</span> Régua Leitura
              </button>
              <button class="btn-opcao-acess" id="btnMascaraFoco" aria-pressed="false">
                <span>🕶️</span> Máscara Foco
              </button>
              <button class="btn-opcao-acess" id="btnSemAnimacao" aria-pressed="false" style="grid-column: span 2;">
                <span>🛑</span> Reduzir Estímulos / Animações
              </button>
            </div>
          </div>

          <!-- 4. LEITOR DE TELA POR VOZ (TEXT-TO-SPEECH) -->
          <div class="secao-recurso-acess">
            <h3>🔊 Leitor de Voz e Narração</h3>
            <div class="barra-controle-voz">
              <div class="botoes-audio-fila">
                <button id="btnLerConteudo" title="Ler conteúdo principal ou texto selecionado">▶️ Ler Página</button>
                <button id="btnPausarVoz" title="Pausar leitura">⏸️ Pausar</button>
                <button id="btnPararVoz" title="Parar leitura">⏹️ Parar</button>
              </div>
              <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.85rem;">
                <label for="velocidadeVozSelect">Velocidade:</label>
                <select id="velocidadeVozSelect" style="padding:4px 8px; border-radius:6px; border:1px solid #cbd5e1;">
                  <option value="0.8">0.8x (Mais lenta)</option>
                  <option value="1" selected>1.0x (Normal)</option>
                  <option value="1.25">1.25x (Rápida)</option>
                </select>
              </div>
              <div id="statusVozTexto" class="status-voz-texto" aria-live="polite">
                Dica: Selecione qualquer texto na tela para ouvi-lo em voz alta!
              </div>
            </div>
          </div>

          <!-- 5. GUIA DE ATALHOS DE TECLADO -->
          <div class="secao-recurso-acess">
            <h3>⌨️ Atalhos de Teclado</h3>
            <ul class="lista-atalhos-acess">
              <li><span>Abrir/Fechar Acessibilidade</span> <kbd>Alt + A</kbd></li>
              <li><span>Alternar Alto Contraste</span> <kbd>Alt + C</kbd></li>
              <li><span>Ouvir Texto / Voz</span> <kbd>Alt + V</kbd></li>
              <li><span>Aumentar / Diminuir Fonte</span> <kbd>Alt + / Alt -</kbd></li>
              <li><span>Régua de Leitura</span> <kbd>Alt + R</kbd></li>
              <li><span>Máscara de Foco</span> <kbd>Alt + M</kbd></li>
              <li><span>Fechar Painel / Parar Voz</span> <kbd>Esc</kbd></li>
            </ul>
          </div>

          <button id="btnResetarAcessibilidade" class="btn-resetar-acess">
            Restaurar Configurações Originais
          </button>
        </section>
      `;
      document.body.appendChild(wrapper);
    }
  }

  // Aplicar o estado atual no DOM
  function aplicarEstado() {
    const body = document.body;

    // 1. Alto Contraste
    body.classList.toggle('acessibilidade-alto-contraste', estado.altoContraste);
    const btnAC = document.getElementById('btnAltoContraste');
    if (btnAC) {
      btnAC.classList.toggle('ativo', estado.altoContraste);
      btnAC.setAttribute('aria-pressed', estado.altoContraste);
    }

    // 2. Modo Escuro
    body.classList.toggle('acessibilidade-modo-escuro', estado.modoEscuro && !estado.altoContraste);
    const btnME = document.getElementById('btnModoEscuro');
    if (btnME) {
      btnME.classList.toggle('ativo', estado.modoEscuro && !estado.altoContraste);
      btnME.setAttribute('aria-pressed', estado.modoEscuro && !estado.altoContraste);
    }

    // 3. Fonte Dislexia
    body.classList.toggle('acessibilidade-fonte-dislexia', estado.fonteDislexia);
    const btnFD = document.getElementById('btnFonteDislexia');
    if (btnFD) {
      btnFD.classList.toggle('ativo', estado.fonteDislexia);
      btnFD.setAttribute('aria-pressed', estado.fonteDislexia);
    }

    // 4. Espaçamento Ampliado
    body.classList.toggle('acessibilidade-espacamento-ampliado', estado.espacamentoAmpliado);
    const btnEsp = document.getElementById('btnEspacamento');
    if (btnEsp) {
      btnEsp.classList.toggle('ativo', estado.espacamentoAmpliado);
      btnEsp.setAttribute('aria-pressed', estado.espacamentoAmpliado);
    }

    // 5. Reduzir Animação
    body.classList.toggle('acessibilidade-sem-animacao', estado.semAnimacao);
    const btnAnim = document.getElementById('btnSemAnimacao');
    if (btnAnim) {
      btnAnim.classList.toggle('ativo', estado.semAnimacao);
      btnAnim.setAttribute('aria-pressed', estado.semAnimacao);
    }

    // 6. Fator de Fonte
    document.documentElement.style.setProperty('--fator-fonte', estado.fatorFonte);

    // 7. Daltonismo
    body.classList.remove('daltonismo-protanopia', 'daltonismo-deuteranopia', 'daltonismo-tritanopia', 'daltonismo-monocromatico');
    if (estado.filtroDaltonismo && estado.filtroDaltonismo !== 'nenhum') {
      body.classList.add(`daltonismo-${estado.filtroDaltonismo}`);
    }
    const selDalt = document.getElementById('seletorDaltonismo');
    if (selDalt) selDalt.value = estado.filtroDaltonismo;

    // 8. Régua de Leitura
    const regua = document.getElementById('reguaLeituraVisual');
    if (regua) {
      regua.style.display = estado.reguaLeitura ? 'block' : 'none';
    }
    const btnReg = document.getElementById('btnReguaLeitura');
    if (btnReg) {
      btnReg.classList.toggle('ativo', estado.reguaLeitura);
      btnReg.setAttribute('aria-pressed', estado.reguaLeitura);
    }

    // 9. Máscara de Foco
    const mTopo = document.getElementById('mascaraFocoTopo');
    const mBase = document.getElementById('mascaraFocoBase');
    if (mTopo && mBase) {
      mTopo.style.display = estado.mascaraFoco ? 'block' : 'none';
      mBase.style.display = estado.mascaraFoco ? 'block' : 'none';
    }
    const btnMasc = document.getElementById('btnMascaraFoco');
    if (btnMasc) {
      btnMasc.classList.toggle('ativo', estado.mascaraFoco);
      btnMasc.setAttribute('aria-pressed', estado.mascaraFoco);
    }

    // 10. Velocidade de Voz
    const selVel = document.getElementById('velocidadeVozSelect');
    if (selVel) selVel.value = String(estado.velocidadeVoz);

    salvarEstado();
  }

  // Controle da régua e máscara seguindo o ponteiro do mouse
  function atualizarPosicaoFoco(e) {
    const y = e.clientY || 200;
    const alturaJanela = window.innerHeight;
    const faixaAltura = 80;

    const regua = document.getElementById('reguaLeituraVisual');
    if (regua && estado.reguaLeitura) {
      regua.style.top = `${y}px`;
    }

    const mTopo = document.getElementById('mascaraFocoTopo');
    const mBase = document.getElementById('mascaraFocoBase');
    if (mTopo && mBase && estado.mascaraFoco) {
      const topHeight = Math.max(0, y - faixaAltura / 2);
      const botHeight = Math.max(0, alturaJanela - (y + faixaAltura / 2));
      mTopo.style.height = `${topHeight}px`;
      mBase.style.height = `${botHeight}px`;
    }
  }

  // Web Speech API - Text to Speech
  function falarTexto(texto, elementoParaDestacar) {
    if (!sintetizador) {
      alert('Seu navegador não possui suporte nativo à síntese de voz (Web Speech API).');
      return;
    }

    pararVoz();

    if (!texto || !texto.trim()) {
      texto = obterTextoDaPagina();
    }

    if (!texto) return;

    locutorAtual = new SpeechSynthesisUtterance(texto);
    locutorAtual.lang = 'pt-BR';
    locutorAtual.rate = estado.velocidadeVoz || 1;

    const statusEl = document.getElementById('statusVozTexto');
    if (statusEl) statusEl.textContent = '🔊 Lendo em voz alta...';

    if (elementoParaDestacar) {
      limparDestaqueVoz();
      elementoParaDestacar.classList.add('acessibilidade-destaque-voz');
      elementoFalando = elementoParaDestacar;
    }

    locutorAtual.onend = function () {
      if (statusEl) statusEl.textContent = '✅ Leitura concluída.';
      limparDestaqueVoz();
    };

    locutorAtual.onerror = function () {
      if (statusEl) statusEl.textContent = '⏹️ Leitura interrompida.';
      limparDestaqueVoz();
    };

    sintetizador.speak(locutorAtual);
  }

  function pausarVoz() {
    if (sintetizador && sintetizador.speaking) {
      if (sintetizador.paused) {
        sintetizador.resume();
        const statusEl = document.getElementById('statusVozTexto');
        if (statusEl) statusEl.textContent = '🔊 Lendo em voz alta...';
      } else {
        sintetizador.pause();
        const statusEl = document.getElementById('statusVozTexto');
        if (statusEl) statusEl.textContent = '⏸️ Leitura pausada.';
      }
    }
  }

  function pararVoz() {
    if (sintetizador) {
      sintetizador.cancel();
      limparDestaqueVoz();
      const statusEl = document.getElementById('statusVozTexto');
      if (statusEl) statusEl.textContent = '⏹️ Leitura parada.';
    }
  }

  function limparDestaqueVoz() {
    if (elementoFalando) {
      elementoFalando.classList.remove('acessibilidade-destaque-voz');
      elementoFalando = null;
    }
    document.querySelectorAll('.acessibilidade-destaque-voz').forEach((el) => {
      el.classList.remove('acessibilidade-destaque-voz');
    });
  }

  function obterTextoDaPagina() {
    // Verificar se há seleção de texto
    const selecao = window.getSelection().toString();
    if (selecao && selecao.trim().length > 0) {
      return selecao.trim();
    }

    // Tentar pegar área principal de conteúdo
    const principal = document.querySelector('main, #conteudo, .app, [role="main"]');
    if (principal) {
      return principal.innerText.slice(0, 3000);
    }

    return document.body.innerText.slice(0, 2000);
  }

  // Alternar visibilidade do painel
  function alternarPainel(forcarAberto) {
    const painel = document.getElementById('painelAcessibilidade');
    const backdrop = document.getElementById('backdropAcessibilidade');
    if (!painel || !backdrop) return;

    const estaAberto = painel.style.display === 'block';
    const novoEstado = typeof forcarAberto === 'boolean' ? forcarAberto : !estaAberto;

    painel.style.display = novoEstado ? 'block' : 'none';
    backdrop.style.display = novoEstado ? 'block' : 'none';

    if (novoEstado) {
      document.getElementById('btnFecharAcessibilidade')?.focus();
    } else {
      document.getElementById('btnAbrirAcessibilidade')?.focus();
    }
  }

  // Vincular eventos aos elementos da interface
  function vincularEventos() {
    document.getElementById('btnAbrirAcessibilidade')?.addEventListener('click', () => alternarPainel(true));
    document.getElementById('btnFecharAcessibilidade')?.addEventListener('click', () => alternarPainel(false));
    document.getElementById('backdropAcessibilidade')?.addEventListener('click', () => alternarPainel(false));

    // Alto Contraste
    document.getElementById('btnAltoContraste')?.addEventListener('click', () => {
      estado.altoContraste = !estado.altoContraste;
      if (estado.altoContraste) estado.modoEscuro = false;
      aplicarEstado();
    });

    // Modo Escuro
    document.getElementById('btnModoEscuro')?.addEventListener('click', () => {
      estado.modoEscuro = !estado.modoEscuro;
      if (estado.modoEscuro) estado.altoContraste = false;
      aplicarEstado();
    });

    // Filtro Daltonismo
    document.getElementById('seletorDaltonismo')?.addEventListener('change', (e) => {
      estado.filtroDaltonismo = e.target.value;
      aplicarEstado();
    });

    // Aumentar / Diminuir Fonte
    document.getElementById('btnAumentarFonte')?.addEventListener('click', () => {
      if (estado.fatorFonte < 1.5) {
        estado.fatorFonte = +(estado.fatorFonte + 0.15).toFixed(2);
        aplicarEstado();
      }
    });

    document.getElementById('btnDiminuirFonte')?.addEventListener('click', () => {
      if (estado.fatorFonte > 0.85) {
        estado.fatorFonte = +(estado.fatorFonte - 0.15).toFixed(2);
        aplicarEstado();
      }
    });

    // Fonte Dislexia
    document.getElementById('btnFonteDislexia')?.addEventListener('click', () => {
      estado.fonteDislexia = !estado.fonteDislexia;
      aplicarEstado();
    });

    // Espaçamento Ampliado
    document.getElementById('btnEspacamento')?.addEventListener('click', () => {
      estado.espacamentoAmpliado = !estado.espacamentoAmpliado;
      aplicarEstado();
    });

    // Reduzir Animações
    document.getElementById('btnSemAnimacao')?.addEventListener('click', () => {
      estado.semAnimacao = !estado.semAnimacao;
      aplicarEstado();
    });

    // Régua de Leitura
    document.getElementById('btnReguaLeitura')?.addEventListener('click', () => {
      estado.reguaLeitura = !estado.reguaLeitura;
      aplicarEstado();
    });

    // Máscara de Foco
    document.getElementById('btnMascaraFoco')?.addEventListener('click', () => {
      estado.mascaraFoco = !estado.mascaraFoco;
      aplicarEstado();
    });

    // Leitor de Voz
    document.getElementById('btnLerConteudo')?.addEventListener('click', () => {
      const texto = obterTextoDaPagina();
      falarTexto(texto);
    });

    document.getElementById('btnPausarVoz')?.addEventListener('click', pausarVoz);
    document.getElementById('btnPararVoz')?.addEventListener('click', pararVoz);

    document.getElementById('velocidadeVozSelect')?.addEventListener('change', (e) => {
      estado.velocidadeVoz = parseFloat(e.target.value) || 1;
      salvarEstado();
    });

    // Resetar
    document.getElementById('btnResetarAcessibilidade')?.addEventListener('click', () => {
      estado = { ...estadoPadrao };
      aplicarEstado();
      pararVoz();
    });

    // Mouse movement para régua e máscara
    window.addEventListener('mousemove', atualizarPosicaoFoco, { passive: true });
    window.addEventListener('touchmove', (e) => {
      if (e.touches && e.touches[0]) {
        atualizarPosicaoFoco({ clientY: e.touches[0].clientY });
      }
    }, { passive: true });

    // Atalhos de teclado (Alt + Tecla)
    window.addEventListener('keydown', (e) => {
      if (e.altKey) {
        const key = e.key.toLowerCase();
        if (key === 'a') {
          e.preventDefault();
          alternarPainel();
        } else if (key === 'c') {
          e.preventDefault();
          estado.altoContraste = !estado.altoContraste;
          aplicarEstado();
        } else if (key === 'v') {
          e.preventDefault();
          falarTexto(obterTextoDaPagina());
        } else if (key === '+' || key === '=') {
          e.preventDefault();
          if (estado.fatorFonte < 1.5) {
            estado.fatorFonte = +(estado.fatorFonte + 0.15).toFixed(2);
            aplicarEstado();
          }
        } else if (key === '-') {
          e.preventDefault();
          if (estado.fatorFonte > 0.85) {
            estado.fatorFonte = +(estado.fatorFonte - 0.15).toFixed(2);
            aplicarEstado();
          }
        } else if (key === 'r') {
          e.preventDefault();
          estado.reguaLeitura = !estado.reguaLeitura;
          aplicarEstado();
        } else if (key === 'm') {
          e.preventDefault();
          estado.mascaraFoco = !estado.mascaraFoco;
          aplicarEstado();
        }
      } else if (e.key === 'Escape') {
        alternarPainel(false);
        pararVoz();
      }
    });

    // Leitura contextual com clique duplo em qualquer elemento de texto quando leitor estiver em foco
    document.addEventListener('dblclick', (e) => {
      const texto = e.target.innerText || e.target.textContent;
      if (texto && texto.trim().length > 3 && !e.target.closest('#widgetAcessibilidadeUniversal')) {
        falarTexto(texto.trim(), e.target);
      }
    });
  }

  // Inicialização
  function inicializar() {
    injetarFiltrosSVG();
    injetarComponentesVisuais();
    vincularEventos();
    aplicarEstado();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializar);
  } else {
    inicializar();
  }

  // Expor API global acessível
  window.AcessibilidadeSP = {
    falarTexto,
    pausarVoz,
    pararVoz,
    alternarPainel,
    obterEstado: () => ({ ...estado }),
  };
})();
