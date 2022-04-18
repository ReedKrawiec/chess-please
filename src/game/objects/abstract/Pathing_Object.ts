
import { obj} from "../../../lib/object";
import { obj_state, Vector } from "../../../lib/state";
import { nav_mesh, Pathing_Room } from "../../rooms/abstract/Pathing_Room";
import { AStarFinder } from "astar-typescript";
import { Vec,rotation_length } from "../../../lib/math";
import { DEBUG, render_collision_box, render_line } from "src/van";
import { debug_state } from "lib/debug";
export interface Pathing_Object_state extends obj_state {
  last_pos:Vector;
  pathing_timer:number;
}

interface Pathing_Object_parameters {

}

export class Pathing_Object extends obj {
  hasGoal: boolean = false;
  currentPath: Vector[];
  currentFullPath: Vector[];
  currentGoalPos: Vector;
  collision = false;
  state:Pathing_Object_state;
  speed: number = 1;
  path_recalc_interval:number = 1000;
  constructor(state:obj_state,params?:unknown){
    super(state,params);
    this.state.last_pos = {
      x:undefined,
      y:undefined
    };
    this.state.pathing_timer = 0;
  }
  posToCord(nav_mesh: nav_mesh, pos: Vector): Vector {
    let room = this.game.getRoom() as Pathing_Room<unknown>;
    let x = Math.floor((pos.x - nav_mesh.box.x + nav_mesh.box.width / 2) / nav_mesh.box.width * (nav_mesh.box.width / room.nav_node_diameter));
    let y = Math.floor((pos.y - nav_mesh.box.y + nav_mesh.box.height / 2) / nav_mesh.box.height * (nav_mesh.box.height / room.nav_node_diameter));
    return { x, y };
  }
  cordOnGrid(nav_mesh:nav_mesh, pos:Vector){
    return(pos.x >= 0 && pos.y >= 0 && pos.y < nav_mesh.grid.length && pos.x < nav_mesh.grid[0].length);
  }
  pathExists(start:Vector,goal:Vector){
    return this.createPath(start,goal).exists;
  }
  createPath(start:Vector,goal:Vector){
    let room = this.game.getRoom() as Pathing_Room<unknown>;
    let mesh = room.computeNavMesh(room.floor_tag,this.id);
    start = this.posToCord(mesh, start);
    goal = this.posToCord(mesh, goal);
    let instance = new AStarFinder({
      grid: {
        matrix: mesh.grid
      }
    });
    if(this.cordOnGrid(mesh,start) && this.cordOnGrid(mesh,goal)){
      let bottom_left: Vector = {
        x: mesh.box.x - mesh.box.width / 2,
        y: mesh.box.y - mesh.box.height / 2
      }
      let raw_path = instance.findPath(start, goal);
      let path = raw_path.map((cord) => {
        return {
          x: bottom_left.x + room.nav_node_diameter * cord[0] + room.nav_node_diameter/2,
          y: bottom_left.y + room.nav_node_diameter * cord[1] + room.nav_node_diameter/2
        }
      });
      if(path.length > 0){
        return {
          exists: true,
          path 
        }
      }
    }
    return {
      exists: false,
      path:undefined
    }
  }
  setGoal(pos:Vector){
    let room = this.game.getRoom() as Pathing_Room<unknown>;
    let mesh = room.computeNavMesh(room.floor_tag,this.id);
    
    let start = this.state.position;
    let goal = pos;
    let path_result = this.createPath(start,goal);
    if(path_result.exists){
      this.currentPath = path_result.path;
      this.currentFullPath = Array.from(path_result.path)
      this.currentGoalPos = this.currentPath.splice(0,1)[0];
      this.hasGoal = true;
    }
  }
  statef(delta_time: number) {
    super.statef(delta_time);
    if (this.currentGoalPos) {
      if(DEBUG && debug_state.render_toggles["path_finding"]){
        let last_pos = this.state.position;
        for(let a of this.currentPath){
          render_line({
            start:last_pos,
            end:a
          });
          last_pos = a;
        }
        
      }
      let speed = this.speed;
      let dist = Vec.distance(this.state.position,this.currentGoalPos);
      let angle = this.angleTowardsPoint(this.currentGoalPos);
      let vel = rotation_length(this.speed, angle);
      this.state.velocity = Vec.scalar_mult(vel,delta_time/16.66);
      
      if (dist < this.speed) {
        if (this.currentPath.length > 0) {
          this.currentGoalPos = this.currentPath.shift();
        }
        else{
          this.state.position = this.currentGoalPos;
          this.hasGoal = false;
          this.currentGoalPos = undefined;
          this.currentFullPath = undefined;
          this.currentPath = undefined;
        }
        this.state.velocity = { x: 0, y: 0 };
      }
      if(this.state.pathing_timer == 0){
        
        if(this.state.last_pos.x == this.state.position.x && this.state.last_pos.y == this.state.position.y){
          let goal = this.currentFullPath[this.currentFullPath.length - 1];
          this.setGoal(goal);

        }
      }
      this.state.pathing_timer += delta_time;
      if(this.state.pathing_timer > this.path_recalc_interval){
        this.state.pathing_timer = 0;
      }
    }
    else{
      this.state.pathing_timer = 0;
    }
    this.state.last_pos.x  = this.state.position.x;
    this.state.last_pos.y = this.state.position.y;   
  }
}
