import { bounding_box, gravity_obj,obj } from "./object";
import { Particle, sprite } from "./sprite";
import { dimensions, obj_state, Vector } from "./state";
import { velocityCollisionCheck,check_collisions,collision_box,check_all_collisions,check_all_objects} from "./collision";
import {render_collision_box,DEBUG, PAUSED, peer_connection, createItemString} from "../van";
import {Bind,control_func, exec_type, Poll_Mouse} from "./controls";
import {HUD,Text, Text_Node} from "./hud";
import {audio} from "./audio"
import {game,peer_to_peer_game} from "../van";
import {debug_update_obj_list,root_path,path, debug_state} from "../lib/debug";
import {prefabs} from "../game/objects/prefabs";
import {Vec,getRandInt} from "lib/math";
import { Camera } from "./render";
import {net_type, Web, Network} from "./network";

interface position{
  x:number,
  y:number
}

export function applyGravity(ob:gravity_obj,grav_const:number, grav_max:number){
  if(ob.gravity && ob.state.velocity.y > grav_max){
    ob.state.velocity.y += grav_const;
  }
}

export interface particle_entry{
  sprite:string,
  height:number,
  width:number
}

interface particles{
  [index:string]:particle_entry
}

export interface room_i<T>{
  background_url:string,
  objects:obj[]
  state:T
}

export interface object_state_config {
  type:string,
  state:obj_state,
  parameters?: unknown
}

export interface state_config{
  objects:object_state_config[]
}

interface internal_map{
  [index:number]:{
    [index:number]:Map<string,obj>
  }
}

interface cache_entries{
  [index:string]:any
}

export interface p2p{
  parse_packet(type:string,data:unknown,id:string):void
}


export class proximity_matrix{
  length:number;
  square_length:number;
  internal_map:internal_map = {};
  constructor(full_length:number,dimension:number){
    this.length = full_length;
    this.square_length = this.length/dimension;
    if(dimension % 2 != 1){
      throw new Error("Proximity map matix dimension must be odd. Got:" + dimension)
    }
  }
  private ensure(a:Vector){
    if(!this.internal_map[a.y]){
      this.internal_map[a.y] = {}
    }
    if(!this.internal_map[a.y][a.x]){
      this.internal_map[a.y][a.x] = new Map<string,obj>();
    }
    return this.internal_map[a.y][a.x];
  }
  get(a:Vector){
    return this.ensure(a);
  }
  add(a:Vector,o:obj){
    let entry = this.ensure(a);
    entry.set(o.id,o);
    o.proximity_boxes.add(a);
  }
  exists(a:Vector){
    if(!this.internal_map[a.y] || !this.internal_map[a.y][a.x])
      return false;
    return true;
  }
  remove(a:Vector,o:obj){
    let entry = this.internal_map[a.y][a.x];
    entry.delete(o.id);
    o.proximity_boxes.delete(a);
  }
  getObjectsFromBox(a:collision_box):obj[]{
    return this.getObjectsFromCords(this.getCordsFromBox(a));
  }
  getObjectsFromCords(input:Vector[]):obj[]{
    let object_set = new Set<obj>();
    for(let cord of input){
      if(this.exists(cord)){
        let keys = this.internal_map[cord.y][cord.x].keys();
        for(let k of keys){
          let j = this.internal_map[cord.y][cord.x].get(k);
          object_set.add(j);
        }
      }
    }
    return Array.from(object_set);
  }
  getCordsFromBox(a:collision_box){
    let bottom_left = Vec.create(a.x - a.width/2,a.y - a.height/2);
    let top_right = Vec.create(a.x + a.width/2,a.y + a.height/2);
    return this.getCordsFromBoundingBox({bottom_left,top_right})
  }
  getCordsFromBoundingBox(a:bounding_box){
    let box = a;
    let bot_left = Vec.scalar_divide(Vec.scalar_add(box.bottom_left,this.length/2),this.square_length);
    let top_right = Vec.scalar_divide(Vec.scalar_add(box.top_right,this.length/2),this.square_length);
    bot_left = Vec.func(bot_left,(a)=>Math.max(0,a));
    top_right = Vec.func(top_right,(a)=>Math.min(this.length/this.square_length,a));
    let min = Vec.func(bot_left,(a)=>Math.floor(a));
    let max = Vec.func(top_right,(a)=>Math.ceil(a));
    let dimensions_in_boxes = Vec.sub(max,min);
    
    let all_boxes = [];
    let cord = Vec.func(
      Vec.scalar_divide(
        Vec.scalar_add(
          Vec.func(box.bottom_left,(a)=>Math.max(a,-this.length/2)),
          this.length/2),
        this.square_length),
      (a)=>Math.floor(a)
    );
    for(let a = 0;a<dimensions_in_boxes.y;a++){
      for(let b = 0;b<dimensions_in_boxes.x;b++){
        let new_vec = Vec.add(Vec.create(b,a),cord);
        new_vec = Vec.func(new_vec,(a)=>Math.floor(a));
        all_boxes.push(new_vec);
      }
    }
    return all_boxes;
  }
  
  getBoxLocations(o:obj){
    let box = o.getBoundingBox();
    let cords = this.getCordsFromBoundingBox(box);
    return cords;
  }

}

export class room<T>{
  //Url to an image to be used for the room background
  background_url: string;
  background: HTMLImageElement;
  objects: obj[] = [];
  //This object contains particle definitions
  particles:particles = {};
  //This array is what actually contains the particles
  //that exists within the room.
  particles_arr: obj[] = [];
  state: T;
  binds:number[] = [];
  game:game<unknown>;
  hud:HUD;
  valid:boolean = true;
  audio = new audio();
  //These text nodes exists in the actual room space, rather than
  //on the hud layer.
  render:boolean = true;
  text_nodes:Text[] = [];
  config:state_config;
  proximity_map:proximity_matrix = new proximity_matrix(10000,5);
  cameras:Camera[] = [];
  cache_entries:cache_entries = {};
  constructor(game:game<unknown>,config:state_config){
    this.game = game;
    this.config = config;
    this.bindControl("mouse0",exec_type.once,()=>{
      let hud_clicked = false;
      for(let cam of this.cameras){
        if(cam.hud){
          let mouse_hud = Poll_Mouse(cam,true);
          for(let obj of cam.hud.graphic_elements){
            if(obj.collidesWithPoint(mouse_hud)){
              hud_clicked = true;
              obj.event("click");
            }
          }
        }
      }
      if(!hud_clicked){
        for(let cam of this.cameras){
          let mouse = Poll_Mouse(cam)
          let colliders = this.checkObjectsPoint(mouse);
          for(let obj of colliders){
            obj.event("click");
          }
        }
      }
    })
  }
  
  exportStateConfig(){
    let config:state_config = {objects:[]};
    let filtered = this.objects.filter((obj)=>obj.save_to_file && !obj.parent)
    for(let o of filtered){
      //If an object has a parent object, it's a descendent of a composite object
      //The parent will spawn this object when it's instantiated, so we do
      //not have to save this instance.
        let state:obj_state = {
          position:Vec.from(o.state.position)
        }
        if(o.state.velocity.x != 0 || o.state.velocity.y !=0){
          state.velocity = Vec.from(o.state.velocity)
        }
        if(o.state.rotation != 0){
          state.rotation = o.state.rotation;
        }
        if(o.state.scaling.width != 1 || o.state.scaling.height != 1){
          state.scaling = o.state.scaling;
        }
        if(Object.keys(o.params).length > 0){
          config.objects.push({
            type:o.constructor.name,
            state,
            parameters:o.params
          })
        } else {
          config.objects.push({
            type:o.constructor.name,
            state
          })
        }
    }
    return config;
  }
  //This handles the loading of all room sprites, and
  //any objects it contains.
  load() {
    let _this = this;
    return new Promise<void>(async (resolve, reject) => {
      let background = new Image();
      let object_promise_array = this.objects.map((a) => a.load());
      await Promise.all(object_promise_array);
      let background_url = this.background_url;
      if(DEBUG){
        background_url = path.join(root_path,this.background_url);
      }
      background.src = background_url;
      background.onerror = (() => {
        throw new Error("Loading Error:" + this.background_url);
      })
      background.onload = (async() => {
        _this.background = background;
        await this.audio.load();
        for(let cam of this.cameras){
          if(cam.hud){
            await cam.hud.load()
          }
        }
        resolve();
      });
    })
  }
  initialize(){

  }
  //This is used while loading objects from file, it's used to dynamically load
  //objects from the room's json. If adding items within code, it's better to create
  //new instances of objects through addItem
  createItemString(name:string,state_config:obj_state,parameters:any):obj{
    return createItemString(name,state_config,parameters);
  }
  async addItemStateConfig(config:object_state_config,id?:string){
    if(prefabs[config.type]){
      let params = config.parameters || {}
      let new_obj = <obj>(new prefabs[config.type](Object.assign({},config.state),params));
      if(id) new_obj.id = id;
      await this.addItems(new_obj.combinedObjects());
    }
    else{
      console.log("UNKNOWN TYPE ATTEMPTED TO LOAD: " + config.type)
    }
  }
  //Adds the passed item to the room.
  async addItem(o:obj, list = this.objects){
    await this.addItems([...o.combinedObjects()],list);
  }
  //Adds every item in the passed array to the room.
  async addItems(o:obj[], list = this.objects){
    for(let ob of o){
      ob.game = this.game;
    }
    await Promise.all(o.map((a)=>a.load()));
    if(list == this.objects){
      for(let ob of o){
        let cords = this.proximity_map.getBoxLocations(ob);
        for(let cord of cords){
          this.proximity_map.add(cord,ob);
        }
      }
    }
    list.push(...o);
    if(this.game.state.current_room && o.some((o)=>o.static)){
      this.game.drawAllStatics();
    }
    if(DEBUG && list === this.objects){
      debug_update_obj_list();
    }
  }
  //Deletes the item and removes it from the room's object list
  deleteItem(id:string, list = this.objects){
    for(let a = 0;a < list.length;a++){
      if(list[a].id === id){
        list.splice(a,1)
        a--;
      }
    }
    
    if(DEBUG && list === this.objects){
      debug_update_obj_list();
    }
  }
  //Any particles that are needed in the room should be added to the particle array here.
  registerParticles(){

  }
  //Adds a bind that is executed when the passed key is activated
  //key examples: mouse0down KeyAdown KeyLup
  bindControl(key:string,x:exec_type,func:control_func,interval:number = 1){
    this.binds.push(Bind(key,func,x,interval,false)); 
  }
  //Checks for objects that have collision at the passed point
  checkCollisionsPoint(pos:Vector,exempt?:string[],list = this.objects):obj[]{
    return this.checkCollisions({x:pos.x,y:pos.y,height:0,width:0},exempt,list);
  }
  //Checks for any objects at the passed point
  checkObjectsPoint(pos:Vector,exempt?:string[],list = this.objects):obj[]{
    return this.checkObjects({x:pos.x,y:pos.y,height:0,width:0},exempt,list);
  }
  //Checks for collisions at the point that contain every tag within the second argument
  checkCollisionsPointInclusive(pos:Vector,tags?:string[],list = this.objects):obj[]{
    return this.checkCollisionsInclusive({x:pos.x,y:pos.y,height:0,width:0},tags,list);
  }
  //Checks for any objects that contain every tag within the second argument
  checkObjectsPointInclusive(pos:Vector,tags?:string[],list = this.objects):obj[]{
    return this.checkObjectsInclusive({x:pos.x,y:pos.y,height:0,width:0},tags,list);
  }
  //Checks for collisions in the box that contain the tags in the second argument
  checkCollisionsInclusive(box:collision_box,tags:string[],list=this.objects):obj[]{
    if(DEBUG){
      render_collision_box(box);
    }
    if(list == this.objects){
      list = this.proximity_map.getObjectsFromBox(box);
    }
    return list.filter(obj=>obj.collision && obj.collidesWithBox(box) && tags.every((val)=>obj.tags.has(val)));
    
  }
  //Checks for any objects in the box that contain all tags in the second argument
  checkObjectsInclusive(box:collision_box,tags:string[],list=this.objects):obj[]{
    if(DEBUG && debug_state.render_toggles["collision_box"]){
      render_collision_box(box);
    }
    if(list == this.objects){
      list = this.proximity_map.getObjectsFromBox(box);
    }
    return list.filter((obj)=>obj.collidesWithBox(box) && tags.every((val)=>obj.tags.has(val)));
    
  }
  //checks for objects with collision in the box that do not contain the tags in the second argument
  checkCollisions(box:collision_box,exempt:string[] = [],list=this.objects):obj[]{
    if(DEBUG && debug_state.render_toggles["collision_box"]){
      render_collision_box(box);
    }
    if(list == this.objects){
      list = this.proximity_map.getObjectsFromBox(box);
    }
    return list.filter(obj=>obj.collision && obj.collidesWithBox(box) && exempt.every((val)=>!obj.tags.has(val)));
  }
  //checks for  any objects in the box that do not contain the tags in the second argument
  checkObjects(box:collision_box,exempt:string[] = [],list=this.objects):obj[]{
    if(DEBUG && debug_state.render_toggles["collision_box"]){
      render_collision_box(box);
    }
    if(list == this.objects){
      list = this.proximity_map.getObjectsFromBox(box);
    }
    return list.filter(obj=>obj.collidesWithBox(box) && exempt.every((val)=>!obj.tags.has(val)));
  }
  //This method should be used to call bindControl and create any needed keyBindings
  registerControls(){

  }
  registerAudio(){

  }
  cleanup(){

  }
  cache(key:string,value?:any){
    if(!this.cache_entries[key]){
      this.cache_entries[key] = value;
    }
    return this.cache_entries[key];
  }
  //The room's state updating function.
  statef(time: number) {
    for(let particle of this.particles_arr){
      particle.statef(time);
    }
    for(let text_node of this.text_nodes){
      text_node.statef(time);
    }
    let ticking_objects = this.objects.filter((o)=>o.tick_state);
    for (let a = 0; a < ticking_objects.length; a++) {
      //This function checks the velocity of every object, and moves it into it's next location
      //provided that it can fit there.
      velocityCollisionCheck(ticking_objects[a], this.objects);
      ticking_objects[a].statef(time);
    }
    for(let cam of this.cameras){
      if(cam.hud){
        cam.hud.statef(time);
      }
      cam.statef(time);
    }
  }
  emitParticle(name:string,pos:position,lifetime:number,pos_range:number){
    let state = {
      position:Vec.func(pos,(a) => a + getRandInt(-pos_range,pos_range)),
      velocity:{x:0,y:0},
      rotation:0,
      scaling:{width:1,height:1}
    }
    this.addItem(new Particle(this.particles[name],state,lifetime),this.particles_arr);
  }
  getObj(id:string){
    for(let a = 0; a < this.objects.length; a++){
      if(this.objects[a].id == id){
        
        return this.objects[a];
      }
    }
    return null;
  }
  //Gets any objects that have the passed tag
  getObjByTag(tag:string):obj[]{
    return this.objects.filter((a)=>a.tags.has(tag));
  }
  //renders the room's sprite
  renderf(time: number): sprite {
    return {
      sprite_sheet: this.background,
      name:this.constructor.name,
      left: 0,
      top: 0,
      sprite_height: this.background.height,
      sprite_width: this.background.width,
      opacity:1
    }
  }
}

export class p2p_room<T> extends room<T> implements p2p{
  network:Network;
  net_type:net_type;
  game:peer_to_peer_game<unknown>;
  constructor(game:peer_to_peer_game<unknown>,config:state_config){
    super(game,config);
    this.game = game;
    this.network = game.network;
    this.net_type = game.net_type;
  }
  parse_packet(type:string,data:unknown,id:string){
    
  }
  send_packet(type:string,data:any,peer_id?:number){
    this.network.send(type,data);
  }
  async addItemNetwork(type:string,state:any,parameters:any){
    let id = getRandInt(100000,999999)
    let state_config = {
      type,
      state,
      parameters
    }
    this.send_packet("add_item",{
      id,
      state_config
    });
    await this.addItemStateConfig(state_config,id.toString());
  }
  recieve_packet(id:number,type:string,data:string){

  }
  statef(time:number){
    super.statef(time);
    let network_items = this.objects.filter((o)=>o.state_properties_to_sync.length > 0 && Object.keys(o.diff_state).length > 0);
    for(let item of network_items){
      this.send_packet("update_item",{
        id:item.id,
        state:item.diff_state
      })
    }
  }
}
