import { ThreadService } from './../services/thread.service';
import { FirestoreService } from './../firestore.service';
import { Component,OnInit,OnDestroy,HostListener,ElementRef,Renderer2,Output,EventEmitter,ViewChild,ViewEncapsulation, ChangeDetectorRef,AfterViewChecked, NgZone,ApplicationRef,} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { DialogProfileComponent } from '../dialog-profile/dialog-profile.component';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { doc, onSnapshot } from 'firebase/firestore';
import { Unsubscribe } from '@angular/fire/firestore';
import { ChatService } from '../services/chat.service';
import { ChannelService } from '../services/channel.service';
import { Subscription } from 'rxjs';
import { IdleService } from '../services/idle.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [MatMenuModule, MatButtonModule, CommonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class HeaderComponent implements OnInit, OnDestroy, AfterViewChecked  {
  constructor(public dialog: MatDialog, private router: Router, public firestoreService: FirestoreService, private chatService: ChatService, private eRef: ElementRef, private renderer: Renderer2, public channelService: ChannelService, public idleService: IdleService, public threadService: ThreadService, private cdRef: ChangeDetectorRef, private ngZone: NgZone, private appRef: ApplicationRef) {}
  private unsubscribe: Unsubscribe | undefined;
  @Output() userDetails = new EventEmitter<string>();
  @Output() channelDetails = new EventEmitter<string>();
  @Output() test = new EventEmitter<boolean>();
  @ViewChild('inputRef', { static: false }) inputRef: ElementRef | undefined;
  @ViewChild('dropdownMenu', { static: false }) dropdownMenu:
    | ElementRef
    | undefined;
  private userStatusSubscription: Subscription | undefined;
  userStatus: any = 'active';
  userStatus$: any;
  logInUid: any;
  userForm: any;
  userName: any;
  userPhoto: any;
  userUid: any;
  guestLogIn = false;
  userIsVerified = false;
  currentUid: any;
  allUsers: any = [];
  allChannels: any = [];
  filteredUser: any;
  filteredEntities: any = [];
  showDropdown: boolean = false;
  focusOnTextEditor: boolean = false;

  @HostListener('window:resize', ['$event'])
  onResize(event: Event) {
    this.checkScreenWidth();
  }

  checkScreenWidth() {
    this.firestoreService.isScreenWide = window.innerWidth > 850;
  }

  ngAfterViewChecked() {
    this.cdRef.detectChanges();
  }

  backToWorkspace() {
    if (this.threadService.displayThread === true && this.channelService.lastOpenedChannel === true) {
      this.threadService.displayThread = false;
      this.channelService.showChannelChat = true;
      this.channelService.lastOpenedChannel = false;
    } else if (this.threadService.displayThread === true && this.chatService.lastOpenedChat === true) {
      this.threadService.displayThread = false;
      this.chatService.showOwnChat = true;
      this.chatService.lastOpenedChat = false;
    } else if (this.channelService.showChannelChat === true) {
      this.channelService.showChannelChat = false;
      this.firestoreService.displayWorkspace = true;
    } else if (this.chatService.showOwnChat === true) {
      this.chatService.showOwnChat = false;
      this.firestoreService.displayWorkspace = true;
    }
  }

  searchEntity(input: string) {
    const lowerCaseInput = input.toLowerCase().trim();
    this.filteredEntities = [];
    if (input === '') {
      this.displayAllUsersAndChannels();
    } else if (input === '@') {
      this.displayAllUsers();
    } else if (input === '#') {
      this.displayAllChannels();
    } else if (input.startsWith('@')) {
      this.filteredEntities = this.allUsers.filter((item: any) => {
        return (
          item.username &&
          item.username.toLowerCase().includes(lowerCaseInput.substring(1)) &&
          item.uid !== this.firestoreService.currentuid
        );
      });
    } else if (input.startsWith('#')) {
      this.filteredEntities = this.allChannels.filter((channel: any) => {
        return (
          channel.channelName &&
          channel.channelName
            .toLowerCase()
            .includes(lowerCaseInput.substring(1))
        );
      });
    } else {
      const users = this.allUsers.filter((item: any) => {
        item.isUser = true;
        return (
          item.username &&
          item.username.toLowerCase().includes(lowerCaseInput) &&
          item.uid !== this.firestoreService.currentuid
        );
      });
      const channels = this.allChannels.filter((item: any) => {
        item.isChannel = true;
        return (
          item.channelName &&
          item.channelName.toLowerCase().includes(lowerCaseInput)
        );
      });

      this.filteredEntities = [...channels, ...users];
    }
    this.showDropdown = true;
  }

  displayAllUsersAndChannels() {
    this.filteredEntities = [
      ...this.allChannels.map((channel: any) => {
        channel.isChannel = true;
        return channel;
      }),
      ...this.allUsers.filter((user: any) => {
        user.isUser = true;
        return user.username && user.uid !== this.firestoreService.currentuid;
      }),
    ];
    this.showDropdown = true;
  }

  displayAllUsers() {
    this.filteredEntities = this.allUsers.filter((item: any) => {
      item.isUser = true;
      return item.username && item.uid !== this.firestoreService.currentuid;
    });

    this.filteredEntities.sort((a: any, b: any) => {
      const usernameA = a.username.toLowerCase();
      const usernameB = b.username.toLowerCase();
      if (usernameA < usernameB) {
        return -1;
      }
      if (usernameA > usernameB) {
        return 1;
      }
      return 0;
    });
    this.showDropdown = true;
  }

  displayAllChannels() {
    this.filteredEntities = this.allChannels.map((channel: any) => {
      channel.isChannel = true;
      return channel;
    });
    this.showDropdown = true;
  }

  selectEntity(entity: any) {
    if (entity.username) {
      let currentUID = this.firestoreService.currentuid;
      this.userDetails.emit(entity);
      this.filteredEntities = [];
      this.focusOnTextEditor = false;
      this.channelService.showChannelChat = false;
      this.chatService.showOwnChat = true;
      this.chatService.searchChatWithUser(entity.uid);
    } else if (!entity.username) {
      this.channelDetails.emit(entity);
      this.channelService.showChannelChat = true;
      this.chatService.showOwnChat = false;
    }
    if (this.inputRef) {
      this.inputRef.nativeElement.value = '';
    }
    this.filteredEntities = [];
    this.showDropdown = false;
  }

  private blurInputField() {
    const inputElement = this.eRef.nativeElement.querySelector('input');
    if (inputElement) {
      inputElement.blur();
    }
  }

  loadAllEntitys() {
    this.loadAllUsersAndAllChannels();
    this.currentUid = this.firestoreService.currentuid;
    this.allUsers = this.firestoreService.allUsers;
    this.allUsers = this.allUsers.filter((user: any) => {
      user.isUser = true;
      return user.uid != this.currentUid;
    });
    this.allUsers.sort((a: any, b: any) => {
      const usernameA = a.username.toLowerCase();
      const usernameB = b.username.toLowerCase();
      if (usernameA < usernameB) {
        return -1;
      }
      if (usernameA > usernameB) {
        return 1;
      }
      return 0;
    });
    this.allChannels = this.firestoreService.allChannels;
    this.allChannels = this.allChannels.filter((channel: any) => {
      channel.isChannel = true;
      return channel.users.includes(this.currentUid);
    });
    this.filteredEntities = [...this.allChannels, ...this.allUsers];
  }

  @HostListener('document:click', ['$event'])
  clickOutside(event: Event) {
    this.searchEntity(this.inputRef?.nativeElement.value);
    const clickedInsideInput =
      this.inputRef?.nativeElement.contains(event.target) || false;
    const clickedInsideDropdown =
      this.dropdownMenu?.nativeElement.contains(event.target) || false;

    if (!clickedInsideInput && !clickedInsideDropdown) {
      this.showDropdown = false;
    }
  }

  @HostListener('focusin', ['$event'])
  onFocus(event: FocusEvent) {
    this.loadAllUsersAndAllChannels();
    const inputValue = this.eRef.nativeElement.querySelector('input').value;
    const isEventTargetInside = this.eRef.nativeElement.contains(event.target);
    const isTextEditorFocused = this.focusOnTextEditor;
    const areFilteredEntitiesEmpty = this.filteredEntities.length === 0;
    if (isEventTargetInside && !isTextEditorFocused) {
      this.showDropdown = true;
    }
  }

  private focusInputField() {
    const inputElement = this.eRef.nativeElement.querySelector('input');
    if (inputElement) {
      inputElement.focus();
    }
  }

  loadAllUsersAndAllChannels() {
    this.firestoreService
      .getAllUsers()
      .then((users) => {
        this.allUsers = users;
      })
    this.firestoreService
      .getAllChannels()
      .then((Channels) => {
        this.allChannels = Channels.filter((channel) =>
          channel.users.includes(this.firestoreService.currentuid)
        );
      })
  }

  async ngOnInit() {
    this.guestLogIn = false;
    const uid = localStorage.getItem('uid');

    const userDocRef = this.firestoreService.getUserDocRef(uid);
    this.unsubscribe = onSnapshot(userDocRef, (doc) => {
      if (doc.exists()) {
        const userData = doc.data();
        this.userForm = { id: doc.id, ...userData };
        this.userName = this.userForm['username'];
        this.userPhoto = this.userForm['photo'];
        this.userUid = this.userForm['uid'];
        this.userIsVerified =
          this.firestoreService.auth.currentUser.emailVerified;

        if (this.userUid === 'vrsCc3CFhJXvECuPDBX8sr7zpj83') {
          this.guestLogIn = true;
        }
      }
    });
    this.loadAllUsersAndAllChannels();
    this.checkScreenWidth();
    this.userStatus$ = this.idleService.getUserStatus(
      this.firestoreService.currentuid
    );
  }

  changeStatus(event: Event) {
    const newStatus = (event.target as HTMLSelectElement).value;
    this.idleService.setUserStatus(this.firestoreService.currentuid, newStatus);
  }

  ngOnDestroy() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
    if (this.userStatusSubscription) {
      this.userStatusSubscription.unsubscribe();
    }
  }

  openProfileDialog() {
    this.dialog.open(DialogProfileComponent);
  }

  logOut() {
    this.router.navigate(['']);
    this.firestoreService.logOut();
  }
}
