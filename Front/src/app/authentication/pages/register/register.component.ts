import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { FormControl } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
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
    private service: AuthenticationService,
    private toastr: ToastrService
  ) { }

  @ViewChild('scan') scanElement: ElementRef; // The scanElement
  idCardControl = new FormControl();  // FormControl for scan
  private idToken: string;  // The token sent by Google when user login with his Google account

  /**
   * Calls when the user login with his Google account
   * Enables the scanElement and stores the Google token in 'idToken'
   */
  signinWithGoogle(): void {
    const socialPlatformProvider = GoogleLoginProvider.PROVIDER_ID;
    this.socialAuthService.signIn(socialPlatformProvider).then((userData) => {
      this.idToken = userData.idToken;
      this.idCardControl.enable();
      this.scanElement.nativeElement.focus();
    });
  }

  /**
   * @param {*} idCard: the id/number of the scanned card
   * Calls when the user scans his card to register and log-in
   */
  registerCard(idCard): void {
    this.service.postRegisterCard(this.idToken, idCard)
      .subscribe((data: string) => {
        if (data) {
          // data = url of the authorization page
          window.location.href = data;
        } else {
          // No data: the user has already authorized the application
          this.router.navigate(['/user']);
          this.toastr.success('Registeration successful', '', { timeOut: 3000 });
        }
      }, (err: HttpErrorResponse) => {
        // Error 498: fake token
        if (err['status'] === 498) {
          this.toastr.error(err['error'], '', { timeOut: 3000 });
        } else if (err['status'] === 500) {
          this.router.navigate(['/server-error', 'Internal Error']);
        }
      });
  }

  ngOnInit() {
    // Disable the scanElement
    this.idCardControl.disable();
  }

}
