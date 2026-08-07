import type { Actor, ActorInfo } from './types';

export const ACTORS: Record<Actor, ActorInfo> = {
  DEPLOYER: { label: 'Deployer', icon: 'User', sendsTo: ['PROVIDER', 'SERVICE'], description:'Directs an AI agent to perform a task.'},
  DEVELOPER: { label: 'LLM Developer', icon: 'Code', sendsTo: ['PROVIDER'], description: 'The organization that trains and provides access to a foundation model.'},
  PROVIDER: { label: 'Agent Provider', icon: 'Wrench', sendsTo: ['DEPLOYER', 'AGENT', 'DEVELOPER'], description: 'The organization that provides scaffolding and tools to the agent and sends external requests on its behalf.'},
  SERVICE: { label: 'Service', icon: 'Server', sendsTo: ['AGENT', 'DEPLOYER', 'SERVICE_LOG'], description: 'A service that an AI agent can interact with to accomplish a task.'},
  AGENT: { label: 'AI Agent', icon: 'Bot', sendsTo: ['PROVIDER', 'SERVICE'], description: 'The workload running the AI agent instance, which originates external requests.'},
  SERVICE_LOG: { label: 'Service Log', icon: 'Database', sendsTo: [], description: 'A log of relevant actions taken by AI agents contacting the service.'},
};
