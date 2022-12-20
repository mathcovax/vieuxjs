class Loc{
    constructor(href=this.#href){
        this.#href = href.replace(window.location.origin, "");
    }

    get urlArgs(){
        return (this.#href.split("?")[1]?.length > 0? "?" + this.#href.split("?")[1] : "");
    }
    
    get args(){
        if(this.#href.indexOf("?") > -1){
            let args = {};
            for(const arg of this.#href.split("?")[1].split("&")){
                args[arg.split("=")[0]] = arg.split("=")[1];
            }
            return args;
        }
        else{
            return {};
        }
    }

    get urlPath(){
        let urlPath = this.#href.split("?").shift();
        urlPath = (urlPath.startsWith("/")? urlPath : "/" + urlPath);
        urlPath = (urlPath.endsWith("/") && urlPath.length > 1? urlPath.substring(0, urlPath.length-1) : urlPath);
        return urlPath;
    }
    
    get path(){
        let path = this.#href.split("?").shift();
        path = (path.startsWith("/")? path.substring(1, path.length) : path);
        path = (path.endsWith("/")? path.substring(0, path.length-1) : path);
        return path.split("/");
    }

    get url(){
        return this.urlPath + this.urlArgs;
    }

    #href = "/";

    static get urlArgs(){
        return (this.href.split("?")[1]? "?" + this.href.split("?")[1] : "");
    }
    
    static get args(){
        if(this.href.indexOf("?") > -1){
            let args = {};
            for(const arg of this.href.split("?")[1].split("&")){
                args[arg.split("=")[0]] = arg.split("=")[1];
            }
            return args;
        }
        else{
            return {};
        }
    }

    static get urlPath(){
        let urlPath = this.href.split("?").shift().replace(window.location.origin, "");
        urlPath = (urlPath.startsWith("/")? urlPath : "/" + urlPath);
        urlPath = (urlPath.endsWith("/") && urlPath.length > 1? urlPath.substring(0, urlPath.length-1) : urlPath);
        return urlPath;
    }
    
    static get path(){
        let path = this.href.split("?").shift().replace(window.location.origin, "");
        path = (path.startsWith("/")? path.substring(1, path.length) : path);
        path = (path.endsWith("/")? path.substring(0, path.length-1) : path);
        return path.split("/");
    }

    static get url(){
        let url = this.href
        url = (url.startsWith("/")? url : "/" + url);
        url = (url.endsWith("/")? url.substring(0, url.length-1) : url);
        return url;
    }

    static get href(){
        return window.location.href.replace(window.location.origin, "");
    } 
    
    /**
     * 
     * @param {urlPath} url 
     * @return {Loc}
     */
    static parse(url){
        return new Loc(url);
    }
}

async function forPromise(array, fnc){
    let listPromise = [];
    for(let value of array){
        listPromise.push(fnc(value));
    }
    return await Promise.all(listPromise);
}

async function sleep(timespan=0){
    await new Promise((resolve) => {
        setTimeout(resolve, timespan);
    });
}