import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {

  constructor(
    private router: Router
  ) { }

  @Input() user;
  @Input() timeScale: string;
  @Output() timeScaleChanged: EventEmitter<string> = new EventEmitter();

  changeTimeScale(newTimeScale: string): void {
    this.timeScaleChanged.emit(newTimeScale);
  }

  ngOnInit() {
  }

}
