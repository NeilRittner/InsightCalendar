import { RemoteService } from './../remote.service';
import { Component, OnInit } from '@angular/core';
import { AuthService, GoogleLoginProvider } from 'angular-6-social-login';
import { Router } from '@angular/router';

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
  }

  ngOnInit() {
  }

}