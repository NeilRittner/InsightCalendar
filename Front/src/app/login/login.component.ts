import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService, GoogleLoginProvider } from "angular-6-social-login";

import { Router } from "@angular/router";

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  constructor(private socialAuthService: AuthService, private http: HttpClient, private router: Router) { }

  title = "Connection Page";

  idCard;

  public signinWithGoogle() {
    let socialPlatformProvider = GoogleLoginProvider.PROVIDER_ID;

    this.socialAuthService.signIn(socialPlatformProvider).then(
      (userData) => { //on success
        //this will return user data from google. What you need is a user token which you will send it to the server
        this.sendToRestApiMethod(userData.idToken);
      }
    );
  }

  public signinWithCard() {
    this.http.post("http://localhost:8080/api/card", { withCredentials: true, idcard: this.idCard })
      .subscribe(status => {
        console.log('success card');
        this.router.navigate(['/home']);
      })
  }

  sendToRestApiMethod(token: string): void {
    this.http.post("http://localhost:8080/api/tokenGoogle", { withCredentials: true, idtoken: token })
      .subscribe(onSuccess => {
        console.log('success');
        //login was successful
        //save the token that you got from your REST API in your preferred location i.e. as a Cookie or LocalStorage as you do with normal login
        this.router.navigate(['/home']);
      }, onFail => {
        console.log(onFail);
        //login was unsuccessful
        //show an error message
      }
      );
  }

  ngOnInit() {
  }

}
