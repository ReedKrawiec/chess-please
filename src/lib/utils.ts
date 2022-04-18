
export interface string_dict<T> {
    [index:string]:T
}


export let diff = function(prev_state:string_dict<string>,new_state:string_dict<string>):string_dict<string>{
    let delta_state:string_dict<string> = {};
    let keys = Object.keys(new_state);

    for(let key of keys){
        if(!prev_state || new_state[key] != prev_state[key]){
            delta_state[key] = new_state[key]
        }
    }
    return delta_state;
}

export const range = function(first:number,second?:number){
    let start;
    let end;
    if(second){
        start = first;
        end = second;
    }
    else{
        start = 0;
        end = first;
    }
    let to_return = [];
    for(let a = start; a < end; a++){
        to_return.push(a);
    }
    return to_return;
}