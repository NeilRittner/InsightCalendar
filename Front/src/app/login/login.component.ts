import { RemoteService } from './../remote.service';
import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService, GoogleLoginProvider } from 'angular-6-social-login';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})

export class LoginComponent implements OnInit {
  constructor(private socialAuthService: AuthService,
    private http: HttpClient,
    private router: Router,
    private service: RemoteService
  ) { }

  private idToken;
  private idCard;
  private idCardAsso;

  signinWithGoogle(): void {
    const socialPlatformProvider = GoogleLoginProvider.PROVIDER_ID;
    this.socialAuthService.signIn(socialPlatformProvider).then(
      (userData) => {
        this.sendToken(userData.idToken);
      }
    );
  }

  signinWithCard(): void {
    this.http.post('http://localhost:8080/api/card', { withCredentials: true, idCard: this.idCard })
      .subscribe((status: string) => {
        this.router.navigate(['/home']);
      }, onFail => {
        // Do something to tell the user that his card is not store in the database
      });
  }

  sendToken(token: string): void {
    this.http.post('http://localhost:8080/api/tokenGoogle', { responseType: 'text', withCredentials: true, idToken: token })
      .subscribe((onSuccess: string) => {
        this.router.navigate(['/home']);
      }, onFail => {
        // Do something to tell the user that the connection fails
      });
  }

  writeGoogleAccount(): void {
    const socialPlatformProvider = GoogleLoginProvider.PROVIDER_ID;

    this.socialAuthService.signIn(socialPlatformProvider).then(
      (userData) => { // On success
        // This will return user data from google. What you need is a user token which you will send it to the server
        this.idToken = userData.idToken;
      }
    );
  }

  scanCard() {
    this.http.post('http://localhost:8080/api/associate',
    { withCredentials: true, idToken: this.idToken, idCard: this.idCardAsso })
      .subscribe((status: string) => {
        this.router.navigate(['/home']);
      }, onFail => {
        // Do something to tell the user that his card is not store in the database
      });
  }

  ngOnInit() {
  }

}
