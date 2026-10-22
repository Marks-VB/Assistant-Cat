/* SPDX-License-Identifier: AGPL-3.0-or-later */
(function(root){'use strict';
const clean=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
function civilDate(now=new Date(),timeZone='America/Sao_Paulo'){
 const parts=new Intl.DateTimeFormat('en-CA',{timeZone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(now));
 const p=Object.fromEntries(parts.map(p=>[p.type,p.value]));return p.year+'-'+p.month+'-'+p.day;
}
function addDays(iso,n){const d=new Date(iso+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10);}
function addMonths(iso,n){
 const y=Number(iso.slice(0,4)),m=Number(iso.slice(5,7))-1,d=Number(iso.slice(8,10));
 const targetTotalMonths=y*12+m+Number(n);
 const targetYear=Math.floor(targetTotalMonths/12);
 const targetMonth=((targetTotalMonths%12)+12)%12;
 const maxDays=new Date(Date.UTC(targetYear,targetMonth+1,0)).getUTCDate();
 const finalDay=Math.min(d,maxDays);
 return targetYear+'-'+String(targetMonth+1).padStart(2,'0')+'-'+String(finalDay).padStart(2,'0');
}
function validDate(s){return /^\d{4}-\d{2}-\d{2}$/.test(s)&&!Number.isNaN(Date.parse(s+'T12:00:00Z'))&&new Date(s+'T12:00:00Z').toISOString().slice(0,10)===s;}
function parseCommand(text,context={}){
 const t=clean(text).trim(),today=civilDate(context.now||new Date(),context.timeZone||'America/Sao_Paulo');
 if(/^(nao |nunca |nao\b)/.test(t))return {kind:'unsupported',reason:'A instrução contém uma negação; nenhuma alteração será feita.'};
 if(/\b(toda|todo|diariamente|semanalmente|repita|recorrente)\b/.test(t))return {kind:'unsupported',reason:'Recorrência por conversa está planejada. Neste protótipo, crie um item simples.'};
 if(/^(apague|exclua|remova|cancele)\b/.test(t))return {kind:'unsupported',reason:'Exclusão por conversa está planejada. Use a ação de exclusão no detalhe do item.'};
 const isTask=/^(crie |criar |adicione |adicionar )?(uma )?tarefa\b/.test(t);
 const isEvent=/^(marque|marcar|agende|agendar|crie (um )?(evento|compromisso))\b/.test(t);
 if(!isTask&&!isEvent)return {kind:'unsupported',reason:'Modo demonstração: experimente “Marque reunião amanhã às 14h por 45 minutos” ou “Crie tarefa revisar proposta”.'};
 let date=null;
 if(t.includes('depois de amanha'))date=addDays(today,2);else if(t.includes('amanha'))date=addDays(today,1);else if(/\bhoje\b/.test(t))date=today;
 const explicit=t.match(/\b(\d{2})\/(\d{2})\/(\d{4})\b/);
 if(explicit)date=explicit[3]+'-'+explicit[2]+'-'+explicit[1];
 let time=null;const tm=t.match(/\b(?:as|a)\s+(\d{1,2})(?:(?:h|:)(\d{2})?)?\b/)||t.match(/\b(\d{1,2})h(\d{2})?\b/);
 if(tm){const hh=Number(tm[1]),mm=Number(tm[2]||0);if(hh>23||mm>59)return {kind:'unsupported',reason:'Horário inválido. Use horas de 00 a 23 e minutos de 00 a 59.'};time=String(hh).padStart(2,'0')+':'+String(mm).padStart(2,'0');}
 if(date&&!validDate(date))return {kind:'unsupported',reason:'Data inválida. Confira dia, mês e ano.'};
 const durationMatch=t.match(/\bpor\s+(\d+)\s*(minutos?|mins?|horas?|h)\b/);let duration=durationMatch?Number(durationMatch[1])*(durationMatch[2].startsWith('h')?60:1):60;
 if(duration<1||duration>1440)return {kind:'unsupported',reason:'A duração deve estar entre 1 e 1440 minutos neste protótipo.'};
 let title=String(text).replace(/^(crie |criar |adicione |adicionar )?(uma )?tarefa\s*/i,'').replace(/^(marque|marcar|agende|agendar|crie (um )?(evento|compromisso))\s*/i,'');
 const markers=/\s+(depois de amanh[ãa]|amanh[ãa]|hoje|[àa]s\s+\d|\d{2}\/\d{2}\/\d{4}|por\s+\d)/i;
 title=(' '+title).split(markers)[0].trim().replace(/[.,]$/,'');
 const missingFields=[];if(!title)missingFields.push('title');if(!isTask&&!date)missingFields.push('date');if(!isTask&&!time)missingFields.push('time');
 return {kind:isTask?'create_task':'create_event',payload:{title,date,time,duration},missingFields,status:'needs_review'};
}
function validateEvent(e){if(!e||!String(e.title||'').trim())return 'Informe o título.';if(!validDate(e.date))return 'Informe uma data válida.';if(e.recurrence&&!['none','daily','weekly','monthly'].includes(e.recurrence))return 'Recorrência inválida.';if(e.allDay){if(e.endDate&&(!validDate(e.endDate)||e.endDate<e.date))return 'A data final deve ser igual ou posterior à data inicial.';return null;}if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(e.time||''))return 'Informe um horário válido.';if(!Number.isFinite(Number(e.duration))||Number(e.duration)<1||Number(e.duration)>1440)return 'Duração inválida.';return null;}
function eventOccursOn(e,targetDate){
 if(!e||!validDate(e.date)||!validDate(targetDate))return false;
 if(targetDate<e.date)return false;
 const recurrence=e.recurrence||'none';
 const span=(e.allDay&&e.endDate&&e.endDate>=e.date)?Math.round((new Date(e.endDate+'T12:00:00Z')-new Date(e.date+'T12:00:00Z'))/86400000):0;
 if(recurrence==='none'){if(e.allDay){const end=e.endDate||e.date;return e.date<=targetDate&&targetDate<=end;}return e.date===targetDate;}
 if(recurrence==='daily')return true;
 if(recurrence==='weekly'){const diffDays=Math.round((new Date(targetDate+'T12:00:00Z')-new Date(e.date+'T12:00:00Z'))/86400000);return (diffDays%7)<=span;}
 if(recurrence==='monthly'){
  const dayS=Number(e.date.slice(8,10)),yearT=Number(targetDate.slice(0,4)),monthT=Number(targetDate.slice(5,7)),dayT=Number(targetDate.slice(8,10));
  const maxDays=new Date(Date.UTC(yearT,monthT,0)).getUTCDate();
  const startDay=Math.min(dayS,maxDays),endDay=Math.min(dayS+span,maxDays);
  return dayT>=startDay&&dayT<=endDay;
 }
 return false;
}
function conflicts(events,e){if(e.allDay)return [];const start=x=>Date.parse(x.date+'T'+x.time+':00Z');return events.filter(x=>!x.allDay&&x.id!==e.id&&start(x)<start(e)+Number(e.duration)*60000&&start(e)<start(x)+Number(x.duration)*60000);}
function executeProposal(state,proposal,id){
 if(state.executedProposalKeys.includes(proposal.key))return {state,duplicate:true};
 if(proposal.missingFields.length)throw Error('Revise os campos pendentes.');
 const next=JSON.parse(JSON.stringify(state));
 if(proposal.kind==='create_event'){const e={id,title:proposal.payload.title,date:proposal.payload.date,endDate:proposal.payload.endDate||proposal.payload.date,allDay:Boolean(proposal.payload.allDay),time:proposal.payload.time||'09:00',duration:Number(proposal.payload.duration)||60,recurrence:proposal.payload.recurrence||'none',notes:''};const error=validateEvent(e);if(error)throw Error(error);next.events.push(e);}
 else if(proposal.kind==='create_task'){if(!proposal.payload.title.trim())throw Error('Informe o título.');next.tasks.push({id,title:proposal.payload.title,due:proposal.payload.date||'',done:false});}
 else if(proposal.kind==='create_memory'){if(!proposal.payload.title.trim()||!proposal.payload.content.trim())throw Error('Informe título e conteúdo da memória.');next.memories.push({id,title:proposal.payload.title,content:proposal.payload.content});}
 else throw Error('Ação não implementada.');
 next.executedProposalKeys.push(proposal.key);next.messages=next.messages.map(m=>m.proposal&&m.proposal.key===proposal.key?{...m,proposal:{...m.proposal,status:'executed'}}:m);return {state:next,duplicate:false};
}
const validThemes=['light','dark','system','minimalist','glassmorphism','nord','cyberpunk','retro'];
function validateBackup(data){
 if(!data||data.schemaVersion!==2||!Array.isArray(data.events)||!Array.isArray(data.tasks)||!Array.isArray(data.messages)||!Array.isArray(data.executedProposalKeys))throw Error('Formato de backup incompatível.');
 if(!data.profile||typeof data.profile.name!=='string'||typeof data.profile.assistantName!=='string'||!validThemes.includes(data.theme)||!['now','chat','calendar','actions','me'].includes(data.tab)||!data.appearance||!Array.isArray(data.memories))throw Error('Perfil ou preferências inválidos.');
 for(const m of data.messages)if(!m||typeof m.id!=='string'||!['user','assistant'].includes(m.role)||typeof m.text!=='string')throw Error('Backup contém mensagem inválida.');
 for(const m of data.memories)if(!m||typeof m.id!=='string'||typeof m.title!=='string'||typeof m.content!=='string')throw Error('Backup contém memória inválida.');
 if(data.trash&&!Array.isArray(data.trash))throw Error('Backup contém lixeira inválida.');
 if(data.autoSpeak!==undefined&&typeof data.autoSpeak!=='boolean')throw Error('Backup contém configuração de voz inválida.');
 if(data.events.length>10000||data.tasks.length>10000||data.messages.length>1000)throw Error('Backup excede o limite do protótipo.');
 for(const e of data.events){const error=validateEvent(e);if(error||typeof e.id!=='string')throw Error('Backup contém evento inválido.');}
 for(const t of data.tasks){
  if(!t||typeof t.id!=='string'||typeof t.title!=='string'||!t.title.trim()||typeof t.done!=='boolean'||(t.due&&!validDate(t.due)))throw Error('Backup contém tarefa inválida.');
  if(t.repeatAfter!==undefined&&t.repeatAfter!==null){
   if(typeof t.repeatAfter!=='object'||!['days','weeks','months'].includes(t.repeatAfter.unit)||!Number.isFinite(Number(t.repeatAfter.amount))||Number(t.repeatAfter.amount)<1){
    throw Error('Backup contém tarefa inválida.');
   }
  }
  if(t.subtasks&&!Array.isArray(t.subtasks))throw Error('Backup contém subtarefas inválidas.');
  if(Array.isArray(t.subtasks)){
   for(const sub of t.subtasks){
    if(!sub||typeof sub.id!=='string'||typeof sub.title!=='string'||!sub.title.trim()||typeof sub.done!=='boolean')throw Error('Backup contém subtarefa inválida.');
   }
  }
 }
 const ids=[...data.events,...data.tasks].map(x=>x.id);if(new Set(ids).size!==ids.length)throw Error('Backup contém IDs duplicados.');
 return data;
}
function calculateNextDueDate(completionDate,repeatAfter){
 if(!validDate(completionDate))throw Error('Data de conclusão inválida.');
 if(!repeatAfter||!['days','weeks','months'].includes(repeatAfter.unit))throw Error('Unidade de repetição inválida.');
 const amount=Number(repeatAfter.amount);
 if(!Number.isFinite(amount)||amount<1)throw Error('Intervalo de repetição inválido.');
 if(repeatAfter.unit==='days')return addDays(completionDate,amount);
 if(repeatAfter.unit==='weeks')return addDays(completionDate,amount*7);
 if(repeatAfter.unit==='months')return addMonths(completionDate,amount);
 throw Error('Unidade de repetição inválida.');
}
function completeTaskWithRepeat(tasksOrTask,taskIdOrOptions,maybeOptions={}){
 if(Array.isArray(tasksOrTask)){
  const tasks=tasksOrTask,taskId=taskIdOrOptions,options=maybeOptions||{};
  const task=tasks.find(t=>t.id===taskId);
  if(!task)return {tasks,completedTask:null,nextTask:null,duplicated:false};
  const completionDate=options.completionDate||civilDate(options.now||new Date(),options.timeZone||'America/Sao_Paulo');
  const seriesId=task.seriesId||task.id;
  const completedTask={...task,done:true,seriesId,completedAt:completionDate};
  if(!task.repeatAfter||!task.repeatAfter.unit||!task.repeatAfter.amount){
   const nextTasks=tasks.map(t=>t.id===taskId?completedTask:t);
   return {tasks:nextTasks,completedTask,nextTask:null,duplicated:false};
  }
  const existingPending=tasks.some(t=>t.id!==taskId&&(t.seriesId===seriesId||t.id===task.nextTaskId)&&!t.done);
  if(existingPending){
   const nextTasks=tasks.map(t=>t.id===taskId?completedTask:t);
   return {tasks:nextTasks,completedTask,nextTask:null,duplicated:true};
  }
  const nextDue=calculateNextDueDate(completionDate,task.repeatAfter);
  const nextId=options.newId||('task-'+Math.random().toString(36).slice(2,10));
  const nextTask={
   id:nextId,
   title:task.title,
   due:nextDue,
   priority:task.priority||'normal',
   repeatAfter:{unit:task.repeatAfter.unit,amount:Number(task.repeatAfter.amount)},
   seriesId,
   done:false,
   subtasks:Array.isArray(task.subtasks)?task.subtasks.map((s,i)=>({
    id:options.generateSubtaskId?options.generateSubtaskId(s,i):(s.id+'-next'),
    title:s.title,
    done:false
   })):[]
  };
  completedTask.nextTaskId=nextId;
  const nextTasks=tasks.map(t=>t.id===taskId?completedTask:t).concat(nextTask);
  return {tasks:nextTasks,completedTask,nextTask,duplicated:false};
 }else{
  const task=tasksOrTask,options=taskIdOrOptions||{};
  if(!task)return {completedTask:null,nextTask:null,duplicated:false};
  const completionDate=options.completionDate||civilDate(options.now||new Date(),options.timeZone||'America/Sao_Paulo');
  const seriesId=task.seriesId||task.id;
  const completedTask={...task,done:true,seriesId,completedAt:completionDate};
  if(!task.repeatAfter||!task.repeatAfter.unit||!task.repeatAfter.amount){
   return {completedTask,nextTask:null,duplicated:false};
  }
  if(Array.isArray(options.existingTasks)){
   const existingPending=options.existingTasks.some(t=>t.id!==task.id&&(t.seriesId===seriesId||t.id===task.nextTaskId)&&!t.done);
   if(existingPending)return {completedTask,nextTask:null,duplicated:true};
  }
  const nextDue=calculateNextDueDate(completionDate,task.repeatAfter);
  const nextId=options.newId||('task-'+Math.random().toString(36).slice(2,10));
  const nextTask={
   id:nextId,
   title:task.title,
   due:nextDue,
   priority:task.priority||'normal',
   repeatAfter:{unit:task.repeatAfter.unit,amount:Number(task.repeatAfter.amount)},
   seriesId,
   done:false,
   subtasks:Array.isArray(task.subtasks)?task.subtasks.map((s,i)=>({
    id:options.generateSubtaskId?options.generateSubtaskId(s,i):(s.id+'-next'),
    title:s.title,
    done:false
   })):[]
  };
  completedTask.nextTaskId=nextId;
  return {completedTask,nextTask,duplicated:false};
 }
}
function searchItems(state,query,filters={}){
 const q=clean(query).trim();
 const type=filters.type||'all';
 const status=filters.status||'all';
 let results=[];
 if(type==='all'||type==='event'){
  for(const e of (state.events||[])){
   const text=clean(e.title+' '+(e.notes||'')+' '+(e.date||'')+' '+(e.endDate||'')+' '+(e.recurrence||''));
   if(!q||text.includes(q))results.push({...e,kind:'event'});
  }
 }
 if(type==='all'||type==='task'){
  for(const t of (state.tasks||[])){
   if(status==='pending'&&t.done)continue;
   if(status==='done'&&!t.done)continue;
   const repText=t.repeatAfter?(' repete '+t.repeatAfter.amount+' '+t.repeatAfter.unit):'';
   const text=clean(t.title+' '+(t.due||'')+repText);
   if(!q||text.includes(q))results.push({...t,kind:'task'});
  }
 }
 return results;
}
function getWeekRange(refDate){
 const d=new Date(refDate+'T12:00:00Z');
 const day=d.getUTCDay();
 const diffToMonday=day===0?-6:1-day;
 const start=addDays(refDate,diffToMonday);
 const end=addDays(start,6);
 const days=[];
 for(let i=0;i<7;i++)days.push(addDays(start,i));
 return {start,end,days};
}
function categorizeItem(title,notes){
 const t=clean((title||'')+' '+(notes||''));
 if(/\b(reuniao|reunioes|projeto|trabalho|sprint|review|cliente|alinhamento|apresentacao|entrega|demo|planejamento|call|sync)\b/.test(t))return 'Trabalho';
 if(/\b(saude|medico|medica|consulta|dentista|exame|terapia|remedio|treino|academia|corrida|exercicio|caminhada)\b/.test(t))return 'Saúde e Bem-estar';
 if(/\b(estudo|estudos|aula|curso|leitura|livro|oficina|workshop|faculdade|pos|certificacao)\b/.test(t))return 'Foco e Estudos';
 if(/\b(festa|aniversario|jantar|almoco|cinema|show|encontro|cafe|amigos|lazer|happy hour)\b/.test(t))return 'Social e Lazer';
 if(/\b(mercado|compras|casa|faxina|manutencao|pagamento|banco|conta|gato|pet|veterinario|racao)\b/.test(t))return 'Pessoal e Casa';
 return 'Geral';
}
function calculateWeeklyRecap(state,referenceDate){
 if(!state)return null;
 const refDate=referenceDate?(typeof referenceDate==='string'&&validDate(referenceDate)?referenceDate:civilDate(referenceDate)):civilDate();
 const {start,end,days}=getWeekRange(refDate);

 const events=state.events||[];
 let totalOccurrences=0,totalMinutes=0,allDayCount=0;
 const occurrencesByDay=days.map(d=>({date:d,events:[]}));
 const categoriesMap={};
 const uniqueEventIds=new Set();

 for(const e of events){
  for(let i=0;i<days.length;i++){
   const day=days[i];
   if(eventOccursOn(e,day)){
    uniqueEventIds.add(e.id);
    const isAllDay=Boolean(e.allDay);
    if(isAllDay)allDayCount++;
    const duration=Number(e.duration)||(isAllDay?1440:60);
    totalOccurrences++;
    totalMinutes+=duration;
    occurrencesByDay[i].events.push({
     id:e.id,
     title:e.title,
     duration,
     allDay:isAllDay,
     time:e.time||''
    });
    const cat=e.category&&String(e.category).trim()?String(e.category).trim():categorizeItem(e.title,e.notes);
    categoriesMap[cat]=(categoriesMap[cat]||0)+1;
   }
  }
 }
 const totalHours=Math.round((totalMinutes/60)*10)/10;

 const allTasks=state.tasks||[];
 let weekTasks=allTasks.filter(t=>{
  if(t.due&&t.due>=start&&t.due<=end)return true;
  if(t.completedAt&&t.completedAt>=start&&t.completedAt<=end)return true;
  return false;
 });
 if(weekTasks.length===0&&allTasks.length>0&&!allTasks.some(t=>t.due)){
  weekTasks=allTasks;
 }

 const completedTasks=weekTasks.filter(t=>t.done).length;
 const pendingTasks=weekTasks.filter(t=>!t.done).length;
 const totalTasks=weekTasks.length;
 const completionRate=totalTasks>0?Math.round((completedTasks/totalTasks)*100):0;

 const tasksByPriority={
  high:weekTasks.filter(t=>t.priority==='high').length,
  normal:weekTasks.filter(t=>!t.priority||t.priority==='normal').length,
  low:weekTasks.filter(t=>t.priority==='low').length
 };

 let totalSubtasks=0,completedSubtasks=0;
 for(const t of weekTasks){
  if(Array.isArray(t.subtasks)){
   totalSubtasks+=t.subtasks.length;
   completedSubtasks+=t.subtasks.filter(s=>s.done).length;
  }
 }

 let productivityLevel='tranquila';
 let productivityLabel='Semana tranquila';
 let catMotivation='Uma semana com bastante espaço livre para respirar e planejar com calma.';

 if(completedTasks>0&&pendingTasks===0&&totalOccurrences>0){
  productivityLevel='excelente';
  productivityLabel='Conclusão impecável';
  catMotivation='Todas as tarefas planejadas foram concluídas e sua agenda foi cumprida com excelência!';
 }else if(completionRate>=70||(completedTasks>=3&&completionRate>=50)){
  productivityLevel='alta';
  productivityLabel='Semana muito produtiva';
  catMotivation='Você teve um ritmo admirável esta semana. Celebre cada conquista alcançada!';
 }else if(completedTasks>0||(totalOccurrences>=3&&completionRate>=30)){
  productivityLevel='equilibrada';
  productivityLabel='Ritmo constante';
  catMotivation='Passo a passo você cuidou do que importava. Um ótimo progresso com equilíbrio e leveza!';
 }else if(pendingTasks>0){
  productivityLevel='em_andamento';
  productivityLabel='Foco em andamento';
  catMotivation='Sem pressa: cada pequena ação conta. Escolha uma tarefa leve para começar o dia.';
 }else if(totalOccurrences>0){
  productivityLevel='agenda_ativa';
  productivityLabel='Agenda ativa';
  catMotivation='Sua agenda teve momentos bem marcados. Lembre-se de reservar pausas para recarregar!';
 }

 const assistantName=(state.profile&&state.profile.assistantName)||'Nino';
 const sDate=start.split('-').reverse().slice(0,2).join('/');
 const eDate=end.split('-').reverse().slice(0,2).join('/');
 const year=end.slice(0,4);
 const lines=[
  '🐾 Retrospectiva Semanal — Assistente Gato',
  'Período: '+sDate+' a '+eDate+'/'+year,
  '',
  '📅 Agenda: '+totalOccurrences+' compromisso(s) ('+totalHours+'h ocupadas)',
  '✅ Afazeres: '+completedTasks+' concluído(s), '+pendingTasks+' pendente(s) ('+completionRate+'% de conclusão)'
 ];
 const catEntries=Object.entries(categoriesMap);
 if(catEntries.length>0){
  lines.push('','📊 Distribuição de eventos:');
  for(const [cName,cCount] of catEntries){
   lines.push('  • '+cName+': '+cCount);
  }
 }
 if(totalSubtasks>0){
  lines.push('','📌 Subtarefas: '+completedSubtasks+'/'+totalSubtasks+' concluídas');
 }
 lines.push(
  '',
  '✨ Produtividade: '+productivityLabel,
  '🐱 '+assistantName+' diz: “'+catMotivation+'”'
 );
 const summaryText=lines.join('\n');

 return {
  week:{start,end,days,referenceDate:refDate},
  events:{
   total:totalOccurrences,
   uniqueCount:uniqueEventIds.size,
   totalMinutes,
   totalHours,
   allDayCount,
   categories:categoriesMap,
   byDay:occurrencesByDay
  },
  tasks:{
   total:totalTasks,
   completed:completedTasks,
   pending:pendingTasks,
   completionRate,
   byPriority:tasksByPriority,
   subtasks:{total:totalSubtasks,completed:completedSubtasks}
  },
  productivity:{
   level:productivityLevel,
   label:productivityLabel,
   message:catMotivation
  },
  summaryText
 };
}
const api={clean,civilDate,addDays,addMonths,validDate,parseCommand,validateEvent,eventOccursOn,conflicts,executeProposal,validateBackup,searchItems,calculateNextDueDate,completeTaskWithRepeat,calculateWeeklyRecap,categorizeItem,validThemes};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.GatoDomain=api;
})(typeof window!=='undefined'?window:globalThis);
