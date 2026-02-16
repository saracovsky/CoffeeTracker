import * as Sentry from '@sentry/react-native';

export async function trackInteraction<T>(
  elementId: string,
  callback: () => T | Promise<T>
): Promise<T> {
  return await Sentry.startSpan(
    {
      name: elementId,
      op: 'ui.action.press',
      attributes: {
        'ui.element': elementId,
      },
    },
    async (span) => {
      try {
        const result = await Promise.resolve(callback());
        span?.setStatus({ code: 1, message: 'ok' });
        return result;
      } catch (error) {
        span?.setStatus({ code: 2, message: 'unknown_error' });
        Sentry.captureException(error);
        throw error;
      }
    }
  );
}

export function withInteractionTracking<T extends any[]>(
  elementId: string,
  handler: (...args: T) => void | Promise<void>
) {
  return async (...args: T) => {
    await trackInteraction(elementId, () => handler(...args));
  };
}
