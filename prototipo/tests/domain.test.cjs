// SPDX-License-Identifier: AGPL-3.0-or-later
const test=require('node:test'),assert=require('node:assert/strict');
const D=require('../src/domain.js'),C=require('../src/cat-avatar.js'),corpus=require('../../testes/Casos-Assistente.json');
for(const c of corpus.cases.filter(c=>c.implemented))test(c.id+': '+c.input,()=>{
 const actual=D.parseCommand(c.input,c.context);assert.equal(actual.kind,c.expected.kind);
 if(c.expected.payload)for(const [key,value] of Object.entries(c.expected.payload))assert.equal(actual.payload[key],value,key);
 if(c.expected.missingFields)assert.deepEqual(actual.missingFields,c.expected.missingFields);
});
test('A data relativa respeita o dia civil em São Paulo quando UTC já mudou de dia',()=>assert.equal(D.parseCommand('Marque revisão amanhã às 10h',{now:'2026-10-22T01:30:00Z',timeZone:'America/Sao_Paulo'}).payload.date,'2026-10-22'));
test('Data impossível e ano bissexto são distinguidos',()=>{assert.equal(D.validDate('2026-02-29'),false);assert.equal(D.validDate('2028-02-29'),true);});
test('Eventos adjacentes não conflitam, mas sobreposição e passagem de dia sim',()=>{
 const events=[{id:'a',date:'2026-10-21',time:'14:00',duration:60},{id:'b',date:'2026-10-21',time:'23:30',duration:90}];
 assert.equal(D.conflicts(events,{id:'c',date:'2026-10-21',time:'15:00',duration:30}).length,0);
 assert.equal(D.conflicts(events,{id:'c',date:'2026-10-21',time:'14:30',duration:15}).length,1);
 assert.equal(D.conflicts(events,{id:'c',date:'2026-10-22',time:'00:15',duration:15}).length,1);
});
const fixture=()=>({schemaVersion:2,profile:{name:'Pessoa',assistantName:'Gato'},appearance:{coat:'tuxedo'},theme:'light',tab:'chat',events:[],tasks:[],messages:[],memories:[],executedProposalKeys:[]});
test('Duas confirmações com a mesma chave criam só um evento',()=>{const p={...D.parseCommand('Marque revisão amanhã às 14h',{now:'2026-10-21T13:00:00Z'}),key:'proposal-1'};const first=D.executeProposal(fixture(),p,'event-1');const second=D.executeProposal(first.state,p,'event-2');assert.equal(first.state.events.length,1);assert.equal(second.state.events.length,1);assert.equal(second.duplicate,true);});
test('Campos pendentes bloqueiam a execução da proposta',()=>{const p={...D.parseCommand('Marque reunião às 14h'),key:'pending'};assert.throws(()=>D.executeProposal(fixture(),p,'event-1'),/pendentes/);});
test('Backup aceita estado íntegro e rejeita perfil ausente e evento inválido',()=>{assert.deepEqual(D.validateBackup(fixture()),fixture());assert.throws(()=>D.validateBackup({...fixture(),profile:null}),/Perfil/);assert.throws(()=>D.validateBackup({...fixture(),events:[{id:'a',title:'X',date:'2026-02-31',time:'12:00',duration:30}]}),/evento inválido/);});
test('Backup rejeita IDs duplicados',()=>{const e={id:'same',title:'A',date:'2026-10-21',time:'10:00',duration:30};assert.throws(()=>D.validateBackup({...fixture(),events:[e,{...e}]}),/duplicados/);});
test('eventOccursOn respeita regras de recorrência none, daily, weekly e monthly (B16)',()=>{
 const single={id:'1',title:'Consulta',date:'2026-10-15',time:'10:00',duration:30,recurrence:'none'};
 assert.equal(D.eventOccursOn(single,'2026-10-15'),true);
 assert.equal(D.eventOccursOn(single,'2026-10-16'),false);
 assert.equal(D.eventOccursOn(single,'2026-10-14'),false);

 const daily={id:'2',title:'Remédio',date:'2026-10-20',time:'08:00',duration:15,recurrence:'daily'};
 assert.equal(D.eventOccursOn(daily,'2026-10-19'),false);
 assert.equal(D.eventOccursOn(daily,'2026-10-20'),true);
 assert.equal(D.eventOccursOn(daily,'2026-10-21'),true);
 assert.equal(D.eventOccursOn(daily,'2026-11-05'),true);

 const weekly={id:'3',title:'Treino',date:'2026-10-21',time:'07:00',duration:60,recurrence:'weekly'}; // quarta-feira
 assert.equal(D.eventOccursOn(weekly,'2026-10-14'),false);
 assert.equal(D.eventOccursOn(weekly,'2026-10-21'),true);
 assert.equal(D.eventOccursOn(weekly,'2026-10-22'),false);
 assert.equal(D.eventOccursOn(weekly,'2026-10-28'),true);
 assert.equal(D.eventOccursOn(weekly,'2026-11-04'),true);

 const monthly={id:'4',title:'Aluguel',date:'2026-10-31',time:'12:00',duration:30,recurrence:'monthly'};
 assert.equal(D.eventOccursOn(monthly,'2026-10-31'),true);
 assert.equal(D.eventOccursOn(monthly,'2026-11-30'),true); // nov tem 30 dias
 assert.equal(D.eventOccursOn(monthly,'2026-11-29'),false);
 assert.equal(D.eventOccursOn(monthly,'2026-12-31'),true);
 assert.equal(D.eventOccursOn(monthly,'2027-02-28'),true); // fev 2027 tem 28 dias
 assert.equal(D.eventOccursOn(monthly,'2026-09-30'),false); // antes do início

 assert.equal(D.eventOccursOn(null,'2026-10-21'),false);
 assert.equal(D.eventOccursOn(single,'data-invalida'),false);
});
test('validateEvent e validateBackup validam o campo de recorrência (B16)',()=>{
 const valid={id:'ev1',title:'Aula',date:'2026-10-21',time:'10:00',duration:60,recurrence:'weekly'};
 assert.equal(D.validateEvent(valid),null);
 const invalid={...valid,recurrence:'quinzenal'};
 assert.equal(D.validateEvent(invalid),'Recorrência inválida.');
 assert.throws(()=>D.validateBackup({...fixture(),events:[invalid]}),/evento inválido/);
});
test('72 composições SVG são distintas e parâmetros não aceitam marcação arbitrária (B36)',()=>{const outputs=new Set();for(const coat of Object.keys(C.coats))for(const outfit of Object.keys(C.outfits))for(const glasses of Object.keys(C.glasses))outputs.add(C.render({coat,outfit,glasses}));assert.equal(outputs.size,72);assert.equal(C.render({coat:'<script>bad</script>'}).includes('<script>'),false);assert.ok(C.render().includes('data-layer="glasses"'));});
test('Novas pelagens white e gray_tabby expandem a coleção para 8 pelagens válidas (B36)',()=>{
 assert.equal(Object.keys(C.coats).length,8);
 assert.ok(C.coats.white,'Pelagem white (Persa/branco) deve existir');
 assert.ok(C.coats.gray_tabby,'Pelagem gray_tabby (Tigrado cinza) deve existir');
 assert.equal(C.coats.white.label,'Persa/branco');
 assert.equal(C.coats.gray_tabby.label,'Tigrado cinza');
 for(const coat of ['white','gray_tabby']){
  for(const outfit of Object.keys(C.outfits)){
   for(const glasses of Object.keys(C.glasses)){
    const svg=C.render({coat,outfit,glasses});
    assert.ok(svg.startsWith('<svg'),'SVG deve ser gerado');
    assert.ok(svg.includes(C.coats[coat].label),'SVG deve conter label da pelagem no título/aria-label');
   }
  }
 }
});
test('calculateNextDueDate calcula corretamente dias, semanas e meses (B17)',()=>{
 assert.equal(D.calculateNextDueDate('2026-10-21',{unit:'days',amount:3}),'2026-10-24');
 assert.equal(D.calculateNextDueDate('2026-10-21',{unit:'days',amount:1}),'2026-10-22');
 assert.equal(D.calculateNextDueDate('2026-10-21',{unit:'weeks',amount:2}),'2026-11-04');
 assert.equal(D.calculateNextDueDate('2026-01-31',{unit:'months',amount:1}),'2026-02-28');
 assert.equal(D.calculateNextDueDate('2028-01-31',{unit:'months',amount:1}),'2028-02-29'); // bissexto
 assert.equal(D.calculateNextDueDate('2026-10-31',{unit:'months',amount:1}),'2026-11-30');
 assert.throws(()=>D.calculateNextDueDate('data-invalida',{unit:'days',amount:1}),/Data de conclusão inválida/);
 assert.throws(()=>D.calculateNextDueDate('2026-10-21',{unit:'anos',amount:1}),/Unidade de repetição inválida/);
 assert.throws(()=>D.calculateNextDueDate('2026-10-21',{unit:'days',amount:0}),/Intervalo de repetição inválido/);
});
test('completeTaskWithRepeat gera próxima ocorrência com data calculada e evita duplicação de série (B17)',()=>{
 const task={
  id:'task-1',
  title:'Comprar ração',
  due:'2026-10-20',
  done:false,
  priority:'high',
  repeatAfter:{unit:'days',amount:3},
  subtasks:[{id:'sub-1',title:'Checar sabor favorito',done:true}]
 };
 const tasks=[task];
 const res1=D.completeTaskWithRepeat(tasks,'task-1',{completionDate:'2026-10-21',newId:'task-2'});
 assert.equal(res1.completedTask.done,true);
 assert.equal(res1.completedTask.completedAt,'2026-10-21');
 assert.equal(res1.completedTask.seriesId,'task-1');
 assert.equal(res1.duplicated,false);
 assert.ok(res1.nextTask);
 assert.equal(res1.nextTask.id,'task-2');
 assert.equal(res1.nextTask.title,'Comprar ração');
 assert.equal(res1.nextTask.due,'2026-10-24');
 assert.equal(res1.nextTask.priority,'high');
 assert.equal(res1.nextTask.done,false);
 assert.equal(res1.nextTask.seriesId,'task-1');
 assert.deepEqual(res1.nextTask.repeatAfter,{unit:'days',amount:3});
 assert.equal(res1.nextTask.subtasks.length,1);
 assert.equal(res1.nextTask.subtasks[0].title,'Checar sabor favorito');
 assert.equal(res1.nextTask.subtasks[0].done,false);
 assert.equal(res1.tasks.length,2);

 // Chamar novamente com a tarefa concluída quando já existe pendente na mesma série NÃO duplica
 const res2=D.completeTaskWithRepeat(res1.tasks,'task-1',{completionDate:'2026-10-21',newId:'task-3'});
 assert.equal(res2.duplicated,true);
 assert.equal(res2.nextTask,null);
 assert.equal(res2.tasks.length,2);

 // Concluir agora a task-2 gera a task-3
 const res3=D.completeTaskWithRepeat(res1.tasks,'task-2',{completionDate:'2026-10-24',newId:'task-3'});
 assert.equal(res3.duplicated,false);
 assert.ok(res3.nextTask);
 assert.equal(res3.nextTask.id,'task-3');
 assert.equal(res3.nextTask.due,'2026-10-27');
 assert.equal(res3.nextTask.seriesId,'task-1');
 assert.equal(res3.tasks.length,3);
});
test('validateBackup valida repeatAfter em afazeres e rejeita formatos inválidos (B17)',()=>{
 const validTask={id:'t-rec',title:'Regar plantas',done:false,repeatAfter:{unit:'days',amount:2}};
 const validData={...fixture(),tasks:[validTask]};
 assert.deepEqual(D.validateBackup(validData),validData);

 const invalidUnit={...fixture(),tasks:[{...validTask,repeatAfter:{unit:'minutos',amount:10}}]};
 assert.throws(()=>D.validateBackup(invalidUnit),/tarefa inválida/);

 const invalidAmount={...fixture(),tasks:[{...validTask,repeatAfter:{unit:'days',amount:-1}}]};
 assert.throws(()=>D.validateBackup(invalidAmount),/tarefa inválida/);

 const invalidType={...fixture(),tasks:[{...validTask,repeatAfter:'2 dias'}]};
 assert.throws(()=>D.validateBackup(invalidType),/tarefa inválida/);
});
test('calculateWeeklyRecap calcula corretamente estatísticas da semana, eventos, horas e afazeres (B28)',()=>{
 const state={
  profile:{name:'Maria',assistantName:'Nino'},
  events:[
   {id:'e1',title:'Reunião de alinhamento',date:'2026-10-19',time:'10:00',duration:60,recurrence:'none'},
   {id:'e2',title:'Consulta com nutricionista',date:'2026-10-21',time:'14:00',duration:45,recurrence:'none'},
   {id:'e3',title:'Treino diário',date:'2026-10-19',time:'08:00',duration:30,recurrence:'daily'},
   {id:'e4',title:'Evento fora da semana',date:'2026-11-05',time:'10:00',duration:60,recurrence:'none'}
  ],
  tasks:[
   {id:'t1',title:'Entregar relatório',due:'2026-10-20',done:true,priority:'high'},
   {id:'t2',title:'Revisar planilha',due:'2026-10-22',done:false,priority:'normal',subtasks:[{id:'s1',title:'Parte 1',done:true},{id:'s2',title:'Parte 2',done:false}]},
   {id:'t3',title:'Planejar férias',due:'2026-10-25',done:true,priority:'low'},
   {id:'t4',title:'Tarefa do próximo mês',due:'2026-11-15',done:false}
  ]
 };

 const recap=D.calculateWeeklyRecap(state,'2026-10-21');
 assert.ok(recap);
 assert.equal(recap.week.start,'2026-10-19');
 assert.equal(recap.week.end,'2026-10-25');
 assert.equal(recap.week.days.length,7);

 assert.equal(recap.events.total,9);
 assert.equal(recap.events.uniqueCount,3);
 assert.equal(recap.events.totalMinutes,315);
 assert.equal(recap.events.totalHours,5.3);

 assert.equal(recap.tasks.total,3);
 assert.equal(recap.tasks.completed,2);
 assert.equal(recap.tasks.pending,1);
 assert.equal(recap.tasks.completionRate,67);
 assert.equal(recap.tasks.byPriority.high,1);
 assert.equal(recap.tasks.byPriority.normal,1);
 assert.equal(recap.tasks.byPriority.low,1);
 assert.equal(recap.tasks.subtasks.total,2);
 assert.equal(recap.tasks.subtasks.completed,1);
});
test('categorizeItem e distribuição de categorias por palavras-chave e campo personalizado (B28)',()=>{
 assert.equal(D.categorizeItem('Reunião de sprint'),'Trabalho');
 assert.equal(D.categorizeItem('Consulta médica anual'),'Saúde e Bem-estar');
 assert.equal(D.categorizeItem('Treino funcional na academia'),'Saúde e Bem-estar');
 assert.equal(D.categorizeItem('Oficina de culinária e curso de pães'),'Foco e Estudos');
 assert.equal(D.categorizeItem('Festa de aniversário do Pedro'),'Social e Lazer');
 assert.equal(D.categorizeItem('Comprar ração para gato e petiscos'),'Pessoal e Casa');
 assert.equal(D.categorizeItem('Troca de lâmpada'),'Geral');

 const state={
  events:[
   {id:'1',title:'Reunião A',date:'2026-10-20',duration:30},
   {id:'2',title:'Dentista',date:'2026-10-20',duration:45},
   {id:'3',title:'Outro item',date:'2026-10-20',duration:30,category:'Projetos Especiais'}
  ],
  tasks:[]
 };
 const recap=D.calculateWeeklyRecap(state,'2026-10-20');
 assert.equal(recap.events.categories['Trabalho'],1);
 assert.equal(recap.events.categories['Saúde e Bem-estar'],1);
 assert.equal(recap.events.categories['Projetos Especiais'],1);
});
test('calculateWeeklyRecap avalia produtividade e gera resumo formatado para compartilhamento (B28)',()=>{
 const stateCompleted={
  profile:{name:'Lucas',assistantName:'Mimi'},
  events:[{id:'e1',title:'Reunião',date:'2026-10-20',duration:60}],
  tasks:[{id:'t1',title:'Finalizar artigo',due:'2026-10-20',done:true}]
 };
 const recap=D.calculateWeeklyRecap(stateCompleted,'2026-10-20');
 assert.equal(recap.productivity.level,'excelente');
 assert.ok(recap.productivity.label.includes('impecável')||recap.productivity.label.includes('produtiva'));
 assert.ok(recap.summaryText.includes('🐾 Retrospectiva Semanal — Assistente Gato'));
 assert.ok(recap.summaryText.includes('1 compromisso(s) (1h ocupadas)'));
 assert.ok(recap.summaryText.includes('1 concluído(s), 0 pendente(s) (100% de conclusão)'));
 assert.ok(recap.summaryText.includes('Mimi diz:'));

 const emptyRecap=D.calculateWeeklyRecap({events:[],tasks:[]},'2026-10-20');
 assert.equal(emptyRecap.events.total,0);
 assert.equal(emptyRecap.tasks.total,0);
 assert.equal(emptyRecap.productivity.level,'tranquila');
});
