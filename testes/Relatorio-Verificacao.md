# Relatório de verificação — pacote v2

Data: 21/10/2026.

## Verificado automaticamente

- **35 testes aprovados:** 20 casos do interpretador de demonstração, 8 testes de invariantes de domínio e SVG, 7 testes do controlador de interface com um adaptador DOM mínimo.
- Regras de data civil, horário inválido, ano bissexto, sobreposição e passagem de meia-noite.
- Proposta não executa antes da confirmação; repetir a mesma chave não duplica evento.
- Persistência, troca de gato com preservação de roupa/óculos, eventos manuais, tarefas, preferências, memória e exportação no teste integrado simulado.
- Escape de conteúdo textual do usuário.
- XML válido nos 83 SVGs: 54 composições, 28 camadas e uma coleção de prévia.
- 38 tickets com IDs únicos e dependências existentes, sem ciclos.
- Sintaxe dos JavaScripts e estrutura do pacote ZIP.

## Revisão visual realizada

A coleção SVG foi rasterizada para inspeção das seis pelagens com terno e óculos. Foram conferidas a diferença entre pelagens e a composição das peças. Isso não substitui a revisão de todos os estados da interface.

## Validações ainda pendentes

Não foi possível concluir a inspeção do protótipo em navegador real neste ambiente. O executável Chromium não estava disponível; o download retornou um arquivo inválido. O navegador remoto recusou o endereço local com `ERR_BLOCKED_BY_CLIENT`. Nenhum sucesso de teste visual em navegador é alegado.

O teste do controlador usa um adaptador mínimo e não implementa layout, foco real, seletores, diálogo nativo, IndexedDB real nem leitura de tela. Esses pontos permanecem no ticket B11. Foram verificadas regras e interações do controlador, não uma matriz de navegadores.

O aplicativo Android, alarmes, widgets, autenticação remota, APIs de calendário, e-mail e modelos reais de IA não foram implementados ou testados nesta versão.

## Reproduzir

```bash
cd prototipo
npm test
```

Para a revisão manual, siga o roteiro em `docs/Instalacao-e-Execucao.md`.
