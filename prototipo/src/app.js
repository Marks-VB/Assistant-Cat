/* SPDX-License-Identifier: AGPL-3.0-or-later */
(async function(){'use strict';
const D=GatoDomain,C=CatAvatar,S=GatoStorage,$=s=>document.querySelector(s);
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const paths={chat:'M4 4h16v12H9l-5 4V4Z',now:'M12 3v3m0 12v3M3 12h3m12 0h3M7 12a5 5 0 1 0 10 0 5 5 0 0 0-10 0Z',calendar:'M5 5h14v15H5V5Zm3-3v6m8-6v6M5 10h14',actions:'M4 8h16v12H4V8Zm4 0V5h8v3m-12 5h16m-9-2v4h2v-4',me:'M8 7a4 4 0 1 0 8 0 4 4 0 0 0-8 0ZM4 21v-2a8 8 0 0 1 16 0v2',plus:'M12 5v14m-7-7h14',check:'m5 12 4 4L19 6',arrow:'m8 5 7 7-7 7',edit:'m5 16-1 4 4-1L20 7l-4-4L5 16Z',trash:'M5 7h14m-12 0 1 13h8l1-13M9 7V4h6v3',settings:'M4 7h8m4 0h4M4 17h3m4 0h9M12 4v6M7 14v6',sun:'M12 2v2m0 16v2M2 12h2m16 0h2M6 6l-1-1m14 14-1-1M6 18l-1 1M18 6l1-1M8 12a4 4 0 1 0 8 0 4 4 0 0 0-8 0Z',search:'m21 21-4.35-4.35M19 11a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z',volume:'M11 5L6 9H2v6h4l5 4V5zm4.5 3a4 4 0 0 1 0 8m2.5-11a8 8 0 0 1 0 14',volumeOff:'M11 5L6 9H2v6h4l5 4V5zm5 4l6 6m0-6l-6 6',mic:'M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3zm5 7a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V18H9v2h6v-2h-2v-3.08A7 7 0 0 0 19 8h-2z',micOff:'M1 1l22 22M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6'};
const icon=n=>'<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="'+paths[n]+'"/></svg>';
const navs=[['chat','Chat'],['now','Agora'],['calendar','Agenda'],['actions','Ações'],['me','Eu']];
const today=()=>D.civilDate(new Date(),'America/Sao_Paulo');
const uid=()=>globalThis.crypto?.randomUUID?.()||'local-'+Date.now()+'-'+Math.random().toString(16).slice(2);
const dateLabel=s=>new Intl.DateTimeFormat('pt-BR',{day:'numeric',month:'long',timeZone:'UTC'}).format(new Date(s+'T12:00:00Z'));
const fullDate=s=>new Intl.DateTimeFormat('pt-BR',{weekday:'long',day:'numeric',month:'long',timeZone:'UTC'}).format(new Date(s+'T12:00:00Z'));
const defaultAssistantName=(typeof navigator!=='undefined'&&navigator.language&&navigator.language.startsWith('en'))?'Your Assistant Cat':'Seu Gato Assistente';
function initial(){const date=today();return {schemaVersion:2,profile:{name:'Você',assistantName:defaultAssistantName},appearance:{coat:'tuxedo',outfit:'none',glasses:'none'},theme:'light',tab:'now',events:[{id:uid(),title:'Revisão da semana',date,time:'14:00',duration:45,notes:'Evento de exemplo. Edite ou remova quando quiser.'}],tasks:[{id:uid(),title:'Organizar as prioridades',due:date,done:false},{id:uid(),title:'Testar meu novo assistente',due:'',done:false}],messages:[{id:uid(),role:'assistant',text:'Olá! Vamos deixar o dia mais leve? Sou um assistente de demonstração. Posso ajudar a criar um compromisso ou uma tarefa usando os exemplos abaixo.'}],memories:[],executedProposalKeys:[]};}
let state,appearanceDraft,profileTab='cat',calendarTab='calendar',actionsTab='automations',selectedDate=today(),monthDate=today().slice(0,7),queue=Promise.resolve(),toastTimer,searchQuery='',searchKind='all',searchStatus='all',recognition=null,isListening=false,speakingMessageId=null;
function stopSpeech(){if(typeof window!=='undefined'&&window.speechSynthesis){try{window.speechSynthesis.cancel();}catch{}}speakingMessageId=null;}
function stopSpeech(){if(typeof window!=='undefined'&&window.speechSynthesis){try{window.speechSynthesis.cancel();}catch{}}else if(globalThis.speechSynthesis){try{globalThis.speechSynthesis.cancel();}catch{}}speakingMessageId=null;}
function toggleSpeech(text,msgId){
 const synth=typeof window!=='undefined'&&window.speechSynthesis?window.speechSynthesis:(globalThis.speechSynthesis||null);
 const Utterance=typeof window!=='undefined'&&window.SpeechSynthesisUtterance?window.SpeechSynthesisUtterance:(globalThis.SpeechSynthesisUtterance||null);
 if(!synth||!Utterance){
  toast('Síntese de voz não é suportada neste navegador.');
  return;
 }
 if(speakingMessageId===msgId){
  stopSpeech();
  render();
  return;
 }
 stopSpeech();
 const cleanText=String(text||'').replace(/[*_#`~]/g,'').trim();
 if(!cleanText)return;
 const utterance=new Utterance(cleanText);
 utterance.lang='pt-BR';
 utterance.pitch=1.05;
 utterance.rate=1.0;
 utterance.onstart=()=>{speakingMessageId=msgId;render();};
 utterance.onend=()=>{if(speakingMessageId===msgId){speakingMessageId=null;render();}};
 utterance.onerror=(e)=>{
  if(speakingMessageId===msgId){speakingMessageId=null;render();}
  if(e.error!=='canceled'&&e.error!=='interrupted')toast('Não foi possível reproduzir o áudio da mensagem.');
 };
 speakingMessageId=msgId;
 render();
 try{synth.speak(utterance);}catch{speakingMessageId=null;render();toast('Falha ao reproduzir áudio.');}
}
function toggleRecognition(){
 const SpeechRec=(typeof window!=='undefined'&&(window.SpeechRecognition||window.webkitSpeechRecognition))||globalThis.SpeechRecognition||globalThis.webkitSpeechRecognition;
 if(!SpeechRec){
  toast('Reconhecimento de voz não é suportado neste navegador.');
  return;
 }
 if(isListening){
  if(recognition){try{recognition.stop();}catch{}}
  isListening=false;
  render();
  return;
 }
 try{
  recognition=new SpeechRec();
 }catch{
  toast('Não foi possível inicializar o microfone.');
  return;
 }
 recognition.lang='pt-BR';
 recognition.continuous=false;
 recognition.interimResults=true;
 recognition.maxAlternatives=1;
 const input=$('#chat-input');
 let baseText=input?input.value:'';
 if(baseText&&!baseText.endsWith(' '))baseText+=' ';
 recognition.onstart=()=>{
  isListening=true;
  render();
  toast('Microfone aberto. Fale sua mensagem…');
 };
 recognition.onresult=e=>{
  let transcript='';
  for(let i=e.resultIndex;i<e.results.length;++i){
   transcript+=e.results[i][0].transcript;
  }
  const curInput=$('#chat-input');
  if(curInput){
   curInput.value=baseText+transcript;
   curInput.focus();
  }
 };
 recognition.onerror=e=>{
  isListening=false;
  render();
  if(e.error==='not-allowed'||e.error==='service-not-allowed'){
   toast('Permissão de microfone negada. Verifique as configurações do navegador.');
  }else if(e.error==='no-speech'){
   toast('Nenhuma fala foi detectada. Tente falar novamente.');
  }else if(e.error!=='aborted'){
   toast('Erro no reconhecimento de voz: '+e.error);
  }
 };
 recognition.onend=()=>{
  isListening=false;
  render();
 };
 try{
  recognition.start();
 }catch(err){
  isListening=false;
  render();
  toast('Não foi possível acionar o microfone.');
 }
}
await S.init();try{state=await S.load();if(state)D.validateBackup(state);}catch{state=null;}
if(!state){state=initial();try{await S.save(state);}catch{}}
else if(state.profile&&(!state.profile.assistantName||state.profile.assistantName==='Nino')){state.profile.assistantName=defaultAssistantName;try{await S.save(state);}catch{}}
appearanceDraft=C.normalize(state.appearance);
function toast(text){$('#toast').textContent=text;$('#toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('visible'),4200);}
function update(fn){const operation=queue.then(async()=>{const next=fn(JSON.parse(JSON.stringify(state)));await S.save(next);state=next;render();});queue=operation.catch(e=>toast(e.message||'Não foi possível salvar.'));return operation;}
function appearance(input=state.appearance){const avatarState=isListening?'listening':(speakingMessageId?'speaking':(input.state||'idle'));return {...input,state:avatarState,background:state.theme==='dark'?'dark':'neutral'};}
function applyTheme(){let theme=state.theme;if(theme==='system')theme=matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light';document.documentElement.dataset.theme=theme;}
function heading(title,sub,button=''){return '<div class="heading"><div><div class="eyebrow">Seu espaço, no seu ritmo</div><h1>'+title+'</h1><p class="subheading">'+sub+'</p></div>'+button+'</div>';}
function empty(title,description){return '<div class="empty">'+C.render(appearance())+'<h3>'+title+'</h3><p>'+description+'</p></div>';}
function eventRows(events){const recLabels={daily:'Repete diariamente',weekly:'Repete semanalmente',monthly:'Repete mensalmente'};return events.length?events.map(e=>{const timeStr=e.allDay?'Dia inteiro':esc(e.time);const dateStr=e.allDay&&(e.endDate&&e.endDate!==e.date)?dateLabel(e.date)+' até '+dateLabel(e.endDate):dateLabel(e.date)+(e.allDay?'':' · '+Number(e.duration)+' min');const recStr=e.recurrence&&recLabels[e.recurrence]?' · <span class="recurrence-indicator" title="'+recLabels[e.recurrence]+'">🔁 '+recLabels[e.recurrence]+'</span>':'';return '<div class="event-row"><div class="event-time" style="'+(e.allDay?'font-size:11px':'')+'">'+timeStr+'</div><div><h3>'+esc(e.title)+'</h3><p>'+dateStr+recStr+'</p></div><div class="row-actions"><button class="ghost" data-action="edit-event" data-id="'+esc(e.id)+'" aria-label="Editar '+esc(e.title)+'" title="Editar '+esc(e.title)+'">'+icon('edit')+'</button><button class="ghost danger" data-action="delete-event" data-id="'+esc(e.id)+'" aria-label="Excluir '+esc(e.title)+'" title="Excluir '+esc(e.title)+'">'+icon('trash')+'</button></div></div>';}).join(''):empty('Um pouco de espaço livre','Adicione um compromisso quando precisar.');}
function repeatLabel(r){
 if(!r||!r.unit)return '';
 const amt=Number(r.amount)||1;
 const unitPlural={days:'dias',weeks:'semanas',months:'meses'}[r.unit]||r.unit;
 const unitSingular={days:'dia',weeks:'semana',months:'mês'}[r.unit]||r.unit;
 const u=amt===1?unitSingular:unitPlural;
 return '🔁 Repete após '+amt+' '+u;
}
function taskRows(tasks){return tasks.length?tasks.map(t=>{
 const subtasks=t.subtasks||[];
 const doneCount=subtasks.filter(s=>s.done).length;
 const subtasksHtml=subtasks.length?'<div style="margin-top:8px;display:flex;flex-direction:column;gap:6px;padding-left:14px;border-left:2px solid var(--border)">'+subtasks.map(s=>'<div class="subtask-row" style="display:flex;align-items:center;gap:8px"><button class="check subtask-check '+(s.done?'done':'')+'" role="checkbox" aria-checked="'+(s.done?'true':'false')+'" data-action="toggle-subtask" data-task-id="'+esc(t.id)+'" data-sub-id="'+esc(s.id)+'" aria-label="'+(s.done?'Reabrir ':'Concluir ')+esc(s.title)+'">'+(s.done?'✓':'')+'</button><span class="task-label '+(s.done?'done':'')+'" style="font-size:13px">'+esc(s.title)+'</span><button class="ghost danger subtask-delete-btn" data-action="delete-subtask" data-task-id="'+esc(t.id)+'" data-sub-id="'+esc(s.id)+'" aria-label="Excluir subtarefa '+esc(s.title)+'" title="Excluir subtarefa"><span aria-hidden="true">×</span></button></div>').join('')+'</div>':'';
 const priorityBadge=t.priority==='high'?'<span style="font-size:10px;font-weight:700;color:var(--danger);background:var(--surface-alt);padding:2px 6px;border-radius:4px;margin-left:6px">Alta prioridade</span>':t.priority==='low'?'<span style="font-size:10px;color:var(--muted);background:var(--surface-alt);padding:2px 6px;border-radius:4px;margin-left:6px">Baixa prioridade</span>':'';
 const repeatBadge=t.repeatAfter&&t.repeatAfter.unit?'<span class="task-repeat-badge" title="'+repeatLabel(t.repeatAfter)+'">'+repeatLabel(t.repeatAfter)+'</span>':'';
 return '<div class="task-row"><button class="check '+(t.done?'done':'')+'" role="checkbox" aria-checked="'+(t.done?'true':'false')+'" data-action="toggle-task" data-id="'+esc(t.id)+'" aria-label="'+(t.done?'Reabrir ':'Concluir ')+esc(t.title)+'">'+(t.done?'✓':'')+'</button><div class="task-label '+(t.done?'done':'')+'">'+esc(t.title)+priorityBadge+repeatBadge+(t.due?'<div class="task-date">'+dateLabel(t.due)+'</div>':'')+(subtasks.length?'<div class="task-date" style="font-size:11px;color:var(--accent);margin-top:4px">'+doneCount+'/'+subtasks.length+' subtarefas</div>':'')+subtasksHtml+'</div><div class="row-actions"><button class="ghost" data-action="add-subtask-prompt" data-id="'+esc(t.id)+'" aria-label="Adicionar subtarefa a '+esc(t.title)+'" title="Adicionar subtarefa">'+icon('plus')+'</button><button class="ghost" data-action="edit-task" data-id="'+esc(t.id)+'" aria-label="Editar tarefa '+esc(t.title)+'" title="Editar tarefa">'+icon('edit')+'</button><button class="ghost danger" data-action="delete-task" data-id="'+esc(t.id)+'" aria-label="Excluir tarefa '+esc(t.title)+'" title="Excluir tarefa">'+icon('trash')+'</button></div></div>';
}).join(''):empty('Tudo tranquilo por aqui','Crie uma tarefa para tirar uma ideia da cabeça.');}
function weeklyRecapCard(recap,assistantName){
 if(!recap)return '';
 const sDate=dateLabel(recap.week.start);
 const eDate=dateLabel(recap.week.end);
 const catEntries=Object.entries(recap.events.categories);
 const catsHtml=catEntries.length?catEntries.map(([cat,count])=>'<span class="pill" style="margin:0;font-size:12px"><strong>'+esc(cat)+'</strong>: '+count+'</span>').join(''):'<span class="muted" style="font-size:13px">Nenhum evento categorizado esta semana.</span>';
 return '<section class="card weekly-recap-card" aria-label="Retrospectiva da semana"><div class="section-head"><div><div class="eyebrow">Retrospectiva da Semana</div><h2>Sua semana em resumo</h2><p class="subheading">'+sDate+' até '+eDate+' · <span class="pill" style="margin:0;font-size:11px">'+esc(recap.productivity.label)+'</span></p></div><div class="row-actions"><button type="button" class="secondary copy-recap-btn" data-action="copy-recap" aria-label="Compartilhar ou copiar resumo da semana" title="Copiar resumo textual para compartilhar">📋 Copiar resumo</button><button type="button" class="ghost" data-action="open-recap-dialog" aria-label="Ver resumo em texto" title="Ver texto da retrospectiva">Ver texto</button></div></div><div class="recap-grid"><div class="recap-stat"><div class="recap-stat-label">Compromissos</div><div class="recap-stat-val">'+recap.events.total+' <small>evento'+(recap.events.total!==1?'s':'')+'</small></div><div class="recap-stat-sub">'+recap.events.totalHours+'h ocupadas ('+recap.events.totalMinutes+' min)</div></div><div class="recap-stat"><div class="recap-stat-label">Afazeres</div><div class="recap-stat-val">'+recap.tasks.completed+' <small>/ '+recap.tasks.total+' feitos</small></div><div class="recap-stat-sub">'+recap.tasks.pending+' pendente'+(recap.tasks.pending!==1?'s':'')+' ('+recap.tasks.completionRate+'% concluído)</div></div><div class="recap-stat"><div class="recap-stat-label">Ritmo da semana</div><div class="recap-stat-val" style="font-size:18px">'+esc(recap.productivity.label)+'</div><div class="recap-stat-sub">'+(recap.tasks.subtasks.total>0?recap.tasks.subtasks.completed+'/'+recap.tasks.subtasks.total+' subtarefas':'Passo a passo no seu ritmo')+'</div></div></div><div style="margin-top:18px"><div style="font-size:13px;font-weight:600;color:var(--muted);margin-bottom:8px">Distribuição de atividades:</div><div class="recap-categories">'+catsHtml+'</div></div><div class="recap-cat-note"><div class="recap-cat-note-icon" aria-hidden="true">🐾</div><div><div class="recap-cat-note-author">'+esc(assistantName)+' diz:</div><div class="recap-cat-note-quote">“'+esc(recap.productivity.message)+'”</div></div></div></section>';
}
function nowView(){const upcoming=state.events.filter(e=>e.date>=today()).sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time)).slice(0,5), pending=state.tasks.filter(t=>!t.done);const recap=D.calculateWeeklyRecap(state,today());return heading('Seu dia, mais leve.',fullDate(today()),'<button data-action="new-event" aria-label="Criar novo evento">'+icon('plus')+' Novo evento</button>')+'<div class="hero"><div><div class="eyebrow">'+esc(state.profile.assistantName)+' está por aqui</div><h2>Um passo de cada vez.</h2><p>Você tem '+pending.length+' tarefa'+(pending.length!==1?'s':'')+' pendente'+(pending.length!==1?'s':'')+'. Vamos cuidar do que importa?</p><button class="hero-action" data-action="go-chat" aria-label="Conversar com '+esc(state.profile.assistantName)+'">Conversar com '+esc(state.profile.assistantName)+' →</button></div>'+C.render(appearance())+'</div><div class="columns"><section class="card" aria-label="Próximos compromissos"><div class="section-head"><h2>Na sua agenda</h2><button class="ghost" data-action="go-calendar" aria-label="Ver agenda completa">Ver agenda →</button></div>'+eventRows(upcoming)+'</section><section class="card" aria-label="Tarefas pendentes"><div class="section-head"><h2>Pequenos passos</h2><button class="ghost" data-action="go-tasks" aria-label="Ver todos os afazeres">Ver todos →</button></div>'+taskRows(pending.slice(0,4))+'</section></div>'+weeklyRecapCard(recap,state.profile.assistantName);}
function proposalCard(p){if(p.status==='executed')return '<div class="proposal"><strong>✓ Ação salva</strong><p>O item já aparece na agenda, afazeres ou memórias.</p></div>';const x=p.payload,needs=p.missingFields.length>0;const typeLabel=p.kind==='create_event'?' · '+Number(x.duration)+' min':p.kind==='create_task'?' · Afazer':' · Nova memória';const subText=p.kind==='create_memory'?(x.content||''):((x.date?dateLabel(x.date):'Data a definir')+(x.time?' · '+esc(x.time):'')+(x.priority&&x.priority!=='normal'?' · Prioridade '+x.priority:''));return '<div class="proposal"><strong>'+esc(x.title||'Revise o título')+'</strong><p>'+esc(subText)+typeLabel+'</p>'+(needs?'<p class="error" role="alert">Complete: '+p.missingFields.map(x=>({date:'data',time:'horário',title:'título',content:'conteúdo'}[x]||x)).join(', ')+'.</p>':'')+'<div class="buttons">'+(!needs?'<button data-action="confirm-proposal" data-key="'+esc(p.key)+'" aria-label="Confirmar proposta: '+esc(x.title||'item')+'">Confirmar</button>':'')+(p.kind==='create_event'?'<button class="secondary" data-action="review-proposal" data-key="'+esc(p.key)+'" aria-label="Revisar proposta: '+esc(x.title||'evento')+'">Revisar campos</button>':'')+'</div></div>';}
function chatView(){return heading('Converse com '+esc(state.profile.assistantName),'Diga o que precisa organizar. Você revisa a proposta antes de salvar.')+'<div class="info" style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap"><span>Assistente de demonstração conectado ao modelo <strong>gemini-3.5-flash-lite</strong>.</span><span class="pill" style="margin:0">IA Ativa</span></div><div class="chat-panel"><div class="chat-list" id="chat-list" role="log" aria-live="polite" aria-label="Histórico de mensagens da conversa">'+state.messages.map(m=>{const isSpeaking=speakingMessageId===m.id;return '<article class="message '+(m.role==='user'?'user':'assistant')+'"><div class="message-head"><small>'+(m.role==='user'?'Você':esc(state.profile.assistantName))+'</small>'+(m.role==='assistant'?'<button type="button" class="ghost speak-btn '+(isSpeaking?'speaking':'')+'" data-action="speak-message" data-msg-id="'+esc(m.id)+'" aria-label="'+(isSpeaking?'Parar áudio da mensagem':'Ouvir resposta')+'" title="'+(isSpeaking?'Parar áudio da mensagem':'Ouvir resposta')+'">'+icon(isSpeaking?'volumeOff':'volume')+(isSpeaking?' Ouvindo…':' Ouvir')+'</button>':'')+'</div>'+esc(m.text)+(m.proposal?proposalCard(m.proposal):'')+'</article>';}).join('')+'</div><div class="chat-hints" role="group" aria-label="Sugestões de comandos rápidos"><button class="secondary" data-action="sample-event">Reunião amanhã às 14h</button><button class="secondary" data-action="sample-task">Criar uma tarefa</button></div><form id="chat-form" class="composer" aria-label="Enviar mensagem ao assistente"><label class="sr-label" for="chat-input">Mensagem para o assistente</label><input id="chat-input" name="message" aria-label="Mensagem para o assistente" maxlength="1500" required placeholder="Ex.: Marque revisão amanhã às 14h…" autocomplete="off"><button type="button" class="icon-button mic-btn '+(isListening?'listening':'')+'" data-action="toggle-mic" aria-label="'+(isListening?'Parar gravação de voz':'Ditar mensagem por voz')+'" title="'+(isListening?'Parar gravação de voz':'Ditar mensagem por voz')+'" aria-pressed="'+(isListening?'true':'false')+'">'+icon(isListening?'micOff':'mic')+'</button><button type="submit" aria-label="Enviar mensagem">Enviar →</button></form></div>';}
function eventOccursOn(e,date){return D.eventOccursOn?D.eventOccursOn(e,date):(e.allDay?e.date<=date&&date<=(e.endDate||e.date):e.date===date);}
function calendarView(){let content='';if(calendarTab==='tasks'){content='<form id="task-form" class="inline-form" aria-label="Criar nova tarefa"><label for="new-task-title">Nova tarefa<input id="new-task-title" name="title" required maxlength="180" placeholder="Uma coisa de cada vez"></label><label for="new-task-due" style="max-width:170px">Prazo opcional<input id="new-task-due" name="due" type="date"></label><button type="submit">Adicionar</button></form><section class="card" aria-label="Lista de afazeres"><h2>Afazeres</h2>'+taskRows(state.tasks)+'</section>';}
else if(calendarTab==='search'){
 const results=D.searchItems(state,searchQuery,{type:searchKind,status:searchStatus});
 const evs=results.filter(r=>r.kind==='event');
 const tsks=results.filter(r=>r.kind==='task');
 content='<section class="card" aria-label="Pesquisa na rotina"><div class="calendar-toolbar" style="flex-wrap:wrap;gap:12px"><h2>Buscar na sua rotina</h2><div style="display:flex;gap:8px;flex:1;min-width:260px"><label class="sr-label" for="search-input">Termo de busca</label><input id="search-input" value="'+esc(searchQuery)+'" placeholder="Pesquisar por título, notas ou data…" aria-label="Pesquisar por título, notas ou data" style="margin:0"><button class="ghost" data-action="clear-search" aria-label="Limpar termo de busca">Limpar</button></div></div><div class="form-row" style="margin-top:14px"><label for="search-kind">Tipo de item<select id="search-kind" aria-label="Filtrar por tipo de item"><option value="all" '+(searchKind==='all'?'selected':'')+'>Todos</option><option value="event" '+(searchKind==='event'?'selected':'')+'>Eventos</option><option value="task" '+(searchKind==='task'?'selected':'')+'>Afazeres</option></select></label><label for="search-status">Status dos afazeres<select id="search-status" aria-label="Filtrar por status dos afazeres"><option value="all" '+(searchStatus==='all'?'selected':'')+'>Todos</option><option value="pending" '+(searchStatus==='pending'?'selected':'')+'>Pendentes</option><option value="done" '+(searchStatus==='done'?'selected':'')+'>Concluídos</option></select></label></div><div style="margin-top:20px" aria-live="polite"><p class="subheading" style="margin-bottom:15px">'+results.length+' resultado(s) encontrado(s)'+(searchQuery?' para “'+esc(searchQuery)+'”':'')+':</p>'+(evs.length?'<h3>Eventos ('+evs.length+')</h3>'+eventRows(evs):'')+(tsks.length?'<h3 style="margin-top:20px">Afazeres ('+tsks.length+')</h3>'+taskRows(tsks):'')+(results.length===0?empty('Nenhum item encontrado','Tente outros termos ou remova os filtros.'):'')+'</div></section>';
}
else{const first=new Date(monthDate+'-01T12:00:00Z'),start=D.addDays(monthDate+'-01',-first.getUTCDay());const weekdays=['domingo','segunda-feira','terça-feira','quarta-feira','quinta-feira','sexta-feira','sábado'];let cells=['D','S','T','Q','Q','S','S'].map((d,i)=>'<div class="weekday" role="columnheader" aria-label="'+weekdays[i]+'"><abbr title="'+weekdays[i]+'">'+d+'</abbr></div>').join('');for(let i=0;i<42;i++){const date=D.addDays(start,i),events=state.events.filter(e=>eventOccursOn(e,date));cells+='<button class="day '+(!date.startsWith(monthDate)?'outside ':'')+(date===today()?'today ':'')+(date===selectedDate?'selected':'')+'" role="gridcell" data-action="select-date" data-date="'+date+'" aria-selected="'+(date===selectedDate?'true':'false')+'" aria-label="'+dateLabel(date)+(date===today()?', hoje':'')+', '+events.length+' evento(s)"><span class="day-number">'+Number(date.slice(-2))+'</span>'+events.slice(0,2).map(e=>'<span class="event-chip">'+(e.allDay?'★ ':esc(e.time)+' ')+(e.recurrence&&e.recurrence!=='none'?'🔁 ':'')+esc(e.title)+'</span>').join('')+'</button>';}
content='<section class="card" aria-label="Visão de calendário"><div class="calendar-toolbar"><button class="secondary" data-action="prev-month" aria-label="Mês anterior">←</button><h2>'+new Intl.DateTimeFormat('pt-BR',{month:'long',year:'numeric',timeZone:'UTC'}).format(first)+'</h2><button class="secondary" data-action="next-month" aria-label="Próximo mês">→</button><button class="ghost" data-action="today" aria-label="Ir para a data de hoje">Hoje</button></div><div class="month-grid" role="grid" aria-label="Grade do mês">'+cells+'</div><div class="calendar-events"><h3>'+fullDate(selectedDate)+'</h3>'+eventRows(state.events.filter(e=>eventOccursOn(e,selectedDate)).sort((a,b)=>(a.allDay?0:1)-(b.allDay?0:1)||(a.time||'').localeCompare(b.time||'')))+'</div></section>';}
return heading('Espaço para seus planos.','Compromissos e afazeres, juntos e organizados.','<button data-action="new-event" aria-label="Criar novo evento">'+icon('plus')+' Novo evento</button>')+'<div class="tabs" role="tablist" aria-label="Seções da agenda"><button role="tab" aria-selected="'+(calendarTab==='calendar')+'" data-action="calendar-tab" data-tab="calendar" class="'+(calendarTab==='calendar'?'active':'')+'">Calendário</button><button role="tab" aria-selected="'+(calendarTab==='tasks')+'" data-action="calendar-tab" data-tab="tasks" class="'+(calendarTab==='tasks'?'active':'')+'">Afazeres <small>'+state.tasks.filter(t=>!t.done).length+'</small></button><button role="tab" aria-selected="'+(calendarTab==='search')+'" data-action="calendar-tab" data-tab="search" class="'+(calendarTab==='search'?'active':'')+'">'+icon('search')+' Busca</button></div>'+content;
}
function actionsView(){const isRecap=actionsTab==='recap',coordination=actionsTab==='coordination';let content='';if(isRecap){const recap=D.calculateWeeklyRecap(state,today());content=weeklyRecapCard(recap,state.profile.assistantName);}else{content='<div class="planned"><section class="card"><span class="actions-card-icon">'+icon('actions')+'</span><h2>'+(coordination?'Encontrar um horário em comum':'Sua próxima rotina')+'</h2><p>'+(coordination?'Um assistente para negociar reuniões por e-mail. O envio e a leitura de mensagens serão conectados em uma etapa futura.':'Resumos, clima e acompanhamentos em horários definidos. Execuções contínuas e pesquisa externa entram depois da base local.')+'</p><span class="pill">Planejado · sem servidor conectado</span><details><summary>O que falta para funcionar?</summary><p>Servidor próprio, agendador, contas autorizadas, histórico de execução e tratamento de falhas. Esta tela é uma prévia de navegação e não executa essas ações.</p></details></section><section class="card"><h2>Primeiro, a base.</h2><p>O protótipo já permite criar eventos e tarefas, conversar em modo demonstração e escolher o seu gato.</p><button class="secondary" data-action="go-chat">Testar o chat →</button><a class="button-link" href="../backlog/Backlog-Implementacao.md">Consultar backlog</a></section></div>';}return heading('Um pouco de ajuda a mais.','O lugar das rotinas que podem trabalhar com você.')+'<div class="tabs" role="tablist" aria-label="Categorias de ações"><button role="tab" aria-selected="'+(actionsTab==='automations')+'" data-action="actions-tab" data-tab="automations" class="'+(actionsTab==='automations'?'active':'')+'">Automações</button><button role="tab" aria-selected="'+(actionsTab==='recap')+'" data-action="actions-tab" data-tab="recap" class="'+(actionsTab==='recap'?'active':'')+'">Retrospectiva</button><button role="tab" aria-selected="'+(actionsTab==='coordination')+'" data-action="actions-tab" data-tab="coordination" class="'+(actionsTab==='coordination'?'active':'')+'">Coordenação</button></div>'+content;}
function catEditor(){return '<div class="settings-layout"><aside class="cat-preview" aria-label="Prévia do gato"><div id="cat-preview">'+C.render(appearance(appearanceDraft))+'</div><div><h3>'+esc(state.profile.assistantName)+'</h3><p>Um gato do seu jeito.<br>72 combinações possíveis.</p><label class="state-selector" for="preview-state">Prévia de expressão<select id="preview-state" aria-label="Expressão do gato para teste">'+C.states.map(s=>'<option value="'+s+'">'+({idle:'Neutro',listening:'Ouvindo — prévia',thinking:'Pensando — prévia',speaking:'Falando — prévia',success:'Sucesso',error:'Atenção',offline:'Offline'}[s])+'</option>').join('')+'</select></label></div></aside><section aria-label="Personalização visual"><h2>Escolha sua companhia.</h2><p class="subheading">Troque a pelagem sem perder os acessórios.</p><div class="cat-grid" role="group" aria-label="Opções de pelagem">'+Object.entries(C.coats).map(([key,c])=>'<button class="cat-choice" data-action="coat" data-coat="'+key+'" aria-pressed="'+(appearanceDraft.coat===key)+'" aria-label="Pelagem: '+c.label+'">'+C.render({...appearanceDraft,coat:key})+c.label+'</button>').join('')+'</div><div class="form-row"><label for="outfit">Roupa<select id="outfit" aria-label="Roupa do gato">'+Object.entries(C.outfits).map(([key,v])=>'<option value="'+key+'" '+(appearanceDraft.outfit===key?'selected':'')+'>'+v+'</option>').join('')+'</select></label><label for="glasses">Óculos<select id="glasses" aria-label="Óculos do gato">'+Object.entries(C.glasses).map(([key,v])=>'<option value="'+key+'" '+(appearanceDraft.glasses===key?'selected':'')+'>'+v+'</option>').join('')+'</select></label></div><div class="settings-actions"><button data-action="save-cat">Salvar meu gato</button><button class="secondary" data-action="cancel-cat">Descartar alterações</button><button class="ghost" data-action="download-cat">Baixar SVG</button></div><p class="status-line">Aparência, nome e personalidade são independentes. Nenhuma troca apaga seu histórico.</p></section></div>';}
function memoryView(){return '<section class="card" aria-label="Memórias locais"><h2>O que vale lembrar.</h2><p class="subheading">Memórias manuais ficam neste aparelho. O assistente de demonstração não as envia a um serviço externo.</p><form id="memory-form" style="margin-top:22px" aria-label="Adicionar nova memória"><label for="memory-title">Título<input id="memory-title" name="title" maxlength="120" required placeholder="Ex.: preferência de horário"></label><label for="memory-content">Detalhes<textarea id="memory-content" name="content" maxlength="2000" rows="3" required placeholder="Gosto de reuniões depois das 10h."></textarea></label><button type="submit">Salvar memória</button></form><div style="margin-top:25px">'+(state.memories.length?state.memories.map(m=>'<div class="memory"><h3>'+esc(m.title)+'</h3><p>'+esc(m.content)+'</p><button class="ghost danger" data-action="delete-memory" data-id="'+esc(m.id)+'" aria-label="Excluir memória: '+esc(m.title)+'">Excluir memória</button></div>').join(''):empty('Conhecendo você aos poucos','Adicione uma preferência quando fizer sentido.'))+'</div></section>';}
function settingsView(){const themeOptions=[['dark','Escuro (Padrão do app)'],['light','Claro (Minimalista White)'],['minimalist','Minimalismo Preto & Branco'],['glassmorphism','Glassmorphism (Vidro Fosco)'],['nord','Nordic Frost (Azul Ártico)'],['cyberpunk','Cyberpunk Neon'],['retro','Retrô Vintage (Tons Terrosos)'],['system','Automático (Do sistema)']];return '<section class="card" aria-label="Preferências do sistema"><h2>Seu espaço pessoal.</h2><form id="settings-form" style="margin-top:24px" aria-label="Formulário de preferências"><div class="form-row"><label for="profile-name">Como podemos chamar você?<input id="profile-name" name="name" value="'+esc(state.profile.name)+'" maxlength="80" required></label><label for="profile-assistant-name">Nome do assistente<input id="profile-assistant-name" name="assistantName" value="'+esc(state.profile.assistantName)+'" maxlength="60" required></label></div><label for="profile-theme">Tema da Interface<select id="profile-theme" name="theme">'+themeOptions.map(([k,v])=>'<option value="'+k+'" '+(state.theme===k?'selected':'')+'>'+v+'</option>').join('')+'</select></label><label style="display:flex;align-items:center;gap:8px;cursor:pointer;margin-top:14px"><input type="checkbox" name="autoSpeak" '+(state.autoSpeak?'checked':'')+'> Reproduzir respostas em voz alta automaticamente (síntese de fala)</label><p class="info">Fuso do protótipo: America/Sao_Paulo. Entrada e reprodução de voz utilizam a Web Speech API nativa do navegador.</p><button type="submit">Salvar preferências</button></form></section>';}
function dataView(){return '<section class="card" aria-label="Gerenciamento de dados"><h2>Seus dados acompanham você.</h2><p class="subheading">Armazenamento atual: '+esc(S.getMode())+'. Exporte um backup para guardar uma cópia independente do navegador.</p><div class="backup-actions" style="margin-top:25px"><button data-action="export-backup">Exportar backup JSON</button><button class="secondary" data-action="import-backup">Importar backup</button></div><div class="info">Importar substitui os dados locais depois de validar o arquivo e pedir sua confirmação.</div><a class="button-link" href="../docs/Instalacao-e-Execucao.md">Como executar e contribuir</a></section>';}
function trashView(){const items=state.trash||[];return '<section class="card" aria-label="Lixeira e itens excluídos"><div class="section-head"><div><h2>Lixeira e recuperação</h2><p class="subheading">Itens removidos ficam aqui. Você pode restaurar ou apagar definitivamente.</p></div>'+(items.length?'<button class="ghost danger" data-action="empty-trash" aria-label="Esvaziar toda a lixeira">Esvaziar lixeira</button>':'')+'</div><div style="margin-top:20px">'+(items.length?items.map(it=>'<div class="event-row"><div class="event-time">'+(it.kind==='event'?'Evento':'Afazer')+'</div><div><h3>'+esc(it.item.title)+'</h3><p>Excluído em '+dateLabel(it.deletedAt.slice(0,10))+'</p></div><div class="row-actions"><button class="secondary" data-action="restore-trash" data-trash-id="'+esc(it.id)+'" aria-label="Restaurar: '+esc(it.item.title)+'">Restaurar</button><button class="ghost danger" data-action="purge-trash" data-trash-id="'+esc(it.id)+'" aria-label="Excluir de vez: '+esc(it.item.title)+'">Excluir de vez</button></div></div>').join(''):empty('Lixeira vazia','Nenhum item foi excluído recentemente.'))+'</div></section>';}
function meView(){const tabs=[['cat','Meu gato'],['memory','Memórias'],['settings','Preferências'],['data','Dados'],['trash','Lixeira <small>'+(state.trash||[]).length+'</small>']];return heading('Um assistente com a sua cara.','Escolhas pequenas que deixam a rotina mais sua.')+'<div class="tabs" role="tablist" aria-label="Opções de personalização">'+tabs.map(([k,v])=>'<button role="tab" aria-selected="'+(profileTab===k)+'" data-action="profile-tab" data-tab="'+k+'" class="'+(profileTab===k?'active':'')+'">'+v+'</button>').join('')+'</div>'+({cat:catEditor,memory:memoryView,settings:settingsView,data:dataView,trash:trashView}[profileTab])();}
function render(){applyTheme();$('#app').innerHTML='<div class="shell"><aside class="sidebar"><div class="brand">'+C.render(appearance())+'<span>Assistente Gato</span></div><nav class="nav" aria-label="Navegação principal">'+navs.map(([key,label])=>'<button data-action="navigate" data-tab="'+key+'" class="'+(state.tab===key?'active':'')+'" '+(state.tab===key?'aria-current="page"':'')+' aria-label="'+label+'">'+icon(key)+'<span>'+label+'</span></button>').join('')+'</nav><div class="side-note">Seu ritmo. Sua companhia.<br>Gratuito · código aberto<br>Protótipo v2 · dados locais</div></aside><main id="content" tabindex="-1"><header class="topbar"><span class="pill">Local · demonstração</span><button class="profile-button" data-action="go-profile" aria-label="Perfil do assistente: '+esc(state.profile.assistantName)+'">'+C.render(appearance())+'<span>'+esc(state.profile.assistantName)+'</span></button></header>'+({now:nowView,chat:chatView,calendar:calendarView,actions:actionsView,me:meView}[state.tab]||nowView)()+'<p class="footer-label">'+(S.getMode()==='memory'?'Armazenamento indisponível: alterações somente nesta sessão.':'Salvo neste navegador · '+esc(S.getMode()))+' · Sem servidor conectado</p></main></div>';
try{const titles={chat:'Chat',now:'Agora',calendar:calendarTab==='tasks'?'Afazeres':calendarTab==='search'?'Busca':'Agenda',actions:actionsTab==='recap'?'Retrospectiva':actionsTab==='coordination'?'Coordenação':'Ações',me:profileTab==='memory'?'Memórias':profileTab==='settings'?'Preferências':profileTab==='data'?'Dados':profileTab==='trash'?'Lixeira':'Meu gato'};document.title=(titles[state.tab]||'Assistente Gato')+' — Assistente Gato';}catch{}}
function openEditor(e={},proposalKey=''){const form=$('#event-form');form.reset();form.elements.id.value=e.id||'';form.elements.proposalKey.value=proposalKey;form.elements.title.value=e.title||'';form.elements.allDay.checked=Boolean(e.allDay);form.elements.date.value=e.date||selectedDate;form.elements.endDate.value=e.endDate||e.date||selectedDate;form.elements.time.value=e.time||'09:00';form.elements.duration.value=e.duration||60;form.elements.notes.value=e.notes||'';if(form.elements.recurrence)form.elements.recurrence.value=e.recurrence||'none';const isAllDay=Boolean(e.allDay);$('#end-date-wrapper').style.display=isAllDay?'block':'none';$('#time-wrapper').style.display=isAllDay?'none':'block';$('#duration-wrapper').style.display=isAllDay?'none':'block';form.elements.time.required=!isAllDay;form.elements.duration.required=!isAllDay;$('#editor-title').textContent=e.id?'Editar evento':proposalKey?'Revisar proposta':'Novo evento';$('#editor-error').textContent='';$('#editor').showModal();form.elements.title.focus();}
function openTaskEditor(t={}){const form=$('#task-edit-form');if(!form)return;form.reset();form.elements.id.value=t.id||'';form.elements.title.value=t.title||'';form.elements.due.value=t.due||'';form.elements.priority.value=t.priority||'normal';if(form.elements.repeatAmount)form.elements.repeatAmount.value=(t.repeatAfter&&t.repeatAfter.amount)?t.repeatAfter.amount:'';if(form.elements.repeatUnit)form.elements.repeatUnit.value=(t.repeatAfter&&t.repeatAfter.unit)?t.repeatAfter.unit:'';$('#task-editor-title').textContent='Editar tarefa';$('#task-editor-error').textContent='';$('#task-editor').showModal();form.elements.title.focus();}
function download(name,content,type){const url=URL.createObjectURL(new Blob([content],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function findProposal(key){return state.messages.find(m=>m.proposal?.key===key)?.proposal;}
async function dispatch(button){const action=button.dataset.action,id=button.dataset.id;
 if(action==='navigate'){if(button.dataset.tab!=='chat'){if(isListening&&recognition){try{recognition.stop();}catch{}isListening=false;}stopSpeech();}await update(s=>({...s,tab:button.dataset.tab}));return;}
 if(['go-chat','go-calendar','go-tasks','go-profile'].includes(action)){if(action!=='go-chat'){if(isListening&&recognition){try{recognition.stop();}catch{}isListening=false;}stopSpeech();}if(action==='go-tasks')calendarTab='tasks';if(action==='go-profile')profileTab='cat';await update(s=>({...s,tab:action==='go-chat'?'chat':action==='go-profile'?'me':'calendar'}));return;}
 if(action==='calendar-tab'){calendarTab=button.dataset.tab;render();return;}
 if(action==='profile-tab'){profileTab=button.dataset.tab;render();return;}
 if(action==='actions-tab'){actionsTab=button.dataset.tab;render();return;}
 if(action==='toggle-mic'){toggleRecognition();return;}
 if(action==='speak-message'){const msg=state.messages.find(m=>m.id===button.dataset.msgId);if(msg)toggleSpeech(msg.text,msg.id);return;}
 if(action==='new-event'){openEditor();return;}
 if(action==='edit-event'){openEditor(state.events.find(e=>e.id===id));return;}
 if(action==='close-dialog'){$('#editor').close();return;}
 if(action==='edit-task'){openTaskEditor(state.tasks.find(t=>t.id===id));return;}
 if(action==='close-task-dialog'){$('#task-editor').close();return;}
 if(action==='delete-event'){const e=state.events.find(e=>e.id===id);if(e&&confirm('Excluir “'+e.title+'”?')){await update(s=>({...s,events:s.events.filter(e=>e.id!==id),trash:[...(s.trash||[]),{id:uid(),kind:'event',deletedAt:new Date().toISOString(),item:e}]}));toast('Evento movido para a lixeira.');}return;}
 if(action==='toggle-task'){
  const targetTask=state.tasks.find(t=>t.id===id);
  if(!targetTask)return;
  if(!targetTask.done){
   if(targetTask.repeatAfter&&targetTask.repeatAfter.unit){
    let spawned=null;
    await update(s=>{
     const res=D.completeTaskWithRepeat(s.tasks,id,{
      completionDate:today(),
      newId:uid(),
      generateSubtaskId:()=>uid()
     });
     spawned=res.nextTask;
     return {...s,tasks:res.tasks};
    });
    if(spawned){
     const amt=Number(targetTask.repeatAfter.amount)||1;
     const unitPlural={days:'dias',weeks:'semanas',months:'meses'}[targetTask.repeatAfter.unit]||targetTask.repeatAfter.unit;
     const unitSingular={days:'dia',weeks:'semana',months:'mês'}[targetTask.repeatAfter.unit]||targetTask.repeatAfter.unit;
     const u=amt===1?unitSingular:unitPlural;
     toast('Tarefa concluída! Próxima ocorrência agendada para '+dateLabel(spawned.due)+' (repetir após '+amt+' '+u+').');
    }else{
     toast('Tarefa concluída.');
    }
    return;
   }
   await update(s=>({...s,tasks:s.tasks.map(t=>t.id===id?{...t,done:true,completedAt:today()}:t)}));
   toast('Tarefa atualizada. Clique novamente para desfazer.');
   return;
  }
  await update(s=>({...s,tasks:s.tasks.map(t=>t.id===id?{...t,done:false,completedAt:null}:t)}));
  toast('Tarefa reaberta.');
  return;
 }
 if(action==='toggle-subtask'){const taskId=button.dataset.taskId,subId=button.dataset.subId;await update(s=>({...s,tasks:s.tasks.map(t=>t.id===taskId?{...t,subtasks:(t.subtasks||[]).map(sub=>sub.id===subId?{...sub,done:!sub.done}:sub)}:t)}));return;}
 if(action==='delete-subtask'){const taskId=button.dataset.taskId,subId=button.dataset.subId;await update(s=>({...s,tasks:s.tasks.map(t=>t.id===taskId?{...t,subtasks:(t.subtasks||[]).filter(sub=>sub.id!==subId)}:t)}));toast('Subtarefa removida.');return;}
 if(action==='add-subtask-prompt'){const t=state.tasks.find(t=>t.id===id);if(!t)return;const subTitle=prompt('Título da subtarefa para “'+t.title+'”:');if(!subTitle||!subTitle.trim())return;await update(s=>({...s,tasks:s.tasks.map(x=>x.id===id?{...x,subtasks:[...(x.subtasks||[]),{id:uid(),title:subTitle.trim(),done:false}]}:x)}));toast('Subtarefa adicionada.');return;}
 if(action==='delete-task'){const t=state.tasks.find(t=>t.id===id);if(t&&confirm('Excluir esta tarefa?')){await update(s=>({...s,tasks:s.tasks.filter(t=>t.id!==id),trash:[...(s.trash||[]),{id:uid(),kind:'task',deletedAt:new Date().toISOString(),item:t}]}));toast('Tarefa movida para a lixeira.');}return;}
 if(action==='restore-trash'){const trashId=button.dataset.trashId;const entry=(state.trash||[]).find(it=>it.id===trashId);if(!entry)return;await update(s=>{const next={...s,trash:s.trash.filter(it=>it.id!==trashId)};if(entry.kind==='event')next.events=[...next.events,entry.item];else next.tasks=[...next.tasks,entry.item];return next;});toast('Item restaurado com sucesso.');return;}
 if(action==='purge-trash'){const trashId=button.dataset.trashId;if(confirm('Excluir definitivamente este item?')){await update(s=>({...s,trash:s.trash.filter(it=>it.id!==trashId)}));toast('Item excluído permanentemente.');}return;}
 if(action==='empty-trash'){if(confirm('Esvaziar toda a lixeira?')){await update(s=>({...s,trash:[]}));toast('Lixeira esvaziada.');}return;}
 if(action==='select-date'){selectedDate=button.dataset.date;render();return;}
 if(action==='today'){selectedDate=today();monthDate=today().slice(0,7);render();return;}
 if(action==='next-month'||action==='prev-month'){const date=new Date(monthDate+'-01T12:00:00Z');date.setUTCMonth(date.getUTCMonth()+(action==='next-month'?1:-1));monthDate=date.toISOString().slice(0,7);render();return;}
 if(action==='sample-event'||action==='sample-task'){$('#chat-input').value=action==='sample-event'?'Marque revisão do projeto amanhã às 14h por 45 minutos':'Crie tarefa revisar proposta';$('#chat-input').focus();return;}
 if(action==='coat'){appearanceDraft={...appearanceDraft,coat:button.dataset.coat};render();return;}
 if(action==='save-cat'){const saved=C.normalize(appearanceDraft);await update(s=>({...s,appearance:saved}));toast('Seu gato foi salvo.');return;}
 if(action==='cancel-cat'){appearanceDraft=C.normalize(state.appearance);render();toast('Alterações descartadas.');return;}
 if(action==='download-cat'){download('meu-gato.svg',C.render(appearanceDraft),'image/svg+xml');return;}
 if(action==='confirm-proposal'){const p=findProposal(button.dataset.key);if(!p)return;let duplicated=false;await update(s=>{const result=D.executeProposal(s,p,uid());duplicated=result.duplicate;return result.state;});toast(duplicated?'Essa proposta já foi salva.':'Pronto. Seu item foi salvo.');return;}
 if(action==='review-proposal'){const p=findProposal(button.dataset.key);if(p)openEditor(p.payload,p.key);return;}
 if(action==='delete-memory'){if(confirm('Excluir esta memória?'))await update(s=>({...s,memories:s.memories.filter(m=>m.id!==id)}));return;}
 if(action==='export-backup'){download('assistente-gato-backup.json',JSON.stringify(state,null,2),'application/json');toast('Backup exportado.');return;}
 if(action==='import-backup'){$('#backup-file').click();return;}
 if(action==='clear-search'){searchQuery='';render();return;}
 if(action==='toggle-mic'){isListening=!isListening;render();return;}
 if(action==='speak-message'){const msgId=button.dataset.msgId;speakingMessageId=speakingMessageId===msgId?null:msgId;render();return;}
 if(action==='copy-recap'){
  const recap=D.calculateWeeklyRecap(state,today());
  const text=recap?recap.summaryText:'';
  let copied=false;
  if(typeof navigator!=='undefined'&&navigator.clipboard&&typeof navigator.clipboard.writeText==='function'){
   try{await navigator.clipboard.writeText(text);copied=true;}catch{}
  }
  if(!copied&&typeof document!=='undefined'&&document.body&&typeof document.body.appendChild==='function'){
   try{
    const ta=document.createElement('textarea');
    ta.value=text;
    ta.style.position='fixed';
    ta.style.opacity='0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    copied=true;
   }catch{}
  }
  toast(copied?'Resumo semanal copiado para a área de transferência!':'Resumo semanal gerado!');
  return;
 }
 if(action==='open-recap-dialog'){
  const recap=D.calculateWeeklyRecap(state,today());
  const dlg=$('#recap-dialog');
  const cnt=$('#recap-dialog-content');
  if(dlg&&cnt){
   cnt.textContent=recap?recap.summaryText:'Nenhum dado na retrospectiva.';
   dlg.showModal();
  }
  return;
 }
 if(action==='close-recap-dialog'){
  const dlg=$('#recap-dialog');
  if(dlg)dlg.close();
  return;
 }
}
document.addEventListener('click',event=>{const button=event.target.closest('[data-action]');if(button)dispatch(button).catch(e=>toast(e.message));});
document.addEventListener('input',event=>{if(event.target.id==='search-input'){searchQuery=event.target.value;render();}});
document.addEventListener('change',event=>{if(event.target.id==='search-kind'){searchKind=event.target.value;render();}if(event.target.id==='search-status'){searchStatus=event.target.value;render();}if(event.target.id==='outfit'||event.target.id==='glasses'){appearanceDraft={...appearanceDraft,[event.target.id]:event.target.value};$('#cat-preview').innerHTML=C.render(appearance(appearanceDraft));}if(event.target.id==='preview-state')$('#cat-preview').innerHTML=C.render({...appearance(appearanceDraft),state:event.target.value});if(event.target.id==='event-allday'){const isAllDay=event.target.checked;$('#end-date-wrapper').style.display=isAllDay?'block':'none';$('#time-wrapper').style.display=isAllDay?'none':'block';$('#duration-wrapper').style.display=isAllDay?'none':'block';const form=$('#event-form');if(form){form.elements.time.required=!isAllDay;form.elements.duration.required=!isAllDay;if(isAllDay&&!form.elements.endDate.value)form.elements.endDate.value=form.elements.date.value;}}});
document.addEventListener('submit',async event=>{event.preventDefault();const form=event.target,data=new FormData(form);try{
 if(form.id==='chat-form'){
  if(isListening&&recognition){try{recognition.stop();}catch{}isListening=false;}
  const text=String(data.get('message')).trim();
  if(!text)return;
  const userMsg={id:uid(),role:'user',text};
  const thinkingId=uid();
  const thinkingMsg={id:thinkingId,role:'assistant',text:'Pensando...',isThinking:true};
  await update(s=>({...s,messages:[...s.messages,userMsg,thinkingMsg].slice(-500)}));
  $('#chat-input').value='';
  $('#chat-input')?.focus();
  $('#chat-list')?.lastElementChild?.scrollIntoView({block:'nearest'});
  let replyText='Não consegui processar a resposta no momento. Como posso ajudar você?';
  let proposal=null;
  if(typeof GatoAI!=='undefined'&&GatoAI.generateChatResponse){
   try{
    const aiResult=await GatoAI.generateChatResponse(text,{assistantName:state.profile.assistantName,userName:state.profile.name,today:today(),timeZone:'America/Sao_Paulo',memories:state.memories||[]});
    replyText=aiResult.reply||'Como posso ajudar você?';
    if(aiResult.action&&aiResult.action.kind!=='none'){
     const act=aiResult.action,isEvent=act.kind==='create_event',isMemory=act.kind==='create_memory',missing=[];
     if(!act.title)missing.push('title');
     if(isEvent&&!act.date)missing.push('date');
     if(isEvent&&!act.time)missing.push('time');
     if(isMemory&&!act.content)missing.push('content');
     proposal={kind:act.kind,payload:{title:act.title||text,content:act.content||'',date:act.date||today(),time:act.time?(act.time.slice(0,5)):'09:00',duration:Number(act.duration)||60},missingFields:missing,status:'needs_review',key:uid()};
    }
   }catch(err){
    console.error('Erro na chamada Gemini:',err);
    toast('Aviso IA: '+(err.message||'Falha de conexão com Gemini. Usando resposta local.'));
    const parsed=D.parseCommand(text,{now:new Date(),timeZone:'America/Sao_Paulo'});
    replyText=parsed.kind==='unsupported'?parsed.reason:'Preparei uma proposta. Confira os dados antes de confirmar.';
    if(parsed.kind!=='unsupported')proposal={...parsed,key:uid()};
   }
  }else{
   const parsed=D.parseCommand(text,{now:new Date(),timeZone:'America/Sao_Paulo'});
   replyText=parsed.kind==='unsupported'?parsed.reason:'Preparei uma proposta. Confira os dados antes de confirmar.';
   if(parsed.kind!=='unsupported')proposal={...parsed,key:uid()};
  }
  const finalReplyMsg={id:thinkingId,role:'assistant',text:replyText,proposal};
  await update(s=>({...s,messages:s.messages.map(m=>m.id===thinkingId?finalReplyMsg:m)}));
  $('#chat-list')?.lastElementChild?.scrollIntoView({block:'nearest'});
  if(state.autoSpeak)toggleSpeech(finalReplyMsg.text,finalReplyMsg.id);
 }
 if(form.id==='event-form'){const allDay=Boolean(data.get('allDay'));const recurrence=String(data.get('recurrence')||'none');const e={id:String(data.get('id'))||uid(),title:String(data.get('title')).trim(),date:String(data.get('date')),endDate:allDay?(String(data.get('endDate'))||String(data.get('date'))):String(data.get('date')),allDay,time:allDay?'':String(data.get('time')),duration:allDay?1440:Number(data.get('duration')),recurrence,notes:String(data.get('notes')).trim()};const error=D.validateEvent(e);if(error)throw Error(error);const key=String(data.get('proposalKey')||'');const overlap=D.conflicts(state.events,e);await update(s=>{if(key){const p=findProposal(key);if(!p)throw Error('Proposta não encontrada.');const result=D.executeProposal(s,{...p,payload:e,missingFields:[]},e.id);if(!result.duplicate)result.state.events=result.state.events.map(x=>x.id===e.id?e:x);return result.state;}return {...s,events:[...s.events.filter(x=>x.id!==e.id),e]};});$('#editor').close();toast(overlap.length?'Evento salvo. Há sobreposição com '+overlap.length+' compromisso(s).':'Evento salvo na agenda.');}
 if(form.id==='task-form'){const title=String(data.get('title')).trim(),due=String(data.get('due'));if(!title)return;await update(s=>({...s,tasks:[...s.tasks,{id:uid(),title,due,done:false}]}));toast('Tarefa adicionada.');}
 if(form.id==='task-edit-form'){const id=String(data.get('id')),title=String(data.get('title')).trim(),due=String(data.get('due')),priority=String(data.get('priority')||'normal');if(!title)throw Error('Informe o título.');if(due&&!D.validDate(due))throw Error('Informe uma data válida.');let repeatAfter=null;const repeatUnit=String(data.get('repeatUnit')||'').trim();const rawAmount=data.get('repeatAmount');if(repeatUnit){const amount=Number(rawAmount)||1;if(amount<1||amount>365)throw Error('Intervalo de repetição inválido (use de 1 a 365).');repeatAfter={unit:repeatUnit,amount};}else if(rawAmount&&Number(rawAmount)>0){repeatAfter={unit:'days',amount:Number(rawAmount)};}await update(s=>({...s,tasks:s.tasks.map(t=>t.id===id?{...t,title,due,priority,repeatAfter}:t)}));$('#task-editor').close();toast('Tarefa atualizada.');}
 if(form.id==='settings-form'){await update(s=>({...s,profile:{name:String(data.get('name')).trim(),assistantName:String(data.get('assistantName')).trim()},theme:String(data.get('theme')),autoSpeak:Boolean(data.get('autoSpeak'))}));toast('Preferências salvas.');}
 if(form.id==='memory-form'){const title=String(data.get('title')).trim(),content=String(data.get('content')).trim();if(!title||!content)return;await update(s=>({...s,memories:[...s.memories,{id:uid(),title,content}]}));toast('Memória salva.');}
}catch(e){if(form.id==='event-form')$('#editor-error').textContent=e.message;else if(form.id==='task-edit-form')$('#task-editor-error').textContent=e.message;else toast(e.message);}});
$('#backup-file').addEventListener('change',async event=>{const file=event.target.files?.[0];if(!file)return;try{if(file.size>5*1024*1024)throw Error('Use um backup de até 5 MB.');const data=D.validateBackup(JSON.parse(await file.text()));if(!confirm('Substituir os dados atuais por este backup?'))return;data.appearance=C.normalize(data.appearance);await update(()=>data);appearanceDraft=C.normalize(state.appearance);toast('Backup importado.');}catch(e){toast('Importação recusada: '+e.message);}finally{event.target.value='';}});
matchMedia('(prefers-color-scheme:dark)').addEventListener('change',()=>{if(state.theme==='system')render();});
render();
})();
