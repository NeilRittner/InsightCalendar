import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpErrorResponse } from '../../../../../node_modules/@angular/common/http';
import { AuthenticationService } from './../../shared/authentication.service';

@Component({
  selector: 'app-authorization',
  templateUrl: './authorization.component.html',
  styleUrls: ['./authorization.component.css']
})
export class AuthorizationComponent implements OnInit {

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private service: AuthenticationService
  ) { }

  ngOnInit() {
    this.route.queryParams.subscribe(paramsId => {
      this.service.postCode(paramsId.code)
        .subscribe(() => {
          this.router.navigate(['/user']);
        }, (err: HttpErrorResponse) => {
          this.router.navigate(['/server-error', 'Internal Error']);
        });
    });
  }

}
