import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { FormControl } from '@angular/forms';
import { HttpErrorResponse } from '../../../../../node_modules/@angular/common/http';
import { ToastrService } from 'ngx-toastr';
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
    private authService: AuthService,
    private toastr: ToastrService
  ) { }

  @ViewChild('scan') scanElement: ElementRef; // The scan element
  idCardControl = new FormControl();  // FormControl for scan
  timeToastr = 1500;  // Toastr notifications time

  /**
   * Calls when the user want to log-in with his Google Account
   */
  signinWithGoogle(): void {
    const socialPlatformProvider = GoogleLoginProvider.PROVIDER_ID;
    this.authService.signIn(socialPlatformProvider).then(userData => {
      this.service.postGoogleToken(userData.idToken)
        .subscribe((data: string) => {
          // If data: it means that the application need the authorization to manage the user's calendar
          if (data) {
            // data = url of the authorization page
            window.location.href = data;
          } else {
            // No data: the user has already authorized the application
            this.router.navigate(['/user']);
          }
        }, (err: HttpErrorResponse) => {
          // Error 498: fake token
          if (err['status'] === 498) {
            this.toastr.error(err['error'], '', { timeOut: this.timeToastr });
          } else if (err['status'] === 500) {
            this.router.navigate(['/server-error', 'Internal Error']);
          }
        });
    });
  }

  /**
   * @param {*} idCard: the id/number of the scanned card
   * Calls when the user scans his card to log-in
   */
  signinWithCard(idCard): void {
    this.service.postCardId(idCard)
      .subscribe(() => {
        this.router.navigate(['/user']);
      }, (err: HttpErrorResponse) => {
        // Error 404: the card is not associated to a user
        if (err['status'] === 404) {
          this.toastr.error(err['error'], '', { timeOut: this.timeToastr });
        } else if (err['status'] === 500) {
          this.router.navigate(['/server-error', 'Internal Error']);
        }
      });
  }

  ngOnInit() {
    // Focus on the scanElement, the user can scan his card without selecting the scanElement
    this.scanElement.nativeElement.focus();
  }

}
