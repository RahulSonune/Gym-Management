export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api/v1',
  /** Set false when Spring Boot API is running and you log in with real credentials. */
  // useMockApi: true,
  useMockApi: false,
  appName: 'FitLife Gym',
  defaultCurrency: 'INR',
  defaultTimezone: 'Asia/Kolkata',
  /**
   * Browser-only secret for AES-GCM encryption of persisted session data.
   * Use a long random value per deployment; still not equal to server-side secrecy.
   */
  clientStorageSecret: 'fitlife-dev-client-storage-secret-change-for-prod-min-32',
  /**
   * Member/staff PII + staff email/password stored as FLENC1 in DB.
   * Login sends a sealed credentials envelope; auth compares sealed values. Roles use JWT.
   */
  memberPiiEncryptionEnabled: true,
};
