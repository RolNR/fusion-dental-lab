/**
 * Feature flags configuration
 * Controls the visibility and availability of features in the application
 */

export const featureFlags = {
  /**
   * Enable the "Create Clinic" button in the user form
   * When disabled, users can only select existing clinics
   */
  enableCreateClinicInUserForm:
    process.env.NEXT_PUBLIC_ENABLE_CREATE_CLINIC_IN_USER_FORM === 'true',
} as const;
