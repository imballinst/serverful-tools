export enum ErrorCodes {
  UNAUTHENTICATED = '10000',
  TOKEN_IS_INVALID = '10001',
  SESSION_EXPIRED = '10002'
}

export const ErrorMessages = {
  [ErrorCodes.UNAUTHENTICATED]:
    'Please input your Bitbucket repository token first.',
  [ErrorCodes.TOKEN_IS_INVALID]:
    'Token is invalid. Please ensure your form is correct, then try again.',
  [ErrorCodes.SESSION_EXPIRED]:
    'Session expired. Please input your Bitbucket repository token then try again.'
};
