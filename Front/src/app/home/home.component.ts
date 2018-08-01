import { RemoteService } from './../remote.service';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})

export class HomeComponent implements OnInit {
  constructor(private service: RemoteService) { }

  user = {};

  ngOnInit() {
    this.service.getUser()
      .subscribe(data => {
        this.user = data;
      });
  }

}
