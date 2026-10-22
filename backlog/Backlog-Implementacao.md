# Backlog de implementação

Estado da entrega v2. “Concluído no protótipo” não significa produto de produção. Depender de um ticket só permite iniciar quando seu critério de aceite estiver cumprido. Esforço e datas serão estimados ao escolher plataforma e equipe.

| ID | Trabalho | Prioridade | Estado | Depende de | Critério de aceite |
| --- | --- | --- | --- | --- | --- |
| B01 | Base local e repositório | P0 | Concluído no protótipo | — | IndexedDB com alternativa e estado de persistência visível. |
| B02 | Cinco menus principais | P0 | Concluído no protótipo | B01 | Chat, Agora, Agenda, Ações e Eu são acessíveis. |
| B03 | Eventos manuais | P0 | Concluído no protótipo | B01 | Criar, editar e excluir evento simples com data, hora e duração. |
| B04 | Afazeres básicos | P0 | Concluído no protótipo | B01 | Criar, concluir, reabrir e excluir tarefa. |
| B05 | Chat de demonstração | P0 | Concluído no protótipo | B01 | 20 entradas do corpus têm resultado verificado; proposta antes de gravar. |
| B06 | Execução idempotente | P0 | Concluído no protótipo | B03, B04, B05 | Repetir a confirmação da mesma chave não duplica item. |
| B07 | Editor e exportação do gato | P0 | Concluído no protótipo | B01 | 6 pelagens × 3 roupas × 3 óculos; salvar, descartar e baixar SVG. |
| B08 | Tokens, temas e foco | P0 | Concluído no protótipo | B02 | Tema claro/escuro, tokens compartilhados e foco visível. |
| B09 | Backup versionado | P0 | Concluído no protótipo | B01 | Exportar e validar JSON; rejeitar formato incompatível. |
| B10 | Memórias manuais | P1 | Concluído no protótipo | B01 | Criar, listar e excluir memória local. |
| B11 | Verificação visual e dispositivos | P0 | Concluído no protótipo | B02, B07, B08 | Conferir 360/390/768/1440 px, teclado, zoom e leitura de tela. |
| B12 | Editar títulos e detalhes de afazeres | P1 | Concluído no protótipo | B04 | Editar tarefa sem perder conclusão ou identidade. |
| B13 | Listas, subtarefas e importância | P1 | Concluído no protótipo | B12 | Mover listas e preservar hierarquia sem ciclos. |
| B14 | Dia inteiro e vários dias | P1 | Concluído no protótipo | B03 | Datas civis preservadas na visualização e backup. |
| B15 | Modelo de fuso e conversões | P1 | Planejado | B03 | Armazenar intenção local e instante; casos de DST verificados. |
| B16 | Recorrência de eventos | P1 | Concluído no protótipo | B14, B15 | Regras, contagem, término e exceções por ocorrência. |
| B17 | Recorrência após conclusão | P2 | Concluído no protótipo | B13 | Próxima tarefa depende da conclusão real e não duplica a série. |
| B18 | Lixeira e restauração | P1 | Concluído no protótipo | B03, B04 | Excluir passa a ser recuperável; restauração mantém relações. |
| B19 | Pesquisa local | P1 | Concluído no protótipo | B03, B04 | Buscar por título, data, tipo e conclusão com resultados claros. |
| B20 | Provedor real de IA | P1 | Concluído no protótipo | B05, B06 | Adaptador substituível, payload validado, erro e cancelamento. |
| B21 | Memória usada pela IA | P2 | Concluído no protótipo | B10, B20 | Selecionar contexto aprovado; editar, excluir e desativar uso. |
| B22 | Entrada e síntese de voz | P2 | Concluído no protótipo | B20 | Permissão de microfone explícita, transcrição revisável e alternativa textual. |
| B23 | Cliente Android e lembretes | P1 | Planejado | B15 | Agendar, cancelar e reconciliar após reinício em aparelho real. |
| B24 | Widgets Android | P2 | Planejado | B23 | 2x2 e 4x2 atualizam a agenda; widget de voz separado. |
| B25 | Primeiro conector de calendário | P2 | Planejado | B15, B16 | Conectar uma conta própria, sincronizar e tratar revogação. |
| B26 | Sincronização entre dispositivos | P2 | Planejado | B01, B25 | Fila durável, cursores, autorização e conflito de revisão. |
| B27 | Contatos e participantes | P2 | Planejado | B25 | Importação selecionada, duplicados, convites e respostas. |
| B28 | Retrospectiva semanal | P2 | Concluído no protótipo | B19 | Contagem, horas e categorias com cálculo verificável. |
| B29 | Worker e automação simples | P3 | Planejado | B20, B26 | Executar rotina em horário definido com histórico e idempotência. |
| B30 | Condições e fontes externas | P3 | Planejado | B29 | Registrar condição atendida ou não, fontes e orçamento. |
| B31 | Inbox e triagem | P3 | Planejado | B20, B25 | Sugestão tem origem, revisão, aceitação ou descarte. |
| B32 | Conector de e-mail | P3 | Planejado | B26, B31 | Leitura e envio têm capacidades separadas e autorização própria. |
| B33 | Coordenação de reuniões | P3 | Planejado | B27, B32 | Participantes, estados, rascunhos, respostas e confirmação de evento. |
| B34 | Página pública de agendamento | P3 | Planejado | B25, B26 | Disponibilidade e reserva atômica; duas abas não reservam a mesma vaga. |
| B35 | Radar de agenda | P3 | Planejado | B30 | Explicar risco, origem, última avaliação e próximo acompanhamento. |
| B36 | Novas pelagens e peças | P1 | Concluído no protótipo | B07 | Persa/branco e novas roupas preservam geometria e compatibilidade. |
| B37 | Adaptação para arquitetura de produto | P1 | Concluído (app/ React+TS+Tailwind) | B11 | Separar pacotes e migrar interface conforme decisão documentada, preservando dados. |
| B38 | Preparação do repositório público | P1 | Planejado | B11 | README, licença, contribuição, execução reproduzível e revisão de dependências. |

## Definição de conclusão

Código implementado, critério atendido, teste relevante aprovado, documentação de mudança atualizada, ausência de credenciais e preservação de dados existentes. Telas que dependem de um serviço ainda ausente ficam identificadas como planejadas.

## Ordem recomendada da próxima rodada

1. B11: validar o protótipo visualmente e em dispositivos.
2. B12/B14/B15: consolidar edição de afazeres e regras temporais.
3. B18/B19: recuperação de dados e pesquisa.
4. B20: integrar um provedor real de IA.
5. B23 ou B25: escolher entre entrega Android ou primeira integração externa conforme o público inicial.
