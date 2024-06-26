import { Component, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { DialogAddPeopleComponent } from '../dialog-add-people/dialog-add-people.component';
import { ChannelService } from '../services/channel.service';
import { CommonModule } from '@angular/common';
import { FirestoreService } from '../firestore.service';
import { DialogContactInfoComponent } from '../dialog-contact-info/dialog-contact-info.component';

@Component({
  selector: 'app-dialog-members',
  standalone: true,
  imports: [ CommonModule ],
  templateUrl: './dialog-members.component.html',
  styleUrl: './dialog-members.component.scss'
})
export class DialogMembersComponent implements OnInit {
  allUsers: any[] = [];
  memberData: { username: string, photo: string, uid: any }[] = [];

  constructor(private dialogRef: MatDialogRef<DialogMembersComponent>, public dialog: MatDialog, public channelService: ChannelService, public firestoreService: FirestoreService) {}

  closeDialogMember(): void {
    this.dialogRef.close();
  }

  openAddPeopleDialog() {
    this.dialog.open(DialogAddPeopleComponent);
    this.dialogRef.close();
  }

  ngOnInit(): void {
    this.firestoreService.getAllUsers().then(users => {
      this.allUsers = users;
      this.updateMemberData();
    })
  }

  async openContactInfo(userid:any ) {
    let allUsers = await this.firestoreService.getAllUsers();
    let userDetails = allUsers.filter(
      (user) => user.uid == userid
    );
    this.dialog.open(DialogContactInfoComponent, {
      data: userDetails[0],
    });
  }

  updateMemberData(): void {
    this.memberData = this.allUsers.filter(user => this.channelService.UserName.includes(user.uid)).map(user => ({ username: user.username, photo: user.photo, uid: user.uid }));
  }
}
