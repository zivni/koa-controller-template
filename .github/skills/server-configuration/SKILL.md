---
name: server-configuration
description: 'Add or modify backend configuration using node-config. Use when adding new settings, environment variables, or production overrides to the server.'
argument-hint: 'Describe the config property to add or modify'
---

# Server Configuration

## When to Use

- Adding a new configuration property to the backend
- Changing default values for settings
- Mapping environment variables to configuration
- Setting up production environment overrides
- Debugging configuration values or access patterns

## Architecture Overview

The backend uses the `node-config` library with typed configuration:

- **[server/config/default.json5](../../server/config/default.json5)**: Base config with all settings and sensible defaults
- **[server/config/prod.json5](../../server/config/prod.json5)**: Production-only overrides (sparse — only add if user explicitly requests)
- **[server/config/custom-environment-variables.json](../../server/config/custom-environment-variables.json)**: Maps environment variables to config paths
- **[server/src/settings/configurationInterface.ts](../../server/src/settings/configurationInterface.ts)**: `IConfiguration` interface — mirrors the config structure
- **[server/src/settings/configuration.ts](../../server/src/settings/configuration.ts)**: `Configuration` class — implements the interface with typed getters

## Step-by-Step Procedure

### 1. Add to Default Config
Open [server/config/default.json5](../../server/config/default.json5) and add your new property with a sensible default value:
```json5
{
  myFeature: {
    enabled: true,
    timeout: 5000
  }
}
```

### 2. Add to Interface
Update [server/src/settings/configurationInterface.ts](../../server/src/settings/configurationInterface.ts) to add the property to `IConfiguration`:
```typescript
interface IConfiguration {
  // ... existing properties
  myFeature: {
    enabled: boolean;
    timeout: number;
  };
}
```

### 3. Add Getter to Configuration Class
Update [server/src/settings/configuration.ts](../../server/src/settings/configuration.ts) to add a typed getter using `config.get()`:
```typescript
get myFeature(): MyFeatureConfig {
  return config.get<MyFeatureConfig>('myFeature');
}
```

### 4. Ask About Environment Variables
Ask the user: **"Does this configuration need to be overridable via environment variables?"**
- If **yes**: Add the mapping to [server/config/custom-environment-variables.json](../../server/config/custom-environment-variables.json)
  - For **string** values: use simple mapping
  - For **boolean/number** values: use object with `__name` and `__format`
  
  ```json
  {
    "myFeature": {
      "enabled": {
        "__name": "MY_FEATURE_ENABLED",
        "__format": "boolean"
      },
      "timeout": {
        "__name": "MY_FEATURE_TIMEOUT",
        "__format": "number"
      },
      "description": "MY_FEATURE_DESCRIPTION"
    }
  }
  ```
- If **no**: Skip this step

### 5. Production Override (Only if Requested)
Only add to [server/config/prod.json5](../../server/config/prod.json5) if the user explicitly requests a production override. Keep this file sparse:
```json5
{
  myFeature: {
    timeout: 10000  // Longer timeout in production
  }
}
```

## Usage in Code

Once configured, access settings via the `Configuration` service (injected via Inversify):
```typescript
@Controller('/')
export class MyController {
  constructor(@inject(ConfigurationSymbol) private config: Configuration) {}

  @Route('/test')
  async test(ctx: BrowserContext) {
    const enabled = this.config.myFeature.enabled;
    const timeout = this.config.myFeature.timeout;
    // ... use values
  }
}
```

## Notes

- **Single responsibility**: Keep `default.json5` focused on backend settings only
- **Type safety**: Always ensure `IConfiguration` and `Configuration` are in sync with the JSON files
- **Environment variables**: Use screaming-snake-case for env var names (e.g., `MY_FEATURE_ENABLED`)
- **Sensible defaults**: Every property in `default.json5` should have a reasonable default that works without env vars
