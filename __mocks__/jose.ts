export const SignJWT = jest.fn().mockImplementation(() => ({
  setProtectedHeader: jest.fn().mockReturnThis(),
  setIssuedAt: jest.fn().mockReturnThis(),
  setExpirationTime: jest.fn().mockReturnThis(),
  sign: jest.fn().mockResolvedValue('mock.jwt.token'),
}));

export const jwtVerify = jest.fn().mockResolvedValue({
  payload: {
    sub: 'mock-user-id',
    email: 'mock@example.com',
  },
  protectedHeader: {
    alg: 'HS256',
  },
});

export const createRemoteJWKSet = jest.fn();
export const compactVerify = jest.fn();
export const CompactEncrypt = jest.fn();
export const compactDecrypt = jest.fn();
export const EncryptJWT = jest.fn();
export const decodeJwt = jest.fn();
export const generateKeyPair = jest.fn();
export const generateSecret = jest.fn();
export const importJWK = jest.fn();
export const exportJWK = jest.fn(); 