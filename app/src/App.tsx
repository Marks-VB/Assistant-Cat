// SPDX-License-Identifier: AGPL-3.0-or-later
// Assistant Cat - Multiplatform Native Theme (Web, Mobile & Microsoft Store)

import React, { useState, useEffect, useRef } from 'react';
import { X, Bell, Check, ChevronRight, Handshake, Link2, MailCheck, Repeat, User, Users, Zap } from 'lucide-react';
import {
  AppState,
  CalendarEvent,
  Task,
  Memory,
  Proposal,
  CatAppearance,
  ChatMessage,
  Priority,
  Recurrence,
  NavLayout
} from './types';
import { GatoStorage } from './core/storage';
import { toExportableState } from './core/backup';
import { CatAvatar } from './components/CatAvatar';
import * as Domain from './core/domain';
import * as AI from './core/ai-adapter';
import { ensureNotificationPermission, syncEventReminders } from './core/notifications';
import { THEME_OPTIONS, normalizeTheme, resolveTheme } from './core/themes';
import { coats, outfits, glasses } from './core/cat-avatar';

// Componentes
import { FloatingBottomBar, AppTabKey } from './components/FloatingBottomBar';
import { SideNav } from './components/SideNav';
import { TabBar, TabKey } from './components/TabBar';
import { AppHeader } from './components/AppHeader';
import { EventCard } from './components/EventCard';
import { InlineEventCard } from './components/InlineEventCard';
import { ChatScreen } from './components/ChatScreen';
import { NotificationsModal } from './components/NotificationsModal';
import { BottomSheet } from './components/BottomSheet';
import { AvatarModal } from './components/AvatarModal';
import { NowTimeline } from './components/NowTimeline';
import { BookingFlow } from './components/BookingFlow';
import { OnboardingFlow } from './components/OnboardingFlow';
import { LayoutPreview } from './components/LayoutPreview';
import { LAYOUT_OPTIONS } from './core/layout';

const uid = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : 'app-' + Date.now() + '-' + Math.random().toString(36).slice(2, 9);

// A interface é só PT-BR, então o nome padrão também é. Antes isto virava
// "Your Assistant Cat" em navegador com locale en-*, o que misturava idiomas
// na mesma tela (nome em inglês, o resto em português). O usuário pode
// renomear em Personalizar.
const defaultAssistantName = 'Seu Gato Assistente';

const initialAppState: AppState = {
  schemaVersion: 2,
  profile: { name: 'Você', assistantName: defaultAssistantName },
  appearance: { coat: 'white', outfit: 'none', glasses: 'none', state: 'idle' },
  theme: 'midnight',
  layout: 'auto',
  onboarded: false,
  defaultDuration: 60,
  tab: 'chat',
  events: [
    {
      id: uid(),
      title: 'Call com o Laércio',
      date: Domain.civilDate(),
      time: '14:30',
      duration: 60,
      recurrence: 'none',
      notes: 'Alinhamento de cronograma e metas do projeto.'
    },
    {
      id: uid(),
      title: 'Treinamento de Equipe',
      date: Domain.civilDate(),
      time: '14:00',
      duration: 45,
      recurrence: 'none',
      notes: 'Capacitação interna em novas ferramentas.'
    },
    {
      id: uid(),
      title: 'Call com a Started',
      date: Domain.civilDate(),
      time: '15:00',
      duration: 30,
      recurrence: 'none',
      notes: 'Status report e validação de entregas.'
    }
  ],
  tasks: [
    { id: uid(), title: 'Revisar proposta do Laércio', due: Domain.civilDate(), done: false, priority: 'high' },
    { id: uid(), title: 'Enviar resumo da retrospectiva', due: '', done: false, priority: 'normal', repeatAfter: { unit: 'weeks', amount: 1 } },
    { id: uid(), title: 'Configurar link de agendamento', due: '', done: true, priority: 'normal' }
  ],
  messages: [
    {
      id: uid(),
      role: 'user',
      text: 'O Laércio pediu para mudar para as 14:30'
    },
    {
      id: uid(),
      role: 'assistant',
      text: 'Alterado, com aviso 15 minutos antes, às 14h15.',
      proposal: {
        kind: 'create_event',
        action: 'create_event',
        status: 'executed',
        confidence: 0.98,
        payload: {
          title: 'Call com o Laércio',
          date: Domain.civilDate(),
          time: '14:30',
          duration: 60
        }
      }
    }
  ],
  memories: [],
  executedProposalKeys: [],
  trash: [],
  autoSpeak: false
};

export function App() {
  const [state, setState] = useState<AppState>(initialAppState);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Navegação
  const [currentTab, setCurrentTab] = useState<TabKey>('chat');
  const [calendarSubTab, setCalendarSubTab] = useState<'calendar' | 'todos' | 'search'>('calendar');
  const [tasksSubTab, setTasksSubTab] = useState<'coordination' | 'triggers'>('coordination');

  // Modais
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const [isBookingFlowOpen, setIsBookingFlowOpen] = useState(false);
  const [isChatsDrawerOpen, setIsChatsDrawerOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);

  // Modais de Edição
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [recapModalOpen, setRecapModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Partial<CalendarEvent> | null>(null);
  const [editingTask, setEditingTask] = useState<Partial<Task> | null>(null);

  // Chat e Voz
  const [chatInput, setChatInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const confirmingProposals = useRef(new Set<Proposal>());
  const themeMountedRef = useRef(false);
  const themeTimerRef = useRef<number | null>(null);

  // Inicialização do storage
  useEffect(() => {
    async function init() {
      await GatoStorage.init();
      const saved = await GatoStorage.load();
      if (saved) {
        if (!saved.profile?.assistantName || saved.profile.assistantName === 'Nino') {
          saved.profile.assistantName = defaultAssistantName;
        }
        saved.theme = normalizeTheme(saved.theme);
        saved.layout = saved.layout === 'bottom' || saved.layout === 'side' ? saved.layout : 'auto';
        // Instalações antigas (com estado salvo) não devem ver as boas-vindas de novo.
        saved.onboarded = saved.onboarded === undefined ? true : saved.onboarded;
        setState(saved);
        void syncEventReminders(saved.events);
      }
      setLoading(false);
    }
    init();
  }, []);

  // Título por aba (SEO/a11y SPA)
  useEffect(() => {
    const titles: Record<string, string> = {
      chat: 'Chat',
      now: 'Agora',
      calendar: 'Agenda',
      tasks: 'Afazeres',
      me: 'Eu',
    };
    document.title = `${titles[currentTab] || 'Assistente Gato'} — Assistant Cat`;
  }, [currentTab]);

  const updateState = async (updater: (prev: AppState) => AppState) => {
    const prev = state;
    const next = updater(prev);
    setState(next);
    await GatoStorage.save(next);
    if (next.events !== prev.events) {
      void syncEventReminders(next.events);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Aplica o tema escolhido no documento e acompanha a preferência do sistema.
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const resolved = resolveTheme(state.theme, media.matches);
      if (themeMountedRef.current) {
        // Transição curta só de cor/sombra; sem animar layout (evita o "pulo" do avatar).
        const root = document.documentElement;
        root.classList.add('theme-transition');
        if (themeTimerRef.current) window.clearTimeout(themeTimerRef.current);
        themeTimerRef.current = window.setTimeout(() => {
          root.classList.remove('theme-transition');
          themeTimerRef.current = null;
        }, 320);
      }
      themeMountedRef.current = true;
      document.documentElement.dataset.theme = resolved;
      const option = THEME_OPTIONS.find((item) => item.id === resolved);
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta && option) meta.setAttribute('content', option.themeColor);
      try {
        localStorage.setItem('assistant-cat-theme', resolved);
      } catch {
        /* armazenamento indisponível */
      }
    };
    apply();
    const onChange = () => {
      if (state.theme === 'system') apply();
    };
    media.addEventListener('change', onChange);
    return () => {
      media.removeEventListener('change', onChange);
      if (themeTimerRef.current) {
        window.clearTimeout(themeTimerRef.current);
        themeTimerRef.current = null;
      }
    };
  }, [state.theme]);

  // Expõe o layout escolhido para CSS/testes e normaliza valores antigos.
  const navLayout: NavLayout = state.layout === 'bottom' || state.layout === 'side' ? state.layout : 'auto';
  useEffect(() => {
    document.documentElement.dataset.nav = navLayout;
  }, [navLayout]);

  // Scroll automático no chat
  useEffect(() => {
    if (currentTab === 'chat' && chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [state.messages, currentTab]);

  // Síntese e Reconhecimento de Voz (Web Speech API)
  const toggleSpeak = (text: string, msgId: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      showToast('Síntese de voz não suportada pelo navegador.');
      return;
    }
    if (speakingMsgId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingMsgId(null);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = navigator.language?.startsWith('en') ? 'en-US' : 'pt-BR';
    utterance.rate = 1.0;
    utterance.onend = () => setSpeakingMsgId(null);
    utterance.onerror = () => setSpeakingMsgId(null);
    setSpeakingMsgId(msgId);
    window.speechSynthesis.speak(utterance);
  };

  const toggleSpeechRecognition = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showToast('Reconhecimento de fala não suportado neste navegador.');
      return;
    }
    if (isListening) {
      setIsListening(false);
      return;
    }
    try {
      const recognition = new SpeechRecognition();
      recognition.lang = navigator.language?.startsWith('en') ? 'en-US' : 'pt-BR';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        showToast('Ouvindo você...');
      };
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setChatInput(prev => (prev ? prev + ' ' + transcript : transcript));
      };
      recognition.onerror = () => {
        setIsListening(false);
        showToast('Não foi possível capturar a voz.');
      };
      recognition.onend = () => {
        setIsListening(false);
      };
      recognition.start();
    } catch {
      setIsListening(false);
      showToast('Erro ao iniciar microfone.');
    }
  };

  // Enviar mensagem no Chat
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = chatInput.trim();
    if (!text) return;

    const userMsg: ChatMessage = { id: uid(), role: 'user', text };
    const newMessages = [...state.messages, userMsg];
    setChatInput('');
    await updateState(s => ({ ...s, messages: newMessages }));

    setIsThinking(true);
    try {
      const aiResponse = await AI.requestInference(text, { ...state, messages: newMessages });
      const assistantMsgId = uid();
      const assistantMsg: ChatMessage = {
        id: assistantMsgId,
        role: 'assistant',
        text: aiResponse.replyText,
        proposal: aiResponse.proposal || undefined
      };

      await updateState(s => ({
        ...s,
        messages: [...s.messages, assistantMsg]
      }));

      if (state.autoSpeak) {
        toggleSpeak(aiResponse.replyText, assistantMsgId);
      }
    } catch {
      showToast('Erro ao consultar o assistente.');
    } finally {
      setIsThinking(false);
    }
  };

  // Confirmar proposta do assistente
  const handleConfirmProposal = async (prop: Proposal) => {
    if (prop.status === 'executed' || confirmingProposals.current.has(prop)) return;

    let nextState = { ...state };
    const p = prop.payload;
    const action = prop.action || prop.kind;
    const permissionPromise = action === 'create_event' ? ensureNotificationPermission() : null;

    if (action === 'create_event') {
      const newEvent: CalendarEvent = {
        id: uid(),
        title: p.title || 'Novo Evento',
        date: p.date || Domain.civilDate(),
        time: p.time || '10:00',
        duration: p.duration || 60,
        recurrence: (p.recurrence as Recurrence) || 'none',
        notes: p.notes,
        reminderMinutes: p.reminderMinutes ?? 15
      };
      nextState.events = [...nextState.events, newEvent];
    } else if (action === 'create_task') {
      const newTask: Task = {
        id: uid(),
        title: p.title || 'Nova Tarefa',
        due: p.due || p.date,
        priority: (p.priority as Priority) || 'normal',
        done: false,
        repeatAfter: p.repeatAfter || null
      };
      nextState.tasks = [...nextState.tasks, newTask];
    } else if (action === 'create_memory') {
      const title = p.title?.trim();
      const content = p.content?.trim();
      if (!title || !content) {
        showToast('A proposta de memória precisa de título e conteúdo antes de ser salva.');
        return;
      }
      const newMemory: Memory = { id: uid(), title, content };
      nextState.memories = [...nextState.memories, newMemory];
    } else {
      showToast('Esta proposta não contém uma ação que possa ser registrada.');
      return;
    }

    // Marcar proposta como executada
    nextState.messages = nextState.messages.map(m => {
      if (m.proposal && m.proposal === prop) {
        return { ...m, proposal: { ...m.proposal, status: 'executed' } };
      }
      return m;
    });

    try {
      confirmingProposals.current.add(prop);
      await GatoStorage.save(nextState);
      setState(nextState);
      showToast('Ação confirmada e registrada com sucesso!');
      if (permissionPromise) {
        const granted = await permissionPromise;
        await syncEventReminders(nextState.events);
        if (!granted) {
          showToast('Evento salvo. Ative as notificações para receber o lembrete.');
        }
      }
    } catch {
      showToast('Não foi possível salvar a ação. A proposta continua pendente.');
    } finally {
      confirmingProposals.current.delete(prop);
    }
  };

  // Ajustar o lembrete de uma proposta ainda não confirmada
  const handleProposalReminderChange = async (messageId: string, minutes: number | null) => {
    await updateState((s) => ({
      ...s,
      messages: s.messages.map((m) =>
        m.id === messageId && m.proposal
          ? { ...m, proposal: { ...m.proposal, payload: { ...m.proposal.payload, reminderMinutes: minutes } } }
          : m
      )
    }));
  };

  // Alternar conclusão de tarefa com suporte a repeatAfter
  const handleToggleTask = async (task: Task) => {
    if (!task.done && task.repeatAfter?.unit) {
      const result = Domain.completeTaskWithRepeat(state.tasks, task.id);
      await updateState(s => ({ ...s, tasks: result.tasks }));
      showToast('Tarefa concluída! Próxima ocorrência agendada.');
      return;
    }
    await updateState(s => ({
      ...s,
      tasks: s.tasks.map(t =>
        t.id === task.id ? { ...t, done: !t.done, completedAt: !t.done ? Domain.civilDate() : null } : t
      )
    }));
    showToast(task.done ? 'Tarefa reaberta.' : 'Tarefa concluída.');
  };

  const handleDeleteTask = async (task: Task) => {
    if (!confirm('Mover esta tarefa para a lixeira?')) return;
    await updateState(s => ({
      ...s,
      tasks: s.tasks.filter(t => t.id !== task.id),
      trash: [...(s.trash || []), { id: uid(), kind: 'task', deletedAt: new Date().toISOString(), item: task }]
    }));
    showToast('Tarefa movida para a lixeira.');
  };

  const handleDeleteEvent = async (ev: CalendarEvent) => {
    if (!confirm('Mover este evento para a lixeira?')) return;
    await updateState(s => ({
      ...s,
      events: s.events.filter(e => e.id !== ev.id),
      trash: [...(s.trash || []), { id: uid(), kind: 'event', deletedAt: new Date().toISOString(), item: ev }]
    }));
    showToast('Evento movido para a lixeira.');
  };

  // Retrospectiva Semanal
  const recap = Domain.calculateWeeklyRecap(state, Domain.civilDate());
  const handleCopyRecap = async () => {
    if (!recap) return;
    try {
      await navigator.clipboard.writeText(recap.summaryText);
      showToast('Resumo copiado com sucesso!');
    } catch {
      showToast('Não foi possível copiar o resumo.');
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[var(--bg-primary)] text-[var(--text-primary)]">
        <p className="text-[var(--text-primary)] font-medium animate-pulse text-sm">Carregando Seu Gato Assistente...</p>
      </div>
    );
  }

  const sideNavVisibility =
    navLayout === 'side' ? 'md:flex' : navLayout === 'auto' ? 'lg:flex' : 'hidden';
  const contentOffset =
    navLayout === 'side' ? 'md:pl-[240px]' : navLayout === 'auto' ? 'lg:pl-[240px]' : '';
  const bottomNavVisibility =
    navLayout === 'side' ? 'md:hidden' : navLayout === 'auto' ? 'lg:hidden' : '';

  return (
    <div className="app-shell min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans select-none antialiased">
      <a href="#main" className="skip-link">Pular para conteúdo</a>
      {/* Toast flutuante */}
      {toastMessage && (
        <div role="status" aria-live="polite" className="fixed top-[88px] left-1/2 -translate-x-1/2 z-50 bg-[var(--surface-card)] border border-[var(--border-strong)] text-[var(--text-primary)] text-xs font-semibold px-4 py-2 rounded-full shadow-2xl animate-fade-in flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[var(--accent)]" />
          <span>{toastMessage}</span>
        </div>
      )}

      <SideNav
        currentTab={currentTab}
        onChangeTab={(tab) => setCurrentTab(tab)}
        badgeCounts={{ calendar: 3 }}
        assistantName={state.profile.assistantName}
        appearance={state.appearance}
        themeLabel={THEME_OPTIONS.find((option) => option.id === state.theme)?.label || 'Escuro'}
        onOpenAvatarModal={() => setIsAvatarModalOpen(true)}
        className={sideNavVisibility}
      />

      <div className={`flex min-h-screen flex-col ${contentOffset}`}>
      {/* Header Nativo (exibido nas abas Now, Calendar, Tasks e Me) */}
      {currentTab !== 'chat' && (
        <AppHeader
          assistantName={state.profile.assistantName}
          appearance={state.appearance}
          onOpenChatsDrawer={() => setIsChatsDrawerOpen(true)}
          onOpenAvatarModal={() => setIsAvatarModalOpen(true)}
          onOpenNotifications={() => setIsNotificationsOpen(true)}
          unreadNotificationsCount={2}
        />
      )}

      {/* Área Principal de Conteúdo (com profundidade Apple ao abrir sheets/modais) */}
      <main
        id="main"
        tabIndex={-1}
        className={`flex-1 w-full max-w-2xl lg:max-w-4xl mx-auto transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isBottomSheetOpen ? 'scale-[0.98] opacity-85 brightness-90 rounded-2xl overflow-hidden' : 'scale-100 opacity-100'
        } ${currentTab === 'chat' ? 'px-0 pt-0 pb-16' : 'px-4 pt-3 pb-24'}`}
      >
        {/* ========================================================= */}
        {/* ABA 1: CHAT COM O ASSISTENTE (CHAT) */}
        {/* ========================================================= */}
        {currentTab === 'chat' && (
          <>
          <ChatScreen
            assistantName={state.profile.assistantName}
            appearance={state.appearance}
            messages={state.messages}
            chatInput={chatInput}
            isListening={isListening}
            speakingMsgId={speakingMsgId}
            isThinking={isThinking}
            unreadNotifications={true}
            onInputChange={setChatInput}
            onSendMessage={handleSendMessage}
            onToggleVoice={toggleSpeechRecognition}
            onToggleSpeak={toggleSpeak}
            onOpenDrawer={() => setIsChatsDrawerOpen(true)}
            onOpenAvatarModal={() => setIsAvatarModalOpen(true)}
            onOpenNotifications={() => setIsNotificationsOpen(true)}
            onOpenBottomSheet={() => setIsBottomSheetOpen(true)}
            onEditEvent={(p) => {
              setEditingEvent({
                title: p?.title,
                date: p?.date || Domain.civilDate(),
                time: p?.time || '14:30',
                duration: p?.duration || 60,
                reminderMinutes: p?.reminderMinutes ?? 15
              });
              setEventModalOpen(true);
            }}
            onViewAgenda={() => setCurrentTab('calendar')}
            onProposalReminderChange={handleProposalReminderChange}
          />
          {state.messages.some(
            m => m.proposal?.status === 'needs_review' &&
              ['create_event', 'create_task', 'create_memory'].includes(m.proposal.action || m.proposal.kind)
          ) && (
            <div className="fixed bottom-40 left-4 right-4 z-30 mx-auto max-h-36 max-w-xl space-y-2 overflow-y-auto rounded-2xl border border-[var(--border-strong)] bg-[var(--surface-card)] p-3 shadow-2xl backdrop-blur">
              {state.messages
                .filter(
                  m => m.proposal?.status === 'needs_review' &&
                    ['create_event', 'create_task', 'create_memory'].includes(m.proposal.action || m.proposal.kind)
                )
                .map(message => {
                  const proposal = message.proposal;
                  if (!proposal) return null;
                  const label = proposal.action || proposal.kind;
                  return (
                    <div key={message.id} className="flex items-center justify-between gap-3 text-xs text-[var(--text-primary)]">
                      <span className="min-w-0 truncate">
                        Confirmar {label === 'create_memory' ? 'memória' : label === 'create_task' ? 'tarefa' : 'evento'}:
                        {' '}{proposal.payload.title || 'sem título'}
                      </span>
                      <button
                        onClick={() => handleConfirmProposal(proposal)}
                        className="shrink-0 rounded-full bg-[var(--accent)] px-3 py-1.5 font-bold text-[var(--text-primary)] hover:bg-[var(--accent-hover)]"
                      >
                        Confirmar
                      </button>
                    </div>
                  );
                })}
            </div>
          )}
          </>
        )}

        {/* ========================================================= */}
        {/* ABA 2: NOW (TIMELINE DO DIA / INBOX) */}
        {/* ========================================================= */}
        {currentTab === 'now' && (
          <div className="space-y-6">
            {/* Retrospectiva Semanal Compacta */}
            {recap && (
              <div className="rounded-[20px] bg-[var(--surface-card)] border border-[var(--border-subtle)] p-4 text-[var(--text-primary)]">
                <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
                  <div>
                    <h3 className="font-bold text-sm">Retrospectiva Semanal</h3>
                    <p className="text-[11px] text-[var(--text-secondary)]">
                      {recap.week.start} até {recap.week.end} · {recap.productivity.label}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleCopyRecap}
                      className="px-2.5 py-1 rounded-full bg-[var(--overlay-weak)] border border-[var(--border-strong)] text-[11px] font-semibold text-[var(--text-primary)] hover:text-[var(--text-primary)]"
                    >
                      Copiar
                    </button>
                    <button
                      onClick={() => setRecapModalOpen(true)}
                      className="px-2.5 py-1 rounded-full bg-[var(--accent)] text-[11px] font-semibold text-[var(--text-primary)]"
                    >
                      Detalhes
                    </button>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2 rounded-xl bg-[var(--surface-elevated)]">
                    <div className="text-[10px] text-[var(--text-secondary)]">Eventos</div>
                    <div className="font-bold text-sm text-[var(--text-primary)]">{recap.events.total}</div>
                  </div>
                  <div className="p-2 rounded-xl bg-[var(--surface-elevated)]">
                    <div className="text-[10px] text-[var(--text-secondary)]">Tarefas</div>
                    <div className="font-bold text-sm text-[var(--text-primary)]">
                      {recap.tasks.completed}/{recap.tasks.total}
                    </div>
                  </div>
                  <div className="p-2 rounded-xl bg-[var(--surface-elevated)]">
                    <div className="text-[10px] text-[var(--text-secondary)]">Conclusão</div>
                    <div className="font-bold text-sm text-[var(--accent)]">{recap.tasks.completionRate}%</div>
                  </div>
                </div>
              </div>
            )}

            {/* Timeline Contínua */}
            <NowTimeline
              events={state.events}
              onOpenEvent={(ev) => {
                setEditingEvent(ev);
                setEventModalOpen(true);
              }}
              onNewEvent={() => {
                setEditingEvent({ date: Domain.civilDate(), time: '14:00', duration: state.defaultDuration || 60 });
                setEventModalOpen(true);
              }}
            />
          </div>
        )}

        {/* ========================================================= */}
        {/* ABA 3: CALENDAR (GRADE MENSAL & TO-DOS) */}
        {/* ========================================================= */}
        {currentTab === 'calendar' && (
          <div className="space-y-4">
            {/* Header com Abas Internas */}
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setCalendarSubTab('calendar')}
                  className={`text-sm font-bold pb-1 transition ${
                    calendarSubTab === 'calendar'
                      ? 'text-[var(--text-primary)] border-b-2 border-[var(--accent)]'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  Agenda
                </button>
                <button
                  onClick={() => setCalendarSubTab('todos')}
                  className={`text-sm font-bold pb-1 transition ${
                    calendarSubTab === 'todos'
                      ? 'text-[var(--text-primary)] border-b-2 border-[var(--accent)]'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  Afazeres
                </button>
                <button
                  onClick={() => setCalendarSubTab('search')}
                  className={`text-sm font-bold pb-1 transition ${
                    calendarSubTab === 'search'
                      ? 'text-[var(--text-primary)] border-b-2 border-[var(--accent)]'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  Buscar
                </button>
              </div>

              <button
                onClick={() => {
                  if (calendarSubTab === 'todos') {
                    setEditingTask({ due: Domain.civilDate(), priority: 'normal' });
                    setTaskModalOpen(true);
                  } else {
                    setEditingEvent({ date: Domain.civilDate(), time: '10:00', duration: state.defaultDuration || 60 });
                    setEventModalOpen(true);
                  }
                }}
                aria-label={calendarSubTab === 'todos' ? 'Criar nova tarefa' : 'Criar novo compromisso'}
                className="press-scale h-9 shrink-0 rounded-full bg-[var(--accent)] px-3 text-xs font-bold text-[var(--text-primary)] shadow-[var(--nav-shadow)] transition hover:bg-[var(--accent-hover)]"
              >
                {calendarSubTab === 'todos' ? '+ Nova tarefa' : '+ Novo compromisso'}
              </button>
            </div>

            {/* Sub-Aba 1: Grade Mensal Contínua */}
            {calendarSubTab === 'calendar' && (
              <div className="space-y-4">
                <div className="rounded-[20px] bg-[var(--surface-card)] border border-[var(--border-subtle)] p-4 text-[var(--text-primary)]">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-sm">Outubro / Novembro 2026</h3>
                    <div className="flex gap-1 text-xs">
                      <span className="w-2.5 h-2.5 rounded-full bg-[var(--accent)]" />
                      <span className="text-[var(--text-secondary)] text-[11px]">3 compromissos</span>
                    </div>
                  </div>

                  {/* Dias da Semana */}
                  <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-[var(--text-secondary)] mb-2">
                    <div>DOM</div>
                    <div>SEG</div>
                    <div>TER</div>
                    <div>QUA</div>
                    <div>QUI</div>
                    <div>SEX</div>
                    <div>SÁB</div>
                  </div>

                  {/* Dias do Mês */}
                  <div className="grid grid-cols-7 gap-1.5 text-center text-xs">
                    {Array.from({ length: 31 }, (_, i) => {
                      const day = i + 1;
                      const isToday = day === 21; // Conforme frame do app (dia 21 com círculo branco sólido)
                      const hasEvent = [18, 21, 24].includes(day);
                      return (
                        <div
                          key={day}
                          className={`p-2 rounded-xl flex flex-col items-center justify-center min-h-[52px] border ${
                            isToday
                              ? 'bg-[var(--inverted-bg)] text-[var(--inverted-text)] font-extrabold border-[var(--inverted-bg)]'
                              : 'bg-[var(--surface-elevated)] border-transparent text-[var(--text-primary)] hover:border-[var(--border-strong)]'
                          }`}
                        >
                          <span>{day}</span>
                          {hasEvent && (
                            <div className="w-full mt-1 flex justify-center">
                              <span
                                className={`h-1.5 w-4 rounded-full ${isToday ? 'bg-[var(--accent)]' : 'bg-[var(--accent)]'}`}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Lista de Eventos Agendados */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Compromissos Cadastrados</h4>
                  {state.events.map((e) => (
                    <div
                      key={e.id}
                      className="rounded-[16px] bg-[var(--surface-card)] border border-[var(--border-subtle)] p-3 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold text-sm text-[var(--text-primary)]">{e.title}</div>
                        <div className="text-xs text-[var(--text-secondary)] flex items-center gap-2 flex-wrap">
                          <span>{e.date} · {e.allDay ? 'Dia inteiro' : `${e.time} (${e.duration} min)`}</span>
                          {e.reminderMinutes ? (
                            <span className="text-[var(--accent)] font-medium" title={`Notificar ${e.reminderMinutes} minutos antes`}>
                              <Bell size={12} className="inline -mt-0.5 mr-1" aria-hidden="true" />{e.reminderMinutes} min antes
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteEvent(e)}
                        aria-label={`Excluir evento ${e.title}`}
                        className="text-[var(--text-secondary)] hover:text-[var(--accent)] text-sm p-1 min-h-[44px] min-w-[44px] flex items-center justify-center"
                      >
                        <X size={14} aria-hidden="true" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sub-Aba 2: To-dos */}
            {calendarSubTab === 'todos' && (
              <div className="space-y-4">
                {state.tasks.length === 0 ? (
                  /* Empty State: Foco e produtividade em dia */
                  <div className="rounded-[24px] bg-[var(--surface-card)] border border-[var(--border-subtle)] p-8 text-center space-y-4 my-8">
                    <div className="w-16 h-16 mx-auto rounded-full bg-[var(--surface-elevated)] flex items-center justify-center text-[var(--accent)] shadow-inner">
                      <Check size={26} strokeWidth={2} aria-hidden="true" />
                    </div>
                    <div>
                      <h4 className="font-bold text-base text-[var(--text-primary)]">Nenhum afazer pendente</h4>
                      <p className="text-xs text-[var(--text-secondary)] mt-1">Todas as tarefas foram concluídas. Suas prioridades estão organizadas.</p>
                    </div>
                    <button
                      onClick={() => {
                        setEditingTask({ due: Domain.civilDate(), priority: 'normal' });
                        setTaskModalOpen(true);
                      }}
                      className="px-5 py-2.5 rounded-full bg-[var(--inverted-bg)] text-[var(--inverted-text)] font-bold text-xs hover:bg-stone-200 shadow-md"
                    >
                      + Criar tarefa
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {state.tasks.map((t) => (
                      <div
                        key={t.id}
                        className="rounded-[18px] bg-[var(--surface-card)] border border-[var(--border-subtle)] p-3.5 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleToggleTask(t)}
                            aria-label={t.done ? `Marcar ${t.title} como pendente` : `Concluir ${t.title}`}
                            className={`w-5 h-5 rounded-full border flex items-center justify-center transition ${
                              t.done ? 'bg-[var(--accent)] border-[var(--accent)] text-[var(--text-primary)]' : 'border-[var(--border-strong)] text-transparent'
                            }`}
                          >
                            <Check size={12} strokeWidth={2.6} aria-hidden="true" />
                          </button>
                          <div>
                            <span
                              className={`text-sm font-semibold ${t.done ? 'line-through text-[var(--text-secondary)]' : 'text-[var(--text-primary)]'}`}
                            >
                              {t.title}
                            </span>
                            <div className="flex items-center gap-2 text-[11px] text-[var(--text-secondary)] mt-0.5">
                              {t.due && <span>Prazo: {t.due}</span>}
                              {t.priority === 'high' && (
                                <span className="text-[var(--accent)] font-bold uppercase text-[9px] bg-[var(--accent-soft)] px-1.5 py-0.2 rounded">
                                  ALTA
                                </span>
                              )}
                              {t.repeatAfter && (
                                <span className="inline-flex items-center gap-1">
                                  <Repeat size={11} strokeWidth={2} aria-hidden="true" />
                                  Repete a cada {t.repeatAfter.amount} {t.repeatAfter.unit}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteTask(t)}
                          aria-label={`Excluir tarefa ${t.title}`}
                          className="text-[var(--text-secondary)] hover:text-[var(--accent)] text-sm p-1 min-h-[44px] min-w-[44px] flex items-center justify-center"
                        >
                          <X size={14} aria-hidden="true" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Sub-Aba 3: Pesquisa */}
            {calendarSubTab === 'search' && (
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Pesquisar por compromissos ou tarefas..."
                  className="w-full rounded-full bg-[var(--surface-card)] border border-[var(--border-strong)] px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none"
                />
                <p className="text-xs text-[var(--text-secondary)]">Digite palavras-chave para filtrar seu histórico com o assistente.</p>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* ABA 4: TASKS (COORDENAÇÃO & TRIGGERS) */}
        {/* ========================================================= */}
        {currentTab === 'tasks' && (
          <div className="space-y-6">
            {/* Header com Sub-Abas */}
            <div className="flex items-center gap-4 border-b border-[var(--border-subtle)] pb-3">
              <button
                onClick={() => setTasksSubTab('coordination')}
                className={`text-sm font-bold pb-1 transition ${
                  tasksSubTab === 'coordination'
                    ? 'text-[var(--text-primary)] border-b-2 border-[var(--accent)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                Coordination
              </button>
              <button
                onClick={() => setTasksSubTab('triggers')}
                className={`text-sm font-bold pb-1 transition ${
                  tasksSubTab === 'triggers'
                    ? 'text-[var(--text-primary)] border-b-2 border-[var(--accent)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                Triggers
              </button>
            </div>

            {tasksSubTab === 'coordination' && (
              <div className="rounded-[24px] bg-[var(--surface-card)] border border-[var(--border-subtle)] p-6 text-center space-y-6">
                {/* Animação com linhas pontilhadas e avatares (00:16 - 00:19) */}
                <div className="relative py-6 max-w-xs mx-auto">
                  <div className="flex justify-between items-center mb-6">
                    <div className="w-12 h-12 rounded-full bg-[var(--accent-soft)] border border-[var(--accent)] flex items-center justify-center text-[var(--accent)] shadow-lg">
                      <User size={20} strokeWidth={1.9} aria-hidden="true" />
                    </div>
                    <div className="w-12 h-12 rounded-full bg-[var(--accent-soft)] border border-[var(--accent)] flex items-center justify-center text-[var(--accent)] shadow-lg">
                      <Users size={20} strokeWidth={1.9} aria-hidden="true" />
                    </div>
                    <div className="w-12 h-12 rounded-full bg-[var(--accent-soft)] border border-[var(--accent)] flex items-center justify-center text-[var(--accent)] shadow-lg">
                      <Handshake size={20} strokeWidth={1.9} aria-hidden="true" />
                    </div>
                  </div>
                  <div className="w-16 h-16 mx-auto rounded-full bg-[var(--surface-elevated)] border-2 border-[var(--accent)] flex items-center justify-center text-[var(--accent)] shadow-2xl">
                    <MailCheck size={26} strokeWidth={1.8} aria-hidden="true" />
                  </div>
                  <div className="mt-2 text-[10px] font-mono text-[var(--text-secondary)]">Negociação autônoma via IA</div>
                </div>

                <div>
                  <h3 className="text-lg font-bold">Coordenação Inteligente de Reuniões</h3>
                  <p className="text-xs text-[var(--text-secondary)] mt-2 max-w-sm mx-auto">
                    {state.profile.assistantName} entra em contato direto com os participantes, propõe janelas ideais na
                    sua agenda e confirma o encontro sem você precisar intervir.
                  </p>
                </div>

                <button
                  onClick={() => setIsBookingFlowOpen(true)}
                  className="w-full py-3.5 rounded-full bg-[var(--inverted-bg)] text-[var(--inverted-text)] font-bold text-xs hover:bg-stone-200 transition shadow-lg"
                >
                  Start a coordination
                </button>
              </div>
            )}

            {tasksSubTab === 'triggers' && (
              <div className="rounded-[24px] bg-[var(--surface-card)] border border-[var(--border-subtle)] p-6 text-center space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-[var(--surface-elevated)] flex items-center justify-center text-[var(--accent)]">
                  <Zap size={26} strokeWidth={1.9} aria-hidden="true" />
                </div>
                <div>
                  <h4 className="font-bold text-base text-[var(--text-primary)]">Disparadores em Tempo Real</h4>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">
                    Crie gatilhos automáticos para lembretes de voos, entregas de encomendas ou alarmes contextuais.
                  </p>
                </div>
                <button
                  onClick={() => showToast('Módulo de Triggers ativo no plano Pro.')}
                  className="px-5 py-2.5 rounded-full bg-[var(--accent)] text-[var(--text-primary)] font-bold text-xs"
                >
                  + Novo Trigger
                </button>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* ABA 5: ME (CONFIGURAÇÕES, INTEGRAÇÕES E COTA FREE) */}
        {/* ========================================================= */}
        {currentTab === 'me' && (
          <div className="space-y-6">
            {/* Card de Conta Local */}
            <div className="rounded-[24px] bg-[var(--surface-card)] border border-[var(--border-subtle)] p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base text-[var(--text-primary)]">{state.profile.name}</h3>
                  <p className="text-xs text-[var(--text-secondary)]">Conta local · seus dados ficam neste aparelho</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider bg-[var(--overlay)] px-2 py-0.5 rounded text-[var(--text-primary)]">
                    GRÁTIS
                  </span>
                  <button
                    onClick={() => showToast('Ainda não há planos pagos. O app é gratuito e de código aberto.')}
                    className="px-3 py-1 rounded-full bg-[var(--accent)] text-[var(--text-primary)] text-xs font-bold shadow-md hover:bg-[var(--accent-hover)]"
                  >
                    Planos
                  </button>
                </div>
              </div>

              {/* Uso de IA: sem cota do app — o consumo é do provedor escolhido */}
              <div className="space-y-1.5 pt-2 border-t border-[var(--border-subtle)]">
                <div className="flex justify-between items-baseline text-xs">
                  <span className="text-[var(--text-secondary)]">Uso de IA</span>
                  <span className="text-[var(--accent)] font-bold">Configurável</span>
                </div>
                <p className="text-[11px] leading-relaxed text-[var(--text-secondary)]">
                  Sem cota do app. O consumo é da sua chave ou do proxy definido em Personalizar → IA.
                </p>
              </div>
            </div>

            {/* Acesso Rápido ao Booking Link */}
            <div
              onClick={() => setIsBookingFlowOpen(true)}
              className="rounded-[20px] bg-[var(--surface-card)] border border-[var(--border-subtle)] p-4 flex items-center justify-between cursor-pointer hover:bg-[var(--surface-elevated)] transition"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[var(--accent-soft)] flex items-center justify-center text-[var(--accent)]">
                  <Link2 size={18} strokeWidth={1.9} aria-hidden="true" />
                </div>
                <div>
                  <div className="font-bold text-sm text-[var(--text-primary)]">Booking Link (Estilo Calendly)</div>
                  <div className="text-xs text-[var(--text-secondary)]">Crie sua página pública com auxílio da IA</div>
                </div>
              </div>
              <ChevronRight size={18} className="text-[var(--text-secondary)]" aria-hidden="true" />
            </div>

            {/* Customização do Gato */}
            <div
              onClick={() => setIsAvatarModalOpen(true)}
              className="rounded-[20px] bg-[var(--surface-card)] border border-[var(--border-subtle)] p-4 flex items-center justify-between cursor-pointer hover:bg-[var(--surface-elevated)] transition"
            >
              <div className="flex items-center gap-3">
                <CatAvatar appearance={state.appearance} className="w-10 h-10" />
                <div>
                  <div className="font-bold text-sm text-[var(--text-primary)]">Personalizar Assistente</div>
                  <div className="text-xs text-[var(--text-secondary)]">Pelagens, roupas, personalidade e tom de voz</div>
                </div>
              </div>
              <ChevronRight size={18} className="text-[var(--text-secondary)]" aria-hidden="true" />
            </div>

            {/* Tema do aplicativo */}
            <div className="rounded-[24px] bg-[var(--surface-card)] border border-[var(--border-subtle)] p-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="font-semibold text-[var(--text-primary)]">Tema do aplicativo</div>
                  <div className="text-xs text-[var(--text-secondary)]">Paleta visual aplicada em todas as telas</div>
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--accent)]">
                  {THEME_OPTIONS.find((option) => option.id === state.theme)?.label}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {THEME_OPTIONS.map((option) => {
                  const active = state.theme === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => updateState((s) => ({ ...s, theme: option.id }))}
                      aria-pressed={active}
                      className={`press-scale rounded-2xl border p-2.5 text-left transition ${
                        active
                          ? 'border-[var(--accent)] ring-2 ring-[var(--accent-ring)]'
                          : 'border-[var(--border-subtle)] hover:border-[var(--border-strong)]'
                      }`}
                    >
                      <div className="mb-2 flex h-6 overflow-hidden rounded-lg border border-[var(--border-subtle)]">
                        {option.preview.map((color, index) => (
                          <span
                            key={`${option.id}-${index}`}
                            className="flex-1"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                      <div className="text-xs font-bold text-[var(--text-primary)]">{option.label}</div>
                      <div className="text-[10px] leading-tight text-[var(--text-secondary)]">{option.description}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Navegação / Menu */}
            <div className="rounded-[24px] bg-[var(--surface-card)] border border-[var(--border-subtle)] p-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="font-semibold text-[var(--text-primary)]">Menu de navegação</div>
                  <div className="text-xs text-[var(--text-secondary)]">Onde os menus aparecem em cada tela</div>
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--accent)]">
                  {LAYOUT_OPTIONS.find((option) => option.id === navLayout)?.label}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {LAYOUT_OPTIONS.map((option) => {
                  const active = navLayout === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => updateState((s) => ({ ...s, layout: option.id }))}
                      aria-pressed={active}
                      className={`press-scale rounded-2xl border p-2.5 text-left transition ${
                        active
                          ? 'border-[var(--accent)] ring-2 ring-[var(--accent-ring)]'
                          : 'border-[var(--border-subtle)] hover:border-[var(--border-strong)]'
                      }`}
                    >
                      <LayoutPreview layout={option.id} />
                      <div className="mt-2 text-xs font-bold text-[var(--text-primary)]">{option.label}</div>
                      <div className="text-[10px] leading-tight text-[var(--text-secondary)]">{option.hint}</div>
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => setIsOnboardingOpen(true)}
                className="text-xs font-semibold text-[var(--text-secondary)] underline underline-offset-2 hover:text-[var(--accent)]"
              >
                Rever boas-vindas (tema, assistente e menu em passos)
              </button>
            </div>

            {/* Seções de Configuração (itens planejados, sem integração ativa) */}
            <div className="rounded-[24px] bg-[var(--surface-card)] border border-[var(--border-subtle)] divide-y divide-[var(--border-subtle)] text-sm">
              <div className="flex items-center justify-between px-4 pt-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                  Integrações planejadas
                </span>
                <span className="rounded-full border border-[var(--border-strong)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                  Demonstração
                </span>
              </div>
              {/* Calendários */}
              <div className="p-4 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-[var(--text-primary)]">Calendários</div>
                  <div className="text-xs text-[var(--text-secondary)]">Sincronização com Google Calendar</div>
                </div>
                <span className="text-xs text-[var(--text-secondary)]">Em breve</span>
              </div>

              {/* Contatos */}
              <div className="p-4 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-[var(--text-primary)]">Contatos</div>
                  <div className="text-xs text-[var(--text-secondary)]">Importar da agenda ou criar contatos</div>
                </div>
                <span className="text-xs text-[var(--text-secondary)]">Em breve</span>
              </div>

              {/* Integrações */}
              <div className="p-4 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-[var(--text-primary)]">Integrações</div>
                  <div className="text-xs text-[var(--text-secondary)]">Localização, Gmail e Outlook</div>
                </div>
                <span className="text-xs text-[var(--text-secondary)]">Em breve</span>
              </div>

              {/* Geral */}
              <div className="p-4 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-[var(--text-primary)]">Geral</div>
                  <div className="text-xs text-[var(--text-secondary)]">Notificação 15 min antes, idioma e tema</div>
                </div>
                <span className="text-xs text-[var(--text-secondary)]">Em breve</span>
              </div>
            </div>

            {/* Exportar Backup */}
            <div className="pt-2 text-center">
              <button
                onClick={() => {
                  const exportable = toExportableState(state);
                  const blob = new Blob([JSON.stringify(exportable, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'assistant-cat-backup.json';
                  a.click();
                  showToast('Backup exportado (sem sua chave de IA).');
                }}
                className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] underline font-mono"
              >
                Exportar Backup de Dados (JSON Local)
              </button>
            </div>

            {/* Rodapé de privacidade e documentos legais */}
            <div className="pt-1 space-y-2 text-center">
              <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
                Seus dados ficam neste dispositivo e a chave de IA não vai no backup. Ao usar um
                provedor de IA, o texto da sua mensagem é enviado ao provedor escolhido.
              </p>
              <div className="flex items-center justify-center gap-3 text-xs">
                <a
                  href="./termos.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--text-secondary)] underline hover:text-[var(--text-primary)]"
                >
                  Termos de Uso
                </a>
                <a
                  href="./privacidade.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--text-secondary)] underline hover:text-[var(--text-primary)]"
                >
                  Política de Privacidade
                </a>
              </div>
            </div>
          </div>
        )}
      </main>
      </div>

      {/* ========================================================= */}
      {/* BARRA DE NAVEGAÇÃO INFERIOR FLUTUANTE (FLOATING PILL TAB BAR) */}
      {/* ========================================================= */}
      <div className={bottomNavVisibility}>
        <FloatingBottomBar
          currentTab={currentTab}
          onChangeTab={(tab) => setCurrentTab(tab)}
          badgeCounts={{ calendar: 3 }}
        />
      </div>

      {/* ========================================================= */}
      {/* MODAIS INTEGRADOS */}
      {/* ========================================================= */}

      {/* 1. Modal Meu Assistente: Personalização do Assistente com Carrossel */}
      <AvatarModal
        isOpen={isAvatarModalOpen}
        onClose={() => setIsAvatarModalOpen(false)}
        appearance={state.appearance}
        profile={state.profile}
        autoSpeak={state.autoSpeak || false}
        ai={state.ai}
        onSave={async (newAppearance, newProfile, autoSpeak, ai) => {
          await updateState((s) => ({
            ...s,
            appearance: newAppearance,
            profile: newProfile,
            autoSpeak,
            ai
          }));
          showToast('Assistente atualizado com sucesso!');
        }}
      />

      {/* 2. Modal Notifications: Central de Avisos com 4 Cards */}
      <NotificationsModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
      />

      {/* 3. Bottom Sheet do Botão + */}
      <BottomSheet
        isOpen={isBottomSheetOpen}
        onClose={() => setIsBottomSheetOpen(false)}
        onSelectTool={(tool) => {
          setIsBottomSheetOpen(false);
          if (tool === 'coordination') {
            setCurrentTab('tasks');
            setTasksSubTab('coordination');
          } else if (tool === 'todo') {
            setCurrentTab('calendar');
            setCalendarSubTab('todos');
            // Abre direto a criação manual de tarefa, em vez de só navegar.
            setEditingTask({ due: Domain.civilDate(), priority: 'normal' });
            setTaskModalOpen(true);
          } else if (tool === 'trigger') {
            setCurrentTab('tasks');
            setTasksSubTab('triggers');
          } else {
            showToast(`Ferramenta '${tool}' acionada!`);
          }
        }}
      />

      {/* 4. Fluxo de Criação de Link de Agendamento (Booking Flow) */}
      <BookingFlow
        isOpen={isBookingFlowOpen}
        onClose={() => setIsBookingFlowOpen(false)}
        assistantName={state.profile.assistantName}
      />

      {/* 5. Gaveta de Histórico de Chats  */}
      {isChatsDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-start bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-xs h-full bg-[var(--bg-primary)] border-r border-[var(--border-subtle)] p-5 flex flex-col justify-between shadow-2xl animate-slide-right">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-[var(--border-subtle)]">
                <h3 className="font-bold text-base text-[var(--text-primary)]">Chats</h3>
                <button
                  onClick={() => setIsChatsDrawerOpen(false)}
                  aria-label="Fechar histórico de chats"
                  className="w-11 h-11 rounded-full bg-[var(--surface-card)] text-[var(--text-primary)] hover:text-[var(--text-primary)] flex items-center justify-center border border-[var(--border-strong)]"
                >
                  <X size={14} aria-hidden="true" />
                </button>
              </div>

              <div className="mt-4 space-y-2">
                <div className="rounded-xl bg-[var(--surface-elevated)] p-3 border border-[var(--border-strong)] cursor-pointer">
                  <div className="font-bold text-xs text-[var(--text-primary)]">Call com o Laércio</div>
                  <div className="text-[11px] text-[var(--text-secondary)] truncate">O Laércio pediu para mudar para as 14:30</div>
                </div>
                <div className="rounded-xl bg-[var(--surface-card)] p-3 border border-[var(--border-subtle)] cursor-pointer hover:bg-[var(--surface-elevated)]">
                  <div className="font-bold text-xs text-[var(--text-primary)]">Planejamento da Semana</div>
                  <div className="text-[11px] text-[var(--text-secondary)] truncate">Revisão de metas e retrospectiva</div>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setIsChatsDrawerOpen(false);
                showToast('Novo chat iniciado.');
              }}
              className="w-full py-3 rounded-full bg-[var(--accent)] text-[var(--text-primary)] font-bold text-xs shadow-lg hover:bg-[var(--accent-hover)]"
            >
              + Chat
            </button>
          </div>
        </div>
      )}

      {/* 6. Modal de Edição de Evento */}
      {eventModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-[24px] bg-[var(--surface-card)] border border-[var(--border-strong)] p-6 shadow-2xl text-[var(--text-primary)]">
            <h3 className="font-bold text-base mb-4">Adicionar / Editar Compromisso</h3>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const title = (form.elements.namedItem('title') as HTMLInputElement).value;
                const date = (form.elements.namedItem('date') as HTMLInputElement).value;
                const time = (form.elements.namedItem('time') as HTMLInputElement).value;
                const duration = Number((form.elements.namedItem('duration') as HTMLInputElement).value) || 60;
                const notes = (form.elements.namedItem('notes') as HTMLTextAreaElement).value;
                const reminderValue = (form.elements.namedItem('reminder') as HTMLSelectElement).value;
                const reminderMinutes = reminderValue === 'off' ? null : Number(reminderValue) || null;
                const permissionPromise = reminderMinutes ? ensureNotificationPermission() : null;

                const newEv: CalendarEvent = {
                  id: editingEvent?.id || uid(),
                  title,
                  date,
                  time,
                  duration,
                  notes,
                  recurrence: 'none',
                  reminderMinutes
                };
                const nextEvents = editingEvent?.id
                  ? state.events.map((ev) => (ev.id === editingEvent.id ? newEv : ev))
                  : [...state.events, newEv];

                await updateState((s) => ({ ...s, events: nextEvents }));
                setEventModalOpen(false);
                showToast('Evento salvo com sucesso!');
                if (permissionPromise) {
                  const granted = await permissionPromise;
                  await syncEventReminders(nextEvents);
                  if (!granted) {
                    showToast('Evento salvo. Ative as notificações para receber o lembrete.');
                  }
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="text-xs font-bold text-[var(--text-secondary)]">Título do Evento</label>
                <input
                  name="title"
                  defaultValue={editingEvent?.title || ''}
                  required
                  className="w-full rounded-xl bg-[var(--surface-elevated)] border border-[var(--border-strong)] p-2.5 text-sm text-[var(--text-primary)] mt-1 focus:border-[var(--accent)] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[var(--text-secondary)]">Data</label>
                  <input
                    name="date"
                    type="date"
                    defaultValue={editingEvent?.date || Domain.civilDate()}
                    required
                    className="w-full rounded-xl bg-[var(--surface-elevated)] border border-[var(--border-strong)] p-2.5 text-sm text-[var(--text-primary)] mt-1 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[var(--text-secondary)]">Horário de Início</label>
                  <input
                    name="time"
                    type="time"
                    defaultValue={editingEvent?.time || '14:30'}
                    required
                    className="w-full rounded-xl bg-[var(--surface-elevated)] border border-[var(--border-strong)] p-2.5 text-sm text-[var(--text-primary)] mt-1 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[var(--text-secondary)]">Duração (minutos)</label>
                <input
                  name="duration"
                  type="number"
                  defaultValue={editingEvent?.duration || 60}
                  className="w-full rounded-xl bg-[var(--surface-elevated)] border border-[var(--border-strong)] p-2.5 text-sm text-[var(--text-primary)] mt-1 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[var(--text-secondary)]">Lembrete</label>
                <select
                  name="reminder"
                  defaultValue={
                    editingEvent?.reminderMinutes != null
                      ? String(editingEvent.reminderMinutes)
                      : editingEvent?.id
                        ? 'off'
                        : '15'
                  }
                  className="w-full rounded-xl bg-[var(--surface-elevated)] border border-[var(--border-strong)] p-2.5 text-sm text-[var(--text-primary)] mt-1 focus:border-[var(--accent)] focus:outline-none"
                >
                  <option value="off">Sem lembrete</option>
                  <option value="5">5 minutos antes</option>
                  <option value="10">10 minutos antes</option>
                  <option value="15">15 minutos antes</option>
                  <option value="30">30 minutos antes</option>
                  <option value="60">60 minutos antes</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-[var(--text-secondary)]">Notas ou Pauta</label>
                <textarea
                  name="notes"
                  defaultValue={editingEvent?.notes || ''}
                  rows={2}
                  className="w-full rounded-xl bg-[var(--surface-elevated)] border border-[var(--border-strong)] p-2.5 text-sm text-[var(--text-primary)] mt-1 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEventModalOpen(false)}
                  className="rounded-full bg-[var(--overlay-weak)] border border-[var(--border-strong)] px-4 py-2 text-xs font-semibold text-[var(--text-primary)] hover:text-[var(--text-primary)]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-[var(--accent)] px-5 py-2 text-xs font-bold text-[var(--text-primary)] hover:bg-[var(--accent-hover)]"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. Modal de Edição de Tarefa */}
      {taskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-[24px] bg-[var(--surface-card)] border border-[var(--border-strong)] p-6 shadow-2xl text-[var(--text-primary)]">
            <h3 className="font-bold text-base mb-4">Adicionar / Editar Tarefa</h3>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const title = (form.elements.namedItem('title') as HTMLInputElement).value;
                const due = (form.elements.namedItem('due') as HTMLInputElement).value;
                const priority = (form.elements.namedItem('priority') as HTMLSelectElement).value as Priority;
                const repeatUnit = (form.elements.namedItem('repeatUnit') as HTMLSelectElement).value;
                const repeatAmount = Number((form.elements.namedItem('repeatAmount') as HTMLInputElement).value);

                const newTask: Task = {
                  id: editingTask?.id || uid(),
                  title,
                  due: due || undefined,
                  priority,
                  done: false,
                  repeatAfter: repeatUnit ? { unit: repeatUnit as any, amount: repeatAmount || 1 } : null
                };

                await updateState((s) => ({
                  ...s,
                  tasks: editingTask?.id
                    ? s.tasks.map((t) => (t.id === editingTask.id ? newTask : t))
                    : [...s.tasks, newTask]
                }));
                setTaskModalOpen(false);
                showToast('Tarefa salva com sucesso!');
              }}
              className="space-y-4"
            >
              <div>
                <label className="text-xs font-bold text-[var(--text-secondary)]">Título</label>
                <input
                  name="title"
                  defaultValue={editingTask?.title || ''}
                  required
                  className="w-full rounded-xl bg-[var(--surface-elevated)] border border-[var(--border-strong)] p-2.5 text-sm text-[var(--text-primary)] mt-1 focus:border-[var(--accent)] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[var(--text-secondary)]">Prazo (opcional)</label>
                  <input
                    name="due"
                    type="date"
                    defaultValue={editingTask?.due || ''}
                    className="w-full rounded-xl bg-[var(--surface-elevated)] border border-[var(--border-strong)] p-2.5 text-sm text-[var(--text-primary)] mt-1 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[var(--text-secondary)]">Prioridade</label>
                  <select
                    name="priority"
                    defaultValue={editingTask?.priority || 'normal'}
                    className="w-full rounded-xl bg-[var(--surface-elevated)] border border-[var(--border-strong)] p-2.5 text-sm text-[var(--text-primary)] mt-1 focus:outline-none"
                  >
                    <option value="normal">Normal</option>
                    <option value="high">Alta Prioridade</option>
                    <option value="low">Baixa Prioridade</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[var(--text-secondary)]">Repetir a cada</label>
                  <input
                    name="repeatAmount"
                    type="number"
                    min="1"
                    defaultValue={editingTask?.repeatAfter?.amount || 1}
                    className="w-full rounded-xl bg-[var(--surface-elevated)] border border-[var(--border-strong)] p-2.5 text-sm text-[var(--text-primary)] mt-1 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[var(--text-secondary)]">Intervalo</label>
                  <select
                    name="repeatUnit"
                    defaultValue={editingTask?.repeatAfter?.unit || ''}
                    className="w-full rounded-xl bg-[var(--surface-elevated)] border border-[var(--border-strong)] p-2.5 text-sm text-[var(--text-primary)] mt-1 focus:outline-none"
                  >
                    <option value="">Não repete</option>
                    <option value="days">Dias</option>
                    <option value="weeks">Semanas</option>
                    <option value="months">Meses</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setTaskModalOpen(false)}
                  className="rounded-full bg-[var(--overlay-weak)] border border-[var(--border-strong)] px-4 py-2 text-xs font-semibold text-[var(--text-primary)] hover:text-[var(--text-primary)]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-[var(--accent)] px-5 py-2 text-xs font-bold text-[var(--text-primary)] hover:bg-[var(--accent-hover)]"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. Modal: Retrospectiva Semanal Detalhada */}
      {recapModalOpen && recap && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-[24px] bg-[var(--surface-card)] border border-[var(--border-strong)] p-6 shadow-2xl text-[var(--text-primary)] space-y-4">
            <h3 className="font-bold text-base">Retrospectiva Semanal Detalhada</h3>
            <pre className="rounded-2xl bg-[var(--surface-elevated)] border border-[var(--border-subtle)] p-4 text-xs font-mono text-[var(--text-primary)] whitespace-pre-wrap leading-relaxed max-h-72 overflow-y-auto">
              {recap.summaryText}
            </pre>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setRecapModalOpen(false)}
                className="rounded-full bg-[var(--overlay-weak)] border border-[var(--border-strong)] px-4 py-2 text-xs font-semibold text-[var(--text-primary)] hover:text-[var(--text-primary)]"
              >
                Fechar
              </button>
              <button
                onClick={handleCopyRecap}
                className="rounded-full bg-[var(--accent)] px-5 py-2 text-xs font-bold text-[var(--text-primary)] hover:bg-[var(--accent-hover)]"
              >
                Copiar Resumo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. Boas-vindas de primeiro acesso (ou refeitas a partir de Me) */}
      <OnboardingFlow
        open={isOnboardingOpen || (!loading && state.onboarded === false)}
        theme={state.theme}
        layout={navLayout}
        appearance={state.appearance}
        assistantName={state.profile.assistantName}
        userName={state.profile.name}
        autoSpeak={state.autoSpeak || false}
        defaultDuration={state.defaultDuration || 60}
        onSelectTheme={(id) => updateState((s) => ({ ...s, theme: id }))}
        onSelectLayout={(id) => updateState((s) => ({ ...s, layout: id }))}
        onSelectAppearance={(appearance) => updateState((s) => ({ ...s, appearance }))}
        onSetAssistantName={(name) =>
          updateState((s) => ({ ...s, profile: { ...s.profile, assistantName: name } }))
        }
        onSetUserName={(name) =>
          updateState((s) => ({ ...s, profile: { ...s.profile, name } }))
        }
        onSetAutoSpeak={(enabled) => updateState((s) => ({ ...s, autoSpeak: enabled }))}
        onSetDefaultDuration={(minutes) => updateState((s) => ({ ...s, defaultDuration: minutes }))}
        onFinish={async () => {
          setIsOnboardingOpen(false);
          await updateState((s) => ({ ...s, onboarded: true }));
          showToast('Boas-vindas concluídas. Bem-vindo!');
        }}
      />
    </div>
  );
}

export default App;
