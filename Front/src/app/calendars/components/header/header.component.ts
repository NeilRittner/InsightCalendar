import { Component, OnInit, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit, OnChanges {

  constructor(
    private router: Router // Used in the html file
  ) { }

  roomNamesList = ['ConferenceRoom', 'RoomA', 'RoomB', 'RoomC'];
  insightMember: boolean;

  @Input() user;  // To display the name of the user
  @Input() timeScale: string; // The display the timescale (and change it) if the user is on the home page
  @Output() timeScaleChanged: EventEmitter<string> = new EventEmitter();  // Emit an event when
  // the timescale is changed

  /**
   * Regex source : https://stackoverflow.com/questions/10064683/split-by-caps-in-javascript
   * @param {string} roomName
   * Put a space in the roomName given
   * @return {string}: return the name of the room with a space
   */
  spaceRoomName(roomName: string): string {
    const arrayName = roomName.split(/(?=[A-Z])/);
    return arrayName[0] + ' ' + arrayName[1];
  }

  /**
   * @param {string} name: a name
   * This function avoids to display 'undefined' in the header if the first or last name is missing
   * @return {string}: the given name or '' if the name is undefined
   */
  nameDefined(name: string): string {
    if (name === 'undefined') {
      return '';
    } else {
      return name;
    }
  }

  /**
   * @param {string} newTimeScale: the timescale selected by the user
   * This function emits an event to that the user has selected a new timescale for his calendar
   */
  changeTimeScale(newTimeScale: string): void {
    this.timeScaleChanged.emit(newTimeScale);
  }

  /**
   * To know is the user is an insight member or not
   */
  ngOnChanges() {
    if (JSON.stringify(this.user) !== '{}') {
      if (this.user['Email'].split('@')[1] !== 'insight-centre.org') {
        this.insightMember = false;
      } else {
        this.insightMember = true;
      }
    } else {
      this.insightMember = true;
    }
  }

  ngOnInit() {
  }

}
