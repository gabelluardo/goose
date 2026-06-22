import type { CustomProviderCreateRequest_unstable } from '@aaif/goose-sdk';
import type {
  DeclarativeProviderConfig,
  ProviderCatalogEntry,
  ProviderDetails,
  ProviderEngine,
  ProviderTemplate,
  ThinkingEffort,
  UpdateCustomProviderRequest,
} from '../api';
import { getAcpClient } from './acpConnection';

function updateRequestToCreate(
  request: UpdateCustomProviderRequest
): CustomProviderCreateRequest_unstable {
  return {
    engine: request.engine,
    displayName: request.display_name,
    apiUrl: request.api_url,
    apiKey: request.api_key || null,
    models: request.models,
    supportsStreaming: request.supports_streaming ?? null,
    headers: request.headers ?? undefined,
    requiresAuth: request.requires_auth ?? true,
    catalogProviderId: request.catalog_provider_id ?? null,
    basePath: request.base_path ?? null,
    preservesThinking: request.preserves_thinking ?? null,
  };
}

export async function acpListProviderDetails(): Promise<ProviderDetails[]> {
  const client = await getAcpClient();
  const { entries } = await client.goose.providersList_unstable({});
  return entries.map((entry) => ({
    name: entry.providerId,
    is_configured: entry.configured,
    provider_type: entry.providerType as ProviderDetails['provider_type'],
    metadata: {
      name: entry.providerId,
      display_name: entry.providerName,
      description: entry.description,
      default_model: entry.defaultModel,
      model_doc_link: '',
      model_selection_hint: entry.modelSelectionHint ?? null,
      config_keys: entry.configKeys.map((key) => ({
        name: key.name,
        required: key.required,
        secret: key.secret,
        default: key.default ?? null,
        oauth_flow: key.oauthFlow ?? false,
        device_code_flow: key.deviceCodeFlow ?? false,
        primary: key.primary ?? false,
      })),
      known_models: entry.models.map((model) => ({
        name: model.id,
        context_limit: model.contextLimit ?? 0,
        reasoning: model.reasoning ?? undefined,
      })),
      setup_steps: entry.setupSteps,
    },
  }));
}

export async function acpListProviderModels(providerId: string) {
  const client = await getAcpClient();
  const { entries } = await client.goose.providersList_unstable({ providerIds: [providerId] });
  return entries.find((e) => e.providerId === providerId)?.models ?? [];
}

export async function acpListProviderCatalogEntries(
  format?: string
): Promise<ProviderCatalogEntry[]> {
  const client = await getAcpClient();
  const { providers } = await client.goose.providersCatalogList_unstable(format ? { format } : {});
  return providers.map((entry) => ({
    id: entry.providerId,
    name: entry.name,
    format: entry.format,
    api_url: entry.apiUrl,
    model_count: entry.modelCount,
    doc_url: entry.docUrl,
    env_var: entry.envVar,
  }));
}

export async function acpGetProviderTemplate(providerId: string): Promise<ProviderTemplate> {
  const client = await getAcpClient();
  const { template } = await client.goose.providersCatalogTemplate_unstable({ providerId });
  return {
    id: template.providerId,
    name: template.name,
    format: template.format,
    api_url: template.apiUrl,
    doc_url: template.docUrl,
    env_var: template.envVar,
    supports_streaming: template.supportsStreaming,
    models: template.models.map((model) => ({
      id: model.id,
      name: model.name,
      context_limit: model.contextLimit,
      deprecated: model.deprecated,
      capabilities: {
        tool_call: model.capabilities.toolCall,
        reasoning: model.capabilities.reasoning,
        attachment: model.capabilities.attachment,
        temperature: model.capabilities.temperature,
      },
    })),
  };
}

export async function acpGetCustomProvider(
  providerId: string
): Promise<{ config: DeclarativeProviderConfig; is_editable: boolean }> {
  const client = await getAcpClient();
  const { provider, editable } = await client.goose.providersCustomRead_unstable({ providerId });
  return {
    config: {
      name: provider.providerId,
      engine: provider.engine as ProviderEngine,
      display_name: provider.displayName,
      base_url: provider.apiUrl,
      base_path: provider.basePath ?? null,
      catalog_provider_id: provider.catalogProviderId ?? null,
      api_key_env: provider.apiKeyEnv ?? undefined,
      headers: provider.headers ?? null,
      models: (provider.models ?? []).map((name) => ({ name, context_limit: 0 })),
      supports_streaming: provider.supportsStreaming ?? null,
      requires_auth: provider.requiresAuth,
      preserves_thinking: provider.preservesThinking,
    },
    is_editable: editable,
  };
}

export async function acpCreateCustomProviderFromRequest(
  request: UpdateCustomProviderRequest
): Promise<{ provider_name: string }> {
  const client = await getAcpClient();
  const response = await client.goose.providersCustomCreate_unstable(
    updateRequestToCreate(request)
  );
  return { provider_name: response.providerId };
}

export async function acpUpdateCustomProviderFromRequest(
  providerId: string,
  request: UpdateCustomProviderRequest
): Promise<void> {
  const client = await getAcpClient();
  await client.goose.providersCustomUpdate_unstable({
    providerId,
    ...updateRequestToCreate(request),
  });
}

export async function acpDeleteCustomProvider(providerId: string): Promise<void> {
  const client = await getAcpClient();
  await client.goose.providersCustomDelete_unstable({ providerId });
}

export async function acpReadProviderConfig(providerId: string) {
  const client = await getAcpClient();
  const { fields } = await client.goose.providersConfigRead_unstable({ providerId });
  return fields;
}

export async function acpDeleteProviderConfig(providerId: string): Promise<void> {
  const client = await getAcpClient();
  await client.goose.providersConfigDelete_unstable({ providerId });
}

export async function acpSaveProviderConfig(
  providerId: string,
  fields: { key: string; value: string }[]
): Promise<void> {
  const client = await getAcpClient();
  await client.goose.providersConfigSave_unstable({ providerId, fields });
}

export async function acpAuthenticateProvider(providerId: string): Promise<void> {
  const client = await getAcpClient();
  await client.goose.providersConfigAuthenticate_unstable({ providerId });
}

export async function acpReadDefaults(): Promise<{
  providerId: string | null;
  modelId: string | null;
}> {
  const client = await getAcpClient();
  const response = await client.goose.defaultsRead_unstable({});
  return {
    providerId: response.providerId ?? null,
    modelId: response.modelId ?? null,
  };
}

export async function acpSaveDefaults(providerId: string, modelId?: string | null): Promise<void> {
  const client = await getAcpClient();
  await client.goose.defaultsSave_unstable({ providerId, modelId: modelId ?? null });
}

export async function acpReadThinkingEffort(): Promise<ThinkingEffort | null> {
  const client = await getAcpClient();
  const response = await client.goose.preferencesRead_unstable({ keys: ['gooseThinkingEffort'] });
  const value = response.values.find((v) => v.key === 'gooseThinkingEffort')?.value;
  return typeof value === 'string' ? (value as ThinkingEffort) : null;
}

export async function acpSaveThinkingEffort(effort: ThinkingEffort): Promise<void> {
  const client = await getAcpClient();
  await client.goose.preferencesSave_unstable({
    values: [{ key: 'gooseThinkingEffort', value: effort }],
  });
}

/**
 * Switch the provider (and model) for an active session via ACP config options.
 *
 * Changing the provider on the server resets the session's model, so the model
 * is applied as a follow-up step when supplied.
 */
export async function acpSetSessionProviderModel(
  sessionId: string,
  providerId: string,
  modelId?: string | null
): Promise<void> {
  const client = await getAcpClient();
  await client.setSessionConfigOption({ sessionId, configId: 'provider', value: providerId });
  if (modelId) {
    await client.setSessionConfigOption({ sessionId, configId: 'model', value: modelId });
  }
}
