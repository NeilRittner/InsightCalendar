import { RemoteService } from './../remote.service';
import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpErrorResponse } from '../../../node_modules/@angular/common/http';

@Component({
  selector: 'app-authorize',
  templateUrl: './authorize.component.html',
  styleUrls: ['./authorize.component.css']
})

export class AuthorizeComponent implements OnInit {

  constructor(private route: ActivatedRoute,
    private router: Router,
    private service: RemoteService
  ) { }

  ngOnInit() {
    this.route.queryParams.subscribe(paramsId => {
      this.service.postCode(paramsId.code)
      .subscribe(() => {
        this.router.navigate(['/home']);
      },
      (err: HttpErrorResponse) => {
        // 500: Internal Error Component
      });
    });
  }

}
