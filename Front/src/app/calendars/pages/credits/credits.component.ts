import { Component, OnInit } from '@angular/core';
import { DataService } from './../../shared/dataService/data.service';

@Component({
  selector: 'app-credits',
  templateUrl: './credits.component.html',
  styleUrls: ['./credits.component.css']
})
export class CreditsComponent implements OnInit {

  constructor(private dataService: DataService) { }

  ngOnInit() {
    if (JSON.stringify(this.dataService.user) === '{}') {
      this.dataService.getUser();
    }
  }

}
