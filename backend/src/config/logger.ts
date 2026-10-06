export const logger = {
  info: (message: string, meta?: unknown) => {
    if (meta !== undefined) {
      console.log(`[info] ${message}`, meta);
      return;
    }
    console.log(`[info] ${message}`);
  },
  error: (message: string, meta?: unknown) => {
    if (meta !== undefined) {
      console.error(`[error] ${message}`, meta);
      return;
    }
    console.error(`[error] ${message}`);
  },
};
