import { AuthServiceConfig, GoogleLoginProvider } from 'angular-6-social-login';
import { environment } from '../../environments/environment';

export function getAuthServiceConfigs() {
  const config = new AuthServiceConfig([{
    id: GoogleLoginProvider.PROVIDER_ID,
    provider: new GoogleLoginProvider(environment.id_client)
  }]);

  return config;
}
