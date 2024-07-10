import { Injectable, EventEmitter } from '@angular/core';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  sendEmailVerification,
  updatePassword,
  sendPasswordResetEmail,
  signOut,
  verifyBeforeUpdateEmail,
  deleteUser,
} from '@angular/fire/auth';
import { FirebaseApp } from '@angular/fire/app';
import {
  getFirestore,
  doc,
  setDoc,
  collection,
  getDocs,
  getDoc,
  updateDoc,
  where,
  deleteField,
  deleteDoc,
  query,
} from '@angular/fire/firestore';
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from '@angular/fire/storage';
import { User } from '../models/user.class';
import { Channel } from '../models/channel.class';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { Database, ref as reference } from '@angular/fire/database';
import { IdleService } from './services/idle.service';

@Injectable({
  providedIn: 'root',
})
export class FirestoreService {
  public onUserRegistered: EventEmitter<string> = new EventEmitter<string>();
  private resetPasswordUserIdSubject = new BehaviorSubject<any>(null);
  resetPasswordUserId$ = this.resetPasswordUserIdSubject.asObservable();

  private clearMessagesSubject = new BehaviorSubject<any>(null);
  clearMessages$: Observable<any> = this.clearMessagesSubject.asObservable();

  public auth: any;
  public firestore: any;
  private storageUserIcon: any;
  public newDate: any;
  public signUpDate: any;
  currentuid: any;
  storageId: any;
  signInuid: any;
  logInUid: any;
  allUsers: any;
  allChannels: any;
  displayWorkspace: boolean = true;
  isScreenWide: boolean = false;
  isScreenWide1300px: boolean = false;
  threadType: string = '';

  constructor(
    private myFirebaseApp: FirebaseApp,
    public router: Router,
    private rdb: Database,
    private idleService: IdleService
  ) {
    this.auth = getAuth(myFirebaseApp);
    this.auth.languageCode = 'de';
    this.firestore = getFirestore(myFirebaseApp);
    const provider = new GoogleAuthProvider();
    this.currentuid = localStorage.getItem('uid');
    this.initializeAuthState();
  }

  initializeAuthState() {
    onAuthStateChanged(this.auth, (user) => {
      if (user) {
        this.currentuid = user.uid;
        localStorage.setItem('uid', this.currentuid);
      } else {
        localStorage.removeItem('uid');
      }
    });
  }

  getCurrentAuth() {
    const auth = getAuth();
    const user: any = auth.currentUser;
    return user;
  }

  async deleteAccount(uid: any): Promise<string> {
    try {
      const auth = getAuth();
      const user: any = auth.currentUser;
      await deleteUser(user);
      if (auth) {
        await deleteDoc(doc(this.firestore, 'users', uid));
      }
      await this.deleteUserChats(uid);
      localStorage.clear;
      localStorage.setItem('userDelete', 'true');
      return 'auth/correct';
    } catch (error: any) {
      if (error.code === 'auth/requires-recent-login') {
        return 'auth/requires-recent-login';
      }
      return 'auth/false';
    }
  }

  async deleteUserChats(uid: string) {
    try {
      const q = query(
        collection(this.firestore, 'chats'),
        where('participants', 'array-contains', uid)
      );
      const querySnapshot = await getDocs(q);
      const deletePromises = querySnapshot.docs.map((chatDoc) => {
        return deleteDoc(doc(this.firestore, 'chats', chatDoc.id));
      });
      await Promise.all(deletePromises);
    } catch (error) {}
  }

  async deleteUserIcon(currentUserIcon: string, currentUserId: string) {
    if (
      currentUserIcon ===
        'https://firebasestorage.googleapis.com/v0/b/dabubble-180.appspot.com/o/user-icon%2F80.%20avatar%20interaction%20(0).png?alt=media&token=084e1046-d86a-492a-9d3a-d067185b78b3' ||
      'https://firebasestorage.googleapis.com/v0/b/dabubble-180.appspot.com/o/user-icon%2F80.%20avatar%20interaction%20(1).png?alt=media&token=d4ce52b2-3bc9-48fd-9021-912002d298ee' ||
      'https://firebasestorage.googleapis.com/v0/b/dabubble-180.appspot.com/o/user-icon%2F80.%20avatar%20interaction%20(2).png?alt=media&token=e8f80f22-1fef-49ad-91a1-818223fb0d69' ||
      'https://firebasestorage.googleapis.com/v0/b/dabubble-180.appspot.com/o/user-icon%2F80.%20avatar%20interaction%20(3).png?alt=media&token=41950865-ed8c-4797-bf85-942d72833899' ||
      'https://firebasestorage.googleapis.com/v0/b/dabubble-180.appspot.com/o/user-icon%2F80.%20avatar%20interaction%20(4).png?alt=media&token=84f4dfc3-08ba-469e-8792-783b1a504d4b' ||
      'https://firebasestorage.googleapis.com/v0/b/dabubble-180.appspot.com/o/user-icon%2F80.%20avatar%20interaction%20(5).png?alt=media&token=3acc0648-eff2-422a-80c6-a0400a7c0351'
    ) {
    } else {
      const storage = getStorage();
      const desertRef = ref(storage, currentUserIcon);
      const userDocRef = doc(this.firestore, 'users', currentUserId);

      try {
        await deleteObject(desertRef);
        await updateDoc(userDocRef, {
          photo: deleteField(),
        });
      } catch (error: any) {}
    }
  }

  getUserDocRef(uid: any) {
    return doc(this.firestore, 'users', uid);
  }

  async changeName(uid: string, name: string): Promise<void> {
    try {
      const userDocRef = doc(this.firestore, 'users', uid);
      await updateDoc(userDocRef, { username: name });
    } catch (error) {}
  }

  async updateEmail(newMail: string, uid: string): Promise<string> {
    const auth = getAuth();
    try {
      const user = auth.currentUser;
      const allUsers = await this.getAllUsers();
      const emailExists = allUsers.some((user: any) => user.email === newMail);
      if (emailExists) {
        return 'auth/email-already-in-use';
      }
      if (user) {
        await verifyBeforeUpdateEmail(user, newMail);
        const userDocRef = doc(this.firestore, 'users', uid);
        await updateDoc(userDocRef, { email: newMail });
        localStorage.setItem('resetEmail', 'true');
        this.router.navigate(['']);
        return 'auth/correct';
      } else {
        return 'auth/false';
      }
    } catch (error: any) {
      if (error.code === 'auth/requires-recent-login') {
        return 'auth/requires-recent-login';
      }
    }
    return 'auth/false';
  }

  async getUserEmail(userId: any) {
    try {
      const userDocRef = doc(this.firestore, 'users', userId);
      const docSnap = await getDoc(userDocRef);

      if (docSnap.exists()) {
        const userEmail = docSnap.data()['email'];
        return userEmail;
      } else {
        return null;
      }
    } catch (error) {}
  }

  async sendVerificationEmail(user: any): Promise<void> {
    try {
      if (user) {
        await sendEmailVerification(user);
        alert(
          'Bitte verifizieren Sie Ihre neue E-Mail-Adresse. Überprüfen Sie Ihren Posteingang und klicken Sie auf den Verifizierungslink.'
        );
      }
    } catch (error) {}
  }

  currentAuth() {
    return this.auth;
  }

  getAllVariables() {
    return {
      onUserRegistered: this.onUserRegistered,
      resetPasswordUserId$: this.resetPasswordUserId$,
      auth: this.auth,
      firestore: this.firestore,
      storageUserIcon: this.storageUserIcon,
      newDate: this.newDate,
      signUpDate: this.signUpDate,
      currentuid: this.currentuid,
      storageId: this.storageId,
      signInuid: this.signInuid,
    };
  }

  async logOut() {
    try {
      const uid = this.getUid();
      const logOutTimeStamp = this.createTimeStamp();
      const userRef = doc(this.firestore, 'users', this.currentuid);
      await updateDoc(userRef, {
        logOutDate: logOutTimeStamp,
      });

      await signOut(this.auth);
      localStorage.clear();
      this.router.navigate(['']);
      location.reload();
      this.idleService.setData(`users/${this.currentuid}`, {
        uid: this.currentuid,
        activeStatus: 'offline',
      });
    } catch (error) {}
  }

  async logOutAfterDeleteAccount() {
    await this.clearMessagesSubject.next(true);
    signOut(this.auth).then(() => {
      this.router.navigate(['']);
      location.reload();
    });
  }

  async getUserData(uid: any): Promise<any | null> {
    const userDocRef = doc(this.firestore, 'users', uid);

    try {
      const userDocSnapshot = await getDoc(userDocRef);

      if (userDocSnapshot.exists()) {
        const userData = userDocSnapshot.data();
        return { id: userDocSnapshot.id, ...userData };
      } else {
        return null;
      }
    } catch (error) {
      return null;
    }
  }

  setCurrentUid(uid: string) {
    this.currentuid = uid;
    localStorage.setItem('uid', uid);
  }

  async getCurrentUid(): Promise<string | null> {
    const user = this.auth.currentUser;
    if (user) {
      this.currentuid = user.uid;
      localStorage.setItem('uid', this.currentuid);
      return this.currentuid;
    } else {
      this.currentuid = localStorage.getItem('uid');
      return this.currentuid;
    }
  }

  setuid(uid: string) {
    this.signInuid = uid;
  }

  getUid(): string {
    return this.signInuid;
  }

  getStorageUserIconRef() {
    return this.storageUserIcon;
  }

  async uploadUserIconIntoDatabase(
    uid: string,
    userIconTokenURL: string
  ): Promise<void> {
    try {
      const userRef = doc(this.firestore, 'users', uid);
      await updateDoc(userRef, {
        photo: userIconTokenURL,
      });
    } catch (error) {}
  }

  async downloadUserIcon(uid: any) {
    const userData = doc(this.firestore, 'users', uid);
    try {
      const docSnap = await getDoc(userData);

      if (docSnap.exists()) {
        const userData = docSnap.data();
        return userData['photo'];
      }
    } catch (error) {}
  }

  async uploadUserIconIntoStorage(userId: any, file: any) {
    const storage = getStorage();
    const storageRef = ref(storage, 'user-icon/' + file.name);
    await uploadBytes(storageRef, file);
    const token = await getDownloadURL(storageRef);
    return token;
  }

  async uploadDataIntoStorage(file: any) {
    const storage = getStorage();
    const storageRef = ref(storage, 'testData/' + file.name);
    await uploadBytes(storageRef, file);
    const token = await getDownloadURL(storageRef);
    return token;
  }

  async getAllUsers(): Promise<User[]> {
    try {
      const usersCollection = collection(this.firestore, 'users');
      const usersSnapshot = await getDocs(usersCollection);
      const users: User[] = usersSnapshot.docs.map((doc) => doc.data() as User);
      this.allUsers = users;
      return users;
    } catch (error) {
      throw error;
    }
  }

  async getAllChannels(): Promise<Channel[]> {
    try {
      const channelsCollection = collection(this.firestore, 'channels');
      const channelsSnapshot = await getDocs(channelsCollection);
      const channels: Channel[] = channelsSnapshot.docs.map(
        (doc) => doc.data() as Channel
      );
      this.allChannels = channels;
      return channels;
    } catch (error) {
      throw error;
    }
  }

  observeAuthState(): void {
    onAuthStateChanged(this.auth, (user) => {
      if (user) {
        localStorage.setItem('logedIn', 'true');
      } else {
        localStorage.clear();
        this.router.navigate(['']);
      }
    });
  }

  async signUpUser(
    email: string,
    password: string,
    username: string,
    privacyPolice: boolean,
    signUpdate: string
  ): Promise<string | null> {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        this.auth,
        email,
        password
      );
      const user = userCredential.user;
      const userRef = doc(this.firestore, 'users', user.uid);
      await setDoc(userRef, {
        email: email,
        username: username,
        privacyPolice: true,
        uid: user.uid,
        signUpdate: signUpdate,
        password: password,
      });

      this.setuid(user.uid);
      this.sendEmailAfterSignUp(user);
      this.createPrivateChat(user.uid);
      return 'auth';
    } catch (error: any) {
      if (
        error.code === 'auth/invalid-recipient-email' ||
        error.code === 'auth/invalid-email'
      ) {
        return 'auth/invalid-recipient-email';
      }
      if (error.code === 'auth/email-already-in-use') {
        return 'auth/email-already-in-use';
      }
      if (error.code === 'auth/weak-password') {
        return 'weak-password';
      } else {
        return null;
      }
    }
  }

  async createPrivateChat(userID: any) {
    const timestamp = this.createTimeStamp();
    const newChatRef = doc(collection(this.firestore, 'newchats'));
    await setDoc(newChatRef, {
      participants: [userID],
      createdAt: timestamp,
    });
  }

  async logInUser(
    email: string,
    password: string,
    logIndate: string
  ): Promise<string | null> {
    try {
      const userCredential = await signInWithEmailAndPassword(
        this.auth,
        email,
        password
      );
      if (!this.auth.currentUser.emailVerified) {
        return 'auth/email-not-verified';
      }
      const userRef = doc(this.firestore, 'users', userCredential.user.uid);
      await updateDoc(userRef, {
        logIndate: logIndate,
        logOutDate: 1,
      });
      this.setuid(userCredential.user.uid);
      this.setCurrentUid(userCredential.user.uid);
      this.idleService.setData(`users/${userCredential.user.uid}`, {
        uid: userCredential.user.uid,
        activeStatus: 'active',
      });
      localStorage.setItem('uid', userCredential.user.uid);
      this.observeAuthState();
      this.router.navigate(['generalView']);
      return null;
    } catch (error: any) {
      if (error.code === 'auth/invalid-credential') {
        return 'auth/invalid-credential';
      }
      throw error;
    }
  }

  async signInWithGoogle(
    auth: any,
    provider: any,
    logInDate: string
  ): Promise<void> {
    try {
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential !== null) {
        const token = credential.accessToken;
        const user = result.user;
        this.observeAuthState();
        const userRef = doc(this.firestore, 'users', user.uid);
        const signUpDate = user.metadata.creationTime
          ? new Date(user.metadata.creationTime)
          : new Date();
        const signUpDateUnixTimestamp = signUpDate.getTime();
        await setDoc(userRef, {
          email: user.email,
          username: user.displayName,
          privacyPolice: true,
          uid: user.uid,
          photo: user.photoURL,
          logIndate: logInDate,
          signUpdate: signUpDateUnixTimestamp,
        });
        await this.setCurrentUid(user.uid);
        this.createPrivateChat(user.uid);
        await localStorage.setItem('uid', user.uid);
        this.router.navigate(['generalView']);
      }
    } catch (error: any) {
      const errorCode = error.code;
      const errorMessage = error.message;
      const email = error.customData.email;
      const credential = GoogleAuthProvider.credentialFromError(error);
    }
  }

  async sendEmailAfterSignUp(user: any): Promise<void> {
    try {
      await sendEmailVerification(user);
    } catch (error) {}
  }

  async sendEmailResetPasswort(emailData: {
    email: string;
    uid: any;
  }): Promise<void> {
    try {
      const auth = getAuth();
      const { email, uid } = emailData;
      const actionCodeSettings = {
        url: `http://localhost:4200/ChangePasswort?userId=${uid}&mode=resetPassword`,
        handleCodeInApp: true,
      };

      await sendPasswordResetEmail(auth, email, actionCodeSettings);
    } catch (error) {}
  }

  async changePassword(userId: any, newPassword: string): Promise<void> {
    try {
      await updatePassword(this.auth.currentUser, newPassword);
      this.router.navigate(['https://dabubble.lars-thoennes.de/#/']);
    } catch (error) {
      throw error;
    }
  }

  createTimeStamp(): Promise<string> {
    this.newDate = Date.now();
    return this.newDate;
  }
}
