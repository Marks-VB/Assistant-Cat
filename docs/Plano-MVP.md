# Plano de prototipação

### Entrega 0 — base do protótipo

**Escopo:** aplicação web local, sem conta remota e sem integrações externas obrigatórias. A seleção de gato e acessórios da seção 17 faz parte do P0.

| Ordem | Trabalho | Critério de pronto |
| --- | --- | --- |
| 01 | Inicializar navegação, tema e idioma | Cinco áreas principais utilizáveis em desktop e celular |
| 02 | Implementar entidades e armazenamento local | Dados de teste reaparecem após recarregar |
| 03 | CRUD de eventos simples | Criar, editar, excluir e visualizar sem IA |
| 04 | CRUD de tarefas simples | Criar, concluir, reabrir e desfazer |
| 05 | Agora e agenda diária | Mesma informação consistente entre as duas telas |
| 06 | Chat e provedor de demonstração | Solicitações de exemplo produzem propostas reproduzíveis |
| 07 | Revisão e execução de proposta | Confirmar cria exatamente um item e retorna seu ID |
| 08 | Nome e gato do assistente | Seis pelagens, três roupas e três opções de óculos combináveis, com seleção persistida |
| 09 | Exportar/importar backup mínimo | Restaurar eventos e tarefas num perfil de teste |
| 10 | Estados e acessibilidade | Sem telas vazias inexplicadas; navegação por teclado e nomes acessíveis |

**Referências do catálogo:** `AST01`, `CHT01–CHT03`, `CHT10`, `CHT12`, `CAL01`, `CAL02`, `CAL04`, `CAL08`, `EVT01`, `EVT02`, `TSK01–TSK03`, `DAT01`, `CFG01–CFG03`, `CFG09`. Exportação/importação é antecipada para proteger a base do protótipo.

**Fora desta entrega:** acesso social real, cobrança, e-mail real, negociação de reuniões, acompanhamento de risco real, fontes de clima, automação contínua e widgets funcionais. Quando aparecerem na navegação de demonstração, usar estado “planejado” ou “demonstração”, sem indicar que estão conectados.

### Entrega 1 — uso local diário

- Recorrência simples, lembretes configuráveis, calendário local adicional e filtros.
- Listas, subtarefas, importância e busca.
- Conversas múltiplas e memória editável.
- Lixeira, backup de anexos e migrações de dados.
- Um provedor de IA real opcional com erro, cancelamento e orçamento configurável.
- Iniciar cliente Android somente quando o fluxo local estiver estável; implementar alarmes e testar entrega em aparelho.

### Entrega 2 — primeiro conector e sincronização

- Escolher um único conector inicial entre calendário do dispositivo, CalDAV ou Google Calendar, conforme o público e ambiente de teste.
- Se houver servidor: autenticação própria, isolamento de usuários, fila local de operações e cursor de sincronização.
- Testar edição local/remota concorrente e revogação de autorização.
- Mostrar última sincronização, operação pendente e conflito.
- Adicionar resumos semanais e importação de contatos conforme necessidade.

### Entrega 3 — automação e colaboração

- Começar com uma automação de resumo em horário fixo, depois acrescentar condições e pesquisa.
- Worker com fila durável, idempotência, limite de tentativas e histórico.
- Uma página pública de agendamento com disponibilidade e reserva atômica.
- Introduzir coordenação por e-mail somente depois de estabelecer conta de envio, controle de aprovação e histórico de comunicação.
- Ampliar o conjunto de fontes e o acompanhamento de eventos de forma incremental.

## 12. Critérios de aceite e cenários de verificação

Os cenários abaixo são requisitos do novo projeto. Não são resultados de testes de execução do APK original.

| Cenário | Resultado esperado |
| --- | --- |
| Criar evento manualmente | Aparece em Agora e Agenda e persiste ao recarregar |
| Interpretar “amanhã às 14h” | Data baseada no relógio e fuso atuais, apresentada para revisão |
| Solicitação sem horário claro | Pergunta objetiva ou formulário de revisão; nenhuma data inventada silenciosamente |
| Confirmar a mesma proposta duas vezes | Exatamente um item criado |
| Provedor de IA indisponível | Texto preservado e formulário manual acessível |
| Concluir e desfazer tarefa | Estado e lista voltam ao valor anterior, inclusive após recarregar |
| Evento de dia inteiro | Mesma data civil em visualização, backup e conector |
| Evento que atravessa meia-noite | Exibição correta nos dois dias |
| Recorrência com mudança de fuso/DST | Comportamento documentado; horário local da série preservado conforme regra |
| Editar uma ocorrência | Nenhuma alteração silenciosa nas demais ocorrências |
| Permissão de notificação negada | Mostrar limitação e alternativa; não declarar aviso garantido |
| Reiniciar aparelho Android | Reconciliar avisos futuros sem duplicação |
| Remover um evento com aviso | Cancelar a entrega que dependia dele |
| Apagar e restaurar item | Recuperar campos necessários ou indicar limitação da origem externa |
| Exportar e importar backup | Preservar IDs, datas e relações; relatar dados não importados |
| Trabalhar offline e reconectar | Operações pendentes têm estado claro e não são aplicadas em duplicidade |
| Revogar autorização externa | Mostrar reconexão necessária sem apagar a agenda local |
| Duas reservas simultâneas da mesma vaga | Apenas uma confirmação válida |
| Automação não encontra condição | Registrar execução com `matched=false`; seguir preferência de aviso |
| Automação é pausada | Nenhuma nova execução programada; histórico permanece |
| Excluir uma memória | Memória não volta a ser enviada como contexto aprovado |
| Usuário B acessa dados do usuário A | Servidor rejeita a operação; IDs não servem como autorização |

Verificação do P0: priorizar persistência, cálculo de datas, idempotência e fluxos completos. As funcionalidades de servidor e Android só recebem aceite quando testadas em seus ambientes reais, não por aparência de sucesso na interface.
