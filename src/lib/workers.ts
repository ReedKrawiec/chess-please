interface resolver{
    (value:any):void
}


export class WorkerPool{
    entries:Array<{
        worker:Worker,
        working:boolean,
        resolver:resolver
    }> = [];
    queue:Array<{
        type:string,
        data:any,
        resolver:resolver
    }> = [];
    constructor(location:string,amount:number){
        for(let a = 0;a < amount; a++){
            this.entries.push({
                worker:new Worker(location),
                working:false,
                resolver:undefined
            })
            this.entries[a].worker.onmessage = (e) => {
                this.recieve(a,e.data);
            }
        }    
    }
    recieve(id:number, output:string){
        if(output === "fin"){
            this.entries[id].resolver(true);
            if(this.queue.length > 0){
                let event = this.queue.shift();
                this.entries[id].resolver = event.resolver;
                this.entries[id].worker.postMessage({
                    type:event.type,
                    data:event.data
                });
            }
            else{
                this.entries[id].working = false;
            }
            
        }    
    }
    send_all(type:string,data?:any,transferables?:any[]){
        return new Promise((resolve,reject)=>{
            let encoded = {
                type,
                data
            };
            for(let entry of this.entries){
                entry.worker.postMessage(encoded,transferables);
            }
        })
    }
    send(type:string,data?:any,transferables?:any[]){
        return new Promise((resolver,reject)=>{
            let successful = false;
            for(let entry of this.entries){
                if(!entry.working){
                    entry.worker.postMessage({
                        type,
                        data
                    },transferables)
                    entry.working = true;
                    entry.resolver = resolver;
                    successful = true;
                    break;
                }
            }
            if(!successful){
                this.queue.push({
                    type,
                    data,
                    resolver
                });
            }
        })
    }
}