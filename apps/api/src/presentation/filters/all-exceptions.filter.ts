import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';

// صيغة استجابة خطأ موحّدة عبر كل الـAPI
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('Exception');

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse();
    const req = ctx.getRequest();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let message: unknown = 'خطأ داخلي في الخادم';
    if (exception instanceof HttpException) {
      const r = exception.getResponse();
      message = typeof r === 'string' ? r : (r as any).message ?? r;
    }

    if (status >= 500) {
      this.logger.error(`${req.method} ${req.url}`, exception as any);
    }

    res.status(status).json({
      success: false,
      statusCode: status,
      path: req.url,
      message,
      timestamp: new Date().toISOString(),
    });
  }
}
