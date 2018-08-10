import { RemoteService } from './../remote.service';
import { Component, OnInit } from '@angular/core';
import { AuthService, GoogleLoginProvider } from 'angular-6-social-login';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '../../../node_modules/@angular/common/http';


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
    });
  }

  signinWithCard(): void {
    this.service.postCardId(this.idCard)
      .subscribe((data: string) => {
        if (data) {
          // Print "error" : user has no card
        } else {
          this.router.navigate(['/home']);
        }
      },
      (err: HttpErrorResponse) => {
        // 500: Internal Error Component
      });
  }

  register(): void {
    this.router.navigate(['/register']);
  }

  ngOnInit() {
  }

}
