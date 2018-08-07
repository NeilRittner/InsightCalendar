import { RemoteService } from './../remote.service';
import { Component, OnInit } from '@angular/core';
import { AuthService, GoogleLoginProvider } from 'angular-6-social-login';
import { Router } from '@angular/router';


@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})

export class LoginComponent implements OnInit {
  constructor(private socialAuthService: AuthService,
    private router: Router,
    private service: RemoteService
  ) { }

  private idCard: string;

  signinWithGoogle(): void {
    const socialPlatformProvider = GoogleLoginProvider.PROVIDER_ID;
    this.socialAuthService.signIn(socialPlatformProvider).then(userData => {
      this.service.postGoogleToken(userData.idToken)
        .subscribe(res => {
          if (res['status'] === '200') {
            this.router.navigate(['/home']);
          } else if (res['status'] === '500') {
            // Print an error: internal error --> restart the process to sign in or try later
          } else if (res['status'] === '498') {
            // Print an error: idToken error --> restart the process to sign in or try later
          } else {
            window.location.href = res['url'];
          }
        });
    });
  }

  signinWithCard(): void {
    this.service.postCardId(this.idCard)
      .subscribe((status: number) => {
        if (status === 200) {
          this.router.navigate(['/home']);
        } else if (status === 404) {
          // Print an error: card no found
        } else {
          // Print an error: internal error --> restart the process to sign in or try later
        }
      });
  }

  register(): void {
    this.router.navigate(['/register']);
  }

  ngOnInit() {
  }

}
