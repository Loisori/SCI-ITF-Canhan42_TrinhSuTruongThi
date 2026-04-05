import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { UserEntity } from '../modules/users/entities/user.entity';

export const createTypeOrmConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => {
  const url = configService.get<string>('DATABASE_URL');

  if (url) {
    return {
      type: 'mysql',
      url,
      entities: [UserEntity],
      autoLoadEntities: true,
      synchronize: configService.get<string>('DB_SYNCHRONIZE') === 'true',
      ssl: {
        rejectUnauthorized: true,
      },
      connectorPackage: 'mysql2',
    };
  }

  return {
    type: 'mysql',
    host: configService.get<string>('DB_HOST'),
    port: configService.get<number>('DB_PORT', 4001),
    username: configService.get<string>('DB_USERNAME'),
    password: configService.get<string>('DB_PASSWORD'),
    database: configService.get<string>('DB_DATABASE'),
    entities: [UserEntity],
    autoLoadEntities: true,
    synchronize: configService.get<string>('DB_SYNCHRONIZE') === 'true',
    ssl: {
      rejectUnauthorized: true,
    },
    connectorPackage: 'mysql2',
  };
};
