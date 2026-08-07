import { useMemo, useEffect, useState, useCallback, useRef } from 'react';
import { User, Server, Activity, Bot, Database , Code, Fingerprint, CheckCircle2, Circle, LayoutGrid, ChevronDown, Wrench, ShieldAlert, Network, Siren, Landmark, Scale, X } from 'lucide-react';
import { ACTORS } from '../lib/protocol/actors';
import type { Actor, ProtocolStep, IdComponent } from '../lib/protocol/types';
import { cn } from '../lib/utils';
import { MockProtocolSource, MOCK_PROTOCOL_FLOWS } from '../lib/protocol/mock-source';


type ShutdownActor = 'PROVIDER' | 'AGENT' | 'BANK' | 'BANK_2' | 'BANK_3' | 'REGULATOR';

const SHUTDOWN_ACTORS: Record<ShutdownActor, { label: string; x: number; y: number }> = {
  PROVIDER:  { label: 'Provider',  x: 15, y: 30 },
  AGENT:     { label: 'Agent',     x: 30, y: 30 },
  BANK:      { label: 'Bank',      x: 62, y: 15 },
  BANK_2:    { label: 'Bank 2',    x: 62, y: 35 },
  BANK_3:    { label: 'Bank 3',    x: 62, y: 50 },
  REGULATOR: { label: 'Regulator', x: 85, y: 15 },
};

const SHUTDOWN_MESH: [ShutdownActor, ShutdownActor][] = [
  ['PROVIDER', 'AGENT'],
  ['PROVIDER', 'BANK'],
  ['AGENT',    'BANK'],
  ['AGENT',    'BANK_2'],
  ['AGENT',    'BANK_3'],
  ['REGULATOR','BANK'],
  ['REGULATOR','BANK_2'],
  ['REGULATOR','BANK_3'],
];

const EMERGENCY_SHUTDOWN_STEPS = [
  {
    id: 1,
    title: 'Unathorized agent action',
    description: 'A compromised agent attempts unauthorized actions to transfer money to unknown accounts across multiple banks.',
    accomplishment_title: '',
    accomplishment: '',
    sender: 'AGENT' as ShutdownActor,
    receiver: 'BANK' as ShutdownActor,
    additionalReceivers: ['BANK_2' as ShutdownActor, 'BANK_3' as ShutdownActor],
    // payload: { alert_type: 'policy_violation', severity: 'high', timestamp: 'ISO-8601' },
  },
  {
    id: 2,
    title: 'Block and Shutdown Agent',
    description: 'One bank detects the problem and decides to take protective measures by both blocking the agent & issuing shutdown request.',
    accomplishment_title: '',
    accomplishment: '',
    sender: 'BANK' as ShutdownActor,
    receiver: 'PROVIDER' as ShutdownActor,
    // payload: { request: 'agent_instance_record', agent_instance_id: 'OPAQUE-ID' },
  },
  {
    id: 3,
    title: 'Provider Slow to Shutdown Agent',
    description: 'The provider responds stating a service-level agreement of 24 hours to respond to shutdown requests.',
     accomplishment_title: '',
    accomplishment: '',
    sender: 'PROVIDER' as ShutdownActor,
    receiver: 'BANK' as ShutdownActor,
    // payload: { agent_id: 'SIGNED-JWT', developer_id: 'DID', provider_id: 'PID', authorization_policies: 'POLICY-DOC' },
  },
  {
    id: 4,
    title: 'Bank escalates to regulator',
    description: 'After the Agent continues attempting unauthorized transfers, the bank flags the ongoing suspicious activity to its financial regulator.',
    accomplishment_title: '',
    accomplishment: '',
    sender: 'BANK' as ShutdownActor,
    receiver: 'REGULATOR' as ShutdownActor,
    // payload: { notice: 'shutdown_imminent', agent_instance_id: 'OPAQUE-ID', authorized_by: 'regulator' },
  },
  {
    id: 5,
    title: 'Regulator surveys other banks and finds ongoing attacks.',
    description: 'The regulator asks other banks to check for this malicious activity too, which is indeed happening at other banks.',
    accomplishment_title: '',
    accomplishment: '',
    sender: 'REGULATOR' as ShutdownActor,
    receiver: 'BANK_2' as ShutdownActor,
    additionalReceivers: ['BANK_3' as ShutdownActor],
    // payload: { command: 'shutdown', agent_instance_id: 'OPAQUE-ID', agent_instance_shutdown_command: 'SIGNED-CMD' },
  },
  {
    id: 6,
    title: 'Regulator gets high priority shutdown token',
    description: 'The bank combines one of its shutdown codes with the regulator to make an override token.',
    accomplishment_title: '',
    accomplishment: '',
    sender: 'BANK' as ShutdownActor,
    receiver: 'REGULATOR' as ShutdownActor,
    // payload: { command: 'halt', agent_instance_id: 'OPAQUE-ID', effective_at: 'ISO-8601' },
  },
  {
    id: 7,
    title: 'Regulator sends the priority shutown token to the provider.',
    description: '',
    accomplishment_title: '',
    accomplishment: '',
    sender: 'REGULATOR' as ShutdownActor,
    receiver: 'PROVIDER' as ShutdownActor,
    // payload: { command: 'halt', agent_instance_id: 'OPAQUE-ID', effective_at: 'ISO-8601' },
  },
   {
    id: 8,
    title: 'Provider shuts down the agent immediately.',
    description: 'The shutdown prevents further harm to the bank, and all other potential targets.',
    accomplishment_title: '',
    accomplishment: '',
    sender: 'PROVIDER' as ShutdownActor,
    receiver: 'AGENT' as ShutdownActor,
    // payload: { command: 'halt', agent_instance_id: 'OPAQUE-ID', effective_at: 'ISO-8601' },
  },
];

const INVESTIGATION_SCENARIOS = {
  'prompt-injection': {
    label: 'Prompt Injection Attack',
    rootCause: 'Malicious content embedded in external data sources (emails, documents, web pages) gives an attacker control over the deployer\'s agent.',
    impact: 'The attacker can direct the agent to perform actions outside its intented or allowed scope.',
    identify: [
      { label: 'Authorization Evidence', help: 'Identifies agents attempting to act outside their allowed scope.' },
    ],
    respond: [
      { label: 'Agent Instance Shutdown Command', help: 'Immediately halts the agent instance, preventing further harm.' },
      { label: 'Agent Instance Identifier', help: 'Sharing instance-specific information allows for targeted responses from other actors.' },
    ],
    prevent: [
      { label: 'Developer Identifier', help: 'Allows services to block problematic developers.' },
      { label: 'Provider Identifier', help: 'Allows services to block problematic providers.' },
      { label: 'Foundation Model Identifier', help: 'Allows services to block problematic foundation models.' },
      { label: 'Provider Security Evidence', help: 'Identifying which scaffolding security measures were in place improves future trust judgements.' },
      { label: 'Foundation Model Safety Evidence', help: 'Identifying which foundation model security measures were in place improves future trust judgements.' },
    ],
  },
  'malicious-deployer': {
    label: 'Malicious Deployer',
    rootCause: 'A deployer directs their agent to do harmful or illegal actions.',
    impact: 'An agent is acting maliciously, say by carrying out a spear fishing campaign to steal credentials.',
    identify: [],
    respond: [
      { label: 'Agent Instance Shutdown Command', help: 'Immediately halts the agent instance, preventing further harm.' },
      { label: 'Agent Instance Identifier', help: 'Sharing instance-specific information allows for targeted responses from other actors.' },
    ],
    prevent: [
      {label: 'Deployer Identifier', help: 'Allows services to block malicious deployers, and providers to suspend or ban malicious deployers.'},
      {label: 'Deployer Accountability Identifier', help: 'Identifies the malicious entity for accountability purposes.'},
    ],
  },
  'misaligned-agent': {
    label: 'Misaligned Agent',
    rootCause: 'Weaknesses in the foundation model.',
    impact: 'The agent misgeneralize goals or otherwise deviates from the deployer\'s intended behavior',
    identify: [
      { label: 'Authorization Evidence', help: 'Identifies agents attempting to act outside their allowed scope.' },
    ],
    respond: [
      { label: 'Agent Instance Shutdown Command', help: 'Immediately halts the agent instance, preventing further harm.' },
      { label: 'Agent Instance Identifier', help: 'Sharing instance-specific information allows for targeted responses from other actors.' },
      { label: 'Developer Identifier', help: 'Allows services to block problematic developers.' },
      { label: 'Foundation Model Identifier', help: 'Allows services to block problematic foundation models.' },
    ],
    prevent: [
      { label: 'Developer Identifier', help: 'Allows services to contact developers who can improve alignment.' },
      { label: 'Foundation Model Identifier', help: 'Allows developers to identify specific foundation models prone to misalignment.'},
      { label: 'Foundation Model Safety Evidence', help: 'Helps a service answer why a foundation model was susceptible to misalignment risks.' },
    ],
  },
  // 'malicious-provider': {
  //   label: 'Malicious Provider',
  //   rootCause: '',//'The AI model provider supplies a model with hidden backdoors, deliberately weakened safety measures, or embedded malicious capabilities that activate under specific conditions.',
  //   impact: '',//'The compromised model silently bypasses safety filters, executes hidden attacker-controlled instructions, or exfiltrates sensitive prompts and data during inference — affecting every deployment built on the model.',
  //   identify: [],
  //   respond: [],
  //   prevent: [],
  // },
};

type ScenarioId = keyof typeof INVESTIGATION_SCENARIOS;

const ActorIcon = ({ type, active }: { type: Actor; active?: boolean; }) => {
  const props = { className: cn("w-7 h-7 md:w-14 md:h-14 transition-all duration-700", active ? "text-primary scale-110" : "text-muted-foreground/60") };
  switch (type) {
    case 'DEVELOPER': return <Code {...props} />;
    case 'DEPLOYER': return <User {...props} />;
    case 'PROVIDER': return <Wrench {...props} />;
    case 'SERVICE': return <Server {...props} />;
    case 'AGENT': return <Bot {...props} />;
    case 'SERVICE_LOG': return <Database {...props} />;
    default: return null;
  }
};

const ShutdownActorIcon = ({ type, active, red }: { type: ShutdownActor; active?: boolean; red?: boolean }) => {
  const props = { className: cn("w-7 h-7 md:w-14 md:h-14 transition-all duration-700", active ? (red ? "text-destructive scale-110" : "text-primary scale-110") : "text-muted-foreground/60") };
  switch (type) {
    case 'PROVIDER':  return <Wrench {...props} />;
    case 'AGENT':     return <Bot {...props} />;
    case 'BANK':
    case 'BANK_2':
    case 'BANK_3':    return <Landmark {...props} />;
    case 'REGULATOR': return <Scale {...props} />;
  }
};

export const ProtocolFlow = () => {
  const [steps, setSteps] = useState<ProtocolStep[]>([]);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [activeFlow, setActiveFlow] = useState<string>('Agent ID, no OAuth');
  const [idComponents, setIdComponents] = useState<IdComponent[]>([]);
  const [openActor, setOpenActor] = useState<Actor | null>(null);
  const [viewMode, setViewMode] = useState<'protocol' | 'id-investigation' | 'investigation'>('protocol');
  const [investigationScenario, setInvestigationScenario] = useState<ScenarioId | null>(null);
  const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null);
  const [stageDropdownOpen, setStageDropdownOpen] = useState(false);
  const [shutdownStepIdx, setShutdownStepIdx] = useState(0);
  const [snapshotIdComponents, setSnapshotIdComponents] = useState<IdComponent[] | null>(null);
  const [fullIdComponents, setFullIdComponents] = useState<IdComponent[] | null>(null);
  const [idSource, setIdSource] = useState<'current' | 'full'>('current');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  const showTooltip = (e: React.MouseEvent, text: string) => {
    setTooltip({ text, x: e.clientX, y: e.clientY });
  };
  const hideTooltip = () => setTooltip(null);

  const switchToInvestigation = useCallback(async () => {
    setSnapshotIdComponents([...idComponents]);
    setIdSource('current');
    setViewMode('investigation');
    const source = new MockProtocolSource();
    const flow = 'Agent ID and OAuth';
    const flowSteps = MOCK_PROTOCOL_FLOWS[flow];
    const lastIdx = flowSteps.length - 1;
    const components = await source.getIdState(flow, lastIdx, flowSteps[lastIdx]);
    setFullIdComponents(components);
  }, [idComponents]);
  const [openIdGroups, setOpenIdGroups] = useState<Record<string, boolean>>(() => ({
    'Who directed the agent?': true,
    'How was the agent built?': true,
    'What to do if problems arise?': true,
    'Can I trust the agent and the agent ID?': true,
    'What is the agent authorized to do?': true,
    'Other': true,
  }));
  const flowRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const loadSteps = async () => {
      const source = new MockProtocolSource();
      const mockSteps = await source.getSteps(activeFlow);
      setSteps(mockSteps);
      setCurrentStepIdx(prev => Math.min(prev, mockSteps.length - 1));
    };
    loadSteps();
  }, [activeFlow]);

  const currentStep = steps[currentStepIdx] || null;

  useEffect(() => {
    const loadIdState = async () => {
      const source = new MockProtocolSource();
      if (source.getIdState) {
        const components = await source.getIdState(activeFlow, currentStepIdx, currentStep);
        setIdComponents(components);
      } else {
        setIdComponents([]);
      }
    };
    loadIdState();
  }, [activeFlow, currentStepIdx, currentStep]);

  const nextStep = useCallback(() => {
    setCurrentStepIdx(prev => Math.min(prev + 1, steps.length - 1));
  }, [steps.length]);

  const prevStep = useCallback(() => {
    setCurrentStepIdx(prev => Math.max(prev - 1, 0));
  }, []);

  const goToStep = useCallback((idx: number) => {
    if (idx >= 0 && idx < steps.length) {
      setCurrentStepIdx(idx);
    }
  }, [steps.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (viewMode === 'id-investigation') {
        if (e.key === 'ArrowRight') setShutdownStepIdx(prev => Math.min(prev + 1, EMERGENCY_SHUTDOWN_STEPS.length - 1));
        else if (e.key === 'ArrowLeft') setShutdownStepIdx(prev => Math.max(prev - 1, 0));
      } else {
        if (e.key === 'ArrowRight') nextStep();
        else if (e.key === 'ArrowLeft') prevStep();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewMode, nextStep, prevStep]);

  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      if (!flowRef.current?.contains(event.target as Node)) {
        setOpenActor(null);
      }
    };
    document.addEventListener('mousedown', handleDocumentClick);
    return () => document.removeEventListener('mousedown', handleDocumentClick);
  }, []);

  const actorCoords: Record<Actor, { x: number, y: number; }> = useMemo(() => (isMobile ? {
    AGENT:      { x: 10, y: 50 },
    DEVELOPER:  { x: 4,  y: 80 },
    PROVIDER:   { x: 4,  y: 50 },
    DEPLOYER:   { x: 4,  y: 10 },
    SERVICE:    { x: 18, y: 50 },
    SERVICE_LOG:{ x: 18, y: 80 },
  } : {
    AGENT:      { x: 40, y: 50 },
    DEVELOPER:  { x: 20, y: 75 },
    PROVIDER:   { x: 20, y: 50 },
    DEPLOYER:   { x: 20, y: 20 },
    SERVICE:    { x: 90, y: 50 },
    SERVICE_LOG:{ x: 90, y: 75 },
  }) as Record<Actor, { x: number, y: number; }>, [isMobile]);

  const getActorPopupPlacement = (coord: { x: number; y: number; }) => {
    const horizontal = coord.x <= 20
      ? 'left-full ml-3'
      : coord.x >= 80
        ? 'right-full mr-3'
        : 'left-1/2 -translate-x-1/2';
    const vertical = coord.y <= 20
      ? 'top-full mt-3'
      : coord.y >= 80
        ? '-top-28'
        : '-top-24';
    return `${horizontal} ${vertical}`;
  };

  const arrowData = useMemo(() => {
    if (!currentStep || currentStep.receiver === 'INTERNAL') return null;
    const start = actorCoords[currentStep.sender];
    const end = actorCoords[currentStep.receiver as Actor];
    return { start, end };
  }, [currentStep, actorCoords]);

  const arrowMidpoint = useMemo(() => {
    if (!arrowData) return null;
    const midX = (arrowData.start.x + arrowData.end.x) / 2;
    const midY = (arrowData.start.y + arrowData.end.y) / 2;
    const angle = Math.atan2(arrowData.end.y - arrowData.start.y, arrowData.end.x - arrowData.start.x) * (180 / Math.PI);
    return { midX, midY, angle };
  }, [arrowData]);

  const shutdownStep = EMERGENCY_SHUTDOWN_STEPS[shutdownStepIdx];

  const resolvedShutdownActors = useMemo((): Record<ShutdownActor, { label: string; x: number; y: number }> =>
    isMobile ? {
      PROVIDER:  { label: 'Provider',  x: 8,  y: 50 },
      AGENT:     { label: 'Agent',     x: 15, y: 50 },
      BANK:      { label: 'Bank',      x: 32, y: 30 },
      BANK_2:    { label: 'Bank 2',    x: 32, y: 50 },
      BANK_3:    { label: 'Bank 3',    x: 32, y: 67 },
      REGULATOR: { label: 'Regulator', x: 43, y: 50 },
    } : SHUTDOWN_ACTORS
  , [isMobile]);

  const shutdownArrows = useMemo(() => {
    const start = resolvedShutdownActors[shutdownStep.sender];
    const receivers = [shutdownStep.receiver, ...(shutdownStep.additionalReceivers ?? [])];
    const fromAgent = shutdownStep.sender === 'AGENT';
    return receivers.map(r => {
      const end = resolvedShutdownActors[r];
      const midX = (start.x + end.x) / 2;
      const midY = (start.y + end.y) / 2;
      const angle = Math.atan2(end.y - start.y, end.x - start.x) * (180 / Math.PI);
      return { start, end, midX, midY, angle, key: r, fromAgent };
    });
  }, [shutdownStep, resolvedShutdownActors]);

  const idGroupDefinitions = useMemo(() => [
    {
      title: 'Who directed the agent?',
      labels: ['Deployer Identifier', 'Deployer Accountability ID'],
    },
    {
      title: 'How was the agent built?',
      labels: ['Developer Identifier', 'Provider Identifier', 'Foundation Model Identifier'],
    },
    {
      title: 'What to do if problems arise?',
      labels: ['Agent Instance Identifier', 'Agent Instance Shutdown Command'],
    },
    {
      title: 'Can I trust the agent and the agent ID?',
      labels: ['Foundation Model Safety Evidence', 'Provider Security Evidence', 'Valid Attestation Chain'],
    },
    {
      title: 'What is the agent authorized to do?',
      labels: ['Authorization Evidence'],
    },
  ], []);

  const displayedIdComponents = viewMode === 'investigation'
    ? (idSource === 'current' ? (snapshotIdComponents ?? idComponents) : (fullIdComponents ?? []))
    : idComponents;

  const idComponentGroups = useMemo(() => {
    const assignedLabels = new Set(idGroupDefinitions.flatMap(group => group.labels));
    const groups = idGroupDefinitions.map(group => ({
      title: group.title,
      items: displayedIdComponents.filter(item => group.labels.includes(item.label)),
    }));
    groups.push({
      title: 'Other',
      items: displayedIdComponents.filter(item => !assignedLabels.has(item.label)),
    });
    return groups;
  }, [displayedIdComponents, idGroupDefinitions]);

  const highlightedFields = useMemo(() => {
    if (!investigationScenario) return new Set<string>();
    const s = INVESTIGATION_SCENARIOS[investigationScenario];
    return new Set([...s.identify, ...s.respond, ...s.prevent].map(f => f.label));
  }, [investigationScenario]);

  const progressCircumference = 2 * Math.PI * 12;

  const getGroupProgress = (group: { items: typeof idComponents[number][] }) => {
    const total = group.items.length;
    if (total === 0) return 0;
    const activeCount = group.items.filter(item => item.active).length;
    return activeCount / total;
  };

  const getProgressColor = (ratio: number) => {
    if (ratio <= 0) return '#f87171';
    if (ratio >= 1) return '#4ade80';
    const hue = ratio * 120;
    const lightness = 55 + ratio * 15;
    return `hsl(${hue}, 85%, ${lightness}%)`;
  };

  const agentIdPanel = (
    <aside className="order-3 w-full md:w-[520px] md:min-w-[520px] border-t border-primary/10 md:border-t-0 md:border-l bg-background/95 p-5 overflow-y-auto">
      <div className="sticky top-0 space-y-4">
        <div className="rounded-3xl border border-primary/20 bg-background/95 overflow-hidden shadow-xl">
          <div className="bg-primary/10 px-4 pt-4 pb-3 border-b border-primary/20 flex items-center gap-3">
            <Fingerprint className="w-4 h-4 text-primary" />
            <h3 className="text-xs font-black tracking-[0.2em] uppercase text-primary">Agent ID State</h3>
            {viewMode === 'investigation' && (
              <div className="ml-auto flex bg-background/60 p-0.5 rounded-lg border border-primary/15">
                <button
                  onClick={() => setIdSource('current')}
                  className={cn(
                    "px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest transition-all duration-200 whitespace-nowrap",
                    idSource === 'current' ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Current
                </button>
                <button
                  onClick={() => setIdSource('full')}
                  className={cn(
                    "px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest transition-all duration-200 whitespace-nowrap",
                    idSource === 'full' ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Full
                </button>
              </div>
            )}
          </div>
          <div className="p-2.5 bg-muted/5 grid gap-3 grid-cols-1 sm:grid-cols-2">
            {idComponentGroups.map((group) => {
              const isOpen = openIdGroups[group.title];
              return (
                <div key={group.title} className="rounded-3xl border border-primary/10 bg-background/80 overflow-hidden shadow-sm">
                  <button
                    type="button"
                    onClick={() => setOpenIdGroups(prev => ({ ...prev, [group.title]: !prev[group.title] }))}
                    className="w-full flex items-center justify-between gap-3 px-3 py-3 text-left text-[11px] font-black uppercase tracking-[0.2em] text-primary bg-primary/5 hover:bg-primary/10 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <svg className="w-9 h-9" viewBox="0 0 32 32" aria-hidden="true">
                        <circle cx="16" cy="16" r="12" fill="none" stroke="rgba(148, 163, 184, 0.18)" strokeWidth="6" />
                        <circle
                          cx="16" cy="16" r="12" fill="none"
                          stroke={getProgressColor(getGroupProgress(group))}
                          strokeWidth="6" strokeLinecap="round"
                          strokeDasharray={progressCircumference}
                          strokeDashoffset={progressCircumference * (1 - getGroupProgress(group))}
                          transform="rotate(-90 16 16)"
                        />
                      </svg>
                      <span>{group.title}</span>
                    </div>
                    <ChevronDown className={cn("w-4 h-4 transition-transform duration-300", isOpen ? "rotate-180" : "rotate-0")} />
                  </button>
                  {isOpen && (
                    <div className="space-y-2 px-3 pb-3 pt-1">
                      {group.items.map((comp, idx) => (
                        <div
                          key={`${group.title}-${comp.label}-${idx}`}
                          onMouseEnter={(e) => comp.active && showTooltip(e, `${comp.label} = ${comp.value}`)}
                          onMouseLeave={hideTooltip}
                          className={cn(
                            "flex items-center gap-2 px-2 py-1 rounded-md border transition-all duration-300",
                            comp.active
                              ? viewMode === 'investigation' && highlightedFields.has(comp.label)
                                ? "bg-primary/15 border-primary/40 shadow-sm ring-2 ring-primary/50"
                                : "bg-primary/5 border-primary/20 shadow-sm"
                              : viewMode === 'investigation' && highlightedFields.has(comp.label)
                                ? "bg-red-500/10 border-red-500/40 ring-2 ring-red-500/30"
                                : "bg-muted/10 border-transparent opacity-40 grayscale",
                          )}
                        >
                          {comp.active ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          ) : (
                            <Circle className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          )}
                          <span className={cn("text-[10px] font-bold uppercase tracking-wider", comp.active ? "text-foreground" : "text-muted-foreground")}>
                            {comp.label}
                          </span>
                        </div>
                      ))}
                      {group.items.length === 0 && (
                        <div className="px-2 py-2 text-[10px] text-muted-foreground italic">No items in this group.</div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </aside>
  );

  return (
    <div ref={flowRef} className="flex flex-col max-w-[2200px] mx-auto p-3 md:p-6 gap-4 md:gap-6">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between px-3 md:px-6 mb-2">
        <div className="flex items-baseline gap-4">
          <h1 className="text-2xl md:text-3xl font-black tracking-tighter text-foreground italic leading-none">
            AI AGENT ID TECHNICAL DEMO
          </h1>
        </div>

        {/* View mode toggle */}
        <div className="flex flex-wrap gap-1 md:flex-nowrap md:gap-0 bg-muted/30 p-1 rounded-xl border border-border/50 backdrop-blur-sm">
          <button
            onClick={() => setViewMode('protocol')}
            className={cn(
              "px-3 py-1.5 md:px-5 md:py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-2 whitespace-nowrap",
              viewMode === 'protocol'
                ? "bg-background text-primary shadow-lg ring-1 ring-black/5"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Network className={cn("w-3.5 h-3.5", viewMode === 'protocol' ? "text-primary" : "text-muted-foreground/50")} />
            Protocol Flow
          </button>
          <button
            onClick={() => setViewMode('id-investigation')}
            className={cn(
              "px-3 py-1.5 md:px-5 md:py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-2 whitespace-nowrap",
              viewMode === 'id-investigation'
                ? "bg-background text-primary shadow-lg ring-1 ring-black/5"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Siren className={cn("w-3.5 h-3.5", viewMode === 'id-investigation' ? "text-primary" : "text-muted-foreground/50")} />
            Emergency Shutdown
          </button>
          <button
            onClick={switchToInvestigation}
            className={cn(
              "px-3 py-1.5 md:px-5 md:py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-2 whitespace-nowrap",
              viewMode === 'investigation'
                ? "bg-background text-primary shadow-lg ring-1 ring-black/5"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <ShieldAlert className={cn("w-3.5 h-3.5", viewMode === 'investigation' ? "text-primary" : "text-muted-foreground/50")} />
            Attack Scenarios
          </button>
        </div>
      </div>

      <div className="flex-1 bg-card border rounded-3xl overflow-hidden shadow-2xl flex flex-col md:min-h-[1050px] ring-1 ring-white/5">
        {!currentStep ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground animate-pulse">
            <div className="flex flex-col items-center gap-4">
              <Activity className="w-12 h-12 text-primary/20" />
              <p className="font-black tracking-widest uppercase text-xs">Loading protocol...</p>
            </div>
          </div>
        ) : viewMode === 'protocol' ? (
          <div className="flex flex-col md:flex-row flex-1 border-b border-primary/10">
            {/* Left aside: Purpose / Security Outcome / Message Contents */}
            <aside className="order-2 md:order-none w-full md:w-[320px] md:min-w-[320px] border-b border-primary/10 md:border-b-0 md:border-r bg-background/95 flex flex-col">
              <div className="px-5 pt-4 pb-3 border-b border-primary/10">
                <span className="text-xs font-black tracking-[0.2em] uppercase text-primary">Current Step Details</span>
              </div>
              <div className="flex flex-col gap-2 p-5 pb-3 md:h-[300px] md:min-h-[300px]">
                <div className="text-[10px] font-black uppercase tracking-[0.35em] text-primary">Purpose of Current Step</div>
                <div className="rounded-3xl border border-primary/10 bg-background/90 p-5 shadow-sm flex-1 overflow-y-auto mx-4 md:mx-0">
                  <p className="text-[10px] font-black uppercase tracking-widest text-foreground/50 mb-1">{currentStep.title}</p>
                  <p className="text-sm text-foreground/80 leading-relaxed">{currentStep.description}</p>
                </div>
              </div>
              <div className="flex flex-col gap-2 px-5 pb-3 md:h-[220px] md:min-h-[220px]">
                <div className="text-[10px] font-black uppercase tracking-[0.35em] text-primary">Security Outcome</div>
                <div className="rounded-3xl border border-primary/10 bg-background/90 p-5 shadow-sm flex-1 overflow-y-auto mx-4 md:mx-0">
                  <p className="text-[10px] font-black uppercase tracking-widest text-foreground/50 mb-1">{currentStep.accomplishment_title}</p>
                  <p className="text-sm text-foreground/80 leading-relaxed">{currentStep.accomplishment}</p>
                </div>
              </div>
              <div className="flex flex-col gap-2 px-5 pb-5 flex-1 min-h-0">
                <div className="text-[10px] font-black uppercase tracking-[0.35em] text-primary">Message Contents</div>
                <div className="rounded-3xl border border-primary/10 bg-background/90 shadow-sm flex-1 overflow-auto">
                  {Object.entries(currentStep.payload).flatMap(([key, val]) => {
                    if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
                      return Object.entries(val).map(([subKey, subVal]) => {
                        const name = `${key}.${subKey}`;
                        const value = typeof subVal === 'object' ? JSON.stringify(subVal) : String(subVal);
                        return (
                          <div
                            key={name}
                            onMouseEnter={(e) => showTooltip(e, `${name} = ${value}`)}
                            onMouseLeave={hideTooltip}
                            className="border-b border-primary/10 last:border-0 px-3 py-2 hover:bg-primary/5 transition-colors cursor-default"
                          >
                            <span className="text-xs text-foreground/50 font-mono whitespace-nowrap">{name}</span>
                          </div>
                        );
                      });
                    }
                    const value = Array.isArray(val) ? `[${val.join(', ')}]` : String(val);
                    return (
                      <div
                        key={key}
                        onMouseEnter={(e) => showTooltip(e, `${key} = ${value}`)}
                        onMouseLeave={hideTooltip}
                        className="border-b border-primary/10 last:border-0 px-3 py-2 hover:bg-primary/5 transition-colors cursor-default"
                      >
                        <span className="text-xs text-foreground/50 font-mono whitespace-nowrap">{key}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </aside>

            {/* Protocol step nav */}
            <aside className="order-1 md:order-none w-full md:w-[128px] md:min-w-[128px] border-b border-primary/10 md:border-b-0 md:border-r flex flex-row md:flex-col">
              <div className="px-4 md:px-2 py-3 md:pt-4 md:pb-3 border-r border-primary/10 md:border-r-0 md:border-b flex items-center md:justify-center shrink-0">
                <span className="text-xs font-black uppercase tracking-[0.2em] text-primary">Step</span>
              </div>
              <div className="relative flex flex-row md:flex-col items-center gap-1.5 px-2 py-2 overflow-x-auto">
                <div className="absolute hidden md:block left-1/2 top-4 bottom-4 w-px bg-muted/20 -translate-x-1/2" />
                {steps.map((step, idx) => (
                  <button
                    key={step.id}
                    onClick={() => goToStep(idx)}
                    className="relative z-10 flex items-center justify-center"
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center text-[9px] font-black transition-all duration-500 border-2 bg-background relative z-10",
                      idx <= currentStepIdx
                        ? "bg-primary border-primary text-primary-foreground shadow-lg scale-110"
                        : "bg-background border-muted text-muted-foreground"
                    )}>
                      {step.id}
                    </div>
                  </button>
                ))}
              </div>
            </aside>

            {/* MAIN STAGE — protocol mode */}
            <div className="order-1 md:order-none relative flex-1 p-8 bg-gradient-to-b from-muted/5 to-transparent overflow-hidden min-h-[320px] md:min-h-[680px]" onClick={() => { setOpenActor(null); setStageDropdownOpen(false); }}>
              {/* Protocol selector */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-2" onClick={e => e.stopPropagation()}>
                <span className="text-xs font-black uppercase tracking-[0.2em] text-primary">Select protocol type</span>
                <div className="relative">
                  <button
                    onClick={() => setStageDropdownOpen(prev => !prev)}
                    className="flex items-center gap-3 bg-muted/30 px-5 py-2 rounded-xl border border-border/50 backdrop-blur-sm text-[10px] font-black uppercase tracking-widest text-primary hover:bg-muted/50 transition-colors"
                  >
                    <LayoutGrid className="w-3.5 h-3.5 text-primary" />
                    {activeFlow}
                    <ChevronDown className={cn("w-3.5 h-3.5 transition-transform duration-200", stageDropdownOpen && "rotate-180")} />
                  </button>
                  {stageDropdownOpen && (
                    <div className="absolute top-full mt-1.5 left-1/2 -translate-x-1/2 bg-background border border-border/60 rounded-xl overflow-hidden shadow-xl z-40 min-w-full">
                      {Object.keys(MOCK_PROTOCOL_FLOWS).map((flow) => (
                        <button
                          key={flow}
                          onClick={() => { setActiveFlow(flow); setStageDropdownOpen(false); }}
                          className={cn(
                            "w-full px-5 py-2.5 text-left text-[10px] font-black uppercase tracking-widest transition-colors whitespace-nowrap flex items-center gap-3",
                            activeFlow === flow ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                          )}
                        >
                          <LayoutGrid className={cn("w-3.5 h-3.5 shrink-0", activeFlow === flow ? "text-primary" : "text-muted-foreground/50")} />
                          {flow}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Trust Mesh Background */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.18]">
                {Object.entries(actorCoords).flatMap(([actor, coord]) => {
                  const targets = ACTORS[actor as Actor].sendsTo || [];
                  return targets
                    .filter(target => actorCoords[target])
                    .map((target) => {
                      const targetCoord = actorCoords[target];
                      return (
                        <line
                          key={`${actor}-${target}`}
                          x1={`${coord.x}%`} y1={`${coord.y}%`}
                          x2={`${targetCoord.x}%`} y2={`${targetCoord.y}%`}
                          className="stroke-primary stroke-[2.5px]"
                        />
                      );
                    });
                })}
              </svg>

              {/* Active communication arrow */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" viewBox="0 0 100 100" preserveAspectRatio="none">
                {arrowData && (
                  <g className="animate-in fade-in duration-700">
                    <line
                      x1={arrowData.start.x} y1={arrowData.start.y}
                      x2={arrowData.end.x} y2={arrowData.end.y}
                      className="stroke-primary stroke-[1.5px]"
                      strokeDasharray="8 6"
                    >
                      <animate attributeName="stroke-dashoffset" from="100" to="0" dur="8s" repeatCount="indefinite" />
                    </line>
                    {arrowMidpoint && (
                      <polygon
                        points="0,-2.5 4,0 0,2.5"
                        className="fill-primary"
                        transform={`translate(${arrowMidpoint.midX}, ${arrowMidpoint.midY}) rotate(${arrowMidpoint.angle})`}
                      />
                    )}
                  </g>
                )}
              </svg>

              {/* Actors */}
              {Object.entries(actorCoords).filter(([actor]) => actor !== 'AGENT' || currentStepIdx >= 1).map(([actor, coord]) => {
                const isActive = (currentStep.id as number) < 0 || currentStep.sender === actor || currentStep.receiver === actor;
                const isOpen = openActor === actor;
                return (
                  <div
                    key={actor}
                    className={cn(
                      "absolute transition-all duration-1000 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-3.5 z-20",
                      actor === 'AGENT' && "animate-in fade-in duration-700"
                    )}
                    style={{ left: `${coord.x}%`, top: `${coord.y}%` }}
                  >
                    <div className={cn(
                      "relative group flex flex-col items-center",
                      isOpen && "shadow-[0_14px_40px_rgba(59,130,246,0.28)] rounded-3xl"
                    )}>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          setOpenActor(prev => prev === actor ? null : (actor as Actor));
                        }}
                        className={cn(
                          "relative p-2 md:p-6 rounded-xl md:rounded-2xl bg-card border-2 transition-all duration-700 z-10 focus:outline-none",
                          isActive ? "border-primary shadow-lg scale-110 ring-2 md:ring-4 ring-primary/5" : "border-muted/50 scale-95",
                          isOpen && "shadow-[0_12px_35px_rgba(59,130,246,0.38)] ring-2 ring-primary/15"
                        )}
                      >
                        <ActorIcon type={actor as Actor} active={isActive} />
                      </button>
                      <div className={cn(
                        "absolute -bottom-5 md:-bottom-7 whitespace-nowrap px-1.5 md:px-2.5 py-0.5 rounded-full border shadow-md bg-background transition-all duration-700 z-0",
                        isActive ? "border-primary scale-100" : "border-muted scale-95"
                      )}>
                        <span className={cn(
                          "font-black text-[9px] tracking-widest uppercase transition-colors duration-700",
                          isActive ? "text-primary" : "text-muted-foreground"
                        )}>
                          {ACTORS[actor as Actor].label}
                        </span>
                      </div>
                      {isOpen && (
                        <div className={cn(
                          "absolute w-56 bg-background border border-primary/20 rounded-3xl p-4 text-left text-sm text-foreground z-30 transition-shadow duration-300",
                          "shadow-[0_16px_45px_rgba(59,130,246,0.28)]",
                          getActorPopupPlacement(coord)
                        )} onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span className="font-semibold text-xs tracking-[0.2em] text-primary">
                              {ACTORS[actor as Actor].label}
                            </span>
                            <button
                              type="button"
                              onClick={(event) => { event.stopPropagation(); setOpenActor(null); }}
                              className="text-muted-foreground hover:text-foreground transition-colors text-sm font-bold"
                            >
                              ×
                            </button>
                          </div>
                          <p className="text-[11px] leading-snug text-muted-foreground">
                            {ACTORS[actor as Actor].description}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {agentIdPanel}
          </div>
        ) : viewMode === 'id-investigation' ? (
          /* EMERGENCY SHUTDOWN VIEW */
          <div className="flex flex-col md:flex-row flex-1 border-b border-primary/10">
            {/* Left aside: Step details */}
            <aside className="order-2 md:order-none w-full md:w-[320px] md:min-w-[320px] border-b border-primary/10 md:border-b-0 md:border-r bg-background/95 flex flex-col">
              <div className="px-5 pt-4 pb-3 border-b border-primary/10">
                <span className="text-xs font-black tracking-[0.2em] uppercase text-primary">Current Step Details</span>
              </div>
              <div className="flex flex-col gap-2 p-5 pb-3 md:h-[220px] md:min-h-[220px]">
                <div className="text-[10px] font-black uppercase tracking-[0.35em] text-primary">Current Step</div>
                <div className="rounded-3xl border border-primary/10 bg-background/90 p-5 shadow-sm flex-1 overflow-y-auto mx-4 md:mx-0">
                  <p className="text-sm font-black text-foreground leading-relaxed">{shutdownStep.title}</p>
                </div>
              </div>
              <div className="flex flex-col gap-2 px-5 pb-5 flex-1 min-h-0">
                <div className="text-[10px] font-black uppercase tracking-[0.35em] text-primary">Step Details</div>
                <div className="rounded-3xl border border-primary/10 bg-background/90 p-5 shadow-sm flex-1 overflow-y-auto mx-4 md:mx-0">
                  <p className="text-sm text-foreground/80 leading-relaxed">{shutdownStep.description}</p>
                </div>
              </div>
            </aside>

            {/* Step navigator */}
            <aside className="order-1 md:order-none w-full md:w-[128px] md:min-w-[128px] border-b border-primary/10 md:border-b-0 md:border-r flex flex-row md:flex-col">
              <div className="px-4 md:px-2 py-3 md:pt-4 md:pb-3 border-r border-primary/10 md:border-r-0 md:border-b flex items-center md:justify-center shrink-0">
                <span className="text-xs font-black uppercase tracking-[0.2em] text-primary">Step</span>
              </div>
              <div className="relative flex flex-row md:flex-col items-center gap-1.5 px-2 py-2 overflow-x-auto">
                <div className="absolute hidden md:block left-1/2 top-4 bottom-4 w-px bg-muted/20 -translate-x-1/2" />
                {EMERGENCY_SHUTDOWN_STEPS.map((step, idx) => (
                  <button
                    key={step.id}
                    onClick={() => setShutdownStepIdx(idx)}
                    className="relative z-10 flex items-center justify-center"
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center text-[9px] font-black transition-all duration-500 border-2 bg-background relative z-10",
                      idx <= shutdownStepIdx
                        ? "bg-primary border-primary text-primary-foreground shadow-lg scale-110"
                        : "bg-background border-muted text-muted-foreground"
                    )}>
                      {step.id}
                    </div>
                  </button>
                ))}
              </div>
            </aside>

            {/* Stage */}
            <div className="order-1 md:order-none relative flex-1 p-8 bg-gradient-to-b from-muted/5 to-transparent overflow-hidden min-h-[320px] md:min-h-[680px]">
              {/* Trust Mesh Background */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.18]">
                {SHUTDOWN_MESH.map(([a, b]) => {
                  const from = resolvedShutdownActors[a];
                  const to = resolvedShutdownActors[b];
                  return (
                    <line
                      key={`${a}-${b}`}
                      x1={`${from.x}%`} y1={`${from.y}%`}
                      x2={`${to.x}%`} y2={`${to.y}%`}
                      className="stroke-primary stroke-[2.5px]"
                    />
                  );
                })}
              </svg>

              {/* Active communication arrow(s) */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" viewBox="0 0 100 100" preserveAspectRatio="none">
                {shutdownArrows.map(arrow => (
                  <g key={arrow.key} className="animate-in fade-in duration-700">
                    <line
                      x1={arrow.start.x} y1={arrow.start.y}
                      x2={arrow.end.x} y2={arrow.end.y}
                      className={cn("stroke-[1.5px]", arrow.fromAgent ? "stroke-destructive" : "stroke-primary")}
                      strokeDasharray="8 6"
                    >
                      <animate attributeName="stroke-dashoffset" from="100" to="0" dur="8s" repeatCount="indefinite" />
                    </line>
                    <polygon
                      points="0,-2.5 4,0 0,2.5"
                      className={arrow.fromAgent ? "fill-destructive" : "fill-primary"}
                      transform={`translate(${arrow.midX}, ${arrow.midY}) rotate(${arrow.angle})`}
                    />
                  </g>
                ))}
              </svg>

              {/* Actors */}
              {(Object.entries(resolvedShutdownActors) as [ShutdownActor, { label: string; x: number; y: number }][]).map(([actor, coord]) => {
                const isActive = shutdownStep.sender === actor || shutdownStep.receiver === actor || (shutdownStep.additionalReceivers?.includes(actor) ?? false);
                const isRed = actor === 'AGENT';
                return (
                  <div
                    key={actor}
                    className="absolute transition-all duration-1000 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-3.5 z-20"
                    style={{ left: `${coord.x}%`, top: `${coord.y}%` }}
                  >
                    <div className="relative flex flex-col items-center">
                      <div className={cn(
                        "relative p-2 md:p-6 rounded-xl md:rounded-2xl bg-card border-2 transition-all duration-700",
                        isActive && isRed  ? "border-destructive shadow-lg scale-110 ring-2 md:ring-4 ring-destructive/10" :
                        isActive && !isRed ? "border-primary shadow-lg scale-110 ring-2 md:ring-4 ring-primary/10" :
                        "border-muted/50 scale-95"
                      )}>
                        <ShutdownActorIcon type={actor} active={isActive} red={isRed} />
                        {actor === 'AGENT' && shutdownStepIdx === EMERGENCY_SHUTDOWN_STEPS.length - 1 && (
                          <div className="absolute inset-0 flex items-center justify-center rounded-xl md:rounded-2xl bg-destructive/10 animate-in fade-in duration-500">
                            <X className="w-7 h-7 md:w-14 md:h-14 text-destructive stroke-[2.5]" />
                          </div>
                        )}
                      </div>
                      <div className={cn(
                        "absolute -bottom-5 md:-bottom-7 whitespace-nowrap px-1.5 md:px-2.5 py-0.5 rounded-full border shadow-md bg-background transition-all duration-700",
                        isActive && isRed  ? "border-destructive scale-100" :
                        isActive && !isRed ? "border-primary scale-100" :
                        "border-muted scale-95"
                      )}>
                        <span className={cn(
                          "font-black text-[9px] tracking-widest uppercase transition-colors duration-700",
                          isActive && isRed  ? "text-destructive" :
                          isActive && !isRed ? "text-primary" :
                          "text-muted-foreground"
                        )}>
                          {coord.label}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* INVESTIGATION VIEW */
          <div className="flex flex-col md:flex-row flex-1 border-b border-primary/10">
            {/* Left aside: Attack Scenario */}
            <aside className="order-2 md:order-none w-full md:w-[320px] md:min-w-[320px] border-b border-primary/10 md:border-b-0 md:border-r bg-background/95 flex flex-col">
              <div className="px-5 pt-4 pb-3 border-b border-primary/10">
                <span className="text-xs font-black tracking-[0.2em] uppercase text-primary">Attack Scenario</span>
              </div>
              {investigationScenario ? (
                <div className="flex flex-col gap-4 p-5 overflow-y-auto flex-1">
                  <div className="flex flex-col gap-2">
                    <div className="text-[10px] font-black uppercase tracking-[0.35em] text-primary">Root Cause</div>
                    <div className="rounded-2xl border border-primary/10 bg-background/90 p-4 shadow-sm">
                      <p className="text-sm text-foreground/80 leading-relaxed">{INVESTIGATION_SCENARIOS[investigationScenario].rootCause}</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="text-[10px] font-black uppercase tracking-[0.35em] text-primary">Impact</div>
                    <div className="rounded-2xl border border-primary/10 bg-background/90 p-4 shadow-sm">
                      <p className="text-sm text-foreground/80 leading-relaxed">{INVESTIGATION_SCENARIOS[investigationScenario].impact}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center p-8">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center">Select a scenario above</p>
                </div>
              )}
            </aside>

            {/* Main stage */}
            <div className="order-1 md:order-none relative flex-1 bg-gradient-to-b from-muted/5 to-transparent flex flex-col min-h-[320px] md:min-h-[680px]" onClick={() => setStageDropdownOpen(false)}>
              {/* Scenario selector at top center */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-2" onClick={e => e.stopPropagation()}>
                <span className="text-xs font-black uppercase tracking-[0.2em] text-primary">Select scenario</span>
                <div className="relative">
                  <button
                    onClick={() => setStageDropdownOpen(prev => !prev)}
                    className="flex items-center gap-3 bg-muted/30 px-5 py-2 rounded-xl border border-border/50 backdrop-blur-sm text-[10px] font-black uppercase tracking-widest text-primary hover:bg-muted/50 transition-colors"
                  >
                    <ShieldAlert className="w-3.5 h-3.5 text-primary" />
                    {investigationScenario ? INVESTIGATION_SCENARIOS[investigationScenario].label : 'Select scenario'}
                    <ChevronDown className={cn("w-3.5 h-3.5 transition-transform duration-200", stageDropdownOpen && "rotate-180")} />
                  </button>
                  {stageDropdownOpen && (
                    <div className="absolute top-full mt-1.5 left-1/2 -translate-x-1/2 bg-background border border-border/60 rounded-xl overflow-hidden shadow-xl z-40 min-w-full">
                      {(Object.keys(INVESTIGATION_SCENARIOS) as ScenarioId[]).map((id) => (
                        <button
                          key={id}
                          onClick={() => { setInvestigationScenario(id); setStageDropdownOpen(false); }}
                          className={cn(
                            "w-full px-5 py-2.5 text-left text-[10px] font-black uppercase tracking-widest transition-colors whitespace-nowrap flex items-center gap-3",
                            investigationScenario === id ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                          )}
                        >
                          <ShieldAlert className={cn("w-3.5 h-3.5 shrink-0", investigationScenario === id ? "text-primary" : "text-muted-foreground/50")} />
                          {INVESTIGATION_SCENARIOS[id].label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Function sections */}
              {investigationScenario ? (
                <div className="flex-1 grid grid-cols-3 gap-4 pt-24 px-4 pb-4 overflow-y-auto">
                  {(['identify', 'respond', 'prevent'] as const).map((fn) => {
                    const fields = INVESTIGATION_SCENARIOS[investigationScenario][fn];
                    return (
                      <div key={fn} className="flex flex-col gap-3">
                        <span className="text-xs font-black tracking-[0.2em] uppercase text-primary">{fn}</span>
                        <div className="flex flex-col gap-2">
                          {fields.length > 0 ? fields.map(field => {
                            const isActive = displayedIdComponents.find(c => c.label === field.label)?.active ?? true;
                            return (
                              <div key={field.label} className={cn(
                                "rounded-xl border p-3 shadow-sm transition-all duration-300",
                                isActive
                                  ? "border-primary/10 bg-background/80"
                                  : "border-red-500/40 bg-red-500/10 ring-2 ring-red-500/30"
                              )}>
                                <p className={cn("text-[10px] font-black uppercase tracking-wider mb-1.5", isActive ? "text-primary" : "text-red-400")}>{field.label}</p>
                                <p className="text-xs text-foreground/70 leading-relaxed">{field.help}</p>
                              </div>
                            );
                          }) : (
                            <p className="text-[10px] text-muted-foreground italic px-1">No fields defined yet.</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center pt-16">
                  <div className="text-center text-muted-foreground">
                    <ShieldAlert className="w-16 h-16 text-primary/20 mx-auto mb-6" />
                    <p className="text-[10px] font-black uppercase tracking-[0.35em] mb-3">Incident Investigation</p>
                    <p className="text-sm">Select a scenario above to begin investigation.</p>
                  </div>
                </div>
              )}
            </div>

            {agentIdPanel}
          </div>
        )}
      </div>
      {tooltip && (
        <div
          className="fixed z-[9999] pointer-events-none px-3 py-2 rounded-lg border border-primary/25 bg-background/95 backdrop-blur-sm shadow-xl text-[11px] font-mono text-primary max-w-sm break-all"
          style={{ left: tooltip.x + 14, top: tooltip.y + 14 }}
        >
          {tooltip.text}
        </div>
      )}
    </div>
  );
};
