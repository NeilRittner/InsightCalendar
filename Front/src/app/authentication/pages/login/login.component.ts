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

  @ViewChild('scan') scanElement: ElementRef;
  idCardControl = new FormControl();  // FormControl for scan
  timeToastr = 1500;

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
          if (err['status'] === 498) {
            this.toastr.error(err['error'], '', { timeOut: this.timeToastr });
          } else if (err['status'] === 500) {
            this.router.navigate(['/server-error', 'Internal Error']);
          }
        });
    });
  }

  signinWithCard(idCard): void {
    this.service.postCardId(idCard)
      .subscribe(() => {
        this.router.navigate(['/user']);
      }, (err: HttpErrorResponse) => {
        if (err['status'] === 404) {
          this.toastr.error(err['error'], '', { timeOut: this.timeToastr });
        } else if (err['status'] === 500) {
          this.router.navigate(['/server-error', 'Internal Error']);
        }
      });
    this.idCardControl.reset();
  }

  ngOnInit() {
    this.scanElement.nativeElement.focus();
  }

}
