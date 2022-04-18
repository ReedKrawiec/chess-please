import { g } from "../game/main";
import { game, PAUSED, DEBUG, GetScreenDimensions, GetViewportDimensions, viewport } from "../van";
import { collision_box } from "./collision";
import { obj } from "./object";
import { Camera } from "./render";
import { Vector } from "./state";
import { debug_state } from "./debug";

interface mousePos {
  x: number,
  y: number,
  last: {
    x: number,
    y: number
  }
}

export interface control_func {
  (a?: number, b?: number): void
}

interface mouseBinds {
  [key: string]: Array<[control_func, obj]>
}

interface keyBinds {
  [key: string]: Array<control_func>
}

export enum btype {
  mouse,
  keyboard,
  gamepad
}

interface bind {
  key: string,
  type: btype,
  id: number,
  function: control_func,
  execute: exec_type,
  repeat_timer?: repeat_bind,
  obj?: obj,
  executed?: boolean,
  interval?: number,
  camera?: Camera,
  debug: boolean
}

interface repeat_bind {
  bind: bind,
  timer: number,
  interval: number,
  active: boolean
}

export enum exec_type {
  once,
  repeat
}

let id = 0;

let x = 0;
let y = 0;
let last_x = 0;
let last_y = 0;
let binds: keyBinds = {};
export let debug_binds: bind[] = [];
let mouseBinds: mouseBinds = {};
let bind_count = 0;

let all_binds: Array<bind> = []

let repeat_binds: Array<repeat_bind> = [];

let target = document.getElementById("target");
/*
export function init_click_handler(game:game<unknown>){
  window.addEventListener("click",(e)=>{
    
    let mouse = Poll_Mouse(game.state.cameras[0]);
    if(!mouse){
      return
    }
    let box:collision_box = {
      x:mouse.x,
      y:mouse.y,
      height:1,
      width:1
    };
    
  let d:bind[];
  if(DEBUG){
    if(debug_state.last_clicked && debug_state.last_clicked.id == "debug_target"){
      d = [...debug_binds];
    }
    else if(!PAUSED && debug_state.last_clicked && debug_state.last_clicked.id == "target"){
      d= [...all_binds]
    }
    else{
      d = [];
    }
  }
  else{
    d = [...all_binds];
  }
    for(let a = 0;a < d.length;a++){
      let selected = d[a];
      if(selected.type === btype.mouse && selected.key === "mouse1" && selected.execute == exec_type.once){
        if(selected.obj !== undefined){
          if(selected.obj.collidesWithBox(box)){
            selected.function();
          }
        }
        else{
          selected.function();        
        }
      }
    }  
  })
}
*/

export function within_Canvas(canvas: HTMLCanvasElement) {
  let wratio = parseFloat(window.getComputedStyle(canvas).width) / GetViewportDimensions().width;
  let vratio = parseFloat(window.getComputedStyle(canvas).height) / GetViewportDimensions().height;
  let bounds = canvas.getBoundingClientRect();
  if (x > bounds.left && x < bounds.right && y < bounds.bottom && y > bounds.top) {
    return true;
  }
  return false;
}

let binding_map: {
  [index: string]: bind[]
} = {};

let pressBind = (key: string,hud_layer = false) => {
  let on_names;
  let off_names;
  let base;
  let selected_bind_map;
  if (key.slice(-4) === "down") {
    base = key.substring(0, key.length - 4);
    on_names = [base, key];
    off_names = [`${base}up`];
  }
  else if (key.slice(-2) === "up") {
    base = key.substring(0, key.length - 2);
    on_names = [key];
    off_names = [`${base}down`, base];
  }
  else {
    throw new Error("Attempted to activate invalid bind.");
  }
  const clicked_on = (target:string) => (debug_state.last_clicked && debug_state.last_clicked.id == target)
  const valid_mouse_click = (bind:bind,index:number) => {
    return bind.type != btype.mouse || (within_Canvas(g.state.canvases[index]) && (bind.obj == undefined || (bind.obj && bind.obj.info.on_hud_layer == hud_layer)))
  };
  for (let keyname of on_names) {
    if (keyname == base) {
      held_keys[keyname] = true;
    }
    let selected_binds = binding_map[keyname];
    if (selected_binds !== undefined) {
      for (let bind of selected_binds) {
        if(
          (DEBUG && bind.debug && clicked_on("debug_target") && valid_mouse_click(bind,1))
          ||
          (DEBUG && (!PAUSED && clicked_on("target") && valid_mouse_click(bind,0)))
          ||
          !DEBUG && valid_mouse_click(bind,0)
        ){
          bind.executed = true;
          if (bind.execute == exec_type.repeat) {
            bind.repeat_timer.active = true;
          }
          else {
            bind.function();
          }
        }
      }
    }
  }
  for (let keyname of off_names) {
    if (keyname == base) {
      held_keys[keyname] = false;
    }
    let selected_binds = binding_map[keyname];
    if (selected_binds !== undefined) {
      for (let bind of selected_binds) {
        bind.executed = false;
        if (bind.execute == exec_type.repeat) {
          bind.repeat_timer.active = false;
        }
      }
    }
  }
  
  for (let repeat_bind of repeat_binds) {
    let bind = repeat_bind.bind;
    if (on_names.includes(repeat_bind.bind.key)) {
      if(
        (DEBUG && bind.debug && clicked_on("debug_target") && valid_mouse_click(bind,1))
        ||
        (DEBUG && (!PAUSED && clicked_on("target") && valid_mouse_click(bind,0)))
        ||
        !DEBUG && valid_mouse_click(bind,0)
      ){
        repeat_bind.active = true;
      }
    }
    else if (off_names.includes(repeat_bind.bind.key)) {
      repeat_bind.active = false;
    }
  }
}


let xbox_key = ["A", "B", "X", "Y", "LB", "RB", "LT", "RT", "Back", "Select", "ThumbLeftDown", "ThumbRightDown", "PadUp", "PadDown", "PadLeft", "PadRight", "Start"];
let xbox_keys_state: Array<{
  key: string,
  last_state: number
}> = []
xbox_key.forEach((key) => {
  xbox_keys_state.push({
    key,
    last_state: 0
  })
})
export function handleGamepad(gamepad: Gamepad) {
  if(binding_map["GamepadLeftThumb"] != undefined){
    for(let bind of binding_map["GamepadLeftThumb"]){
      bind.function(gamepad.axes[0], gamepad.axes[1] * -1)
    }
  }
  if(binding_map["GamepadRightThumb"] != undefined){
    for(let bind of binding_map["GamepadRightThumb"]){
      bind.function(gamepad.axes[2], gamepad.axes[3] * -1)
    }
  }
  for (let [i, button] of gamepad.buttons.entries()) {
    let button_entry = xbox_keys_state[i];
    if (button.value > 0 && button_entry.last_state == 0) {
      //Button Down
      pressBind(`Gamepad${button_entry.key}down`);
    }
    else if (button.value == 0 && xbox_keys_state[i].last_state > 0) {
      pressBind(`Gamepad${button_entry.key}up`);
    }
    button_entry.last_state = button.value;
  }
}

let was_valid: boolean = false;

window.addEventListener("mousedown", (e) => {
  e.preventDefault();
  let hud_clicked = false;
  for(let camera of g.getRoom().cameras){
    let mouse = Poll_Mouse(camera,true);
    if(mouse && camera.hud){
      for(let obj of camera.hud.graphic_elements.filter((obj)=>obj.hud_clickable)){
        if(obj.collidesWithBox({x:mouse.x,y:mouse.y,width:0,height:0})){
          pressBind("mouse" + e.button + "down",true);
          return;
        }
      }
    }
  }
  pressBind("mouse" + e.button + "down");
})

window.addEventListener("mouseup", (e) => {
  e.preventDefault();
  pressBind(`mouse${e.button}up`)
})

interface held_keys {
  [index: string]: boolean
}

export let held_keys: held_keys = {};

window.addEventListener("wheel", (e) => {
  let code: string;
  e.preventDefault();
  if (e.deltaY < 0) {
    code = "scrollup";
  }
  else if (e.deltaY > 0) {
    code = "scrolldown";
  }
  pressBind(code);
})

window.addEventListener("keydown", (e) => {

  if (e.code == "Tab") {
    e.preventDefault();
  }
  pressBind(`${e.code}down`);

})
window.addEventListener("keyup", (e) => {
  pressBind(`${e.code}up`);
})
let tracker = document.getElementById("target");
window.addEventListener("mousemove", (e) => {
  var rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
  //console.log(e.target)
  last_x = x;
  last_y = y;
  x = e.clientX; //x position within the element.
  y = e.clientY;  //y position within the element.

})

export function Poll_Mouse(camera: Camera, hud_layer:boolean = false, canvas: HTMLCanvasElement = g.state.canvases[0]): Vector {
  let height = GetViewportDimensions().height;
  let wratio = parseFloat(window.getComputedStyle(canvas).width) / GetViewportDimensions().width;
  let vratio = parseFloat(window.getComputedStyle(canvas).height) / GetViewportDimensions().height;
  let bounds = canvas.getBoundingClientRect();
  if (x > bounds.left && x < bounds.right && y < bounds.bottom && y > bounds.top) {
    
    if(hud_layer){
      return {
        x: (x - bounds.left) / wratio,
        y: ((height - (y - bounds.top) / vratio) - camera.state.viewport.y)
      }
    }
    return ({
      x: ((x - bounds.left - camera.state.viewport.x) / wratio / camera.state.scaling + camera.state.position.x - camera.state.dimensions.width / camera.state.scaling / 2),
      y: ((height - (y - bounds.top) / vratio) / camera.state.scaling + camera.state.position.y - camera.state.dimensions.height / camera.state.scaling / 2 - camera.state.viewport.y)
    })
  }
  return undefined;
}

export function ExecuteRepeatBinds(b: number) {
  for (let a of repeat_binds) {
    if (a.bind.execute === exec_type.repeat && a.timer == 0 && a.active) {
      a.bind.function();
    }
    if (a.active || (!a.active && a.timer != 0))
      a.timer += b;
    if (a.timer > a.interval) {
      a.timer = 0;
    }
  }
}

export function Unbind(bind_id: number) {
  for(let key of Object.keys(binding_map)){
    for(let a = 0; a < binding_map[key].length; a++){
      if(binding_map[key][a].id == bind_id){
        binding_map[key].splice(a,1);
        break;
      }
    }
  }
  for (let a = 0; a < repeat_binds.length; a++) {
    if (repeat_binds[a].bind.id == bind_id) {
      repeat_binds.splice(a, 1);
      break;
    }
  }
}

export function Bind(keyname: string, func: control_func, type: exec_type, interval: number, debug: boolean, obj?: obj): number {
  let bind_type = btype.keyboard;
  if (keyname.slice(0, 5) === "mouse" || keyname.slice(0, 6) === "scroll") {
    bind_type = btype.mouse
  }
  else if (keyname.slice(0, 7) == "Gamepad") {
    bind_type = btype.gamepad;
  }
  let b: bind = {
    key: keyname,
    type: bind_type,
    debug,
    id,
    function: func,
    execute: type,
    executed: false,
    interval,
    obj 
  }
  if (type == exec_type.repeat) {
    b.repeat_timer = {
      bind: b,
      timer: 0,
      interval,
      active: false
    }
    repeat_binds.push(b.repeat_timer);
  }
  if (binding_map[keyname] == undefined) {
    binding_map[keyname] = [];
    
  }
  binding_map[keyname].push(b);
  id++;
  return id - 1;
}