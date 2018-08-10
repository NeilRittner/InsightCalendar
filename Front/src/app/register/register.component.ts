import { RemoteService } from './../remote.service';
import { Component, OnInit } from '@angular/core';
import { AuthService, GoogleLoginProvider } from 'angular-6-social-login';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '../../../node_modules/@angular/common/http';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})

export class RegisterComponent implements OnInit {

  constructor(private socialAuthService: AuthService,
    private router: Router,
    private service: RemoteService
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
          this.router.navigate(['/home']);
        }
      },
        (err: HttpErrorResponse) => {
          // console.log(err['status']);
          // 500: Internal Error Component
          // 498: message token fake
        });
  }

  ngOnInit() {
  }

}
