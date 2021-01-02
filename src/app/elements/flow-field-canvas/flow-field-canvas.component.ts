import { Component, OnInit } from '@angular/core';
import * as NoiseJS from './NoiseLib.js';

@Component({
  selector: 'app-flow-field-canvas',
  templateUrl: './flow-field-canvas.component.html',
  styleUrls: ['./flow-field-canvas.component.sass']
})
export class FlowFieldCanvasComponent implements OnInit {

  canvas;
  ctx;
  field;
  w;
  h;
  size;
  columns;
  rows;
  noiseZ;

  constructor() { }

  ngOnInit(): void {
    this.setup();
    this.draw();
  }

  setup() {
    this.size = 20;
    this.noiseZ = 0;
    this.canvas = document.querySelector('#canvas');
    this.ctx = this.canvas.getContext('2d');
    this.reset();
    window.addEventListener('resize', this.reset);
  }

  initField() {
    this.field = new Array(this.columns);
    for (let x = 0; x < this.columns; x++) {
      this.field[x] = new Array(this.columns);
      for (let y = 0; y < this.rows; y++) {
        this.field[x][y] = [0, 0];
      }
    }
  }

  calculateField() {
    for (let x = 0; x < this.columns; x++) {
      for (let y = 0; y < this.rows; y++) {
        const angle = NoiseJS.simplex3(x / 50, y / 50, this.noiseZ) * Math.PI * 2;
        const length = NoiseJS.simplex3(x / 100 + 40000, y / 100 + 40000, this.noiseZ);
        this.field[x][y][0] = angle;
        this.field[x][y][1] = length;
      }
    }
  }

  reset() {
    this.w = this.canvas.width = window.innerWidth;
    this.h = this.canvas.height = window.innerHeight;
    NoiseJS.seed(Math.random());
    this.columns = Math.floor(this.w / this.size) + 1;
    this.rows = Math.floor(this.h / this.size) + 1;
    this.initField();
  }

  draw() {
    requestAnimationFrame(this.draw);
    this.calculateField();
    this.noiseZ += 0.004;
    this.clear();
    this.drawField();
  }

  clear() {
    this.ctx.fillStyle = 'black';
    this.ctx.fillRect(0, 0, this.w, this.h);
  }

  drawField() {
    for (let x = 0; x < this.columns; x++) {
      for (let y = 0; y < this.rows; y++) {
        const angle = this.field[x][y][0];
        const length = this.field[x][y][1];
        this.ctx.save();
        this.ctx.translate(x * this.size, y * this.size);
        this.ctx.rotate(angle);
        this.ctx.strokeStyle = 'white';
        this.ctx.beginPath();
        this.ctx.moveTo(0, 0);
        this.ctx.lineTo(0, this.size * length);
        this.ctx.stroke();
        this.ctx.restore();
      }
    }
  }
}
