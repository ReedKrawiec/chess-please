import { proximity_matrix, room } from "lib/room";
import { game, viewport } from "src/van";
import { state_config } from "lib/room";
import * as config from "./boardView.json";
import { exec_type, Poll_Mouse } from "lib/controls";
import { g, getNextPuzzle, puzzle } from "game/main";
import { Camera } from "lib/render";
import { piece } from "game/objects/abstract/piece";
import {Chess} from "chess.js";
import { clamp, Vec } from "lib/math";
import { Vector } from "lib/state";
import { HUD, Text } from "lib/hud";
let cfig = config as unknown as state_config;
interface viewState {
  dragging: piece,
  start_drag: Vector,
  perspective: "w" | "b",
  puzzle: puzzle
}

class boardHud extends HUD {
  setTextElements() {
    return [
      new Text({
        position: Vec.create(49 * viewport.width / 50, 2 * viewport.height / 20),
        size: 40,
        scaling: 1,
        font: "VT323",
        color: "white",
        align: "right"
      }, () => `${g.state.globals.rating}`),
    ]
  }
}

export class boardView extends room<viewState>{
  background_url = "./sprites/Error.png";
  render = true;
  proximity_map:proximity_matrix = new proximity_matrix(2000,19);
  constructor(game: game<unknown>) {
    super(game, cfig);
    this.cameras.push(
      new Camera({
        x:0,
        y:0,
        dimensions:viewport,
        scaling:0.3
      },{
        x:0,
        y:0,
        width:1,
        height:1
      },
      new boardHud()
    ));
    this.state = {
      dragging: null,
      start_drag: null,
      perspective: null,
      puzzle: null
    }
  }
  registerControls() {
    super.registerControls();
    this.bindControl("KeyC", exec_type.once, () => {
      this.getObjByTag("piece").forEach((piece) => piece.delete());
      console.log(this.objects);
    });
    this.bindControl("mouse0down", exec_type.once, () => {
      console.log(this.objects);
    });
    this.bindControl("mouse0up",exec_type.once,() => {
      console.log(this.objects);
      if(this.state.dragging){
        let mouse = Poll_Mouse(this.cameras[0]);
        if(mouse.x > 700 || mouse.y > 700 || mouse.x < -700 || mouse.y < -700){
          this.state.dragging.state.position = this.state.start_drag;
        } else {
          let rows = ["a","b","c","d","e","f","g","h"];
          let cols = ["1","2","3","4","5","6","7","8"];
          if(this.state.perspective == "w"){
            rows = rows.reverse();
            cols = cols.reverse();
          }
          let mod_x = Math.floor(mouse.x / 178.571429) + 4;
          let mod_y = Math.floor(mouse.y / 178.571429) + 4;
          let square = `${rows[mod_x]}${cols[mod_y]}`;
          let full_move = this.state.dragging.params.square + square;
          console.log(full_move + " " + this.state.puzzle.solution[0]);
          if(full_move == this.state.puzzle.solution[0]){
            console.log("correct");
            let x = -625 + 178.571429 * (mod_x);
            let y = -625 + 178.571429 * (mod_y);
            let collision = this.checkObjectsPointInclusive(mouse,["piece"]).filter((obj) => obj != this.state.dragging);
            this.state.puzzle.solution.shift();
            if(collision.length > 0){
              collision[0].delete();
              console.log("delete");
            }
            this.state.dragging.state.position.x = x;
            this.state.dragging.state.position.y = y;
            this.state.dragging.params.square = square;
            if(this.state.puzzle.solution.length > 0){
              let next_move = this.state.puzzle.solution.shift();
              this.otherPlayerMove(next_move);
            }
            else {
              console.log("puzzle done!!!")
              g.state.globals.rating += 25;
            }
          }
          else {
            console.log("incorrect");
            this.state.dragging.state.position.x = this.state.start_drag.x;
            this.state.dragging.state.position.y = this.state.start_drag.y;
          }
        }
        this.state.dragging = null;
        this.state.start_drag = null;
      }
    });
    this.bindControl("KeyX", exec_type.once, async () => {
      let puzzles = g.state.globals.puzzles;
      let rating = g.state.globals.rating;
      let next_puzzle:puzzle;
      do {
        next_puzzle = getNextPuzzle(puzzles, rating, 50);
      } while (next_puzzle.solution.length <= 2);
      let chess = new Chess(next_puzzle.fen);
      let board = chess.board();
      console.log(chess.ascii());
      console.log(chess.fen());
      this.getObjByTag("piece").forEach(p => p.delete());
      this.state.perspective = chess.turn();
      this.state.puzzle = next_puzzle;
      if(chess.turn() === "b"){
        board.reverse();
        //board = board.map(row => row.reverse());
      } else {
        board = board.map(row => row.reverse());
      }

      console.log(next_puzzle.solution);
      for(let y = 0; y < 8; y++){
        for(let x = 0; x < 8; x++){
          if(board[y][x]){
            let type:string = board[y][x].type;
            if(board[y][x].color === "w"){
              type = type.toUpperCase();
            }
            await this.addItem(new piece({
              position: Vec.create((x - 4) * 178.571429 + 90,(y - 4) * 178.571429 + 90),
              scaling: {
                width:8,
                height:8
              }
            },{
              type: type,
              square: (<any>board[y][x]).square
            }));
          }
        }
      }
      let next_move = this.state.puzzle.solution.shift();
      this.otherPlayerMove(next_move);
    });
  }
  squareToPosition(square: string){
    let rows = ["a","b","c","d","e","f","g","h"];
    let cols = ["1","2","3","4","5","6","7","8"];
    if (this.state.perspective == "w"){
      rows = rows.reverse();
      cols = cols.reverse();
    }
    let x = rows.indexOf(square[0]);
    let y = cols.indexOf(square[1]);
    return Vec.create((x - 4) * 178.571429 + 90,(y - 4) * 178.571429 + 90);
  }
  otherPlayerMove(move:string){
    let start = this.squareToPosition(move.substring(0,2));
    let end = this.squareToPosition(move.substring(2,4));
    let ai_piece = this.checkObjectsPointInclusive(start,["piece"])[0] as piece;
    let taken_piece = this.checkObjectsPointInclusive(end,["piece"]);
    if(taken_piece.length > 0){
      taken_piece[0].delete();
    }
    this.movePiece(ai_piece,end,175); 
  }
  movePiece(piece: piece, target: Vector, time:number){
    let counter = 0;
    let diff = Vec.sub(target,piece.state.position);
    let interval = setInterval(() => {
      let offset = Vec.func(diff, (v) => v / 60);
      piece.state.position = Vec.add(piece.state.position, offset);
      counter++;
      if(counter === 60){
        clearInterval(interval);
      }
    }, time/60);
  }
  registerParticles() {

  }
  statef(delta_time: number) {
    super.statef(delta_time);
    if(this.state.dragging){
      let mouse = Poll_Mouse(this.cameras[0]);
      this.state.dragging.state.position = mouse;
    }
  }

}