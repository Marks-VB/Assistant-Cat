# Como contribuir

## Começar

Leia `docs/Instalacao-e-Execucao.md`, a especificação e `backlog/Backlog-Implementacao.md`. Escolha um ticket com critério de aceite definido. Mantenha o núcleo local utilizável sem conta.

## Organização

- `prototipo/src/domain.js`: regras, validação e interpretação determinística.
- `prototipo/src/storage.js`: persistência local.
- `prototipo/src/app.js`: navegação e interação.
- `prototipo/src/cat-avatar.js`: desenho vetorial em camadas.
- `design-system`: tokens e regras visuais.
- `testes`: exemplos estruturados e critérios futuros.
- `dados/Catalogo-Recursos.json`: inventário de referência, não estado da implementação.

## Fluxo de mudança

1. Descreva problema, comportamento esperado e ticket relacionado.
2. Implemente uma mudança pequena e preserve IDs e dados existentes.
3. Cubra regras de domínio relevantes com testes; evite testes que só repetem a implementação.
4. Execute `npm test` na pasta do protótipo e confira o fluxo manual relacionado.
5. Registre alterações de esquema, migração ou limitação em documentação.
6. Na revisão, explique resultado, como validar e riscos concretos.

## Convenções

JavaScript simples sem dependências no protótipo, português na interface e identificadores técnicos consistentes. Não inserir credenciais, dados pessoais reais ou chamadas ao serviço de terceiros. Usar escape de conteúdo do usuário nas interfaces e validação dos dados importados. Novos conectores devem declarar capacidades de leitura e escrita.

## Arte

Preserve a área de desenho, o nome das camadas e o encaixe de roupas e óculos. Novas pelagens precisam de contraste nos temas claro/escuro e uma combinação de teste com terno e óculos. Execute o exportador e atualize o manifesto quando mudar a geometria.

## Pull requests

Inclua título objetivo, ticket, mudança de comportamento, passos de verificação e resultado dos testes. Use dados fictícios nas evidências. Toda funcionalidade planejada deve permanecer assim identificada até ter implementação e validação.

## Licença

O código-fonte e a documentação deste projeto são distribuídos sob a licença **GNU Affero General Public License v3 (AGPL-3.0)**. Isso garante que o projeto permaneça aberto e que qualquer trabalho derivado ou serviço remoto baseado nele também compartilhe suas melhorias com a comunidade.
O escopo dos ativos visuais, marcas e direitos autorais de artes está descrito em `ASSETS.md`.
