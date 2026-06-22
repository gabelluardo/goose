import { acpSaveProviderConfig } from '../../../../../../acp/providers';

/**
 * Submit provider configuration through ACP.
 *
 * The ACP server validates the supplied fields, persists config/secret values,
 * and triggers an inventory refresh in a single call, so no client-side
 * rollback is required.
 */
export const providerConfigSubmitHandler = async (
  provider: {
    name: string;
    metadata: {
      config_keys?: Array<{
        name: string;
        required?: boolean;
        default?: unknown;
        secret?: boolean;
      }>;
    };
  },
  configValues: Record<string, string>
) => {
  const parameters = provider.metadata.config_keys || [];

  const fields: { key: string; value: string }[] = [];
  for (const parameter of parameters) {
    const provided = configValues[parameter.name];
    const value = provided !== undefined ? provided : parameter.default;

    if (!provided && !parameter.required) {
      // Skip optional fields with no user-supplied value, unless a default exists.
      if (parameter.default === undefined || parameter.default === null) {
        continue;
      }
    }

    if (value === undefined || value === null || value === '') {
      continue;
    }

    fields.push({ key: parameter.name, value: String(value) });
  }

  await acpSaveProviderConfig(provider.name, fields);
};
