import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '../../../../../node_modules/@angular/common/http';

import { AuthenticationService } from './../../shared/authentication.service';

import { AuthService, GoogleLoginProvider } from 'angular-6-social-login';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {

  constructor(
    private socialAuthService: AuthService,
    private router: Router,
    private service: AuthenticationService
  ) { }

  private idToken: string;
  private idCard: string;

  enterGoogleAccount() {
    const socialPlatformProvider = GoogleLoginProvider.PROVIDER_ID;
    this.socialAuthService.signIn(socialPlatformProvider).then((userData) => {
      this.idToken = userData.idToken;
    });
  }

  registerCard() {
    this.service.postRegisterCard(this.idToken, this.idCard)
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
  }
  ngOnInit() {
  }

}
