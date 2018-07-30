import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})

export class HomeComponent implements OnInit {
  constructor(private http: HttpClient) { }

  user = {};

  getUser() {
    return this.http.get("http://localhost:8080/api/user", { withCredentials: true });
  }

  showUser() {
    this.getUser()
      .subscribe(data => {
        this.user = data;
      });
  }

  ngOnInit() {
    this.showUser();
  }

}
