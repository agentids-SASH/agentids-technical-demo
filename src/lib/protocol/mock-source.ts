import type { ProtocolStep, ProtocolSource, IdComponent } from './types';

// function that generates protocolsteps based on inputs

export const MOCK_PROTOCOL_FLOWS: Record<string, ProtocolStep[]> = {
  'Agent ID and OAuth': [
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
    description: 'Provider provisions a compute workload to run the agent, invoke tools, and call external services.',
    payload: {
      
    },
    accomplishment: 'The Provider establishes control over the agent\'s compute workload. It can later terminate this workload if necessary.',
    accomplishment_title: 'Provider control over agent instance'
  },
  {
    id: 2,
    title: 'Prompt the Agent',
    sender: 'DEPLOYER',
    receiver: 'PROVIDER',
    description: 'Deployer sends a natural language prompt to the active Agent to transfer 1000 USD between two of their bank accounts.',
    payload: {
      deployer_prompt: 'Transfer 1000 USD from my checking account to my savings account',
      receiving_service: 'bank.com',
      deployer_identifier: 'deployer\'s username on provider.net',
      deployer_identifier_on_service: 'deployer\'s username on bank.com',
      deployer_accountability_id: 'Jane Doe (encrypted)',
      deployer_attestation_hash: '',
    },
    accomplishment: 'Deployer sends attestation with plaintext and encrypted Agent ID components to the provider',
    accomplishment_title: 'Deployer\'s Attestation'
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
    title: 'Developer returns Action Plan & Attestation',
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
      developer_identifier: 'LLM Developer XYZ',
      foundation_model_safety_evidence: 'LLMDevXYZ.org/commercial_modelname_4_2_safety_report',
      developer_attestation: 'prior attestion + developer information'
    },
    accomplishment: 'Developer sends signed attestation about the model and how it responded to the prompt.',
    accomplishment_title: 'Developer\'s attestation'
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
      provider_attestation: 'prior attestion + provider attestation'
    },
    accomplishment: 'Provider attestation including safety evidence, instance identifier, and emergency shutdown mechanism.',
    accomplishment_title: 'Provider Attestation'
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
      oauth_access_token: '',
      expires_in: 3600,
      granted_scopes: ['transfer_funds', 'recipient_account_type: \'sender_owned\''],
    },
    accomplishment: 'The Agent is authorized to perform the requested actions.',
    accomplishment_title: 'Agent is authorized'
  },
  {
    id: 10,
    title: 'Agent Attempts Action',
    sender: 'AGENT',
    receiver: 'SERVICE',
    description: 'Agent uses the authorization token to attempt the action.',
    payload: {
      action: 'TRANSFER_FUNDS',
      transaction_details: {
        amount: '1000 USD',
        from_account: 'checking',
        to_account: 'savings'
      },
      oauth_access_token: '',
      agent_id: 'see credential details',
    },
    accomplishment: 'Agent ID and OAuth Access Token accompany the request to the service, which can use them to determine whether to authorize the action.',
    accomplishment_title: 'Agent ID and OAuth Access Token Delivered to Service'
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
    accomplishment: 'Without the appropriate authorization and trust signals, the service declines to carry out the task',
    accomplishment_title: 'Insecure Request Rejected'
  }
  ],
  'Agent ID, no OAuth' : [
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
    description: 'Provider provisions a compute workload to run the agent, invoke tools, and call external services.',
    payload: {
      
    },
    accomplishment: 'The Provider establishes control over the agent\'s compute workload. It can later terminate this workload if necessary.',
    accomplishment_title: 'Provider control over agent instance'
  },
  {
    id: 2,
    title: 'Prompt the Agent',
    sender: 'DEPLOYER',
    receiver: 'PROVIDER',
    description: 'Deployer sends a natural language prompt to the active Agent to transfer 1000 USD between two of their bank accounts.',
    payload: {
      deployer_prompt: 'Transfer 1000 USD from my checking account to my savings account',
      receiving_service: 'bank.com',
      deployer_identifier: 'deployer\'s username on provider.net',
      deployer_accountability_id: 'Jane Doe (encrypted)',
      deployer_attestation_hash: '',
    },
    accomplishment: 'Deployer sends attestation with plaintext and encrypted Agent ID components to the provider',
    accomplishment_title: 'Deployer\'s Attestation'
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
    title: 'Developer returns Action Plan & Attestation',
    sender: 'DEVELOPER',
    receiver: 'PROVIDER',
    description: 'LLM Developer returns an action plan for the agent and its attestation with information about the foundation model used.',
    payload: {
      action_plan: {
        tool: 'bank_api_call',
        method: 'transfer_funds',
        arguments: { recipient_account_type: 'sender_owned' }
      },
      foundation_model_identifier: 'Commerical ModelName_4.2',
      developer_identifier: 'LLM Developer XYZ',
      foundation_model_safety_evidence: 'LLMDevXYZ.org/commercial_modelname_4_2_safety_report',
      developer_attestation: 'prior attestion + developer information'
    },
    accomplishment: 'Developer sends signed attestation about the model and how it responded to the prompt.',
    accomplishment_title: 'Developer\'s attestation'
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
      provider_attestation: 'prior attestion + provider attestation'
    },
    accomplishment: 'Provider attestation including safety evidence, instance identifier, and emergency shutdown mechanism.',
    accomplishment_title: 'Provider Attestation'
  },
  {
    id: 6,
    title: 'Agent Attempts Action',
    sender: 'AGENT',
    receiver: 'SERVICE',
    description: 'Agent attempts to perform the action.',
    payload: {
      action: 'TRANSFER_FUNDS',
      transaction_details: {
        amount: '1000 USD',
        from_account: 'checking',
        to_account: 'savings'
      },
      agent_id: 'see credential details',
    },
    accomplishment: 'Agent ID accompanies the request to the service, which can use it to determine whether to authorize the action.',
    accomplishment_title: 'Agent ID Delivered to Service'
  },
  {
    id: 7,
    title: 'Service Logging',
    sender: 'SERVICE',
    receiver: 'SERVICE_LOG',
    description: 'The service records the agent\'s request including relevant fields from the agent ID.',
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
    id: '8a',
    title: 'Outcome A: Accept Request',
    sender: 'SERVICE',
    receiver: 'AGENT',
    description: 'If the request satisfies the service, it completes the action and notifies the agent.',
    payload: {
      status: 'SUCCESS',
      transaction_details: {
        amount: '1000 USD',
        from_account: 'checking',
        to_account: 'savings',
      },
    },
    accomplishment: 'The agent successfully completes the task for the deployer.',
    accomplishment_title: 'Authorized Action Completed'
  },
  {
    id: "8b",
    title: 'Outcome B: Reject Request',
    sender: 'SERVICE',
    receiver: 'AGENT',
    description: 'If the request does not satisfy the service, it declines to carry out the action and notifies the agent.',
    payload: {
      status: 'ACTION_REJECTED',
      transaction_details: {
        amount: '1000 USD',
        from_account: 'checking',
        to_account: 'savings',
      },
    },
    accomplishment: 'Without the appropriate authorization signals, or for other reasons, the service declines to carry out the task',
    accomplishment_title: 'Unauthorized Request Rejected'
  }
  ],
  'OAuth, no agent ID': [
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
    description: 'Provider provisions a compute workload to run the agent, invoke tools, and call external services.',
    payload: {
      
    },
    accomplishment: 'The Provider establishes control over the agent\'s compute workload. It can later terminate this workload if necessary.',
    accomplishment_title: 'Provider control over agent instance'
  },
  {
    id: 2,
    title: 'Prompt the Agent',
    sender: 'DEPLOYER',
    receiver: 'PROVIDER',
    description: 'Deployer sends a natural language prompt to the active Agent to transfer 1000 USD between two of their bank accounts.',
    payload: {
      deployer_prompt: 'Transfer 1000 USD from my checking account to my savings account',
      receiving_service: 'bank.com',
      deployer_identifier_on_service: 'deployer\'s username on bank.com',
    },
    accomplishment: '',
    accomplishment_title: ''
  },
  {
    id: 3,
    title: 'Call the Foundation Model',
    sender: 'PROVIDER',
    receiver: 'DEVELOPER',
    description: 'Agent forwards the natural language request to the LLM Developer to process the prompt and select tools.',
    payload: {
      prompt: 'Transfer 1000 USD from my checking account to my savings account',
      receiving_service: 'bank.com',
    },
    accomplishment: '',
    accomplishment_title: ''
  },
  {
    id: 4,
    title: 'Developer returns Action Plan',
    sender: 'DEVELOPER',
    receiver: 'PROVIDER',
    description: 'LLM Developer returns a plan for the provider to execute.',
    payload: {
      action_plan: {
        tool: 'bank_api_call',
        method: 'transfer_funds',
        arguments: { recipient_account_type: 'sender_owned' }
      },
    },
    accomplishment: '',
    accomplishment_title: ''
  },
  {
    id: 5,
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
    id: 6,
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
    id: 7,
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
    id: 8,
    title: 'OAuth Response to Agent',
    sender: 'SERVICE',
    receiver: 'AGENT',
    description: 'Service issues an authorization token to the agent.',
    payload: {
      oauth_access_token: '',
      expires_in: 3600,
      granted_scopes: ['transfer_funds', 'recipient_account_type: \'sender_owned\''],
    },
    accomplishment: 'The Agent is authorized to perform the requested actions.',
    accomplishment_title: 'Agent is authorized'
  },
  {
    id: 9,
    title: 'Agent Attemps Action',
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
      oauth_access_token: '',
    },
    accomplishment: 'Agent executes authorized actions.',
    accomplishment_title: ''
  },
  {
    id: 10,
    title: 'Service Logging',
    sender: 'SERVICE',
    receiver: 'SERVICE_LOG',
    description: 'Service records the agent\'s request.',
    payload: {
      transaction_details: {
        amount: '1000 USD',
        from_account: 'checking',
        to_account: 'savings'
      },
    },
    accomplishment: 'The service can log fields used to complete the action.',
    accomplishment_title: 'Log the agent ID'
  },
  {
    id: '11a',
    title: 'Outcome A: Accept Request',
    sender: 'SERVICE',
    receiver: 'AGENT',
    description: 'If the request satisfies the service, it completes the action and notifies the agent.',
    payload: {
      status: 'SUCCESS',
      transaction_details: {
        amount: '1000 USD',
        from_account: 'checking',
        to_account: 'savings',
      },
    },
    accomplishment: 'The agent successfully completes the task for the deployer.',
    accomplishment_title: 'Authorized Action Completed'
  },
  {
    id: '11b',
    title: 'Outcome B: Reject Request',
    sender: 'SERVICE',
    receiver: 'AGENT',
    description: 'If the request does not satisfy the service, it declines to carry out the action and notifies the agent.',
    payload: {
      status: 'ACTION_REJECTED',
      transaction_details: {
        amount: '1000 USD',
        from_account: 'checking',
        to_account: 'savings',
      },
    },
    accomplishment: 'The service declines to carry out the task',
    accomplishment_title: 'Unauthorized Request Rejected'
  }

  ]
};

export class MockProtocolSource implements ProtocolSource {
  async getSteps(flowName: string = 'Standard CIBA (OAuth 2.0)'): Promise<ProtocolStep[]> {
    return MOCK_PROTOCOL_FLOWS[flowName];
  }

  async getIdState(flowName: string, stepIdx: number, currentStep: ProtocolStep | null): Promise<IdComponent[]> {
    if (currentStep) { };
    if (flowName === 'Agent ID, no OAuth') {
      return [
        { label: 'Deployer Identifier', value: 'deployer \#101', active: stepIdx >= 2 },
        { label: 'Deployer Accountability ID', value: 'Jane Doe (encrypted)', active: stepIdx >= 2 },
        { label: 'Provider Identifier', value: 'provider \#202', active: stepIdx >= 5 },
        { label: 'Provider Security Evidence', value: 'provider \#202', active: stepIdx >= 5 },
        { label: 'Valid Attestation Chain', value: 'signed attestations chained together', active: stepIdx >= 2 },
        { label: 'Developer Identifier', value: 'LLM Developer XYZ', active: stepIdx >= 4 },
        { label: 'Foundation Model Identifier', value: 'foundation model name', active: stepIdx >= 4 },
        { label: 'Foundation Model Safety Evidence', value: 'foundation model safety evidence', active: stepIdx >= 4 },
        { label: 'Agent Instance Identifier', value: 'agent_instance_workload_id', active: stepIdx >= 5 },
        { label: 'Agent Instance Shutdown Command', value: 'agent instance shutdown code: 5559', active: stepIdx >= 5 },
        { label: 'Authorization Evidence', value: 'OPA Bounds', active: stepIdx >= 100 },
      ];
    } else if (flowName === 'OAuth, no agent ID') {
      return [
        { label: 'Deployer Identifier', value: 'deployer \#101', active: stepIdx >= 100 },
        { label: 'Deployer Accountability ID', value: 'Jane Doe  (encrypted)', active: stepIdx >= 100 },
        { label: 'Provider Identifier', value: 'provider \#202', active: stepIdx >= 100 },
        { label: 'Provider Security Evidence', value: 'provider \#202', active: stepIdx >= 100 },
        { label: 'Valid Attestation Chain', value: 'signed attestations chained together', active: stepIdx >= 100 },
        { label: 'Developer Identifier', value: 'LLM Developer XYZ', active: stepIdx >= 100 },
        { label: 'Foundation Model Identifier', value: 'foundation model name', active: stepIdx >= 100 },
        { label: 'Foundation Model Safety Evidence', value: 'foundation model safety evidence', active: stepIdx >= 100 },
        { label: 'Agent Instance Identifier', value: 'agent_instance_workload_id', active: stepIdx >= 100 },
        { label: 'Agent Instance Shutdown Command', value: 'agent instance shutdown code: 5559', active: stepIdx >= 100 },
        { label: 'Authorization Evidence', value: 'OAuth Access Token', active: stepIdx >= 8 },
      ];
    } else {
      return [
        { label: 'Deployer Identifier', value: 'deployer \#101', active: stepIdx >= 2 },
        { label: 'Deployer Accountability ID', value: 'Jane Doe (encrypted)', active: stepIdx >= 2 },
        { label: 'Provider Identifier', value: 'provider \#202', active: stepIdx >= 5 },
        { label: 'Provider Security Evidence', value: 'provider \#202', active: stepIdx >= 5 },
         { label: 'Valid Attestation Chain', value: 'signed attestations chained together', active: stepIdx >= 2 },
        { label: 'Developer Identifier', value: 'LLM Developer XYZ', active: stepIdx >= 4 },
        { label: 'Foundation Model Identifier', value: 'foundation model name', active: stepIdx >= 4 },
        { label: 'Foundation Model Safety Evidence', value: 'foundation model safety evidence', active: stepIdx >= 4 },
        { label: 'Agent Instance Identifier', value: 'agent_instance_workload_id', active: stepIdx >= 5 },
        { label: 'Agent Instance Shutdown Command', value: 'agent instance shutdown code: 5559', active: stepIdx >= 5 },
        { label: 'Authorization Evidence', value: 'OAuth Access Token', active: stepIdx >= 9 },
      ];
    }

   
  }
}

