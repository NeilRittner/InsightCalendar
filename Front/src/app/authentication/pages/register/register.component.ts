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

  @ViewChild('scan') scanElement: ElementRef;
  idCardControl = new FormControl();  // FormControl for scan
  private idToken: string;

  signinWithGoogle() {
    const socialPlatformProvider = GoogleLoginProvider.PROVIDER_ID;
    this.socialAuthService.signIn(socialPlatformProvider).then((userData) => {
      this.idToken = userData.idToken;
      this.idCardControl.enable();
      this.scanElement.nativeElement.focus();
    });
  }

  registerCard(idCard) {
    this.service.postRegisterCard(this.idToken, idCard)
      .subscribe((data: string) => {
        if (data) {
          window.location.href = data;
        } else {
          this.router.navigate(['/user']);
          this.toastr.success('Registeration successful', '', { timeOut: 3000 });
        }
      }, (err: HttpErrorResponse) => {
        if (err['status'] === 498) {
          this.toastr.error(err['error'], '', { timeOut: 3000 });
        } else if (err['status'] === 500) {
          this.router.navigate(['/server-error', 'Internal Error']);
        }
      });
  }

  ngOnInit() {
    this.idCardControl.disable();
  }

}
