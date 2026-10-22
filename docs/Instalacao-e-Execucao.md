# Instalação e execução

## Abrir o protótipo

O protótipo usa HTML, CSS e JavaScript sem bibliotecas externas ou etapa de build. É uma base navegável para revisar os fluxos; a arquitetura React/TypeScript do produto futuro continua como proposta de evolução.

1. Extraia o ZIP inteiro.
2. Entre na pasta `Assistente-Gato`.
3. Execute um servidor estático local:

```bash
python3 -m http.server 8080 --bind 127.0.0.1
```

No Windows com Python instalado, use `py -m http.server 8080 --bind 127.0.0.1`.

4. Abra `http://127.0.0.1:8080/prototipo/`.
5. Para encerrar o servidor, pressione Ctrl+C no terminal.

Também é possível abrir `prototipo/index.html` diretamente. Para armazenamento consistente e testes, prefira o servidor local: o comportamento de armazenamento em URLs `file:` varia por navegador. Nenhum cadastro, chave de IA ou acesso externo é necessário para a demonstração.

## Verificação em cinco minutos

1. Em **Eu → Meu gato**, selecione Siamês, Terno e Redondos; salve.
2. Troque somente a pelagem para Frajola; confirme que os acessórios são mantidos.
3. Em **Chat**, use o exemplo de reunião amanhã às 14h, envie e confirme a proposta.
4. Em **Agenda**, procure o compromisso na data correspondente.
5. Em **Agenda → Afazeres**, adicione uma tarefa, conclua e clique novamente para reabrir.
6. Em **Eu → Dados**, exporte um backup.
7. Recarregue: eventos, tarefas, aparência e preferências devem permanecer.

## Testes automatizados

Com Node.js instalado:

```bash
cd prototipo
npm test
```

Não é necessário `npm install`. O teste usa apenas módulos nativos do Node. O corpus em `testes/Casos-Assistente.json` distingue cenários automatizados de requisitos futuros.

## Regerar os SVGs

```bash
cd prototipo
npm run export:cats
```

A saída fica em `artes/svg-modular/`. Não é necessário um serviço de geração de imagem.

## Persistência e limites

O armazenamento preferido é IndexedDB, com alternativa em localStorage. Quando nenhum estiver disponível, a interface informa modo de sessão sem persistência. Backup é um JSON versionado que inclui eventos, tarefas, perfil, memórias, conversas e preferências. Importar substitui o estado local após validação e confirmação.

O chat é um interpretador determinístico limitado aos exemplos e variações simples. Não há modelo de linguagem conectado, sincronização remota, autenticação, disparo de notificações, captura de microfone ou execução contínua de automações. Ações e coordenação estão identificadas como planejadas.

Este protótipo representa horários locais de America/Sao_Paulo; conversões completas entre fusos, recorrência e eventos de dia inteiro estão no backlog. Não usar como sistema definitivo de lembretes.

Referência do armazenamento em `file:`: https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage .
