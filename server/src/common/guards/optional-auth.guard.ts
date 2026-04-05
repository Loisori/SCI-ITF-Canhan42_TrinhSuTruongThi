import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    // If there is an error or the user is not found, we don't throw.
    // Instead, we just return null. This allows the request to proceed.
    return user || null;
  }
}
