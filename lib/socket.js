import { Server as Io, Socket as ioSocket } from "socket.io"

export default class Socket{
    constructor(name){
        this.name = name
    }

    /**
     * 
     * @private
     */
    async socketRequest(socket, io){
        let value = await this.#socketAcces(socket)
        
        if(value == true){
            this.#socketExecute(socket, io)
            return true
        }
        else if(typeof value === "string"){
            return value
        }
        else if(value === false || value === undefined){
            return false
        }
    }

    /**
     * 
     * @param {(socket: ioSocket, io: Io)} fnc 
     */
    socketServer(fnc){
        this.#socketServer = fnc
    }

    /**
     * 
     * @param {()} fnc 
     */
    socketClient(fnc){
        this.#socketClient = fnc
    }

    /**
     * 
     * @param {(socket: ioSocket)} fnc
     */
    socketAcces(fnc){
        this.#socketAcces = fnc
    }

    #socketExecute(socket, io){
        socket.emit("exec", (this.#socketClient).toString(), () => {
            this.#socketServer(socket, io)
        })
    }
    #socketServer = function (){

    }

    #socketClient = function (){

    }

    #socketAcces = async function(auth, headers){
        return false
    }

}