# Assistente Gato

Pacote v2: especificação, conceitos visuais, design system e protótipo local navegável de um assistente pessoal gratuito e open source.

## Abrir

Na pasta deste arquivo, execute:

```bash
python3 -m http.server 8080 --bind 127.0.0.1
```

Abra `http://127.0.0.1:8080/prototipo/`. No Windows, pode usar `py -m http.server 8080 --bind 127.0.0.1`. Consulte [instalação e execução](docs/Instalacao-e-Execucao.md).

## O que já funciona no protótipo

- Menus Chat, Agora, Agenda, Ações e Eu.
- Eventos simples: criar, editar e excluir; agenda mensal e lista por data.
- Afazeres: criar, concluir, reabrir e excluir.
- Chat determinístico de demonstração, revisão e confirmação idempotente de propostas.
- Memórias manuais: adicionar, listar e excluir.
- Gato por camadas: seis pelagens, três roupas e três escolhas de óculos, com persistência e download SVG.
- Tema claro/escuro, nome do assistente, perfil e backup JSON.
- Persistência com IndexedDB ou alternativa disponível.

## Materiais

| Material | Arquivo |
| --- | --- |
| Especificação: 256 capacidades de referência | [Especificação completa](docs/Especificacao-Completa.md) |
| Design system e tokens | [Design system](design-system/Design-System.md) |
| Gatos SVG editáveis | [Coleção vetorial](artes/svg-modular/colecao.svg) |
| Casos de interpretação e critérios futuros | [40 casos](testes/Casos-Assistente.md) |
| Backlog com dependências | [38 tickets](backlog/Backlog-Implementacao.md) |
| Instalação e contribuição | [Execução](docs/Instalacao-e-Execucao.md) e [contribuição](CONTRIBUTING.md) |
| Próxima rodada com agente | [Prompt de evolução](prompts/Evoluir-Prototipo.md) |
| Artes PNG e galeria | [Galeria](galeria.html) |
| Verificação | [Relatório](testes/Relatorio-Verificacao.md) |

## Desenvolvimento

Com Node.js 22 ou posterior:

```bash
cd prototipo
npm test
npm run export:cats
```

Não há dependências de execução a instalar no protótipo. Ele usa JavaScript simples; o app de produção em **React 19 + TypeScript + Tailwind** fica em [`app/`](app/README.md).

## Estado e licença

O corpus tem 20 casos do interpretador atual e 20 cenários planejados. Os 58 testes cobrem regras e controlador de interface em ambiente simulado; não substituem testes em um navegador real. Automação contínua, IA remota, voz, sincronização e integrações estão no backlog e aparecem como planejadas.

AGPL-3.0-or-later para código, documentação e SVGs novos; origem e escopo das artes em [ASSETS.md](ASSETS.md).
