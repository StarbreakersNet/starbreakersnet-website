import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import {HomeScreenComponent} from './home-screen/home-screen.component';
import {YoutubeComponent} from './applications/youtube/youtube.component';
import {FlowFieldCanvasComponent} from './elements/flow-field-canvas/flow-field-canvas.component';


const routes: Routes = [
  { path: '', component: HomeScreenComponent, data: {animation: 'HomeScreenPage'}},
  { path: 'youtube', component: YoutubeComponent, data: {animation: 'YoutubePage'}},
  { path: 'flowfield', component: FlowFieldCanvasComponent, data: {animation: 'FlowFieldPage'}},
  { path: '**', redirectTo: '/' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
