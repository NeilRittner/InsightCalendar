import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '../../../../../node_modules/@angular/common/http';
import { AuthenticationService } from './../../shared/authentication.service';
import { AuthService, GoogleLoginProvider } from 'angular-6-social-login';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  constructor(
    private service: AuthenticationService,
    private router: Router,
    private authService: AuthService
  ) { }

  private idCard: string;
  private fakeToken: boolean;

  signinWithGoogle(): void {
    const socialPlatformProvider = GoogleLoginProvider.PROVIDER_ID;
    this.fakeToken = false;
    this.authService.signIn(socialPlatformProvider).then(userData => {
      this.service.postGoogleToken(userData.idToken)
        .subscribe((data: string) => {
          if (data) {
            window.location.href = data;
          } else {
            this.router.navigate(['/user']);
          }
        }, (err: HttpErrorResponse) => {
          if (err['status'] === 498) {
            this.fakeToken = true;
          } else if (err['status'] === 500) {
            this.router.navigate(['/server-error', 'Internal Error']);
          }
        });
    });
  }

  signinWithCard(): void {
    this.service.postCardId(this.idCard)
      .subscribe(() => {
        this.router.navigate(['/user']);
      }, (err: HttpErrorResponse) => {
        if (err['status'] === 404) {
          
        } else if (err['status'] === 500) {
          this.router.navigate(['/server-error', 'Internal Error']);
        }
      });
  }

  register(): void {
    this.router.navigate(['/register']);
  }

  ngOnInit() {
  }

}
