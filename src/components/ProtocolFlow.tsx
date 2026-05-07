import { useMemo, useEffect, useState, useCallback, useRef } from 'react';
import { User, Server, Activity, Bot, Database , Code, Fingerprint, CheckCircle2, Circle, LayoutGrid, ChevronDown, Wrench } from 'lucide-react';
import { ACTORS } from '../lib/protocol/actors';
import type { Actor, ProtocolStep, IdComponent } from '../lib/protocol/types';
import { cn } from '../lib/utils';
import { MockProtocolSource, MOCK_PROTOCOL_FLOWS } from '../lib/protocol/mock-source';

const ActorIcon = ({ type, active }: { type: Actor; active?: boolean; }) => {
  const props = { className: cn("w-14 h-14 transition-all duration-700", active ? "text-primary scale-110" : "text-muted-foreground/60") };
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

export const ProtocolFlow = () => {
  const [steps, setSteps] = useState<ProtocolStep[]>([]);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [activeFlow, setActiveFlow] = useState<string>(Object.keys(MOCK_PROTOCOL_FLOWS)[0]);
  const [idComponents, setIdComponents] = useState<IdComponent[]>([]);
  const [openActor, setOpenActor] = useState<Actor | null>(null);
  const [openIdGroups, setOpenIdGroups] = useState<Record<string, boolean>>(() => ({
    'Who directed the agent?': true,
    'How was the agent built?': true,
    'What to do if problems arise?': true,
    'Other': true,
  }));
  const flowRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const loadSteps = async () => {
      const source = new MockProtocolSource();
      const mockSteps = await source.getSteps(activeFlow);
      setSteps(mockSteps);
      // We keep currentStepIdx the same, but ensure it's within bounds
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
      if (e.key === 'ArrowRight') {
        nextStep();
      } else if (e.key === 'ArrowLeft') {
        prevStep();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextStep, prevStep]);

  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      if (!flowRef.current?.contains(event.target as Node)) {
        setOpenActor(null);
      }
    };

    document.addEventListener('mousedown', handleDocumentClick);
    return () => document.removeEventListener('mousedown', handleDocumentClick);
  }, []);

  const actorCoords: Record<Actor, { x: number, y: number; }> = useMemo(() => ({
    AGENT: { x: 40, y: 45 },
    DEVELOPER: { x: 20, y: 75 },
    PROVIDER: { x: 20, y: 45 },
    DEPLOYER: { x: 20, y: 15 },
    SERVICE: { x: 90, y: 45 },
    SERVICE_LOG: { x: 90, y: 75 },
  } as Record<Actor, { x: number, y: number; }>), []);

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

  const idGroupDefinitions = useMemo(() => [
    {
      title: 'Who directed the agent?',
      labels: ['Deployer Identifier', 'Deployer Accountability ID'],
    },
    {
      title: 'How was the agent built?',
      labels: ['Foundation Model Identifier', 'Provider Identifier'],
    },
    {
      title: 'What to do if problems arise?',
      labels: ['Agent Instance Shutdown Command', 'Agent Instance Identifier'],
    },
    {
      title: 'Can I trust the agent and the agent ID?',
      labels: ['Foundation Model Safety Evidence', 'Provider Security Evidence', 'Prompt Hash'],
    },
    {
      title: 'What is the agent authorized to do?',
      labels: ['Policy Rules', 'OAuth Access Token'],
    },
  ], []);

  const idComponentGroups = useMemo(() => {
    const assignedLabels = new Set(idGroupDefinitions.flatMap(group => group.labels));
    const groups = idGroupDefinitions.map(group => ({
      title: group.title,
      items: idComponents.filter(item => group.labels.includes(item.label)),
    }));
    groups.push({
      title: 'Other',
      items: idComponents.filter(item => !assignedLabels.has(item.label)),
    });
    return groups;
  }, [idComponents, idGroupDefinitions]);

  const progressCircumference = 2 * Math.PI * 12;

  const getGroupProgress = (group: { items: typeof idComponents[number][] }) => {
    const total = group.items.length;
    if (total === 0) return 0;
    const activeCount = group.items.filter(item => item.active).length;
    return activeCount / total;
  };

  const getProgressColor = (ratio: number) => {
    if (ratio <= 0) return '#7f1d1d';
    if (ratio >= 1) return '#166534';
    const hue = 0 + ratio * 120;
    const lightness = 30 + ratio * 25;
    return `hsl(${hue}, 90%, ${lightness}%)`;
  };

  return (
    <div ref={flowRef} className="flex flex-col h-full max-w-[2200px] mx-auto p-6 gap-6">
      {/* Header: Consolidated Single-Line */}
      <div className="flex items-center justify-between px-6 mb-2">
        <div className="flex items-baseline gap-4">
          <h1 className="text-3xl font-black tracking-tighter !text-slate-900 dark:!text-slate-50 italic leading-none">
            AI AGENT ID TESTBED
          </h1>
          <div className="flex items-center gap-2 border-l pl-4 border-border h-4">
            <Activity className="w-3 h-3 text-primary animate-pulse" />
            <span className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase">Proof of Concept Visualization</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
           {/* Commented out until second view added. */}
          {/* <div className="flex bg-muted/30 p-1 rounded-xl border border-border/50 backdrop-blur-sm">
            {Object.keys(MOCK_PROTOCOL_FLOWS).map((flow) => (
              <button
                key={flow}
                onClick={() => setActiveFlow(flow)}
                className={cn(
                  "px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-2",
                  activeFlow === flow
                    ? "bg-background text-primary shadow-lg ring-1 ring-black/5"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <LayoutGrid className={cn("w-3.5 h-3.5", activeFlow === flow ? "text-primary" : "text-muted-foreground/50")} />
                {flow}
              </button>
            ))}
          </div> */}
        </div>
      </div>

      <div className="flex-1 bg-card border rounded-3xl overflow-hidden shadow-2xl flex flex-col min-h-[1050px] ring-1 ring-white/5">
        {!currentStep ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground animate-pulse">
            <div className="flex flex-col items-center gap-4">
              <Activity className="w-12 h-12 text-primary/20" />
              <p className="font-black tracking-widest uppercase text-xs">
                Loading protocol...
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-1 min-h-[760px] border-b border-primary/10">
              <aside className="w-[420px] min-w-[420px] border-r border-primary/10 bg-background/95 flex flex-col">
                {/* Purpose */}
                <div className="flex flex-col gap-2 p-5 pb-3 h-[300px] min-h-[300px]">
                  <div className="text-[10px] font-black uppercase tracking-[0.35em] text-primary">Purpose</div>
                  <div className="rounded-3xl border border-primary/10 bg-background/90 p-5 shadow-sm flex-1 overflow-y-auto">
                    <p className="text-[10px] font-black uppercase tracking-widest text-foreground/50 mb-1">{currentStep.title}</p>
                    <p className="text-sm text-foreground/80 leading-relaxed">{currentStep.description}</p>
                  </div>
                </div>

                {/* Security Outcome */}
                <div className="flex flex-col gap-2 px-5 pb-3 h-[220px] min-h-[220px]">
                  <div className="text-[10px] font-black uppercase tracking-[0.35em] text-primary">Security Outcome</div>
                  <div className="rounded-3xl border border-primary/10 bg-background/90 p-5 shadow-sm flex-1 overflow-y-auto">
                     <p className="text-[10px] font-black uppercase tracking-widest text-foreground/50 mb-1">{currentStep.accomplishment_title}</p>
                    <p className="text-sm text-foreground/80 leading-relaxed">{currentStep.accomplishment}</p>
                  </div>
                </div>

                {/* Message Contents */}
                <div className="flex flex-col gap-2 px-5 pb-5 flex-1 min-h-0">
                  <div className="text-[10px] font-black uppercase tracking-[0.35em] text-primary">Message Contents</div>
                  <div className="rounded-3xl border border-primary/10 bg-background/90 shadow-sm flex-1 overflow-auto">
                    <table className="min-w-full border-collapse">
                      <tbody>
                        {Object.entries(currentStep.payload).flatMap(([key, val]) => {
                          if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
                            return Object.entries(val).map(([subKey, subVal], i) => (
                              <tr key={`${key}.${subKey}`} className={cn(
                                "border-b border-primary/10 last:border-0 hover:bg-primary/5 transition-colors",
                                i % 2 === 0 ? "bg-black/[0.02] dark:bg-white/[0.02]" : "bg-transparent"
                              )}>
                                <td className="px-3 py-2 text-xs text-foreground/50 border-r border-primary/10 font-mono whitespace-nowrap text-right align-top w-fit">
                                  {key}.{subKey}
                                </td>
                                <td className="px-3 py-2 text-xs font-mono text-foreground/80 break-words leading-relaxed w-full">
                                  {typeof subVal === 'object' ? JSON.stringify(subVal) : String(subVal)}
                                </td>
                              </tr>
                            ));
                          }
                          return (
                            <tr key={key} className="border-b border-primary/10 last:border-0 hover:bg-primary/5 transition-colors odd:bg-black/[0.02] even:bg-transparent dark:odd:bg-white/[0.02]">
                              <td className="px-3 py-2 text-xs text-foreground/50 border-r border-primary/10 font-mono whitespace-nowrap text-right align-top w-fit">
                                {key}
                              </td>
                              <td className="px-3 py-2 text-xs font-mono text-foreground/80 break-words leading-relaxed w-full">
                                {Array.isArray(val) ? `[${val.join(', ')}]` : String(val)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </aside>

              <aside className="w-[128px] min-w-[128px] border-r border-primary/10 pr-4">
                <div className="sticky top-8">
                  <div className="mb-2 flex w-full justify-center">
                    <span className="text-center text-[10px] font-black uppercase tracking-[0.35em] text-primary">Protocol Step</span>
                  </div>
                  <div className="relative flex flex-col items-center gap-4 px-2 py-3">
                    <div className="absolute left-1/2 top-6 bottom-6 w-px bg-muted/20 -translate-x-1/2" />
                    {steps.map((step, idx) => (
                      <button
                        key={step.id}
                        onClick={() => goToStep(idx)}
                        className="relative z-10 flex items-center justify-center"
                      >
                        <div className={cn(
                          "w-11 h-11 rounded-[0.85rem] flex items-center justify-center text-[9px] font-black transition-all duration-500 border-[3px] bg-background relative z-10",
                          idx <= currentStepIdx
                            ? "bg-primary border-primary text-primary-foreground shadow-lg scale-110"
                            : "bg-background border-muted text-muted-foreground group-hover:border-primary/40 group-hover:text-primary"
                        )}>
                          {step.id}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </aside>

              {/* MAIN STAGE */}
              <div className="relative flex-1 p-8 bg-gradient-to-b from-muted/5 to-transparent overflow-hidden min-h-[680px]" onClick={() => setOpenActor(null)}>
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
                            x1={`${coord.x}%`}
                            y1={`${coord.y}%`}
                            x2={`${targetCoord.x}%`}
                            y2={`${targetCoord.y}%`}
                            className="stroke-primary stroke-[2.5px]"
                          /> 
                        );
                      });
                  })}
                </svg>

                {/* ACTIVE COMMUNICATION ARROW */}
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

                {/* THE ACTORS */}
                {Object.entries(actorCoords).filter(([actor]) => actor !== 'AGENT' || currentStepIdx >= 1).map(([actor, coord]) => {
                  const isActive = currentStep.id === 0 || currentStep.sender === actor || currentStep.receiver === actor;
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
                            "relative p-6 rounded-2xl bg-card border-2 transition-all duration-700 z-10 focus:outline-none",
                            isActive
                              ? "border-primary shadow-lg scale-110 ring-4 ring-primary/5"
                              : "border-muted/50 scale-95",
                            isOpen && "shadow-[0_12px_35px_rgba(59,130,246,0.38)] ring-2 ring-primary/15"
                          )}
                        >
                          <ActorIcon type={actor as Actor} active={isActive} />
                        </button>

                        <div className={cn(
                          "absolute -bottom-7 whitespace-nowrap px-2.5 py-0.5 rounded-full border shadow-md bg-background transition-all duration-700 z-0",
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
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setOpenActor(null);
                                }}
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

              {/* AGENT ID STATE PANEL */}
              <aside className="w-[650px] min-w-[650px] border-l border-primary/10 bg-background/95 p-5 overflow-y-auto">
                <div className="sticky top-0 space-y-4">
                  <div className="rounded-3xl border border-primary/20 bg-background/95 overflow-hidden shadow-xl">
                    <div className="bg-primary/10 px-3 py-2 border-b border-primary/20 flex items-center gap-2">
                      <Fingerprint className="w-4 h-4 text-primary" />
                      <h3 className="text-[10px] font-black tracking-widest uppercase text-primary">Agent ID State</h3>
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
                                  <circle
                                    cx="16"
                                    cy="16"
                                    r="12"
                                    fill="none"
                                    stroke="rgba(148, 163, 184, 0.25)"
                                    strokeWidth="6"
                                  />
                                  <circle
                                    cx="16"
                                    cy="16"
                                    r="12"
                                    fill="none"
                                    stroke={getProgressColor(getGroupProgress(group))}
                                    strokeWidth="6"
                                    strokeLinecap="round"
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
                                  <div key={`${group.title}-${comp.label}-${idx}`} className={cn(
                                    "flex items-center justify-between px-2 py-1 rounded-md border transition-all duration-500",
                                    comp.active ? "bg-primary/5 border-primary/20 shadow-sm" : "bg-muted/10 border-transparent opacity-40 grayscale"
                                  )}>
                                    <div className="flex items-center gap-2">
                                      {comp.active ? (
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                      ) : (
                                        <Circle className="w-3.5 h-3.5 text-muted-foreground" />
                                      )}
                                      <span className={cn("text-[10px] font-bold uppercase tracking-wider", comp.active ? "text-foreground" : "text-muted-foreground")}> 
                                        {comp.label}
                                      </span>
                                    </div>
                                    <span className={cn("text-[9px] font-mono truncate max-w-[120px]", comp.active ? "text-primary" : "text-muted-foreground")}>{comp.value}</span>
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
            </div>
          </>
        )}
      </div>
    </div>
  );
};
