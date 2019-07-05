import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {MaterialModule} from '../material-module';
import { AppComponent } from './app.component';
import { DateInputFormatDirective } from './date-input-format.directive';

@NgModule({
  imports:      [ BrowserModule, FormsModule, BrowserAnimationsModule, MaterialModule, ReactiveFormsModule ],
  declarations: [ AppComponent, DateInputFormatDirective ],
  bootstrap:    [ AppComponent ]
})
export class AppModule { }
