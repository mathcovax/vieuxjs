class ToPage{
    static async begin(newUrl, oldUrl=window.location.href){
        if(this.#status === true) return;
        this.#status = true;

        this.#lo = new LoadingOverlay();

        newUrl = Loc.parse(newUrl).url;
        oldUrl = Loc.parse(oldUrl).url;

        const obj = await this.#getPage(newUrl);
        return await this.#upDatePage(obj.html, (Loc.parse(obj.repUrl).url), oldUrl);
    }

    static async #upDatePage(html, newUrl, oldUrl){
        if(oldUrl == newUrl){
            for(const tag of document.head.querySelectorAll("[data-vieuxjs-page]")){
                tag.remove();
            }
            for(const tag of document.body.querySelectorAll("[data-vieuxjs-page]")){
                tag.remove();
            }
            await this.#unloadScripts(newUrl, oldUrl);
            oldUrl = "?";
        }
        this.#currentUrl = newUrl;
        this.#history.push(newUrl);
        newUrl = newUrl.split("?")[0];
        oldUrl = oldUrl.split("?")[0];
        this.#newPage = new DOMParser().parseFromString(html, "text/html");
        this.#currentid = this.#newPage.body.dataset.vieuxjsPage;
        document.title = this.#newPage.title || document.title;
        window.history.pushState(null, null, this.#currentUrl);
        this.#rectiNewPage();
        this.#head(newUrl, oldUrl);
        await this.#loadCss(newUrl);
        this.#body();
        await this.#loadScripts(newUrl, oldUrl);
        this.#unloadScripts(newUrl, oldUrl);
        this.#unloadCss(newUrl);
        this.#status = false;
        this.#lo.finish();
        return
    }

    static #rectiNewPage(){
        for(const tag of this.#newPage.querySelectorAll("[data-vieuxjs-default], [data-vieuxjs]")){
            tag.remove();
        }
        for(const style of this.#newPage.querySelectorAll("style[type=script]")){
            style.outerHTML = style.innerHTML;
        }
        
    }

    static #head(newUrl, oldUrl){
        for(const tag of this.#newPage.head.querySelectorAll("[data-vieuxjs-page]:not(link[rel='stylesheet'])")){
            this.elementHead.append(tag);
        }
        for(const tag of this.elementHead.querySelectorAll("[data-vieuxjs-page]:not([data-vieuxjs-page='"+ this.#currentid +"'])")){
            tag.remove();
        }
    }

    static async #loadCss(newUrl){
        await forPromise(this.#newPage.querySelectorAll("link[rel='stylesheet']"), (css) => {
            return new Promise((resolve) => {
                this.elementCss.append(css);
                css.onload = resolve;
                css.onerror = resolve;
            });
        })
        for(const tag of this.#newPage.querySelectorAll("style")){
            this.elementCss.append(tag);
        }
    }

    static #body(){
        for(let index = 1; this.elementBody.children[index] || this.#newPage.body.children[0]; index++){
            if(this.#newPage.body.children[0]?.dataset?.component && this.elementBody.children[index]?.dataset?.component && this.elementBody.children[index].dataset.component == this.#newPage.body.children[0].dataset.component){
                if(this.elementBody.children[index].dataset.vieuxjsPage != this.#newPage.body.children[0].dataset.vieuxjsPage){
                    this.elementBody.children[index].dataset.vieuxjsPage = this.#newPage.body.children[0].dataset.vieuxjsPage
                }
                this.#newPage.body.children[0].remove()
            }
            else if(this.elementBody.children[index] && this.#newPage.body.children[0])this.elementBody.children[index].replaceWith(this.#newPage.body.children[0])
            else if (!this.elementBody.children[index] && this.#newPage.body.children[0])this.elementBody.append(this.#newPage.body.children[0])
            else if (this.elementBody.children[index] && !this.#newPage.body.children[0]){
                this.elementBody.children[index].remove()
                index--
            }
        }
        this.elementBody.dataset.vieuxjsPage = this.#newPage.body.dataset.vieuxjsPage
    }

    static async #loadScripts(newUrl, oldUrl){
        if(!this.#pageVariable[newUrl.split("?")[0]])this.#pageVariable[newUrl.split("?")[0]] = {}
        pv = this.#pageVariable[newUrl.split("?")[0]]
        if(!this.#scriptsPage[newUrl.split("?")[0]])this.#scriptsPage[newUrl.split("?")[0]] = {}
        await this.#launchScriptsDefault("load", {newUrl: newUrl, oldUrl: oldUrl})

        for await(const script of document.querySelectorAll("script:not([data-vieuxjs]):not([data-vieuxjs-default])")){
            await new Promise(async (resolve) => {
                let s = document.createElement("script");
                if(script.src){
                    if(!this.#scriptsPage[newUrl.split("?")[0]][script.src]){
                        this.#scriptsPage[newUrl.split("?")[0]][script.src] = {
                            load: ()=>{},
                            unload: ()=>{},
                            destroy: () => {},
                            returnLoad: {}
                        }
                        await new Promise((resolve) => {
                            script.dataset.scriptId = script.src;
                            script.onload = resolve;
                            script.onerror = resolve;
                            for(let index = 0; index < script.attributes.length; index++){
                                s.attributes.setNamedItem(script.cloneNode().attributes.removeNamedItem(script.attributes.item(index).name));
                            }
                            script.replaceWith(s);
                        })
                    }
                    else{
                        script.dataset.scriptId = script.src;
                    }
                                       
                }
                else{
                    if(!script.dataset.scriptId?.startsWith("local-")){
                        script.dataset.scriptId = "local-" + (Math.random() + 1).toString(36).substring(2);
                        this.#scriptsPage[newUrl.split("?")[0]][script.dataset.scriptId] = {
                            load: ()=>{},
                            unload: ()=>{},
                            destroy: () => {},
                            returnLoad: {}
                        }
                        for(let index = 0; index < script.attributes.length; index++){
                            s.attributes.setNamedItem(script.cloneNode().attributes.removeNamedItem(script.attributes.item(index).name));
                        }
                        s.innerHTML = script.innerHTML
                        script.replaceWith(s);
                    }
                    else if(!this.#scriptsPage[newUrl.split("?")[0]][script.dataset.scriptId]){
                        this.#scriptsPage[newUrl.split("?")[0]][script.dataset.scriptId] = this.#scriptsPage[oldUrl.split("?")[0]][script.dataset.scriptId];
                    }
                }
                try{
                    this.#scriptsPage[newUrl.split("?")[0]][script.dataset.scriptId].returnLoad = await this.#scriptsPage[newUrl.split("?")[0]][script.dataset.scriptId].load();
                }catch(e){console.log(e);}

                resolve()
            })
        }
    }

    static async #unloadScripts(newUrl, oldUrl){
        await this.#launchScriptsDefault("unload", {newUrl: newUrl, oldUrl: oldUrl})
        for await(const scriptId of Object.keys(this.#scriptsPage[oldUrl.split("?")[0]] || {})){
            await this.#scriptsPage[oldUrl.split("?")[0]][scriptId].unload(this.#pageVariable[oldUrl.split("?")[0]], this.#scriptsPage[oldUrl.split("?")[0]][scriptId].returnLoad)
            if(!document.querySelector("script[data-script-id='" + scriptId + "']"))this.#scriptsPage[oldUrl.split("?")[0]][scriptId].destroy()
            this.#scriptsPage[oldUrl.split("?")[0]][scriptId].returnLoad = {}
            if(scriptId.startsWith("local-")) delete this.#scriptsPage[oldUrl.split("?")[0]][scriptId]
        }
        for(const v in this.#pageVariable[oldUrl.split("?")[0]]){
            delete this.#pageVariable[oldUrl.split("?")[0]][v]
        }
    }

    static async #unloadCss(newUrl){
        for(const css of this.elementCss.querySelectorAll("link:not([data-vieuxjs-page='"+ this.#currentid +"'])")){
            css.remove()
        }
        for(const style of this.elementCss.querySelectorAll("style:not([data-vieuxjs-page='"+ this.#currentid +"'])")){
            style.remove()
        }
    }

    static async #getPage(newUrl){
        return await new Promise((resolve, reject) => {
            fetch(newUrl, { method: "GET", headers: {...this.#header} }).then(response=>{
                if(!response.headers.get('content-disposition')){
                    response.text().then((rep) => {
                        if(rep == "reload"){
                            window.location.reload()
                        }
                        else{
                            resolve({html: rep, repUrl: response.url})
                        }
                    })
                }
                else if(response.headers.get('content-disposition')){
                    response.blob().then((data) => {
                        var a = document.createElement("a")
                        a.href = window.URL.createObjectURL(data)
                        a.download = response.headers.get('content-disposition').split('=')[1].replace(/['"]/g, '')
                        a.click()
                        reject("download")
                    })
                }
            }).catch(this.error)
        })
    }

    static async #launchScriptsDefault(event, obj){
        for await(const fnc of this.#scriptsDefault[event]){
            await fnc(obj)
        }
    }

    static async reload(){
        return await this.begin(window.location.href, this.#currentUrl);
    }

    static error = (e) => {throw e};
    
    static get history(){
        return this.#history;
    }
    
    static #history = class history{
        static push(url){
            this.#state.push(url);
            if(this.#state.length > 50)this.#state.splice(0, 1);
        }
    
        static back(){
            ToPage.begin(this.#state.splice(-2, 1)[0], this.#state.splice(-1, 1)[0]);
        }
        
        static #state = [];
    }

    static #scriptsPage = {}

    static #pageVariable = {}

    static #scriptsDefault = {
        load: [],
        unload: [],
        changeModule: [],
    }

    static #currentUrl = ""

    static #currentid = ""

    static #status = false

    static #lo = false

    static #header = {};
    static get header(){
        return this.#header;
    }
    static set header(arg){
        try{
            this.#header = JSON.parse(JSON.stringify(arg));
        }
        catch{
            throw new Error("");
        }
    }
    
    /**
     * @type {Document}
     */
    static #newPage = {}

    /**
     * @type {Element}
     */
    static get elementHead(){
        return document.head;
    }

    /**
     * @type {Body}
     */
    static get elementBody(){
        return document.body;
    }

    /**
     * @type {Element}
     */
    static get elementCss(){
        return this.elementVieuxjs.querySelector("#css[data-vieuxjs]");
    }

    /**
     * @type {Element}
     */
    static get elementVieuxjs(){
        return this.elementBody.children[0];
    }

    static on(event, fnc){
        if(document.currentScript.dataset.scriptId != undefined){
            this.#scriptsPage[this.#currentUrl.split("?")[0]][document.currentScript.dataset.scriptId][event] = fnc
        }
        else if(document.currentScript.dataset.vieuxjsDefault !== undefined || document.currentScript.dataset.vieuxjs !== undefined){
            this.#scriptsDefault[event].push(fnc)
        }
    }

}

async function tp(newUrl){
    return await ToPage.begin(newUrl);
}

var pv = {};
var v = {};

document.addEventListener("click", (e) => {
    if(e.target.nodeName === "A" && e.target.href){
        e.preventDefault();
        if(e.target.onclick && e.target.onclick(e.target) === false){
            return false;
        }
        if(e.target.href.replace(window.location.href, "")[0] != "#")tp(e.target.href);
        else{
            try {   
                document.querySelector(Loc.parse(e.target.href).url.substring(1)).scrollIntoView({behavior: "smooth"});
            } catch (error) {
                
            }
            
        }
    }
})

window.addEventListener("popstate", (e) => {
    ToPage.history.back();
    e.preventDefault()
})

window.onload = async () => {
    for(const tag of document.head.querySelectorAll("[data-vieuxjs-page]")){
        tag.remove();
    }
    for(const tag of document.body.querySelectorAll("[data-vieuxjs-page]")){
        tag.remove();
    }

    let div = document.createElement("div");
    div.style.display = "none";
    div.id = "import-body";
    div.innerHTML = ToPage.elementVieuxjs.querySelector("#import-body").contentWindow.document.body.innerHTML;
    ToPage.elementVieuxjs.querySelector("#import-body").replaceWith(div);
    for(const style of ToPage.elementVieuxjs.querySelector("#import-body").querySelectorAll("style[type='script']")){
        const div = document.createElement("div");
        const script = document.createElement("script");

        div.innerHTML = style.innerHTML;
        for(let index = 0; index < div.children[0].attributes.length; index++){
            script.attributes.setNamedItem(div.children[0].cloneNode().attributes.removeNamedItem(div.children[0].attributes.item(index).name));
        }
        script.dataset.vieuxjsDefault = "";
        script.innerHTML = div.children[0].innerHTML;

        style.replaceWith(script);
    }

    ToPage.begin(window.location.href, Date.now() + "?" + Date.now());
}
