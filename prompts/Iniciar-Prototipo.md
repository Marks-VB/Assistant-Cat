> Atualização v2: o primeiro protótipo já foi incluído. Para continuar o projeto existente, use `Evoluir-Prototipo.md`. O prompt abaixo é mantido como referência da etapa inicial.

# Prompt inicial para o agente

O bloco abaixo é uma instrução pronta para começar o novo projeto. Ele pede implementação do primeiro recorte, sem reutilizar o código compilado do aplicativo de referência.

```text
Crie o primeiro protótipo do projeto “Assistente Aberto”, um assistente pessoal
 gratuito e open source, usando esta especificação como referência funcional.

Implemente agora apenas a Entrega 0 da seção 11, com interface web em
TypeScript e React. Use identidade visual, textos e código próprios. O mascote será um gato
minimalista conforme a seção 17: pelagem, roupa e óculos combináveis.
Organize o domínio para que um cliente Android possa ser acrescentado depois.

Objetivo de demonstração:
1. A pessoa entra sem conta remota e escolhe seu nome e o do assistente.
2. Cria e edita um compromisso manualmente.
3. Escreve no chat “Marque revisão do projeto amanhã às 14h por 45 minutos”.
4. O assistente de demonstração produz uma proposta estruturada editável,
   usando a data e o fuso atuais.
5. Ao confirmar, o evento é salvo uma única vez e aparece em Agora e Agenda.
6. A pessoa cria uma tarefa, conclui e desfaz a conclusão.
7. Recarregar preserva dados e configurações.
8. Exportar e importar um backup preserva o estado básico.
9. A pessoa escolhe um gato frajola ou siamês, combina terno e óculos,
   salva e vê a mesma aparência no cabeçalho, no perfil e ao reabrir.

Requisitos:
- Navegação: Chat, Agora, Agenda, Ações e Eu. Dentro de Agenda,
  Calendário e Afazeres. Dentro de Ações, Coordenação e Automações
  ficam como planejadas no P0, sem simular serviço conectado.
- Gato em SVG original, montado em camadas: seis pelagens, três roupas
  e três opções de óculos no P0, com prévia imediata e persistência.
- Pelagem, roupa e voz são configurações independentes; mudar a aparência
  não apaga histórico nem altera automaticamente a personalidade.
- Português como idioma inicial, tema claro/escuro e layout responsivo.
- Persistência local com IndexedDB, repositório isolado e esquema versionado.
- Formulários manuais continuam funcionando sem IA e sem rede.
- Provedor de IA de demonstração determinístico por padrão; mostrar
  claramente esse modo. Não fingir que existe uma IA remota conectada.
- Contrato de ActionProposal separado da execução das ações de domínio.
- IDs estáveis e idempotência para evitar duplicação na confirmação.
- Dados fictícios opcionais; nenhum segredo ou endpoint do produto de referência no projeto.
- Estados de carregamento, erro, vazio e sucesso reais.
- Não implementar cobrança, login social, automações remotas, e-mail real,
  widgets funcionais ou todos os 256 recursos nessa primeira entrega.
- Itens futuros podem aparecer como planejados; não marcar como implementados.
- Registrar decisões, como executar, limites e recursos concluídos em docs/.
- Validar persistência, datas relativas, confirmação única e conclusão/desfazer.

Entregue o projeto executável, instruções locais, breve descrição da arquitetura
 e uma lista objetiva do que foi implementado e do que permanece planejado.
Se já houver um repositório, leia suas instruções antes de editar e preserve
as convenções existentes. Faça escolhas de implementação rotineiras e avance
até concluir o fluxo de demonstração.
```
