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

  signinWithGoogle(): void {
    const socialPlatformProvider = GoogleLoginProvider.PROVIDER_ID;
    this.authService.signIn(socialPlatformProvider).then(userData => {
      this.service.postGoogleToken(userData.idToken)
        .subscribe((data: string) => {
          if (data) {
            window.location.href = data;
          } else {
            this.router.navigate(['/user']);
          }
        }, (err: HttpErrorResponse) => {
          // console.log(err['status']);
          // 500: Internal Error Component
          // 498: message token fake
        });
    });
  }

  signinWithCard(): void {
    this.service.postCardId(this.idCard)
      .subscribe((data: string) => {
        if (data) {
          // Print "error" : user has no card
        } else {
          this.router.navigate(['/user']);
        }
      }, (err: HttpErrorResponse) => {
        // 500: Internal Error Component
      });
  }

  register(): void {
    this.router.navigate(['/register']);
  }

  ngOnInit() {
  }

}
