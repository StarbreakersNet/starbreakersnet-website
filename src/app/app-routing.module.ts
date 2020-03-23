import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import {HomeScreenComponent} from './home-screen/home-screen.component';
import {YoutubeComponent} from './applications/youtube/youtube.component';


const routes: Routes = [
  { path: '', component: HomeScreenComponent},
  { path: 'youtube', component: YoutubeComponent },
  { path: '**', redirectTo: '/' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
