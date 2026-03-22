export const jwtConstants = {
  secret: process.env.JWT_SECRET ?? 'replace_me_with_strong_secret',
  expiresIn: process.env.JWT_EXPIRATION ?? '3600s',
};
