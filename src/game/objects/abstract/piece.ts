import { g } from "game/main";
import { boardView } from "game/rooms/boardView";
import { exec_type, Poll_Mouse } from "lib/controls";
import {obj} from "lib/object";
import { obj_state, Vector } from "lib/state";
import {copy} from "src/van";

export interface piece_state extends obj_state{
    
}

export interface piece_parameters{
  type: string,
  square: string
}
    
export class piece extends obj{
  sprite_url = "./sprites/Error.png";
  collision = false;
  render = true;
  state:piece_state;
  static = true;
  params:piece_parameters;
  static default_params:piece_parameters = {
    type: "P",
    square: "a1"
  }
  constructor(state:obj_state,params:piece_parameters = copy(piece.default_params)){
    super(state,params);
    this.tags.add("piece");
    switch(params.type){
      case "P":
        this.sprite_url = "./sprites/chess/white_pawn.png";
        this.width = 12;
        this.height = 16;
        break;
      case "p":
        this.sprite_url = "./sprites/chess/black_pawn.png";
        this.width = 12;
        this.height = 16;
        break;
      case "K":
        this.sprite_url = "./sprites/chess/white_king.png";
        this.width = 20;
        this.height = 20;
        break;
      case "k":
        this.sprite_url = "./sprites/chess/black_king.png";
        this.width = 20;
        this.height = 20;
        break;
      case "B":
        this.sprite_url = "./sprites/chess/white_bishop.png";
        this.width = 16;
        this.height = 20;
        break;
      case "b":
        this.sprite_url = "./sprites/chess/black_bishop.png";
        this.width = 16;
        this.height = 20;
        break;
      case "N":
        this.sprite_url = "./sprites/chess/white_knight.png";
        this.width = 20;
        this.height = 20;
        break;
      case "n":
        this.sprite_url = "./sprites/chess/black_knight.png";
        this.width = 20;
        this.height = 20;
        break;
      case "R":
        this.sprite_url = "./sprites/chess/white_rook.png";
        this.width = 16;
        this.height = 20;
        break;
      case "r":
        this.sprite_url = "./sprites/chess/black_rook.png";
        this.width = 14;
        this.height = 18;
        break;
      case "Q":
        this.sprite_url = "./sprites/chess/white_queen.png";
        this.width = 18;
        this.height = 20;
        break;
      case "q":
        this.sprite_url = "./sprites/chess/black_queen.png";
        this.width = 18;
        this.height = 20;
        break;
    }
  }
  statef(time_delta:number){
    super.statef(time_delta);
  }
  renderf(time_delta:number){
   return super.renderf(time_delta); 
  }
  registerAnimations(){
    
  }
  registerAudio(){
    
  }
  registerControls(){
    this.bindControl("mouse0down",exec_type.once, ()=>{
      let mouse = Poll_Mouse(this.getRoom<boardView>().cameras[0]);
      if(this.collidesWithBox({x:mouse.x,y:mouse.y,width:20,height:20})){
        this.getRoom<boardView>().state.dragging = this;
        this.getRoom<boardView>().state.start_drag = this.state.position;
        this.layer = 2;
      }
    });
  }
}