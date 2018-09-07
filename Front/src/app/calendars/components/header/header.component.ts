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

  roomNamesList = ['ConferenceRoom', 'RoomA', 'RoomB', 'RoomC'];

  @Input() user;
  @Input() timeScale: string;
  @Input() occupancy: number;
  @Output() timeScaleChanged: EventEmitter<string> = new EventEmitter();

  /**
   * Regex source : https://stackoverflow.com/questions/10064683/split-by-caps-in-javascript
   * @param roomName
   */
  spaceRoomName(roomName: string): string {
    const arrayName = roomName.split(/(?=[A-Z])/);
    return arrayName[0] + ' ' + arrayName[1];
  }

  changeTimeScale(newTimeScale: string): void {
    this.timeScaleChanged.emit(newTimeScale);
  }

  ngOnInit() {
  }

}
