import type { ProtocolStep, ProtocolSource, IdComponent } from './types';

// function that generates protocolsteps based on inputs

export const MOCK_PROTOCOL_FLOWS: Record<string, ProtocolStep[]> = {
  
  'With Agent ID': [
    {
    id: 0,
    title: 'Create Agent',
    sender: 'DEPLOYER',
    receiver: 'PROVIDER',
    description: 'Deployer asks the provider to initialize an AI Agent instance backed by a third party developer\'s foundation model.',
    payload: {
      action: 'INITIALIZE_AGENT',
    },
    accomplishment: '',
    accomplishment_title: ''
  },
  {
    id: 1,
    title: 'Start Agent Instance',
    sender: 'PROVIDER',
    receiver: 'AGENT',
    description: 'Provider provisions a compute process to invoke tools and call external services, as appropriate.',
    payload: {
      
    },
    accomplishment: 'The Provider establishes control over the agent\'s compute process. It can later terminate this process if necessary.',
    accomplishment_title: 'Provider control over agent instance'
  },
  {
    id: 2,
    title: 'Initial Prompt',
    sender: 'DEPLOYER',
    receiver: 'PROVIDER',
    description: 'Deployer sends a natural language prompt to the active Agent to transfer 1000 USD between two of their bank accounts.',
    payload: {
      deployer_prompt: 'Transfer 1000 USD from my checking account to my savings account',
      prompt_hash: '[hash of the prompt]',
      receiving_service: 'bank.com',
      deployer_identifier_on_service: 'deployer\'s username on bank.com',
      deployer_identifier: 'deployer\'s username on provider.net',
      deployer_accountability_id: 'Jane Doe',
    },
    accomplishment: 'Elements of the agent ID will bind to this prompt by referencing its hash.',
    accomplishment_title: 'ID elements can bind to the prompt'
  },
  {
    id: 3,
    title: 'Call the Foundation Model',
    sender: 'PROVIDER',
    receiver: 'DEVELOPER',
    description: 'Agent forwards the natural language request to the LLM Developer to process the prompt, select tools, and request the developer\'s signed attestation.',
    payload: {
      prompt: 'Transfer 1000 USD from my checking account to my savings account',
      receiving_service: 'bank.com',
      request_attestation: true
    },
    accomplishment: '',
    accomplishment_title: ''
  },
  {
    id: 4,
    title: 'Developer returns Action Plan & Signed Attestation Return',
    sender: 'DEVELOPER',
    receiver: 'PROVIDER',
    description: 'LLM Developer returns a plan for the provider to execute, along with cryptographically signed attestations about the foundation model and its safety testing.',
    payload: {
      action_plan: {
        tool: 'bank_api_call',
        method: 'transfer_funds',
        arguments: { recipient_account_type: 'sender_owned' }
      },
      foundation_model_identifier: 'Commerical ModelName_4.2',
      developer_id: 'LLM Developer XYZ',
      foundation_model_safety_evidence: 'LLMDevXYZ.org/commercial_modelname_4_2_safety_report',
      developer_attestation: 'signed: prompt_hash + developer information'
    },
    accomplishment: 'The developer gives a signed attestation about the model used by the AI agent.',
    accomplishment_title: 'Add developer\'s information to agent ID'
  },
  {
    id: 5,
    title: 'Prepare Agent to Act',
    sender: 'PROVIDER',
    receiver: 'AGENT',
    description: 'Provider supplies its own identifier and safety evidence to the agent. The provider also establishes an emergency shutdown access point for this agent instance.',
    payload: {
      action: 'PREPARE_AGENT',
      provider_identifier: 'provider \#202',
      provider_security_evidence: 'provider.net/security_evidence/agent_instance_12345',
      agent_instance_identifier: 'agent_instance_12345',
      agent_instance_shutdown_command: 'code: 5559',
      provider_attestation: 'signed: prompt_hash + provider information'
    },
    accomplishment: 'The provider gives a signed attestation about its own identity and the presence of an emergency shutdown mechanism.',
    accomplishment_title: 'Add provider\'s information to agent ID'
  },
  {
    id: 6,
    title: 'Agent asks the service for authorization from the deployer',
    sender: 'AGENT',
    receiver: 'SERVICE',
    description: 'The agent initiates an OAuth 2.0 CIBA request to the service, on behalf of the deployer.',
    payload: {
      action: 'CIBA_AUTH_REQUEST',
      requested_scopes: ['transfer_funds, recipient_account_type: \'sender_owned\''],
      deployer_identifier_on_service: 'deployer\'s username on bank.com',
    },
    accomplishment: '',
    accomplishment_title: ''
  },
  {
    id: 7,
    title: 'Service asks for authorization from the deployer',
    sender: 'SERVICE',
    receiver: 'DEPLOYER',
    description: 'Service contacts the Deployer directly for authorization.',
    payload: {
      action: 'CIBA_AUTH_PROMPT',
      requested_scopes: ['transfer_funds', 'recipient_account_type: \'sender_owned\''],
      provider_domain: 'provider.net',
    },
    accomplishment: '',
    accomplishment_title: ''
  },
  {
    id: 8,
    title: 'Deployer confirms authorization to the service',
    sender: 'DEPLOYER',
    receiver: 'SERVICE',
    description: 'Deployer authenticates, confirms scopes, and specifies remediation guardrails using a standardized machine-readable policy language.',
    payload: {
      oauth_status: 'AUTHORIZED',
      approved_scopes: ['transfer_funds', 'recipient_account_type: \'sender_owned\''],
    },
    accomplishment: 'Deployer authorizes access for specified scopes directly with the service.',
    accomplishment_title: 'Secure authorization via OAuth 2.0 CIBA flow'
  },
  {
    id: 9,
    title: 'OAuth Response to Agent',
    sender: 'SERVICE',
    receiver: 'AGENT',
    description: 'Service issues an authorization token to the agent.',
    payload: {
      oauth_access_token: 'dpop_at_98f2...',
      expires_in: 3600,
      granted_scopes: ['transfer_funds', 'recipient_account_type: \'sender_owned\''],
    },
    accomplishment: 'The Agent is authorized to perform the requested actions.',
    accomplishment_title: 'Agent is authorized'
  },
  {
    id: 10,
    title: 'Agent Performs Action',
    sender: 'AGENT',
    receiver: 'SERVICE',
    description: 'Agent uses the authorization token to perform the action.',
    payload: {
      action: 'TRANSFER_FUNDS',
      transaction_details: {
        amount: '1000 USD',
        from_account: 'checking',
        to_account: 'savings'
      },
      oauth_access_token: 'dpop_at_98f2...',
      agent_id: 'see credential details',
    },
    accomplishment: 'Cryptographically proven agent successfully executes authorized actions.',
    accomplishment_title: ''
  },
  {
    id: 11,
    title: 'Service Logging',
    sender: 'SERVICE',
    receiver: 'SERVICE_LOG',
    description: 'Service records the agent\'s request including relevant fields from the agent ID.',
    payload: {
      transaction_details: {
        amount: '1000 USD',
        from_account: 'checking',
        to_account: 'savings'
      },
      agent_id: 'see credential details',
    },
    accomplishment: 'The service can log fields form the agent ID that could support any future investigations.',
    accomplishment_title: 'Log the agent ID'
  },
  {
    id: '12a',
    title: 'Outcome A: Accept Request',
    sender: 'SERVICE',
    receiver: 'AGENT',
    description: 'If the request and agent ID satisfy the service, it completes the action and notifies the agent.',
    payload: {
      status: 'SUCCESS',
      transaction_details: {
        amount: '1000 USD',
        from_account: 'checking',
        to_account: 'savings',
      },
    },
    accomplishment: 'With the appropriate authorization and trust signals, the agent successfully completes the task for the deployer.',
    accomplishment_title: 'Secure Action Completed'
  },
  {
    id: '12b',
    title: 'Outcome B: Reject Request',
    sender: 'SERVICE',
    receiver: 'AGENT',
    description: 'If the request or agent ID do not satisfy the service, it declines to carry out the action and notifies the agent.',
    payload: {
      status: 'ACTION_REJECTED',
      transaction_details: {
        amount: '1000 USD',
        from_account: 'checking',
        to_account: 'savings',
      },
    },
    accomplishment: 'Without the appropriate authorization and trust signals, the agent declines to carry out the task',
    accomplishment_title: 'Insecure Request Rejected'
  }
  ],
  'Standard CIBA (OAuth 2.0)': [
  {
    id: 0,
    title: 'System Initialization',
    sender: 'DEPLOYER',
    receiver: 'AGENT',
    description: 'Deployer initializes AI Agent instance, provisioning it with access to underlying Developer models.',
    payload: {
      action: 'INITIALIZE_AGENT',
      agent_id: 'agent_v2_alpha',
      configured_providers: ['llm_developer_primary', 'llm_developer_fallback'],
    },
    accomplishment_title: '',
    accomplishment: ''
  }
  ],
};

export class MockProtocolSource implements ProtocolSource {
  async getSteps(flowName: string = 'Standard CIBA (OAuth 2.0)'): Promise<ProtocolStep[]> {
    return MOCK_PROTOCOL_FLOWS[flowName] || MOCK_PROTOCOL_FLOWS['Standard CIBA (OAuth 2.0)'];
  }

  async getIdState(flowName: string, stepIdx: number, currentStep: ProtocolStep | null): Promise<IdComponent[]> {
    if (flowName === 'Standard CIBA (OAuth 2.0)') {
      return [];
    }

    return [
      { label: 'Deployer Identifier', value: 'deployer \#101', active: stepIdx >= 2 },
      { label: 'Deployer Accountability ID', value: 'Jane Doe', active: stepIdx >= 2 },
      { label: 'Provider Identifier', value: 'provider \#202', active: stepIdx >= 5 },
      { label: 'Provider Security Evidence', value: 'provider \#202', active: stepIdx >= 5 },
      { label: 'Prompt Hash', value: '[hash of the prompt]', active: stepIdx >= 2 },
      { label: 'Foundation Model Identifier', value: 'foundation model name', active: stepIdx >= 4 },
      { label: 'Foundation Model Safety Evidence', value: 'foundation model safety evidence', active: stepIdx >= 4 },
      { label: 'Agent Instance Identifier', value: 'agent_instance \#7343', active: stepIdx >= 5 },
      { label: 'Agent Instance Shutdown Command', value: 'agent_instance_shutdown code: 5559', active: stepIdx >= 5 },
      { label: 'Policy Rules', value: 'OPA Bounds', active: stepIdx >= 9 },
      { label: 'OAuth Access Token', value: 'dpop_at_98f2...', active: stepIdx >= 9 },
    ];
  }
}

