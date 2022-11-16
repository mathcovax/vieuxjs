class WebSocket{
    constructor(name, option={}){
        if(this.constructor.#webSockets[name])throw new Error("");
        this.constructor.#webSockets[name] = this;
        this.name = name;
        this.option = option;
    }

    connect(){
        this.socket = io({
            ...this.option,
            auth: {
                name: this.name
            }
        });
    
        this.socket.on("connect_error", (err) => {
            this.#callback("connect_error", this.socket, err)
        });
    
        this.socket.on("exec", (script, fnc) => {
            script = "(" + script + ")";
            eval(script)(this.socket);
            fnc();
        });

        this.socket.on("connect", () => {
            this.#callback("connect", this.socket);
        });

        return this.socket;
    }

    close(){
        this.socket.removeAllListeners();
        this.socket.disconnect();
        delete this.constructor.#webSockets[this.name];
        this.#callback("disconnect", this.socket);
    }

    socket = false;

    #callback = ()=>{}
    callback(fnc){
        this.#callback = fnc;
    }

    name = "";

    option = {};

    static #webSockets = {};
    static closeByName(name){
        if(!this.#webSockets[name])throw new Error("");
        this.#webSockets[name].close();
    }
    static getByName(name){
        if(!this.#webSockets[name])throw new Error("");
        return this.#webSockets[name];
    }
}

function wsConnect(name, option={}, callback=()=>{}){
    const ws = new WebSocket(name, option);
    ws.callback(callback);
    ws.connect();
    return ws.socket;
}

function wsClose(name, callback=false){
    const ws = WebSocket.getByName(name);
    if(typeof callback === "function")ws.callback(callback);
    ws.close();
    return ws.socket;
}