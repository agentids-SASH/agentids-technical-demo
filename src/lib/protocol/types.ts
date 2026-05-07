export type Actor = 
'DEVELOPER' |
'DEPLOYER' | 
'PROVIDER' | 
'SERVICE' | 
'AGENT' | 
'SERVICE_LOG';

export interface ProtocolStep {
  id: string | number;
  title: string;
  sender: Actor;
  receiver: Actor | 'INTERNAL';
  description: string;
  payload: Record<string, unknown>;
  accomplishment: string;
  accomplishment_title: string;
}

export interface ActorInfo {
  label: string;
  icon: string;
  description: string;
  sendsTo: Actor[];
}

export interface ProtocolSource {
  getSteps(): Promise<ProtocolStep[]>;
  onStep?(callback: (step: ProtocolStep) => void): void;
}
