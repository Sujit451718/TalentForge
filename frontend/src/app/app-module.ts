import { NgModule, provideBrowserGlobalErrorListeners } from '@angular/core';
import { BrowserModule, provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing-module';
import { App } from './app';
import { Home } from './components/home/home';
import { Login } from './components/login/login';
import { Register } from './components/register/register';
import { Dashboard } from './components/dashboard/dashboard';
import { Interview } from './components/interview/interview';
import { Feedback } from './components/feedback/feedback';
import { Navbar } from './components/navbar/navbar';
import { Sidebar } from './components/sidebar/sidebar';

@NgModule({
  declarations: [
    App, 
    Home, 
    Login, 
    Register,
    Dashboard, 
    Interview,
    Feedback,
    Navbar, 
    Sidebar
  ],
  imports: [
    BrowserModule, 
    AppRoutingModule, 
    FormsModule
  ],
  providers: [
    provideBrowserGlobalErrorListeners(), 
    provideClientHydration(withEventReplay()),
    provideHttpClient()
  ],
  bootstrap: [App],
})
export class AppModule {}
