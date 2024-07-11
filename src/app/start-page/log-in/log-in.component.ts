import { Component, Output, EventEmitter, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { FirestoreService } from '../../firestore.service';
import { CommonModule } from '@angular/common';
import { GoogleAuthProvider } from '@angular/fire/auth';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-log-in',
  standalone: true,
  imports: [FormsModule, CommonModule, MatProgressSpinnerModule],
  templateUrl: './log-in.component.html',
  styleUrls: ['./log-in.component.scss'],
})
export class LogInComponent implements OnInit {
  @Output() forgotPassword: EventEmitter<any> = new EventEmitter();

  showInputInformationEmail = false;
  showInputInformationPassword = false;
  showEmailVerification = false;
  showPasswordValue = false;
  loadingScreen = false;

  signUpUserEmail: string | null = null;
  signUpUserPassword: string | null = null;

  constructor(
    private router: Router,
    private firestoreService: FirestoreService
  ) {}

  ngOnInit(): void {
    this.initializeComponent();
  }

  initializeComponent(): void {
    this.loadingScreen = false;
    this.firestoreService.createTimeStamp();
    this.setupLocalStorageData();
    this.clearLocalStorageData();
  }

  setupLocalStorageData(): void {
    this.signUpUserEmail =
      localStorage.getItem('userEmail') ||
      localStorage.getItem('resetPasswortEmail');
    if (this.signUpUserEmail) {
      this.signUpUserPassword = localStorage.getItem('userPassword');
    }
  }

  clearLocalStorageData(): void {
    localStorage.removeItem('userEmail');
    localStorage.removeItem('resetPasswortEmail');
    localStorage.removeItem('userPassword');
    setTimeout(() => {
      localStorage.removeItem('resetEmail');
    }, 10000);
  }

  togglePasswordVisibility(): void {
    this.showPasswordValue = !this.showPasswordValue;
    const passwordInput = document.getElementById(
      'passwordInput'
    ) as HTMLInputElement;
    passwordInput.type = this.showPasswordValue ? 'text' : 'password';
  }

  async guestLogIn(): Promise<void> {
    this.setLoadingScreen(true);
    const logInDate = await this.firestoreService.createTimeStamp();
    this.firestoreService.logInUser(
      'guest@adrian-krampikowski.com',
      '123456',
      logInDate
    );
    // this.router.navigate(['/generalView']);
    this.setLoadingScreen(false);
  }

  setLoadingScreen(state: boolean): void {
    this.loadingScreen = state;
  }

  openForgetPasswordComponent(): void {
    this.forgotPassword.emit();
  }

  async logInWithGoogle(): Promise<void> {
    this.setLoadingScreen(true);
    const auth = this.firestoreService.auth;
    const provider = new GoogleAuthProvider();
    const logInDate = await this.firestoreService.createTimeStamp();
    this.firestoreService
      .signInWithGoogle(auth, provider, logInDate)
      .then(() => {
        this.setLoadingScreen(false);
      });
  }

  async userLogIn(formData: any): Promise<void> {
    this.resetErrorMessages();
    this.setLoadingScreen(true);
    const { email, password } = formData.value;

    if (!formData.valid) {
      this.handleInvalidForm(formData);
    } else {
      const logInDate = await this.firestoreService.createTimeStamp();
      this.firestoreService
        .logInUser(email, password, logInDate)
        .then((result) => {
          this.handleLogInResult(result);
        });
    }
  }

  resetErrorMessages(): void {
    this.showInputInformationEmail = false;
    this.showInputInformationPassword = false;
    this.showEmailVerification = false;
  }

  handleInvalidForm(formData: any): void {
    if (formData.controls['email'].invalid) {
      this.showErrorWithDelay(() => (this.showInputInformationEmail = true));
    } else if (formData.controls['password'].invalid) {
      this.showErrorWithDelay(() => (this.showInputInformationPassword = true));
    }
    this.setLoadingScreen(false);
  }

  showErrorWithDelay(showErrorCallback: () => void): void {
    setTimeout(showErrorCallback, 1000);
  }

  handleLogInResult(result: any): void {
    if (result === 'auth/email-not-verified') {
      this.showErrorWithDelay(() => (this.showEmailVerification = true));
    } else if (result === 'auth/invalid-credential') {
      this.showErrorWithDelay(() => (this.showInputInformationPassword = true));
    }
    this.setLoadingScreen(false);
  }

  async resendVerificationEmail(): Promise<void> {
    this.setLoadingScreen(true);
    const user = this.firestoreService.getCurrentAuth();
    this.firestoreService.sendVerificationEmail(user);
    setTimeout(() => {
      this.setLoadingScreen(false);
    }, 500);
  }
}

// import { Component, Output, EventEmitter, OnInit } from '@angular/core';
// import { Router } from '@angular/router';
// import { FormsModule } from '@angular/forms';
// import { FirestoreService } from '../../firestore.service';
// import { CommonModule } from '@angular/common';
// import { GoogleAuthProvider } from '@angular/fire/auth';
// import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

// @Component({
//   selector: 'app-log-in',
//   standalone: true,
//   imports: [FormsModule, CommonModule, MatProgressSpinnerModule],
//   templateUrl: './log-in.component.html',
//   styleUrl: './log-in.component.scss',
// })
// export class LogInComponent implements OnInit {
//   @Output() forgotPassword: EventEmitter<any> = new EventEmitter();

//   constructor(
//     private router: Router,
//     private firestoreService: FirestoreService
//   ) {}
//   showInputInformationEmail: boolean = false;
//   showInputInformationPassword: boolean = false;
//   showEmailVerification: boolean = false;
//   showPasswordValue = false;
//   loadingScreen = false;

//   signUpUserEmail: any;
//   signUpUserPassword: any;

//   ngOnInit(): void {
//     this.loadingScreen = false;
//     this.firestoreService.createTimeStamp();
//     const currentAuthStatus = this.firestoreService.currentAuth()
//     const allVariabeln = this.firestoreService.getAllVariables()
//     setTimeout(() => {
//       localStorage.removeItem('resetEmail')
//     }, 10000);
//     this.signUpUserEmail = localStorage.getItem('userEmail');
//     if(this.signUpUserEmail) {
//       this.signUpUserPassword = localStorage.getItem('userPassword');
//     } else {
//       this.signUpUserEmail = localStorage.getItem('resetPasswortEmail');
//     }
//     localStorage.removeItem('userEmail');
//     localStorage.removeItem('resetPasswortEmail');
//     localStorage.removeItem('userPassword');
//   }

//   showPassword() {
//     if(!this.showPasswordValue) {
//       this.showPasswordValue = true;
//       const passwordInput = document.getElementById('passwordInput') as HTMLInputElement;
//       passwordInput.type = 'text';
//     } else if (this.showPasswordValue) {
//       this.showPasswordValue = false;
//       const passwordInput = document.getElementById('passwordInput') as HTMLInputElement;
//       passwordInput.type = 'password';
//     }
//   }

//   async guestLogIn() {
//     this.loadingScreen = true;
//     const logInDate = await this.firestoreService.createTimeStamp();
//     this.firestoreService.logInUser('guest@adrian-krampikowski.com', '123456', logInDate)
//     // this.router.navigate(['/generalView']);
//   }

//   openForgetPasswordComponent() {
//     this.forgotPassword.emit();
//   }

//   async logInWithGoogle() {
//     this.loadingScreen = true;
//     const auth = this.firestoreService.auth;
//     const provider = new GoogleAuthProvider();
//     const logInDate = await this.firestoreService.createTimeStamp();
//     this.firestoreService
//       .signInWithGoogle(auth, provider, logInDate)
//       .then((result) => {
//         this.loadingScreen = false;
//       })
//   }

//   async userLogIn(formData: any) {
//     this.showInputInformationEmail = false;
//     this.showInputInformationPassword = false;
//     this.showEmailVerification = false;
//     this.loadingScreen = true;
//     const { email, password } = formData.value;
//     if (!formData.valid) {
//       if (formData.controls['email'].invalid) {
//         setTimeout(() => {
//           this.showInputInformationEmail = true;
//         }, 1000);
//         this.loadingScreen = false;
//       } else if (formData.controls['password'].invalid) {
//         setTimeout(() => {
//           this.showInputInformationPassword = true;
//         }, 1000);
//         this.loadingScreen = false;
//       }
//     } else {
//       const logInDate = await this.firestoreService.createTimeStamp();
//       this.firestoreService.logInUser(email, password, logInDate)
//         .then((result) => {
//           if(result === 'auth/email-not-verified') {
//             setTimeout(() => {
//               this.showInputInformationEmail = true;
//             }, 1000);
//             this.loadingScreen = false;
//           }
//           if (result === 'auth/invalid-credential') {
//             setTimeout(() => {
//               this.showInputInformationPassword = true;
//             }, 1000);
//             this.loadingScreen = false;
//           } else {
//             this.loadingScreen = false;
//           }
//         })
//     }
// }

// async resendverificationEmail() {
//   this.loadingScreen = true;
//   const user = this.firestoreService.getCurrentAuth();
//   this.firestoreService.sendVerificationEmail(user)
//   setTimeout(() => {
//     this.loadingScreen = false;
//   }, 500);
// }

// }
