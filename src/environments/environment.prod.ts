export const environment = {
  production: true,
  apiUrl: '/api/v1',
  useMockApi: false,
  appName: 'FitLife Gym',
  defaultCurrency: 'INR',
  defaultTimezone: 'Asia/Kolkata',
  /** Replace via CI/CD with a deployment-specific secret (min ~32 chars). */
  clientStorageSecret: 'REPLACE_WITH_LONG_RANDOM_SECRET_IN_PRODUCTION_BUILD',
  /** Member + staff PII (staff email stays plaintext for login). */
  memberPiiEncryptionEnabled: true,
};
