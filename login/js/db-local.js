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
  versao: "2.7-cmsp-tasks",
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
      habilidadeBNCC: "EF08MA04 / EF08MA07",
      descricao: "Desafios práticos envolvendo proporcionalidade, razão e equações lineares no cotidiano da escola e do laboratório Maker.",
      anexos: [],
      questoes: [
        {
          id: "q1",
          tipo: "lacuna",
          enunciado: "Complete a frase selecionando a taxa de produção unitária correta no menu suspenso:",
          textoAntes: "Se 4 impressoras 3D produzem 24 peças em 3 horas contínuas, a taxa de produção de cada impressora é de",
          textoDepois: "de funcionamento ininterrupto.",
          opcoes: ["2 peças por hora", "4 peças por hora", "6 peças por hora", "8 peças por hora"],
          respostaCorreta: "2 peças por hora",
          pontos: 5,
          dica: "Descubra primeiro quantas peças são feitas ao todo em uma única hora pelas 4 impressoras juntas.",
          explicacao: "24 peças divididas por 3 horas = 8 peças/hora no conjunto. Como são 4 máquinas: 8 / 4 = 2 peças por hora para cada impressora."
        },
        {
          id: "q2",
          tipo: "multiplaEscolha",
          enunciado: "Mantendo o mesmo ritmo de produção, quantas peças serão produzidas por 6 impressoras iguais durante 4 horas de funcionamento?",
          alternativas: [
            { id: "a", texto: "36 peças" },
            { id: "b", texto: "48 peças" },
            { id: "c", texto: "54 peças" },
            { id: "d", texto: "60 peças" }
          ],
          respostaCorreta: "b",
          pontos: 5,
          dica: "Multiplique a quantidade de impressoras pelo número de horas e pela taxa unitária (2 peças/hora).",
          explicacao: "Total de peças = 6 impressoras * 4 horas * 2 peças/hora = 48 peças produzidas."
        },
        {
          id: "q3",
          tipo: "multiplaEscolha",
          enunciado: "O dobro da pontuação de uma guilda na gincana escolar, somado a 150 pontos bônus, totaliza 750 pontos. Qual é a pontuação original dessa guilda?",
          alternativas: [
            { id: "a", texto: "250 pontos" },
            { id: "b", texto: "300 pontos" },
            { id: "c", texto: "350 pontos" },
            { id: "d", texto: "400 pontos" }
          ],
          respostaCorreta: "b",
          pontos: 10,
          dica: "Monte a equação linear: 2x + 150 = 750 e subtraia 150 de ambos os lados.",
          explicacao: "2x + 150 = 750 => 2x = 600 => x = 300 pontos."
        },
        {
          id: "q4",
          tipo: "lacuna",
          enunciado: "Selecione o valor que satisfaz a igualdade na equação linear:",
          textoAntes: "Para a equação 3x - 15 = 45, o valor numérico da incógnita x é",
          textoDepois: ", tornando a sentença verdadeira.",
          opcoes: ["15", "20", "25", "30"],
          respostaCorreta: "20",
          pontos: 5,
          dica: "Some 15 em ambos os membros da igualdade e depois divida por 3.",
          explicacao: "3x = 45 + 15 => 3x = 60 => x = 20."
        },
        {
          id: "q5",
          tipo: "multiplaEscolha",
          enunciado: "Em uma mistura de tinta para pintura de um mural escolar, a proporção recomendada é de 2 partes de pigmento azul para 5 partes de base branca. Se foram utilizados 15 litros de base branca, qual a quantidade necessária de pigmento azul?",
          alternativas: [
            { id: "a", texto: "4 litros" },
            { id: "b", texto: "6 litros" },
            { id: "c", texto: "8 litros" },
            { id: "d", texto: "10 litros" }
          ],
          respostaCorreta: "b",
          pontos: 10,
          dica: "A base branca aumentou 3 vezes (de 5 para 15). O que deve acontecer com o pigmento azul?",
          explicacao: "Razão: 2/5 = x/15 => 5x = 30 => x = 6 litros."
        },
        {
          id: "q6",
          tipo: "dissertativa",
          enunciado: "Explique sucintamente o método das operações inversas que você utiliza para isolar uma incógnita e por que conferir o resultado substituindo a raiz encontrada na equação original é uma prática essencial da investigação científica.",
          criterios: "Clareza expositiva, menção a operações inversas e verificação de validade da solução.",
          pontos: 5,
          dica: "Lembre-se de termos como: 'o que está somando passa subtraindo' ou a propriedade de equivalência da igualdade.",
          explicacao: "O método das operações inversas mantém o equilíbrio entre os membros da equação, e a prova real valida que não houve erro aritmético."
        }
      ]
    },
    {
      id: "tar_2",
      titulo: "Crônica Escolar e Recursos Expressivos",
      componente: "Língua Portuguesa",
      turma: "8º Ano A",
      prazo: "2026-09-28",
      pontosXP: 45,
      status: "ativa",
      habilidadeBNCC: "EF08LP04 / EF08LP07",
      descricao: "Análise de crônica sobre o cotidiano da escola e identificação de figuras de linguagem e coesão referencial.",
      anexos: [],
      questoes: [
        {
          id: "q1",
          tipo: "lacuna",
          enunciado: "Complete a frase selecionando a função coesiva do pronome no trecho em destaque:",
          textoAntes: "No trecho 'Os alunos da Sala do Futuro criaram um robô assistente. Eles dedicaram semanas ao código.', o pronome 'Eles' atua como",
          textoDepois: ", recuperando um termo já mencionado.",
          opcoes: ["elemento anafórico", "elemento catafórico", "termo elíptico", "metáfora estendida"],
          respostaCorreta: "elemento anafórico",
          pontos: 10,
          dica: "Anafórico retoma o que já veio antes no texto; catafórico antecipa o que virá.",
          explicacao: "A anáfora é o mecanismo de coesão referencial que retoma uma expressão precedente ('Os alunos da Sala do Futuro')."
        },
        {
          id: "q2",
          tipo: "multiplaEscolha",
          enunciado: "No trecho 'O sino do intervalo cantou alto e libertou a turma ansiosa', a figura de linguagem presente na expressão 'o sino cantou' é classificada como:",
          alternativas: [
            { id: "a", texto: "Personificação (ou Prosopopeia)" },
            { id: "b", texto: "Metonímia quantitativa" },
            { id: "c", texto: "Pleonasmo vicioso" },
            { id: "d", texto: "Eufemismo atenuador" }
          ],
          respostaCorreta: "a",
          pontos: 10,
          dica: "Atribuir ações humanas (como cantar) a objetos inanimados (o sino).",
          explicacao: "A personificação ou prosopopeia confere características ou ações próprias de seres humanos a objetos ou seres inanimados."
        },
        {
          id: "q3",
          tipo: "multiplaEscolha",
          enunciado: "Qual das seguintes características é predominante no gênero textual 'Crônica'?",
          alternativas: [
            { id: "a", texto: "Relato de fatos do cotidiano sob um olhar reflexivo, lírico ou bem-humorado com linguagem acessível." },
            { id: "b", texto: "Linguagem técnica e impessoal com o objetivo exclusivo de orientar a montagem de um aparelho." },
            { id: "c", texto: "Estrutura estritamente jurídica baseada em artigos e parágrafos de lei." },
            { id: "d", texto: "Ensaio acadêmico com revisão bibliográfica exaustiva e notas de rodapé formais." }
          ],
          respostaCorreta: "a",
          pontos: 5,
          dica: "Pense nas crônicas de jornais que você lê na escola sobre pequenos acontecimentos do dia a dia.",
          explicacao: "A crônica se destaca por transformar o ordinário e os fatos simples do dia a dia em matéria de literatura e reflexão."
        },
        {
          id: "q4",
          tipo: "lacuna",
          enunciado: "Selecione o conector de oposição adequado para unir as orações:",
          textoAntes: "O time de robótica encontrou desafios na programação,",
          textoDepois: "conseguiu apresentar o projeto com excelência na feira de ciências.",
          opcoes: ["contudo", "porque", "conforme", "portanto"],
          respostaCorreta: "contudo",
          pontos: 5,
          dica: "Procure a conjunção adversativa sinônima de 'porém' ou 'no entanto'.",
          explicacao: "'Contudo' é conjunção coordenativa adversativa, estabelecendo quebra de expectativa favorável."
        },
        {
          id: "q5",
          tipo: "multiplaEscolha",
          enunciado: "Em 'Suas palavras foram um bálsamo para o colega que estava nervoso antes da prova', a expressão 'foram um bálsamo' constitui uma:",
          alternativas: [
            { id: "a", texto: "Metáfora" },
            { id: "b", texto: "Hipérbole" },
            { id: "c", texto: "Aliteração" },
            { id: "d", texto: "Ironia" }
          ],
          respostaCorreta: "a",
          pontos: 5,
          dica: "Trata-se de uma comparação direta e implícita sem a palavra 'como'.",
          explicacao: "A metáfora é uma transferência de sentido por semelhança (as palavras acalmaram como um remédio/bálsamo)."
        },
        {
          id: "q6",
          tipo: "dissertativa",
          enunciado: "Escreva uma breve reflexão de 3 a 5 linhas sobre a importância de observar os detalhes e conversas do ambiente escolar para a criação de um texto expressivo e autêntico.",
          criterios: "Pertinência temática, clareza e uso da norma-padrão.",
          pontos: 10,
          dica: "Pense na sensibilidade do cronista para perceber o valor do que parece invisível aos olhos apressados.",
          explicacao: "A crônica desenvolve a escuta atenta, a empatia e o olhar poético sobre a comunidade escolar."
        }
      ]
    },
    {
      id: "tar_3",
      titulo: "Transformações Químicas e Evidências Práticas",
      componente: "Ciências",
      turma: "8º Ano A",
      prazo: "2026-09-30",
      pontosXP: 50,
      status: "ativa",
      habilidadeBNCC: "EF08CI05 / EF08CI06",
      descricao: "Evidências experimentais de transformações químicas, liberação de gases e conservação da matéria.",
      anexos: [],
      questoes: [
        {
          id: "q1",
          tipo: "lacuna",
          enunciado: "Complete a frase identificando a principal evidência da reação química no experimento escolar:",
          textoAntes: "Ao misturar bicarbonato de sódio e vinagre em uma garrafa fechada com bexiga, a efervescência e o inflar da bexiga indicam",
          textoDepois: ", comprovando uma transformação química.",
          opcoes: ["a liberação de gás carbônico (CO₂)", "a liquefação do oxigênio", "a solidificação do nitrogênio", "a evaporação da água pura"],
          respostaCorreta: "a liberação de gás carbônico (CO₂)",
          pontos: 10,
          dica: "A reação ácido-base entre o ácido acético e o bicarbonato produz água, acetato de sódio e um gás específico.",
          explicacao: "A formação rápida de bolhas (efervescência) e o gás retido comprovam a formação de uma nova substância: o gás carbônico (CO₂)."
        },
        {
          id: "q2",
          tipo: "multiplaEscolha",
          enunciado: "Qual das seguintes situações representa exclusivamente uma transformação física da matéria?",
          alternativas: [
            { id: "a", texto: "Fusão de cubos de gelo na bancada do laboratório." },
            { id: "b", texto: "Enferrujamento de um prego de ferro exposto à umidade." },
            { id: "c", texto: "Combustão completa do gás de cozinha no bico de Bunsen." },
            { id: "d", texto: "Fotossíntese nas folhas de uma planta da horta escolar." }
          ],
          respostaCorreta: "a",
          pontos: 10,
          dica: "Nas transformações físicas, a substância muda apenas de estado ou formato, sem alterar sua composição molecular.",
          explicacao: "A fusão do gelo é mudança de estado da água (sólido para líquido), sem criação de novas substâncias químicas."
        },
        {
          id: "q3",
          tipo: "lacuna",
          enunciado: "Identifique o princípio fundamental formulado por Antoine Lavoisier:",
          textoAntes: "Em um sistema fechado, a massa total dos reagentes antes da transformação é",
          textoDepois: "à massa total dos produtos após a reação química.",
          opcoes: ["estritamente igual", "sempre menor", "sempre maior", "imprevisível"],
          respostaCorreta: "estritamente igual",
          pontos: 5,
          dica: "'Na natureza nada se cria, nada se perde, tudo se transforma'.",
          explicacao: "A Lei de Lavoisier (Conservação das Massas) estabelece que o número de átomos se conserva em um sistema fechado."
        },
        {
          id: "q4",
          tipo: "multiplaEscolha",
          enunciado: "Em um ecossistema da Mata Atlântica paulista, a ausência de predadores de topo (como a onça-parda) gera diretamente:",
          alternativas: [
            { id: "a", texto: "Aumento descontrolado de herbívoros e degradação progressiva da vegetação nativa." },
            { id: "b", texto: "Crescimento imediato de todas as árvores centenárias da floresta." },
            { id: "c", texto: "Paralisação completa da evaporação de rios e cachoeiras." },
            { id: "d", texto: "Extinção imediata de fungos decompositores no solo úmido." }
          ],
          respostaCorreta: "a",
          pontos: 10,
          dica: "Pense na cadeia alimentar e no controle biológico populacional das espécies intermediárias.",
          explicacao: "Predadores de topo realizam o controle populacional de herbívoros, evitando a superexploração da cobertura vegetal nativa."
        },
        {
          id: "q5",
          tipo: "lacuna",
          enunciado: "Complete a afirmação sobre o papel biológico dos organismos decompositores:",
          textoAntes: "Os fungos e bactérias decompositores são essenciais para",
          textoDepois: ", permitindo que os nutrientes voltem ao solo para os produtores.",
          opcoes: ["a reciclagem da matéria orgânica", "a geração de energia solar", "a eliminação de oxigênio da atmosfera", "o congelamento do solo"],
          respostaCorreta: "a reciclagem da matéria orgânica",
          pontos: 5,
          dica: "Eles fecham os ciclos biogeoquímicos que mantêm a fertilidade do solo.",
          explicacao: "Os decompositores transformam matéria orgânica morta em compostos minerais assimiláveis pelas plantas."
        },
        {
          id: "q6",
          tipo: "dissertativa",
          enunciado: "Explique como os alunos da Sala do Futuro podem mensurar com uma balança de precisão que a massa não foi perdida quando a reação com efervescência ocorre dentro de uma garrafa hermeticamente tampada.",
          criterios: "Conceito de sistema fechado, leitura de massas e Lei de Lavoisier.",
          pontos: 10,
          dica: "Pese o conjunto antes de misturar e após a reação com a tampa bem fechada.",
          explicacao: "No sistema vedado, o gás liberado não escapa para o ambiente, comprovando a conservação da massa."
        }
      ]
    },
    {
      id: "tar_4",
      titulo: "Revolução Constitucionalista de 1932 em SP",
      componente: "História",
      turma: "8º Ano A",
      prazo: "2026-10-02",
      pontosXP: 40,
      status: "ativa",
      habilidadeBNCC: "EF09HI01 / EF08HI14",
      descricao: "Análise histórica das causas cívicas, propaganda e mobilização popular no movimento constitucionalista paulista de 1932.",
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
      habilidadeBNCC: "EF08GE03 / EF08GE15",
      descricao: "Mapeamento dos afluentes do Rio Tietê, conurbação urbana e impactos da impermeabilização do solo.",
      anexos: []
    },
    {
      id: "tar_6",
      titulo: "Climate Change & Digital Connectors in English",
      componente: "Língua Inglesa",
      turma: "8º Ano A",
      prazo: "2026-10-08",
      pontosXP: 50,
      status: "ativa",
      habilidadeBNCC: "EF08LI08 / SEDUC-SP",
      descricao: "Atividade curricular interativa CMSP: Conectivos em Língua Inglesa, Letramento Digital e Ações Sustentáveis na Escola.",
      anexos: [],
      questoes: [
        {
          id: "q1",
          tipo: "lacuna",
          enunciado: "Complete a frase selecionando a opção correta no menu suspenso (indicando propósito / finalidade):",
          textoAntes: "Students must use strong passwords,",
          textoDepois: "they can protect their personal data online.",
          opcoes: ["so that", "although", "because of", "however"],
          respostaCorreta: "so that",
          pontos: 10,
          dica: "Procure o conector que signifique 'para que' ou 'de modo a' garantir proteção dos dados.",
          explicacao: "'So that' indica finalidade ou propósito ('de modo que' / 'para que'), expressando o objetivo de utilizar senhas fortes para resguardar a privacidade digital."
        },
        {
          id: "q2",
          tipo: "multiplaEscolha",
          enunciado: "Which connector correctly expresses a contrast or concession between the two clauses?",
          alternativas: [
            { id: "a", texto: "Although the school computers are fast, students must respect security rules." },
            { id: "b", texto: "Because the school computers are fast, they stopped working yesterday." },
            { id: "c", texto: "Therefore the monitor is brightly lit." },
            { id: "d", texto: "In order to the battery was fully charged." }
          ],
          respostaCorreta: "a",
          pontos: 10,
          dica: "Observe qual oração expressa uma ideia de concessão ou oposição inesperada ('embora' / 'apesar de').",
          explicacao: "'Although' (embora / apesar de) estabelece o contraste adequado entre a qualidade dos computadores e a necessidade do cumprimento de diretrizes de segurança."
        },
        {
          id: "q3",
          tipo: "lacuna",
          enunciado: "Selecione o conector de causa e consequência adequado no menu suspenso:",
          textoAntes: "The school created a digital awareness campaign",
          textoDepois: "many students needed guidance on cybersecurity and online privacy.",
          opcoes: ["because", "unless", "despite", "whereas"],
          respostaCorreta: "because",
          pontos: 5,
          dica: "Qual conector indica o motivo ou razão fundamental que motivou o início da campanha?",
          explicacao: "'Because' (porque / visto que) expressa a causa direta que justificou a criação da campanha de conscientização digital."
        },
        {
          id: "q4",
          tipo: "multiplaEscolha",
          enunciado: "In the sentence: 'Solar panels were installed on the school roof; therefore, electricity costs were significantly reduced', the word 'therefore' expresses:",
          alternativas: [
            { id: "a", texto: "Conclusion and logical result of the previous fact." },
            { id: "b", texto: "A mandatory condition for the future." },
            { id: "c", texto: "A chronological sequence in the distant past." },
            { id: "d", texto: "An opposite opinion that disagrees with the first idea." }
          ],
          respostaCorreta: "a",
          pontos: 10,
          dica: "Pense na consequência imediata gerada pela instalação dos painéis de energia solar.",
          explicacao: "'Therefore' (portanto / por conseguinte) introduz a conclusão lógica e o resultado prático decorrente da ação anterior."
        },
        {
          id: "q5",
          tipo: "lacuna",
          enunciado: "Complete a declaração sobre sustentabilidade e economia de energia na escola:",
          textoAntes: "Computers and classroom monitors should be turned off after classes",
          textoDepois: "avoid wasting electrical power in the building.",
          opcoes: ["in order to", "even though", "as soon as", "instead of"],
          respostaCorreta: "in order to",
          pontos: 5,
          dica: "Indica o objetivo deliberado da ação com o verbo no infinitivo ('avoid').",
          explicacao: "'In order to' seguido de verbo infinitivo ('avoid') expressa a intenção e a finalidade de economizar energia elétrica."
        },
        {
          id: "q6",
          tipo: "dissertativa",
          enunciado: "Write a short practical recommendation (2 to 3 sentences in English or Portuguese) suggesting how students in Sala do Futuro can promote digital sustainability (for example: turning off monitors, cloud cleanup or device recycling).",
          criterios: "Pertinência temática com sustentabilidade digital, clareza e vocabulário contextualizado.",
          pontos: 10,
          dica: "Mencione hábitos simples do laboratório de informática que reduzem o consumo de energia ou o descarte indevido de lixo eletrônico.",
          explicacao: "A prática desenvolve o protagonismo estudantil e a cidadania digital integrada aos Objetivos de Desenvolvimento Sustentável (ODS)."
        }
      ]
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
      habilidadeBNCC: "EF08MA04 / SEDUC-SP",
      descricao: "Simulação de planejamento orçamentário pessoal e familiar utilizando a metodologia 50-30-20.",
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
      id: "oc_4",
      alunoId: "aluno_1",
      alunoNome: "Guilherme Santos",
      alunoRA: "000.123.456-7 SP",
      turma: "8º Ano A",
      data: "2026-09-26",
      gravidade: "Média",
      tipo: "Não realização reiterada de tarefas no Tarefas SP",
      status: "Pendente de Assinatura dos Pais",
      descricao: "O estudante não realizou os exercícios de fixação de Matemática (Equações Lineares) e Ciências nas últimas 3 semanas.",
      providencias: "Diálogo de orientação com o estudante em sala de aula e envio desta notificação oficial para acompanhamento e alinhamento da rotina de estudos com os responsáveis.",
      registradoPor: "Prof. Carlos Eduardo Silva",
      requerAssinatura: true,
      assinaturaPais: {
        assinado: false,
        responsavelNome: "",
        dataAssinatura: "",
        observacaoPais: ""
      }
    },
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
      registradoPor: "Coordenação Pedagógica",
      requerAssinatura: true,
      assinaturaPais: {
        assinado: true,
        responsavelNome: "Marcos Martins (Pai)",
        vinculo: "Pai",
        dataAssinatura: "2026-09-15 14:32",
        observacaoPais: "Alinhado com o Lucas. Houve atraso no transporte escolar."
      }
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
      registradoPor: "Prof. Carlos Eduardo Silva",
      requerAssinatura: true,
      assinaturaPais: {
        assinado: true,
        responsavelNome: "Sra. Helena Lima (Mãe)",
        vinculo: "Mãe",
        dataAssinatura: "2026-09-16 19:40",
        observacaoPais: "Agradecemos o reconhecimento e o carinho dos professores pela Beatriz!"
      }
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
      registradoPor: "Gestão Escolar",
      requerAssinatura: true,
      assinaturaPais: {
        assinado: false,
        responsavelNome: "",
        dataAssinatura: "",
        observacaoPais: ""
      }
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

  redacoes: [
    {
      id: "red_1",
      alunoId: "aluno_1",
      alunoNome: "Guilherme Santos",
      alunoRA: "000.123.456-7 SP",
      turma: "8º Ano A",
      tema: "O papel da Inteligência Artificial e da tecnologia na escola pública",
      titulo: "Tecnologia e Equidade na Sala de Aula Pública",
      texto: "A presença das novas tecnologias no ambiente escolar paulista tem transformado profundamente a forma como aprendemos e colaboramos. Ao longo do século XXI, a inteligência artificial surge não para substituir o diálogo entre professor e aluno, mas como uma ferramenta inclusiva e de aceleração do conhecimento. Contudo, é imprescindível garantir que todos os estudantes da rede tenham acesso equitativo à internet de qualidade e dispositivos modernos.",
      palavras: 67,
      status: "Avaliado",
      nota: 9.5,
      devolutiva: "Texto exemplar, com excelente argumentação e proposta consistente.",
      data: "2026-09-18"
    }
  ],

  chamadas: [
    {
      id: "cham_1",
      turma: "8º Ano A",
      disciplina: "Matemática",
      data: "2026-09-18",
      professor: "Prof. Carlos Eduardo Silva",
      presentes: 30,
      totalAlunos: 32
    }
  ],

  materiais: [
    {
      id: "mat_1",
      titulo: "Guia BNCC: Equações e Proporções no Cotidiano",
      descricao: "Material de apoio com exercícios comentados e dicas práticas de resolução.",
      componente: "Matemática",
      turma: "8º Ano A",
      data: "2026-09-15"
    },
    {
      id: "mat_2",
      titulo: "Roteiro de Produção Textual: Redação Dissertativa",
      descricao: "Estrutura do texto, conectivos de transição e elaboração de intervenção social.",
      componente: "Língua Portuguesa",
      turma: "8º Ano A",
      data: "2026-09-16"
    }
  ],

  desafiosDiarios: {},

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
        // Garantir retrocompatibilidade com todas as coleções e enriquecer tarefas
        const tarefasMescladas = DADOS_INICIAIS.tarefas.map(tPadrao => {
          const tSalva = (parsed.tarefas || []).find(t => t.id === tPadrao.id);
          if (tSalva) {
            return {
              ...tPadrao,
              ...tSalva,
              questoes: (tSalva.questoes && tSalva.questoes.length) ? tSalva.questoes : tPadrao.questoes
            };
          }
          return tPadrao;
        });
        (parsed.tarefas || []).forEach(t => {
          if (!tarefasMescladas.some(tm => tm.id === t.id)) {
            tarefasMescladas.push(t);
          }
        });

        this.dados = {
          ...DADOS_INICIAIS,
          ...parsed,
          versao: DADOS_INICIAIS.versao,
          usuarios: parsed.usuarios?.length ? parsed.usuarios : DADOS_INICIAIS.usuarios,
          salas: parsed.salas?.length ? parsed.salas : DADOS_INICIAIS.salas,
          guildas: parsed.guildas?.length ? parsed.guildas : DADOS_INICIAIS.guildas,
          tarefas: tarefasMescladas,
          entregas: parsed.entregas || DADOS_INICIAIS.entregas,
          entregasSP: parsed.entregasSP || DADOS_INICIAIS.entregasSP,
          redacoes: parsed.redacoes || DADOS_INICIAIS.redacoes,
          notas: parsed.notas || DADOS_INICIAIS.notas,
          ocorrencias: parsed.ocorrencias || DADOS_INICIAIS.ocorrencias,
          comunicados: parsed.comunicados || DADOS_INICIAIS.comunicados,
          chamadas: parsed.chamadas || DADOS_INICIAIS.chamadas,
          materiais: parsed.materiais || DADOS_INICIAIS.materiais,
          desafiosDiarios: parsed.desafiosDiarios || DADOS_INICIAIS.desafiosDiarios,
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

  /**
   * Realiza a autenticação de membros da equipe de gestão escolar, coordenação ou supervisão.
   * Valida perfis predefinidos da SEDUC-SP ou cria um perfil institucional dinâmico.
   * @param {string} email - E-mail institucional funcional do gestor.
   * @param {string} [senha=""] - Senha de acesso (mínimo 6 dígitos).
   * @returns {Object} Dados do gestor autenticado com cargo e departamento.
   */
  autenticarGestao(email, senha = "") {
    this.carregar();
    const emailLimpo = String(email || "").trim().toLowerCase();
    const gestoresPredefinidos = [
      {
        id: "gestor_1",
        nome: "Diretora Ana Paula Ramos",
        email: "diretoria.escola@educacao.sp.gov.br",
        cargo: "Diretora de Escola",
        departamento: "Diretoria e Gestão Geral",
        unidade: "EE Professor Vicente de Carvalho",
        tipo: "gestor"
      },
      {
        id: "gestor_2",
        nome: "Prof. Coordenador Roberto Mendes",
        email: "coordenacao.pedagogica@educacao.sp.gov.br",
        cargo: "Coordenador de Gestão Pedagógica (CGP)",
        departamento: "Coordenação Pedagógica",
        unidade: "EE Professor Vicente de Carvalho",
        tipo: "gestor"
      },
      {
        id: "gestor_3",
        nome: "Profa. Supervisora Marina Costa",
        email: "supervisao.desbc@educacao.sp.gov.br",
        cargo: "Supervisora de Ensino",
        departamento: "Diretoria de Ensino - Região de SBC (DESBC)",
        unidade: "Diretoria Regional de Ensino",
        tipo: "gestor"
      },
      {
        id: "gestor_4",
        nome: "Secretário Escolar Fernando Dias",
        email: "secretaria.escola@educacao.sp.gov.br",
        cargo: "Gerente de Organização Escolar (GOE)",
        departamento: "Secretaria Escolar & Matrículas",
        unidade: "EE Professor Vicente de Carvalho",
        tipo: "gestor"
      }
    ];

    let gestor = gestoresPredefinidos.find(g => 
      g.email.toLowerCase() === emailLimpo || 
      g.nome.toLowerCase().includes(emailLimpo)
    );

    if (!gestor) {
      gestor = {
        id: `gestor_${Date.now()}`,
        nome: emailLimpo.split("@")[0].replace(/\./g, " ").replace(/\b\w/g, l => l.toUpperCase()),
        email: emailLimpo || "gestao@educacao.sp.gov.br",
        cargo: "Equipe de Gestão Escolar",
        departamento: "Administração SEDUC-SP",
        unidade: "Rede Estadual de São Paulo",
        tipo: "gestor"
      };
    }

    this.definirUsuarioAtivo(gestor);
    try {
      localStorage.setItem("usuarioLogado", JSON.stringify(gestor));
      localStorage.setItem("gestorAtivo", JSON.stringify(gestor));
    } catch (e) {}

    return gestor;
  }

  // ====================================================
  // MÓDULO: ARQUITETURA OFFLINE-FIRST E FILA DE SINCRONIZAÇÃO
  // ====================================================

  /**
   * Recupera a fila de atividades entregues pelo estudante enquanto estava sem conexão.
   * @returns {Array<Object>} Fila de entregas offline pendentes de sincronização com o servidor.
   */
  obterFilaOffline() {
    try {
      const fila = localStorage.getItem("sala_futuro_fila_offline");
      return fila ? JSON.parse(fila) : [];
    } catch (e) {
      return [];
    }
  }

  /**
   * Salva a resolução de uma tarefa na fila offline com persistência garantida no navegador.
   * Também consolida o resultado no banco local para que o estudante veja sua nota e XP imediatamente.
   * @param {Object} entrega - Objeto com id, tarefaId, respostas, acertos, nota e XP.
   * @returns {Array<Object>} A fila offline atualizada.
   */
  salvarEntregaOffline(entrega) {
    try {
      const fila = this.obterFilaOffline();
      // Evita duplicar se o aluno reabrir a atividade
      const idx = fila.findIndex(f => f.id === entrega.id || (f.tarefaId === entrega.tarefaId && f.alunoId === entrega.alunoId));
      if (idx >= 0) {
        fila[idx] = { ...fila[idx], ...entrega, salvoEmOffline: new Date().toISOString() };
      } else {
        fila.push({ ...entrega, salvoEmOffline: new Date().toISOString() });
      }
      localStorage.setItem("sala_futuro_fila_offline", JSON.stringify(fila));
      
      // Salva no banco local imediatamente para manter o histórico coerente
      this.salvarEntregaDocente(entrega);
      return fila;
    } catch (e) {
      console.warn("Erro ao salvar entrega offline:", e);
      return [];
    }
  }

  /**
   * Executa a sincronização em lote da fila offline quando a conexão com a internet retorna.
   * Transmite todas as notas e presenças computadas offline para o diário do professor e esvazia a fila.
   * @returns {{ total: number, sincronizados: number }} Resumo com a quantidade de tarefas sincronizadas.
   */
  sincronizarFilaOffline() {
    const fila = this.obterFilaOffline();
    if (!fila.length) return { total: 0, sincronizados: 0 };
    
    let cont = 0;
    fila.forEach(item => {
      this.salvarEntregaDocente({ ...item, sincronizado: true });
      cont++;
    });

    try {
      localStorage.removeItem("sala_futuro_fila_offline");
    } catch (e) {}

    return { total: fila.length, sincronizados: cont };
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

  // --- XP E PROGRESSO GAMIFICADO ---
  adicionarXPAluno(alunoId, pontos) {
    this.carregar();
    pontos = Number(pontos) || 0;
    if (pontos <= 0) return null;

    let aluno = this.dados.usuarios.find(u => 
      u.id === alunoId || 
      (u.ra && u.ra === alunoId) ||
      (this.dados.usuarioAtivo && this.dados.usuarioAtivo.id === alunoId)
    );

    if (!aluno && this.dados.usuarioAtivo && (!this.dados.usuarioAtivo.tipo || this.dados.usuarioAtivo.tipo === "aluno")) {
      aluno = this.dados.usuarioAtivo;
    }

    if (!aluno) {
      aluno = this.obterAlunos()[0];
    }

    if (aluno) {
      aluno.xp = (Number(aluno.xp) || 0) + pontos;
      aluno.nivel = Math.max(1, Math.floor(aluno.xp / 100) + 1);

      // Atualiza também a pontuação da guilda
      if (aluno.guilda && this.dados.guildas) {
        const guilda = this.dados.guildas.find(g => 
          g.nome.toLowerCase() === aluno.guilda.toLowerCase() ||
          g.id === aluno.guilda
        );
        if (guilda) {
          guilda.pontos = (Number(guilda.pontos) || 0) + pontos;
        }
      }

      if (this.dados.usuarioAtivo && this.dados.usuarioAtivo.id === aluno.id) {
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
    if (!this.dados.materiais) {
      this.dados.materiais = [
        {
          id: "mat_1",
          titulo: "Guia BNCC: Equações e Proporções no Cotidiano",
          descricao: "Material de apoio com exercícios comentados e dicas práticas de resolução.",
          componente: "Matemática",
          turma: "8º Ano A",
          data: "2026-09-15"
        },
        {
          id: "mat_2",
          titulo: "Roteiro de Produção Textual: Redação Dissertativa",
          descricao: "Estrutura do texto, conectivos de transição e elaboração de intervenção social.",
          componente: "Língua Portuguesa",
          turma: "8º Ano A",
          data: "2026-09-16"
        }
      ];
    }
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
