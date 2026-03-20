// rate-limiter.js - API Rate Limiting para endpoints críticos
// ======================================================================

(function () {
  const requestLog = {};
  const DEFAULT_WINDOW_MS = 60 * 1000; // 1 minuto
  const DEFAULT_MAX_REQUESTS = 10;

  /**
   * RateLimiter - Control de tasa de solicitudes usando ventana deslizante
   * @param {Object} config - Configuración
   * @param {number} config.windowMs - Tamaño de la ventana (ms)
   * @param {number} config.maxRequests - Máximo de solicitudes por ventana
   * @param {string} config.keyGenerator - Función para generar clave única
   */
  class RateLimiter {
    constructor(config = {}) {
      this.windowMs = config.windowMs || DEFAULT_WINDOW_MS;
      this.maxRequests = config.maxRequests || DEFAULT_MAX_REQUESTS;
      this.keyGenerator = config.keyGenerator || (() => 'global');
      this.onLimitExceeded = config.onLimitExceeded || (() => {});
    }

    /**
     * Verifica si la solicitud está dentro del límite
     * @returns {Object} { allowed: boolean, remaining: number, resetTime: number }
     */
    check(key = null) {
      const requestKey = key || this.keyGenerator();
      if (!requestLog[requestKey]) {
        requestLog[requestKey] = [];
      }

      const now = Date.now();
      const windowStart = now - this.windowMs;

      // Limpiar solicitudes fuera de la ventana
      requestLog[requestKey] = requestLog[requestKey].filter(
        timestamp => timestamp > windowStart
      );

      const requestCount = requestLog[requestKey].length;
      const allowed = requestCount < this.maxRequests;

      if (allowed) {
        requestLog[requestKey].push(now);
      } else {
        this.onLimitExceeded(requestKey, requestCount, this.maxRequests);
      }

      const remaining = Math.max(0, this.maxRequests - requestCount - (allowed ? 1 : 0));
      const oldestRequest = requestLog[requestKey][0] || 0;
      const resetTime = Math.max(oldestRequest + this.windowMs - now, 0);

      return {
        allowed,
        remaining,
        resetTime,
        limit: this.maxRequests,
        current: requestCount + (allowed ? 1 : 0)
      };
    }

    /**
     * Limpia el log de solicitudes para una clave específica
     */
    reset(key = null) {
      const requestKey = key || this.keyGenerator();
      if (requestLog[requestKey]) {
        delete requestLog[requestKey];
      }
    }

    /**
     * Limpia todo el log de solicitudes
     */
    resetAll() {
      Object.keys(requestLog).forEach(key => {
        delete requestLog[key];
      });
    }

    /**
     * Obtiene estadísticas de un endpoint
     */
    getStats(key = null) {
      const requestKey = key || this.keyGenerator();
      const now = Date.now();
      const windowStart = now - this.windowMs;
      const requests = (requestLog[requestKey] || []).filter(
        timestamp => timestamp > windowStart
      );
      return {
        requests: requests.length,
        limit: this.maxRequests,
        window: this.windowMs,
        keys: Object.keys(requestLog).length
      };
    }
  }

  // =====================================================
  // LIMITADORES POR ENDPOINT
  // =====================================================

  // Login: 5 intentos por minuto
  const loginLimiter = new RateLimiter({
    windowMs: 60 * 1000,
    maxRequests: 5,
    keyGenerator: () => 'login',
    onLimitExceeded: () => {
      console.warn('⚠️ Rate limit superado: demasiados intentos de login');
    }
  });

  // Login con email: Limitar por email (2 intentos por 5 minutos)
  const loginEmailLimiter = new RateLimiter({
    windowMs: 5 * 60 * 1000,
    maxRequests: 2,
    keyGenerator: (email) => `login:${email}`,
    onLimitExceeded: (key) => {
      console.warn(`⚠️ Rate limit: demasiados intentos para ${key}`);
    }
  });

  // Signup: 3 intentos por 10 minutos
  const signupLimiter = new RateLimiter({
    windowMs: 10 * 60 * 1000,
    maxRequests: 3,
    keyGenerator: (email) => `signup:${email}`,
    onLimitExceeded: () => {
      console.warn('⚠️ Rate limit superado: demasiados intentos de registro');
    }
  });

  // RPC calls: 20 por minuto por usuario
  const rpcLimiter = new RateLimiter({
    windowMs: 60 * 1000,
    maxRequests: 20,
    keyGenerator: (userEmail) => `rpc:${userEmail}`,
    onLimitExceeded: () => {
      console.warn('⚠️ Rate limit superado: demasiadas solicitudes API');
    }
  });

  // API calls genérico: 30 por minuto
  const apiLimiter = new RateLimiter({
    windowMs: 60 * 1000,
    maxRequests: 30,
    keyGenerator: () => 'api:general',
    onLimitExceeded: () => {
      console.warn('⚠️ Rate limit superado: demasiadas solicitudes API');
    }
  });

  // =====================================================
  // FUNCIONES PÚBLICAS
  // =====================================================

  const createRateLimitChecker = (limitername, options = {}) => {
    return (async (fn, key = null) => {
      const check = limitername.check(key);
      
      if (!check.allowed) {
        const error = new Error('Demasiadas solicitudes. Intenta más tarde.');
        error.code = 'RATE_LIMIT_EXCEEDED';
        error.retryAfter = Math.ceil(check.resetTime / 1000);
        throw error;
      }

      try {
        const result = await fn();
        return {
          ok: true,
          data: result,
          rateLimit: {
            limit: check.limit,
            remaining: check.remaining,
            reset: Date.now() + check.resetTime
          }
        };
      } catch (error) {
        throw error;
      }
    });
  };

  // Exponer funciones públicas
  window.RateLimiter = {
    loginLimiter,
    loginEmailLimiter,
    signupLimiter,
    rpcLimiter,
    apiLimiter,
    createRateLimitChecker,

    // Métodos de utilidad
    checkLogin: (fn) => createRateLimitChecker(loginLimiter)(fn),
    checkLoginEmail: (email, fn) => createRateLimitChecker(loginEmailLimiter)(fn, email),
    checkSignup: (email, fn) => createRateLimitChecker(signupLimiter)(fn, email),
    checkRPC: (userEmail, fn) => createRateLimitChecker(rpcLimiter)(fn, userEmail),
    checkAPI: (fn) => createRateLimitChecker(apiLimiter)(fn),

    // Estadísticas
    getStats: {
      login: () => loginLimiter.getStats(),
      rpc: (userEmail) => rpcLimiter.getStats(userEmail),
      api: () => apiLimiter.getStats()
    },

    // Reset
    resetAll: () => {
      loginLimiter.resetAll();
      loginEmailLimiter.resetAll();
      signupLimiter.resetAll();
      rpcLimiter.resetAll();
      apiLimiter.resetAll();
    }
  };
})();
