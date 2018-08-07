import { RemoteService } from './../remote.service';
import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

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
      .subscribe((status: string) => {
        this.router.navigate(['/home']);
      });
    });
  }

}
