export enum ErrorCodes {
  // Server side errors.
  UNAUTHENTICATED = '10000',
  TOKEN_IS_INVALID = '10001',
  SESSION_EXPIRED = '10002',
  UNKNOWN_ERROR = '10003',

  // Client side errors.
  MISSING_REPOSITORY_TOKEN = '20000',
  MISSING_WORKSPACE_NAME = '20001',
  MISSING_REPOSITORY_NAME = '20002'
}

// Error messages for server only.
export const ErrorMessages = {
  [ErrorCodes.UNAUTHENTICATED]: 'unauthenticated',
  [ErrorCodes.TOKEN_IS_INVALID]: 'invalid token',
  [ErrorCodes.SESSION_EXPIRED]: 'session expired',
  [ErrorCodes.UNKNOWN_ERROR]: 'unknown error'
};
