import ApiAudit from './apiAudit';

export function auditApi(endpoint: string, method: string = 'GET') {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    // Redéfinir la méthode
    descriptor.value = async function (...args: any[]) {
      const start = performance.now();
      const source = new Error().stack?.split('\n')[2]?.trim() || 'unknown';

      try {
        const result = await originalMethod.apply(this, args);
        const duration = performance.now() - start;

        // Log de l'appel réussi
        ApiAudit.logCall({
          endpoint,
          method,
          timestamp: Date.now(),
          duration,
          success: true,
          cacheHit: result?.fromCache || false,
          source,
        });

        return result;
      } catch (error) {
        const duration = performance.now() - start;

        // Log de l'appel en échec
        ApiAudit.logCall({
          endpoint,
          method,
          timestamp: Date.now(),
          duration,
          success: false,
          error,
          source,
        });

        throw error;
      }
    };

    return descriptor;
  };
}