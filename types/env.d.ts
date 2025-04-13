declare global {
  namespace NodeJS {
    interface ProcessEnv {
      SENDGRID_API_KEY: string;
      SENDGRID_FROM_EMAIL: string;
      SENDGRID_INVITATION_TEMPLATE_ID: string;
      // ...other env vars...
    }
  }
}

export {};
