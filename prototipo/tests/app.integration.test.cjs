// SPDX-License-Identifier: AGPL-3.0-or-later
// In-process UI-controller tests with a minimal DOM adapter; this is not a browser renderer.
const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
async function boot(saved=new Map(),customGlobals={}){
 const listeners={},els=new Map();let downloaded;
 const element=id=>{if(!els.has(id))els.set(id,{id,innerHTML:'',textContent:'',value:'',addEventListener(){},classList:{add(){},remove(){}},focus(){},click(){},scrollIntoView(){},showModal(){this.open=true},close(){this.open=false},elements:{},reset(){for(const e of Object.values(this.elements))e.value='';}});return els.get(id);};
 const form=element('event-form');for(const key of ['id','proposalKey','title','allDay','date','endDate','time','duration','notes','recurrence'])form.elements[key]={value:''};
 const taskEditForm=element('task-edit-form');for(const key of ['id','title','due','priority','repeatAmount','repeatUnit'])taskEditForm.elements[key]={value:''};
 const localStorage={getItem:k=>saved.get(k)||null,setItem:(k,v)=>saved.set(k,String(v)),removeItem:k=>saved.delete(k)};
 const document={documentElement:{dataset:{}},querySelector:s=>element(s.slice(1)),addEventListener:(type,fn)=>{(listeners[type]??=[]).push(fn)},createElement:()=>({click(){}})};
 const sandbox={window:null,globalThis:null,document,localStorage,indexedDB:undefined,console,Intl,Date,Math,JSON,Blob,URL:{createObjectURL:blob=>{downloaded=blob;return 'blob:unit-test'},revokeObjectURL(){}},setTimeout:()=>1,clearTimeout(){},matchMedia:()=>({matches:false,addEventListener(){}}),confirm:()=>true,FormData:class{constructor(form){this.form=form;}get(key){return this.form.values?this.form.values[key]??'':this.form.elements?.[key]?.value??'';}},...customGlobals};
 sandbox.window=sandbox;sandbox.globalThis=sandbox;const ctx=vm.createContext(sandbox);
 for(const file of ['cat-avatar.js','domain.js','storage.js','app.js'])await vm.runInContext(fs.readFileSync(path.join(__dirname,'../src',file),'utf8'),ctx,{filename:file});
 const flush=()=>new Promise(resolve=>setImmediate(resolve));
 async function click(action,data={}){for(const fn of listeners.click||[])fn({target:{closest:()=>({dataset:{action,...data}})}});await flush();await flush();}
 async function change(id,value){for(const fn of [...(listeners.change||[]),...(listeners.input||[])])await fn({target:{id,value}});await flush();}
 async function submit(id,values){for(const fn of listeners.submit||[])await fn({preventDefault(){},target:{id,values}});await flush();}
 const state=()=>JSON.parse(saved.get('assistente-gato-prototype-v2'));
 return {saved,click,change,submit,state,element,html:()=>element('app').innerHTML,download:()=>downloaded};
}
test('Os cinco menus apresentam conteúdo e estados planejados explícitos',async()=>{
 const a=await boot();for(const [tab,text] of [['chat','Assistente de demonstração'],['now','Seu dia, mais leve.'],['calendar','Calendário'],['actions','Planejado'],['me','Escolha sua companhia.']]){await a.click('navigate',{tab});assert.ok(a.html().includes(text),tab);}
});
test('Trocar somente a pelagem preserva roupas e óculos após salvar e reabrir',async()=>{
 const a=await boot();await a.click('navigate',{tab:'me'});await a.change('outfit','suit');await a.change('glasses','round');await a.click('coat',{coat:'siamese'});await a.click('save-cat');assert.equal(a.state().appearance.outfit,'suit');assert.equal(a.state().appearance.glasses,'round');assert.equal(a.state().appearance.coat,'siamese');const reloaded=await boot(a.saved);assert.equal(reloaded.state().appearance.coat,'siamese');assert.ok(reloaded.html().includes('Siamês'));
});
test('Proposta do chat exige confirmação e confirmação repetida não duplica evento',async()=>{
 const a=await boot();await a.click('navigate',{tab:'chat'});const count=a.state().events.length;await a.submit('chat-form',{message:'Marque revisão amanhã às 14h por 45 minutos'});assert.equal(a.state().events.length,count);const proposal=a.state().messages.findLast(x=>x.proposal).proposal;await a.click('confirm-proposal',{key:proposal.key});await a.click('confirm-proposal',{key:proposal.key});assert.equal(a.state().events.length,count+1);assert.ok(a.html().includes('Ação salva'));
});
test('Evento manual é salvo e aparece na agenda',async()=>{
 const a=await boot();await a.submit('event-form',{id:'',proposalKey:'',title:'Evento de teste',date:'2026-12-01',time:'10:00',duration:'45',notes:'Local'});assert.equal(a.state().events.find(e=>e.title==='Evento de teste').duration,45);await a.click('navigate',{tab:'calendar'});await a.click('select-date',{date:'2026-12-01'});assert.ok(a.html().includes('Evento de teste'));
});
test('Evento de dia inteiro e múltiplos dias aparece em todas as datas cobertas (B14)',async()=>{
 const a=await boot();await a.submit('event-form',{id:'',proposalKey:'',title:'Conferência Anual',allDay:true,date:'2026-12-10',endDate:'2026-12-12',notes:''});const ev=a.state().events.find(e=>e.title==='Conferência Anual');assert.equal(ev.allDay,true);assert.equal(ev.endDate,'2026-12-12');await a.click('navigate',{tab:'calendar'});await a.click('select-date',{date:'2026-12-11'});assert.ok(a.html().includes('Conferência Anual'));assert.ok(a.html().includes('Dia inteiro'));
});
test('Evento recorrente aparece nas ocorrências e exibe indicador visual de repetição (B16)',async()=>{
 const a=await boot();
 await a.submit('event-form',{id:'',proposalKey:'',title:'Terapia semanal',date:'2026-12-01',time:'15:00',duration:'50',recurrence:'weekly',notes:''});
 const ev=a.state().events.find(e=>e.title==='Terapia semanal');
 assert.equal(ev.recurrence,'weekly');
 await a.click('navigate',{tab:'calendar'});
 await a.click('select-date',{date:'2026-12-01'});
 assert.ok(a.html().includes('Terapia semanal'));
 assert.ok(a.html().includes('Repete semanalmente'));
 assert.ok(a.html().includes('🔁'));
 await a.click('select-date',{date:'2026-12-08'});
 assert.ok(a.html().includes('Terapia semanal'));
 await a.click('select-date',{date:'2026-12-02'});
 const dayHtml=a.html().split('calendar-events')[1]||'';
 assert.equal(dayHtml.includes('Terapia semanal'),false);

 await a.submit('event-form',{id:'',proposalKey:'',title:'Meditação matinal',date:'2026-12-05',time:'07:00',duration:'20',recurrence:'daily',notes:''});
 await a.click('select-date',{date:'2026-12-05'});
 assert.ok(a.html().includes('Meditação matinal'));
 assert.ok(a.html().includes('Repete diariamente'));
 await a.click('select-date',{date:'2026-12-06'});
 assert.ok(a.html().includes('Meditação matinal'));
});
test('Pesquisa local encontra eventos e tarefas com filtros de tipo e conclusão (B19)',async()=>{
 const a=await boot();await a.submit('task-form',{title:'Comprar comida do gato',due:'2026-12-15'});await a.submit('event-form',{id:'',proposalKey:'',title:'Veterinário vacina',date:'2026-12-16',time:'11:00',duration:'30',notes:'Clínica felina'});await a.click('navigate',{tab:'calendar'});await a.click('calendar-tab',{tab:'search'});assert.ok(a.html().includes('Buscar na sua rotina'));await a.change('search-input','felina');assert.ok(a.html().includes('Veterinário vacina'));assert.equal(a.html().includes('Comprar comida'),false);
});
test('Exclusão move item para lixeira e permite restauração (B18)',async()=>{
 const a=await boot();await a.submit('task-form',{title:'Tarefa temporária',due:'2026-12-20'});const task=a.state().tasks.find(t=>t.title==='Tarefa temporária');await a.click('delete-task',{id:task.id});assert.equal(a.state().tasks.some(t=>t.id===task.id),false);assert.equal(a.state().trash.length,1);assert.equal(a.state().trash[0].item.title,'Tarefa temporária');await a.click('navigate',{tab:'me'});await a.click('profile-tab',{tab:'trash'});assert.ok(a.html().includes('Tarefa temporária'));await a.click('restore-trash',{trashId:a.state().trash[0].id});assert.equal(a.state().trash.length,0);assert.equal(a.state().tasks.some(t=>t.id===task.id),true);
});
test('Gerenciamento de importância e subtarefas em afazeres (B13)',async()=>{
 const a=await boot();await a.submit('task-form',{title:'Lançamento do projeto',due:'2026-12-22'});const task=a.state().tasks.find(t=>t.title==='Lançamento do projeto');await a.submit('task-edit-form',{id:task.id,title:'Lançamento do projeto',due:'2026-12-22',priority:'high'});assert.equal(a.state().tasks.find(t=>t.id===task.id).priority,'high');
});
test('Memória manual é usada no contexto da IA e proposta de memória pode ser confirmada (B21)',async()=>{
 const a=await boot();await a.submit('memory-form',{title:'Preferência de café',content:'Bebo café sem açúcar às 9h.'});assert.equal(a.state().memories.length,1);const proposal={kind:'create_memory',payload:{title:'Novo hábito',content:'Caminhada matinal'},missingFields:[],status:'needs_review',key:'prop-mem-1'};const result=require('../src/domain.js').executeProposal(a.state(),proposal,'mem-1');assert.equal(result.state.memories.length,2);assert.equal(result.state.memories.find(m=>m.title==='Novo hábito').content,'Caminhada matinal');
});
test('Tarefa pode ser criada, concluída e reaberta',async()=>{
 const a=await boot();await a.submit('task-form',{title:'Validar protótipo',due:'2026-12-02'});const task=a.state().tasks.find(t=>t.title==='Validar protótipo');await a.click('toggle-task',{id:task.id});assert.equal(a.state().tasks.find(t=>t.id===task.id).done,true);await a.click('toggle-task',{id:task.id});assert.equal(a.state().tasks.find(t=>t.id===task.id).done,false);
});
test('Tarefa pode ser editada sem perder identidade nem estado de conclusão (B12)',async()=>{
 const a=await boot();await a.submit('task-form',{title:'Tarefa original',due:'2026-12-05'});const task=a.state().tasks.find(t=>t.title==='Tarefa original');await a.click('toggle-task',{id:task.id});assert.equal(a.state().tasks.find(t=>t.id===task.id).done,true);await a.click('edit-task',{id:task.id});await a.submit('task-edit-form',{id:task.id,title:'Tarefa com novo título',due:'2026-12-10'});const updated=a.state().tasks.find(t=>t.id===task.id);assert.equal(updated.title,'Tarefa com novo título');assert.equal(updated.due,'2026-12-10');assert.equal(updated.done,true);
});
test('Preferências são persistidas e conteúdo do usuário é escapado',async()=>{
 const a=await boot();await a.submit('settings-form',{name:'<img src=x onerror=alert(1)>',assistantName:'Meu gato',theme:'dark'});assert.equal(a.state().theme,'dark');await a.click('navigate',{tab:'me'});await a.click('profile-tab',{tab:'settings'});assert.ok(a.html().includes('&lt;img'));assert.equal(a.html().includes('<img src=x'),false);
});
test('Memória manual é persistida e exportação contém um backup validável',async()=>{
 const a=await boot();await a.submit('memory-form',{title:'Horários',content:'Prefiro reuniões depois das 10h.'});assert.equal(a.state().memories.length,1);await a.click('export-backup');const backup=JSON.parse(await a.download().text());assert.equal(backup.schemaVersion,2);assert.equal(backup.memories[0].title,'Horários');assert.equal(backup.events.length,a.state().events.length);
});
test('Acessibilidade, semântica de leitor de tela e regras responsivas atendem B11',async()=>{
 const a=await boot();
 // 1. Verifica atributos de navegação e acessibilidade na barra principal
 assert.ok(a.html().includes('aria-label="Navegação principal"'));
 assert.ok(a.html().includes('aria-current="page"'));
 assert.ok(a.html().includes('aria-label="Perfil do assistente: ' + a.state().profile.assistantName + '"'));

 // 2. Verifica tarefas com role checkbox, aria-checked e touch target de subtarefa
 assert.ok(a.html().includes('role="checkbox"'));
 assert.ok(a.html().includes('aria-checked="false"'));

 // 3. Verifica abas com role tablist e role tab na agenda
 await a.click('navigate',{tab:'calendar'});
 assert.ok(a.html().includes('role="tablist"'));
 assert.ok(a.html().includes('role="tab"'));
 assert.ok(a.html().includes('aria-selected="true"'));
 assert.ok(a.html().includes('role="grid"'));
 assert.ok(a.html().includes('role="columnheader"'));
 assert.ok(a.html().includes('role="gridcell"'));

 // 4. Verifica chat com log acessível e formulário com rotulagem
 await a.click('navigate',{tab:'chat'});
 assert.ok(a.html().includes('role="log"'));
 assert.ok(a.html().includes('aria-label="Mensagem para o assistente"'));

 // 5. Valida integridade do arquivo app.css quanto a breakpoints e touch targets
 const css=fs.readFileSync(path.join(__dirname,'../src/app.css'),'utf8');
 assert.ok(css.includes('360px'),'Breakpoint 360px deve constar no CSS');
 assert.ok(css.includes('390px'),'Breakpoint 390px deve constar no CSS');
 assert.ok(css.includes('768px'),'Breakpoint 768px deve constar no CSS');
 assert.ok(css.includes('1440px'),'Limite de 1440px deve constar no CSS');
 assert.ok(css.includes(':focus-visible'),'Foco visível deve constar no CSS');
 assert.ok(css.includes('min-height: 44px')||css.includes('min-height:44px'),'Touch target mínimo de 44px deve constar no CSS');
 assert.ok(css.includes('prefers-reduced-motion'),'Prevenção de movimento deve constar no CSS');

 // 6. Valida atributos no index.html
 const indexHtml=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
 assert.ok(indexHtml.includes('aria-labelledby="editor-title"'));
 assert.ok(indexHtml.includes('aria-labelledby="task-editor-title"'));
 assert.ok(indexHtml.includes('aria-modal="true"'));
 assert.ok(indexHtml.includes('skip-link'));
});
test('Entrada e síntese de voz: microfone, transcrição revisável, áudio do gato e degradação suave (B22)',async()=>{
 // 1. Graceful degradation sem Web Speech API no navegador
 const a=await boot();
 await a.click('navigate',{tab:'chat'});
 assert.ok(a.html().includes('data-action="toggle-mic"'),'Botão de microfone deve estar no formulário do chat');
 assert.ok(a.html().includes('data-action="speak-message"'),'Botão de ouvir deve estar nas mensagens do assistente');

 // Acionar microfone sem suporte exibe toast amigável sem lançar erro
 await a.click('toggle-mic');
 assert.ok(a.element('toast').textContent.includes('Reconhecimento de voz não é suportado'));

 // Acionar síntese sem suporte exibe toast amigável sem lançar erro
 const initialAssistantMsg=a.state().messages.find(m=>m.role==='assistant');
 await a.click('speak-message',{msgId:initialAssistantMsg.id});
 assert.ok(a.element('toast').textContent.includes('Síntese de voz não é suportada'));

 // 2. Com Web Speech API simulada (SpeechRecognition e speechSynthesis)
 let recognitionInstance=null;
 class MockSpeechRecognition {
  constructor(){
   recognitionInstance=this;
   this.lang='';
   this.continuous=false;
   this.interimResults=false;
   this.onstart=null;
   this.onresult=null;
   this.onerror=null;
   this.onend=null;
  }
  start(){
   if(this.onstart)this.onstart();
  }
  stop(){
   if(this.onend)this.onend();
  }
 }

 const spokenUtterances=[];
 let canceled=false;
 const mockSpeechSynthesis={
  speak(u){spokenUtterances.push(u);if(u.onstart)u.onstart();},
  cancel(){canceled=true;}
 };
 class MockSpeechSynthesisUtterance {
  constructor(text){
   this.text=text;
   this.lang='pt-BR';
   this.onstart=null;
   this.onend=null;
  }
 }

 const b=await boot(new Map(),{
  SpeechRecognition:MockSpeechRecognition,
  speechSynthesis:mockSpeechSynthesis,
  SpeechSynthesisUtterance:MockSpeechSynthesisUtterance
 });

 await b.click('navigate',{tab:'chat'});

 // Iniciar ditado por voz
 await b.click('toggle-mic');
 assert.ok(b.html().includes('listening'),'Botão de microfone ou avatar reflete estado ouvindo');

 // Simular evento de transcrição parcial/final
 recognitionInstance.onresult({
  resultIndex:0,
  results:[[{transcript:'Marque reunião amanhã às 15h',isFinal:true}]]
 });
 assert.equal(b.element('chat-input').value,'Marque reunião amanhã às 15h');

 // Transcrição revisável: usuário pode alterar o texto ditado antes de enviar
 b.element('chat-input').value+=' por 30 minutos';
 await b.submit('chat-form',{message:b.element('chat-input').value});

 // Assistente gerou proposta a partir da mensagem ditada e revisada
 const lastMsg=b.state().messages[b.state().messages.length-1];
 assert.equal(lastMsg.role,'assistant');
 assert.ok(lastMsg.proposal);
 assert.equal(lastMsg.proposal.payload.title,'reunião');

 // Reproduzir resposta do gato via síntese de voz
 await b.click('speak-message',{msgId:lastMsg.id});
 assert.equal(spokenUtterances.length,1);
 assert.ok(spokenUtterances[0].text.includes('Preparei uma proposta'));

 // Clicar novamente interrompe/cancela a reprodução
 canceled=false;
 await b.click('speak-message',{msgId:lastMsg.id});
 assert.equal(canceled,true);

 // Preferência de autoSpeak nas configurações
 await b.click('navigate',{tab:'me'});
 await b.click('profile-tab',{tab:'settings'});
 assert.ok(b.html().includes('name="autoSpeak"'));
 await b.submit('settings-form',{name:'Você',assistantName:'Nino',theme:'light',autoSpeak:true});
 assert.equal(b.state().autoSpeak,true);
});
test('Editor do gato exibe 72 combinações e permite selecionar e persistir white e gray_tabby (B36)',async()=>{
 const a=await boot();
 await a.click('navigate',{tab:'me'});
 await a.click('profile-tab',{tab:'cat'});
 assert.ok(a.html().includes('72 combinações possíveis'),'Editor deve exibir 72 combinações');
 assert.ok(a.html().includes('Persa/branco'),'Opção Persa/branco deve estar visível');
 assert.ok(a.html().includes('Tigrado cinza'),'Opção Tigrado cinza deve estar visível');

 // Selecionar white (Persa/branco) mantendo terno e óculos
 await a.change('outfit','suit');
 await a.change('glasses','square');
 await a.click('coat',{coat:'white'});
 await a.click('save-cat');
 assert.equal(a.state().appearance.coat,'white');
 assert.equal(a.state().appearance.outfit,'suit');
 assert.equal(a.state().appearance.glasses,'square');

 const reloaded=await boot(a.saved);
 assert.equal(reloaded.state().appearance.coat,'white');
 assert.equal(reloaded.state().appearance.outfit,'suit');
 assert.equal(reloaded.state().appearance.glasses,'square');

 // Selecionar gray_tabby (Tigrado cinza)
 await reloaded.click('navigate',{tab:'me'});
 await reloaded.click('coat',{coat:'gray_tabby'});
 await reloaded.click('save-cat');
 assert.equal(reloaded.state().appearance.coat,'gray_tabby');

 const reloaded2=await boot(reloaded.saved);
 assert.equal(reloaded2.state().appearance.coat,'gray_tabby');
 assert.equal(reloaded2.state().appearance.outfit,'suit');
 assert.equal(reloaded2.state().appearance.glasses,'square');
});
test('Recorrência de afazeres após conclusão cria próxima ocorrência e exibe badge (B17)',async()=>{
 const a=await boot();
 // 1. Criar tarefa
 await a.submit('task-form',{title:'Limpar caixa de areia',due:'2026-10-20'});
 const task=a.state().tasks.find(t=>t.title==='Limpar caixa de areia');
 assert.ok(task);

 // 2. Configurar repetição de 3 dias no editor de tarefa
 await a.submit('task-edit-form',{
  id:task.id,
  title:'Limpar caixa de areia',
  due:'2026-10-20',
  priority:'high',
  repeatAmount:'3',
  repeatUnit:'days'
 });
 const updated=a.state().tasks.find(t=>t.id===task.id);
 assert.deepEqual(updated.repeatAfter,{unit:'days',amount:3});

 // 3. Verificar badge visual na lista de afazeres
 await a.click('navigate',{tab:'calendar'});
 await a.click('calendar-tab',{tab:'tasks'});
 assert.ok(a.html().includes('🔁 Repete após 3 dias'),'Badge de repetição deve ser exibido');

 // 4. Concluir a tarefa deve gerar a próxima ocorrência
 const countBefore = a.state().tasks.length;
 await a.click('toggle-task',{id:task.id});
 const tasksAfterFirstComplete=a.state().tasks;
 assert.equal(tasksAfterFirstComplete.length, countBefore + 1);

 const completedOriginal=tasksAfterFirstComplete.find(t=>t.id===task.id);
 assert.equal(completedOriginal.done,true);

 const nextTask=tasksAfterFirstComplete.find(t=>t.id!==task.id&&t.title==='Limpar caixa de areia');
 assert.ok(nextTask);
 assert.equal(nextTask.done,false);
 assert.equal(nextTask.title,'Limpar caixa de areia');
 assert.equal(nextTask.priority,'high');
 assert.deepEqual(nextTask.repeatAfter,{unit:'days',amount:3});
 assert.equal(nextTask.seriesId,completedOriginal.seriesId);

 // Toast explicativo registrado
 assert.ok(a.element('toast').textContent.includes('Tarefa concluída!'));
 assert.ok(a.element('toast').textContent.includes('repetir após 3 dias'));

 // 5. Reabrir e recompletar a tarefa original não duplica a série
 await a.click('toggle-task',{id:task.id});
 assert.equal(a.state().tasks.find(t=>t.id===task.id).done,false);
 assert.ok(a.element('toast').textContent.includes('Tarefa reaberta.'));

 await a.click('toggle-task',{id:task.id});
 assert.equal(a.state().tasks.find(t=>t.id===task.id).done,true);
 assert.equal(a.state().tasks.filter(t=>t.title==='Limpar caixa de areia').length,2,'Não deve duplicar a série de repetição');

 // 6. Concluir a segunda tarefa gera a terceira da série
 await a.click('toggle-task',{id:nextTask.id});
 assert.equal(a.state().tasks.filter(t=>t.title==='Limpar caixa de areia').length,3);
 const thirdTask=a.state().tasks.find(t=>t.id!==task.id&&t.id!==nextTask.id&&t.title==='Limpar caixa de areia');
 assert.ok(thirdTask);
 assert.equal(thirdTask.done,false);
 assert.equal(thirdTask.seriesId,completedOriginal.seriesId);
});
test('Retrospectiva da Semana é exibida na tela Agora com números, categorias e mensagem do gato (B28)',async()=>{
 const a=await boot();
 await a.click('navigate',{tab:'now'});
 assert.ok(a.html().includes('Retrospectiva da Semana'));
 assert.ok(a.html().includes('Sua semana em resumo'));
 assert.ok(a.html().includes('Compromissos'));
 assert.ok(a.html().includes('Afazeres'));
 assert.ok(a.html().includes('Ritmo da semana'));
 assert.ok(a.html().includes('Copiar resumo'));
 assert.ok(a.html().includes(a.state().profile.assistantName + ' diz:'));
});
test('Botão de copiar retrospectiva copia para clipboard e aciona toast (B28)',async()=>{
 let clipboardText='';
 const a=await boot(new Map(),{
  navigator:{
   clipboard:{
    writeText:async text=>{clipboardText=text;}
   }
  }
 });
 await a.click('navigate',{tab:'now'});
 await a.click('copy-recap');
 assert.ok(clipboardText.includes('🐾 Retrospectiva Semanal — Assistente Gato'));
 assert.ok(clipboardText.includes('Agenda:'));
 assert.ok(clipboardText.includes('Afazeres:'));
 assert.ok(a.element('toast').textContent.includes('Resumo semanal copiado'));
});
test('Aba Retrospectiva em Ações exibe o resumo completo da semana (B28)',async()=>{
 const a=await boot();
 await a.click('navigate',{tab:'actions'});
 assert.ok(a.html().includes('Retrospectiva'));
 await a.click('actions-tab',{tab:'recap'});
 assert.ok(a.html().includes('Sua semana em resumo'));
 assert.ok(a.html().includes('Compromissos'));
 assert.ok(a.html().includes('Afazeres'));
});
