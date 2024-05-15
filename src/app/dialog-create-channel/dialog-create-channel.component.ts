import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog'; 
import { DialogAddPeopleToNewChannelComponent } from '../dialog-add-people-to-new-channel/dialog-add-people-to-new-channel.component';
import { Firestore, addDoc, collection, updateDoc, doc } from '@angular/fire/firestore';
import { Channel } from './../../models/channel.class';
import { FormsModule } from '@angular/forms';
import { ChannelService } from '../services/channel.service';
import { ChatService } from '../services/chat.service';
import { FirestoreService } from '../firestore.service';


@Component({
  selector: 'app-dialog-create-channel',
  standalone: true,
  imports: [ CommonModule, FormsModule ],
  templateUrl: './dialog-create-channel.component.html',
  styleUrl: './dialog-create-channel.component.scss'
})
export class DialogCreateChannelComponent {
  channelName: string = '';
  channelDescription: string = '';
  channelAuthor: string = '';
  channel = new Channel();

  constructor(private dialogRef: MatDialogRef<DialogCreateChannelComponent>, public dialog: MatDialog, private channelService: ChannelService, private readonly firestore: Firestore, public chatService: ChatService, public firestoreService: FirestoreService) {}

  closeCreateChannelDialog(): void {
    this.dialogRef.close();
  }

  openAddPeopleToNewChannelDialog(newChannelId: string) {
    this.dialogRef.close();
    this.dialog.open(DialogAddPeopleToNewChannelComponent, {
      data: {
        newChannelId: newChannelId
      }
    });
    this.channelService.setCurrentChannelId(newChannelId);
  }

  async createChannel(): Promise<void> {
    try {
      const authorUid = this.firestoreService.currentuid;
      if (!authorUid) {
        console.error('Benutzer nicht angemeldet.');
        return;
      }
      const channelData = {
        channelName: this.channelName,
        description: this.channelDescription,
        author: authorUid,
      };
      const newChannelId = await this.channelService.addChannel(channelData);
      await this.chatService.createChatForChannel(newChannelId);
      this.dialogRef.close();
      this.openAddPeopleToNewChannelDialog(newChannelId);
    } catch (error) {
      console.error('Fehler beim Erstellen des Kanals:', error);
      throw error;
    }
  }
}