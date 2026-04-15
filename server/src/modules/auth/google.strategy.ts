import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private configService: ConfigService) {
    const apiUrl = configService.get<string>('API_URL');
    if (!apiUrl) {
      console.error('❌ [Auth] API_URL is not defined in environment variables. Google OAuth will fail.');
    }

    super({
      clientID: configService.get<string>('GOOGLE_CLIENT_ID')!,
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET')!,
      callbackURL: (apiUrl || '') + '/api/auth/google/callback',
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { name, emails, photos, displayName } = profile;
    const user = {
      email: emails[0].value,
      fullName: displayName || `${name.givenName} ${name.familyName}`,
      avatarUrl: photos[0].value,
      accessToken,
    };
    done(null, user);
  }
}
