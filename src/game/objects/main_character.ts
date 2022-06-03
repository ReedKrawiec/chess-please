import { g } from "game/main";
import { top_down } from "game/rooms/abstract/top_down";
import { exec_type } from "lib/controls";
import {obj} from "lib/object";
import { positioned_sprite, sprite_gen } from "lib/sprite";
import { obj_state, Vector } from "lib/state";
import {copy} from "src/van";
interface main_character_state extends obj_state{
    
}
    
interface main_character_parameters{
    
}
    
export class main_character extends obj{
  sprite_url = "./sprites/main_char_walk.png";
  height = 380;
  width = 254;
  collision = true;
  static = false;
  render = true;
  state:main_character_state;
  params:main_character_parameters;
  static default_params:main_character_parameters = {}
  constructor(state:obj_state,params:main_character_parameters = copy(main_character.default_params)){
    super(state,params);
    this.tags.add("player");
  }
  statef(time_delta:number){
    super.statef(time_delta);
  }
  renderf(time_delta:number){
    /*
    let positioned = super.renderf(time_delta) as positioned_sprite;
    if(this.tags.has("dark")){
      positioned.sprite = sprites[0][1];
    }
    else{
      positioned.sprite = sprites[0][0];
    }
    return positioned;
    */
   return super.renderf(time_delta);
  }
  registerAnimations(){
    let sprites = sprite_gen(this,this.width,this.height);
    this.animations.add("walk_r", [
      [0, sprites[0][0]],
      [100, sprites[0][1]],
      [200, sprites[0][2]],
      [300, sprites[0][3]],
      [400, sprites[0][4]],
      [500, sprites[0][5]],
      [600, sprites[0][6]],
      [700, sprites[0][7]],
      [800, sprites[0][8]],
    ], 900)
    this.animations.add("walk_l", [
      [0, sprites[1][8]],
      [100, sprites[1][7]],
      [200, sprites[1][6]],
      [300, sprites[1][5]],
      [400, sprites[1][4]],
      [500, sprites[1][3]],
      [600, sprites[1][2]],
      [700, sprites[1][1]],
      [800, sprites[1][0]],
    ], 900)
  }
  registerAudio(){
    
  }
  registerControls(){
    const speed = 8;
    this.bindControl("KeyW", exec_type.once, ()=> {
      let room = g.getRoom() as top_down
      if(room.state.movable)
        this.state.velocity.y = speed;
    });
    this.bindControl("KeyWup",exec_type.once, () => {
      this.state.velocity.y = 0;
    })
    this.bindControl("KeyS", exec_type.once, ()=> {
      let room = g.getRoom() as top_down
      if(room.state.movable)
        this.state.velocity.y = -speed;
    });
    this.bindControl("KeySup",exec_type.once, () => {
      this.state.velocity.y = 0;
    })
    this.bindControl("KeyA", exec_type.once, ()=> {
      let room = g.getRoom() as top_down
      if(room.state.movable && this.state.velocity.x > -speed){
        console.log("left");
        this.state.velocity.x = -speed;
        this.animations.play("walk_l");
      }
    });
    this.bindControl("KeyAup",exec_type.once, () => {
      this.state.velocity.x = 0;
    })
    this.bindControl("KeyD", exec_type.once, ()=> {
      let room = g.getRoom() as top_down
      if(room.state.movable && this.state.velocity.x < speed){
        this.state.velocity.x = speed;
        this.animations.play("walk_r");
      }
    },1);
    this.bindControl("KeyDup",exec_type.once, () => {
      this.state.velocity.x = 0;
    })
  }
}