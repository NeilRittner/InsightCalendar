import { AuthServiceConfig, GoogleLoginProvider } from 'angular-6-social-login';

export function getAuthServiceConfigs() {
  const config = new AuthServiceConfig([{
    id: GoogleLoginProvider.PROVIDER_ID,
    provider: new GoogleLoginProvider('629111666736-3i2vp98mgii0061lju1r767ubp47vi12.apps.googleusercontent.com')
  }]);

  return config;
}
