class Store{
    constructor(data={}, watch={}){
        this.constructor.state = data;
        this.constructor.watch = watch;
    }

    static #value = {}
    static #state = {};
    static get state(){
        return this.#state;
    }
    static set state(data={}){
        for(const key in this.#state){
            delete this.#value[key];
            delete this.#state[key];
        }

        for(const key in data){
            this.#value[key] = data[key];
            Object.defineProperty(this.#state, key, {
                configurable: true,
                get: function(){
                    return this.#value[key];
                }.bind(this),
                set: function(arg){
                    try{
                        this.#watch[key](this.#value[key], arg);
                    }catch{}
                    this.#value[key] = arg;
                }.bind(this)
            })
        }
    }

    static #watch = {};
    static get watch(){
        return this.#watch;
    }
    static set watch(watch={}){
        for(const key in this.#watch){
            delete this.#watch[key];
        }

        for(const key in watch){
            if(!this.#value[key])throw new Error("");
            this.#watch[key] = watch[key];
        }
    }

    static destroy(arr=[]){
        for(const key of arr){
            if(!this.#value[key])throw new Error("");
            delete this.#value[key];
            delete this.#state[key];
            delete this.#watch[key];
        }
    }
}

class SubStore{
    constructor(data={}, watch={}){
        this.state = data;
        this.watch = watch;
    }

    #value = {}
    #state = {};
    get state(){
        return this.#state;
    }
    set state(data={}){
        for(const key in this.#state){
            delete this.#value[key];
            delete this.#state[key];
        }

        for(const key in data){
            this.#value[key] = data[key];
            Object.defineProperty(this.#state, key, {
                configurable: true,
                get: function(){
                    return this.#value[key];
                }.bind(this),
                set: function(arg){
                    try{
                        this.#watch[key](this.#value[key], arg);
                    }catch{}
                    this.#value[key] = arg;
                }.bind(this)
            })
        }
    }

    #watch = {};
    get watch(){
        return this.#watch;
    }
    set watch(watch={}){
        for(const key in this.#watch){
            delete this.#watch[key];
        }

        for(const key in watch){
            if(!this.#value[key])throw new Error("");
            this.#watch[key] = watch[key];
        }
    }

    destroy(){
        for(const key in this.#value){
            delete this.#value[key];
            delete this.#state[key];
            delete this.#watch[key];
        }
    }
}

