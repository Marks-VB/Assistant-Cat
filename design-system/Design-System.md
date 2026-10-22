# Design system — Assistente Gato

Versão 0.2. Proposta nova, aplicada no protótipo. A referência visual é a coleção de gatos minimalistas; os SVGs são desenhos novos por camadas, não vetorização automática das imagens geradas.

## Tokens

A fonte reutilizável fica em `tokens.json`; `tokens.css` contém as variáveis efetivamente usadas pela interface.

| Papel | Claro | Escuro |
| --- | --- | --- |
| Fundo | `#f6f5f0` | `#182327` |
| Superfície | `#fffefa` | `#223135` |
| Texto | `#263c40` | `#eff3eb` |
| Texto secundário | `#647778` | `#b0c2be` |
| Ação principal | `#286c66` | `#a2d3bd` |
| Borda | `#dfe5df` | `#3c5053` |

- Espaçamento em pixels: 4, 8, 12, 16, 24, 32 e 48.
- Raios: 10 px para controles compactos, 18 px para cartões e 28 px para destaque.
- Fonte do sistema, sem download externo; corpo 15 px e altura de linha 1,5.
- Títulos de página 27–36 px; títulos de seção 21 px; rótulos 13 px.
- Largura máxima da aplicação: 1440 px. Barra lateral de 220 px no desktop. Navegação inferior até 700 px.
- Grade principal em duas colunas no desktop e uma no celular.

## Contraste calculado

As razões abaixo foram calculadas a partir das cores sólidas dos tokens, sem constituir uma auditoria integral de acessibilidade.

| Combinação | Claro | Escuro |
| --- | --- | --- |
| Texto / superfície | 11.54:1 | 11.99:1 |
| Texto secundário / superfície | 4.67:1 | 7.25:1 |
| Texto do botão / destaque | 6.07:1 | 8.08:1 |

## Componentes e estados

| Componente | Regras | Estados |
| --- | --- | --- |
| Botão primário | Destaque sólido, verbo claro, tamanho coerente com o contexto | Normal, hover, pressionado, foco, desabilitado |
| Botão secundário | Superfície alternativa; ação de menor prioridade | Normal, foco, pressionado |
| Botão de ícone | Nome acessível obrigatório; ícones lineares próprios | Normal, foco, destrutivo |
| Campo | Rótulo persistente acima do controle, borda e preenchimento de superfície | Vazio, preenchido, inválido, foco |
| Cartão | Borda sutil, raio de 18 px e hierarquia título/detalhe/ação | Normal, planejado, proposta pendente, executado |
| Navegação | Ícone e nome; seleção diferenciada por cor e superfície | Ativo e inativo |
| Escolha de gato | Prévia vetorial, nome e `aria-pressed` | Selecionado, não selecionado, foco |
| Aviso | Mensagem textual e alternativa útil | Informação, falha, sucesso |
| Modal de evento | Foco inicial no título, fechamento explícito e Escape do navegador | Novo, revisão e edição |
| Toast | Estado de operação, região `aria-live` | Sucesso, limitação, erro |
| Estado vazio | Gato discreto, título e orientação de próxima ação | Agenda, tarefa, memória |

## Gatos modulares

- Seis pelagens: Frajola, Laranja, Siamês, Tricolor, Preto e Cinza.
- Roupas: natural, terno e moletom. Óculos: nenhum, redondos e retangulares.
- 54 composições completas em `artes/svg-modular/combinacoes/`.
- Camadas independentes de corpo, cabeça, manchas, traços, roupas e óculos em `artes/svg-modular/camadas/`.
- Renderer de referência: `prototipo/src/cat-avatar.js`; área comum `0 0 240 240`.
- Aparência separada de nome, preferências, memórias e histórico.
- Expressões são prévias de interface; o protótipo não liga o microfone.

## Acessibilidade e movimento

Usar controles nativos, rótulos, foco visível de 3 px, navegação por teclado e texto que explique cada estado. Respeitar `prefers-reduced-motion`. A cor sozinha não deve comunicar erro ou seleção. Verificar a interface em 360, 390, 768 e 1440 px e com texto ampliado.

Os tokens já são usados pelo protótipo. A inspeção visual em navegador e a validação em dispositivos reais permanecem parte do aceite de publicação.

## Temas do aplicativo (React/Android)

O app de produção oferece **8 temas** selecionáveis em **Me → Tema do aplicativo**. As variáveis ficam em `app/src/styles/themes.css` e o catálogo em `app/src/core/themes.ts`.

| Tema | ID | Fundo | Superfície | Acento |
| :--- | :--- | :--- | :--- | :--- |
| Escuro | `midnight` | `#121212` | `#1E1E1E` | `#FF4D4D` |
| Claro | `porcelain` | `#F7F4EE` | `#FFFFFF` | `#C9453A` |
| Minimalista | `minimal` | `#FAFAFA` | `#FFFFFF` | `#111111` |
| Vidro | `glass` | `#0B1220` | translúcido | `#7DD3FC` |
| Nord | `nord` | `#2E3440` | `#3B4252` | `#88C0D0` |
| Cyberpunk | `cyberpunk` | `#07010F` | `#12001F` | `#FF2E97` |
| Retrô | `retro` | `#F3E7CE` | `#FBF3E2` | `#B5462F` |
| Sistema | `system` | segue o aparelho | — | — |

Os componentes usam utilitários semânticos (`bg-[var(--surface-card)]`, `text-[var(--text-primary)]`, `bg-[var(--accent)]`). O tema é aplicado via `data-theme` no `<html>`; `system` escuta `prefers-color-scheme`. Botões de acento herdam `--on-accent` para manter contraste, e cada tema declara `color-scheme` para campos nativos.
