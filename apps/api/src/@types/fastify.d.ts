// Module augmentation — `export {}` makes this a module file so the
// `declare module 'fastify'` block MERGES with the real fastify types
// instead of creating an ambient declaration that shadows them.
export {};

declare module 'fastify' {
  interface FastifyRequest {
    /** Cookies populated by @fastify/cookie */
    cookies: { [cookieName: string]: string | undefined };
  }

  interface FastifyReply {
    setCookie(
      name: string,
      value: string,
      options?: {
        domain?: string;
        path?: string;
        maxAge?: number;
        httpOnly?: boolean;
        secure?: boolean;
        sameSite?: boolean | 'lax' | 'strict' | 'none';
        expires?: Date;
        signed?: boolean;
        encode?: (val: string) => string;
      },
    ): this;

    clearCookie(
      name: string,
      options?: {
        domain?: string;
        path?: string;
        maxAge?: number;
        httpOnly?: boolean;
        secure?: boolean;
        sameSite?: boolean | 'lax' | 'strict' | 'none';
      },
    ): this;

    signCookie(value: string): string;
    unsignCookie(value: string): { valid: boolean; renew: boolean; value: string | null };
  }
}
