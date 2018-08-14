import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {

  constructor() { }

  @Input() user;
  @Output() timeScaleChanged: EventEmitter<string> = new EventEmitter();

  changeTimeScale(newTimeScale: string): void {
    this.timeScaleChanged.emit(newTimeScale);
  }

  ngOnInit() {
  }

}
