import {createContainer, type AppContainer, type CreateContainerOptions} from '../di/container';

export function bootstrap(options?: CreateContainerOptions): AppContainer {
  return createContainer(options);
}

/**
 * Creates the container and restores any Keychain-backed identity session.
 */
export async function bootstrapAsync(
  options?: CreateContainerOptions,
): Promise<AppContainer> {
  const container = createContainer(options);

  try {
    await container.nostrGateway.connect();
  } catch (error) {
    // Partial/unavailable relays must not block app start (Section 27).
    container.logger.warn('Relay connect incomplete at bootstrap', {error});
  }

  await container.hydrateStorySeenStore();

  const restored = await container.restoreSession.execute();
  container.markSessionRestored();
  if (!restored.ok) {
    container.lastRestoreError = restored.error.message;
    container.logger.error('Session restore failed', {code: restored.error.code});
  } else {
    container.lastRestoreError = null;
    if (restored.value) {
      container.logger.info('Session restored', {
        authMethod: restored.value.authMethod,
        pubkeyPrefix: restored.value.publicKey.toHex().slice(0, 8),
      });
      await container.hydrateRelayListFromSession();
    }
  }
  return container;
}
