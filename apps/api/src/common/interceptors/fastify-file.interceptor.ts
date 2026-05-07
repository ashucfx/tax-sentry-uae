import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  Type,
  mixin,
} from '@nestjs/common';
import * as multer from 'multer';
import { Observable } from 'rxjs';

/**
 * Fastify-compatible FileInterceptor.
 *
 * @nestjs/platform-express's FileInterceptor relies on Express req/res.
 * Fastify exposes the raw Node.js IncomingMessage at req.raw — we pass that
 * to multer and then copy the processed file back onto the Fastify request
 * so @UploadedFile() can pick it up normally.
 */
export function FileInterceptor(
  fieldName: string,
  options: multer.Options = { storage: multer.memoryStorage() },
): Type<NestInterceptor> {
  @Injectable()
  class MixinInterceptor implements NestInterceptor {
    private readonly upload = multer(options).single(fieldName);

    async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<unknown>> {
      const httpCtx = context.switchToHttp();
      const req = httpCtx.getRequest<{ raw: any; file?: Express.Multer.File }>();
      const res = httpCtx.getResponse<{ raw: any }>();

      await new Promise<void>((resolve, reject) => {
        this.upload(req.raw, res.raw, (err: unknown) => {
          if (err) {
            reject(err);
          } else {
            // Copy multer output from the raw Node request to the Fastify request
            // so @UploadedFile() finds it in the right place.
            req.file = req.raw.file;
            resolve();
          }
        });
      });

      return next.handle();
    }
  }

  return mixin(MixinInterceptor);
}
