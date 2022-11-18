class LoadingOverlay{
    constructor(timespan=false){
        this.#generateProcess()
        if(this.currentProcess === undefined){
            this.currentProcess = this.#process;
            this.element.style.backgroundColor = "";
        }
        
        if(timespan === 0){
            this.currentProcess = this.#process;
            this.element.style.display = "block";
        }
        else this.#timeout = setTimeout(() => {
            this.currentProcess = this.#process;
            this.element.style.display = "block";
        }, timespan || this.constructor.timespan);
    }

    finish(reset=false){
        if(reset === true)delete this.element.dataset.vieuxjsProcess;
        clearTimeout(this.#timeout);
        if(this.currentProcess === this.#process){
            this.element.style.display = "none";
            this.currentProcess = "";
        };
        delete this.constructor.#processes[this.#process];
    }

    #timeout = false;

    #process = "";

    #generateProcess(){
        do{
            var process = (Math.random() + 1).toString(36).substring(2);
        }while(this.constructor.#processes[process]);
        this.#process = process;
        this.constructor.#processes[process] = this;
    }

    static timespan = 250;

    get element(){
        return document.body.children[0].querySelector("#loading-overlay[data-vieuxjs]");
    }

    get currentProcess(){
        return this.element.dataset.vieuxjsProcess;
    }
    set currentProcess(arg){
        return this.element.dataset.vieuxjsProcess = arg;
    }

    static #processes = {};
}