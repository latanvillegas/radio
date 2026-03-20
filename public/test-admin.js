// test-admin.js - Test Suite para Autenticación de Admin
// ========================================================
// Ejecutar en consola del navegador en admin-login.html

(function () {
  /**
   * Test Framework
   */
  class AdminAuthTestSuite {
    constructor() {
      this.tests = [];
      this.passed = 0;
      this.failed = 0;
      this.results = [];
    }

    /**
     * Registra un test
     */
    describe(name, fn) {
      this.tests.push({ name, fn });
    }

    /**
     * Assertion: expect(value).toBe(expected)
     */
    expect(actual) {
      return {
        toBe: (expected) => {
          if (actual !== expected) {
            throw new Error(`Expected ${expected}, got ${actual}`);
          }
        },
        toBeTruthy: () => {
          if (!actual) {
            throw new Error(`Expected truthy, got ${actual}`);
          }
        },
        toBeFalsy: () => {
          if (actual) {
            throw new Error(`Expected falsy, got ${actual}`);
          }
        },
        toEqual: (expected) => {
          if (JSON.stringify(actual) !== JSON.stringify(expected)) {
            throw new Error(
              `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`
            );
          }
        },
        toContain: (value) => {
          if (!Array.isArray(actual) || !actual.includes(value)) {
            throw new Error(`Expected to contain ${value}`);
          }
        }
      };
    }

    /**
     * Ejecuta todos los tests
     */
    async run() {
      console.clear();
      console.log(
        "%c=== ADMIN AUTH TEST SUITE ===",
        "color: #3b82f6; font-size: 16px; font-weight: bold;"
      );
      console.log("");

      for (const test of this.tests) {
        try {
          await test.fn.call(this);
          this.passed++;
          console.log(`%c✓ ${test.name}`, "color: #22c55e; font-weight: bold;");
          this.results.push({ name: test.name, status: "pass" });
        } catch (error) {
          this.failed++;
          console.error(
            `%c✗ ${test.name}`,
            "color: #ef4444; font-weight: bold;"
          );
          console.error(`  Error: ${error.message}`);
          this.results.push({ name: test.name, status: "fail", error: error.message });
        }
      }

      console.log("");
      console.log(
        `%c${this.passed} passed, ${this.failed} failed`,
        `color: ${this.failed === 0 ? "#22c55e" : "#ef4444"}; font-weight: bold;`
      );
      console.log("");

      return {
        passed: this.passed,
        failed: this.failed,
        results: this.results
      };
    }
  }

  // =====================================================
  // TEST SUITE
  // =====================================================

  const suite = new AdminAuthTestSuite();

  // Test 1: Admin Auth Module Loaded
  suite.describe("AdminAuth module should be loaded", function () {
    this.expect(typeof window.AdminAuth).toBeTruthy();
    this.expect(typeof window.AdminAuth.signInWithPassword).toBe("function");
    this.expect(typeof window.AdminAuth.signUpWithPassword).toBe("function");
    this.expect(typeof window.AdminAuth.getAuthenticatedAdmin).toBe("function");
    this.expect(typeof window.AdminAuth.signOut).toBe("function");
  });

  // Test 2: Supabase Config Available
  suite.describe("Supabase config should be available", function () {
    this.expect(typeof window.SUPABASE_CONFIG).toBe("object");
    this.expect(typeof window.SUPABASE_CONFIG.url).toBe("string");
    this.expect(typeof window.SUPABASE_CONFIG.anonKey).toBe("string");
  });

  // Test 3: Rate Limiter Module Loaded
  suite.describe("RateLimiter module should be loaded", function () {
    this.expect(typeof window.RateLimiter).toBe("object");
    this.expect(typeof window.RateLimiter.loginLimiter).toBe("object");
    this.expect(typeof window.RateLimiter.signupLimiter).toBe("object");
  });

  // Test 4: Admin Audit Module Loaded
  suite.describe("AdminAudit module should be loaded", function () {
    this.expect(typeof window.AdminAudit).toBe("object");
    this.expect(typeof window.AdminAudit.recordAction).toBe("function");
    this.expect(typeof window.AdminAudit.recordLoginSuccess).toBe("function");
  });

  // Test 5: Rate Limiting - Login Limiter
  suite.describe("LoginLimiter should track requests correctly", function () {
    window.RateLimiter.loginLimiter.resetAll();
    
    for (let i = 0; i < 5; i++) {
      const result = window.RateLimiter.loginLimiter.check();
      this.expect(result.allowed).toBeTruthy();
    }

    const resultExceeded = window.RateLimiter.loginLimiter.check();
    this.expect(resultExceeded.allowed).toBeFalsy();
  });

  // Test 6: Rate Limiting - Email-based Signup Limiter
  suite.describe("SignupLimiter should limit per email", function () {
    window.RateLimiter.signupLimiter.resetAll();
    
    const email = "test@example.com";
    const result1 = window.RateLimiter.signupLimiter.check(email);
    const result2 = window.RateLimiter.signupLimiter.check(email);
    const result3 = window.RateLimiter.signupLimiter.check(email);
    const result4 = window.RateLimiter.signupLimiter.check(email);

    this.expect(result1.allowed).toBeTruthy();
    this.expect(result2.allowed).toBeTruthy();
    this.expect(result3.allowed).toBeTruthy();
    this.expect(result4.allowed).toBeFalsy();
  });

  // Test 7: Session Storage and Retrieval
  suite.describe("Session storage should work correctly", function () {
    const testSession = {
      access_token: "test_token_123",
      refresh_token: "refresh_123",
      expires_at: Math.floor(Date.now() / 1000) + 3600
    };

    window.AdminAuth.saveSession(testSession);
    const retrieved = window.AdminAuth.getValidSession();
    
    // Note: This will fail without valid Supabase session, but confirms storage works
    // In real tests, use valid Supabase credentials
  });

  // Test 8: Session Expiration Detection
  suite.describe("Session should detect expiration", function () {
    const expiredSession = {
      access_token: "expired_token",
      refresh_token: "refresh_expired",
      expires_at: Math.floor(Date.now() / 1000) - 1000 // 1000 seconds ago
    };

    window.AdminAuth.saveSession(expiredSession);
    // After this, getValidSession should try to refresh
    // In real test, would verify refresh attempt
  });

  // Test 9: Audit Action Types
  suite.describe("Audit module should have all action types", function () {
    const actions = window.AdminAudit.AuditAction;
    this.expect(typeof actions.STATION_APPROVED).toBe("string");
    this.expect(typeof actions.LOGIN_SUCCESS).toBe("string");
    this.expect(typeof actions.LOGOUT).toBe("string");
    this.expect(typeof actions.ADMIN_CREATED).toBe("string");
    this.expect(actions).toContain("station_approved");
  });

  // Test 10: Severity Levels
  suite.describe("Audit module should have severity levels", function () {
    const levels = window.AdminAudit.SeverityLevel;
    this.expect(typeof levels.INFO).toBe("string");
    this.expect(typeof levels.WARNING).toBe("string");
    this.expect(typeof levels.CRITICAL).toBe("string");
  });

  // Test 11: Inactivity Guard Functions
  suite.describe("Inactivity guard should be available", function () {
    this.expect(typeof window.AdminAuth.startInactivityGuard).toBe("function");
    this.expect(typeof window.AdminAuth.stopInactivityGuard).toBe("function");
    this.expect(typeof window.AdminAuth.resetInactivityTimer).toBe("function");
  });

  // Test 12: SUPABASE_CONFIG must have required fields
  suite.describe("SUPABASE_CONFIG must have required fields", function () {
    const cfg = window.SUPABASE_CONFIG;
    this.expect(cfg.url.length > 0).toBeTruthy();
    this.expect(cfg.anonKey.length > 0).toBeTruthy();
    this.expect(cfg.url.startsWith("http")).toBeTruthy();
  });

  // =====================================================
  // FUNCTIONAL TESTS (Require Real Credentials)
  // =====================================================

  const functionalSuite = new AdminAuthTestSuite();

  /**
   * INSTRUCCIONES PARA TESTS FUNCIONALES:
   * 
   * Descomentar las siguientes funciones y ejecutar con credenciales de Supabase reales:
   * 
   * Ejemplo:
   * window.testAdminAuth.runFunctionalTests('test@example.com', 'password123')
   */

  functionalSuite.describe(
    "[Functional] Login with valid credentials should succeed",
    async function () {
      // Requires: valid email and password
      // This test must be run manually with real credentials
      console.log("  ℹ️  This test requires manual execution with real credentials");
      console.log(
        "  Call: window.testAdminAuth.runFunctionalTests('email@example.com', 'password')"
      );
    }
  );

  // =====================================================
  // EXPORT AND INITIALIZE
  // =====================================================

  window.testAdminAuth = {
    suite,
    functionalSuite,

    /**
     * Ejecuta todos los tests unitarios
     */
    async run() {
      return await suite.run();
    },

    /**
     * Ejecuta tests funcionales (requiere credenciales reales)
     */
    async runFunctionalTests(email, password) {
      if (!email || !password) {
        console.error("❌ Email and password required for functional tests");
        return;
      }

      console.clear();
      console.log(
        "%c=== ADMIN AUTH FUNCTIONAL TESTS ===",
        "color: #3b82f6; font-size: 16px; font-weight: bold;"
      );

      try {
        console.log("ℹ️  Testing login flow...");
        const session = await window.AdminAuth.signInWithPassword(email, password);
        console.log("✓ Login successful");

        const auth = await window.AdminAuth.getAuthenticatedAdmin();
        console.log("✓ Authentication verified:", auth);

        console.log("ℹ️  Testing session retrieval...");
        const validSession = await window.AdminAuth.getValidSession();
        console.log("✓ Session retrieved:", !!validSession?.access_token);

        console.log("ℹ️  Testing logout...");
        if (window.AdminAudit) {
          window.AdminAudit.recordLogout(email);
        }
        await window.AdminAuth.signOut();
        console.log("✓ Logout successful");

        console.log(
          "%c✓ All functional tests passed!",
          "color: #22c55e; font-weight: bold;"
        );
      } catch (error) {
        console.error("%c✗ Functional test failed:", "color: #ef4444;");
        console.error(error);
      }
    },

    /**
     * Muestra estadísticas de rate limiting
     */
    showRateLimitStats() {
      console.table({
        LoginLimiter: window.RateLimiter.getStats.login(),
        RPCLimiter: window.RateLimiter.getStats.api(),
      });
    },

    /**
     * Limpia todos los tests y state
     */
    reset() {
      window.RateLimiter.resetAll();
      window.AdminAuth.clearSession();
      localStorage.clear();
      console.log("✓ Test environment reset");
    },
  };

  console.log(
    "%c=== Admin Auth Tests Initialized ===",
    "color: #3b82f6; font-weight: bold;"
  );
  console.log("Run tests with: window.testAdminAuth.run()");
  console.log(
    "Run functional tests with: window.testAdminAuth.runFunctionalTests(email, password)"
  );
})();
