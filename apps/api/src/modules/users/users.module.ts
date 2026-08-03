import { Module } from '@nestjs/common';
import { UsersController } from '@presentation/controllers/users.controller';
import { UserRegisteredListener } from './user-registered.listener';

@Module({
  controllers: [UsersController],
  providers: [UserRegisteredListener],
})
export class UsersModule {}
