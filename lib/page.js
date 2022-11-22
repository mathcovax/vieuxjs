import ToWindow from "./toWindow.js";
import fs from "fs";
import sass from "sass";
import Root from "./root.js";

export default class Page{
    /**
     * @param {Html} html
     * @param {Json} pson
     */
    constructor(html, pson={}){
        this.html = fs.existsSync(html)? fs.readFileSync(html, "utf-8") : html;
        this.pson = pson;
        this.#generateId();
        this.render();
    }

    render(){
        if(!Root.isIndexMake)Root.makeIndex();
        
        const page = ToWindow(this.constructor.#beforeRender(this.html), "html").window;

        for(const tag of page.document.querySelectorAll("*")){
            tag.dataset.vieuxjsPage = this.#id;
        }

        this.constructor.renderComponents(page);

        for(const tag of page.document.querySelectorAll("style[data-vieuxjs-component]:not([type='script'])")){
            tag.dataset.vieuxjsPage = this.#id;
        }
        
        for(const style of page.document.querySelectorAll("style[scoped]:not([data-vieuxjs-component])")){
            style.textContent = style.textContent.replace(/\{/g, (value) => {
                if(value == "{"){
                    return "[data-vieuxjs-page='" + this.#id + "']{"
                }
            })
        }
        
        this.constructor.renderScript(page);
        this.constructor.renderScss(page);

        const rootIndex = ToWindow(Root.index).window;
        rootIndex.document.body.dataset.vieuxjsPage = this.#id;
        
        for(const tag of page.document.head.children){
            if(tag.nodeName === "TITLE"){
                rootIndex.document.title = tag.innerHTML;
                continue;
            }
            rootIndex.document.head.append(tag.cloneNode(true));
        }
        for(const tag of page.document.body.children){
            rootIndex.document.body.append(tag.cloneNode(true));
        }

        let html = rootIndex.serialize();

        html.match(/\{\%.*?\}/g)?.map((x) => {
            html = html.replace(x, ((obj) => {
                try{
                    for(const item of x.replace(/[{%} ]/g, "").split(".")){
                        obj = obj[item];
                    }
                    if(typeof obj !== "string") new Error("");
                }
                catch{
                    throw new Error("");
                }
                return obj;
            })(this.#pson));
        });
        
        page.close();
        html =  this.constructor.renderGson(html);
        html = this.constructor.#afterRender(html);
        this.#result = html;
        rootIndex.close();
        return html;
    }

    /**
     * @type {Json}
     */
    #pson = {};
    /**
     * @type {Json}
     */
    get pson(){
        return this.pson;
    }
    /**
     * @type {Json}
     */
    set pson(arg){
        try{
            this.#pson = JSON.parse(JSON.stringify(arg));
        }
        catch{
            throw new Error("");
        }
    }

    /**
     * @type {HTML}
     */
    html = "";
    
    /**
     * @type {HTML}
     */
    #result = "";
    /**
     * @type {HTML}
     */
    get result(){
        return this.#result;
    }

    /**
     * @type {String}
     */
    #id = "";
    /**
     * @type {String}
     */
    get id(){
        return this.#id;
    }
    #generateId(){
        do{
            var id = (Math.random() + 1).toString(36).substring(2);
        }while(this.constructor.#pages[id]);
        this.#id = id;
        this.constructor.#pages[id] = this;
    }

    /**
     * @param {Html} html
     * @returns {Html}
     */
    static #beforeRender = (html) => {return html};
    /**
     * @param {(html:Html)Html} fnc 
     */
    static beforeRender(fnc){
        if(typeof fnc === "function"){
            this.#beforeRender = fnc;
        }
        else{
            throw new Error("");
        }
    }

    /**
     * @param {Html} html 
     * @returns {Html}
     */
    static #afterRender = (html) => {return html};
    /**
     * @param {(html:Html)Html} fnc 
     */
    static afterRender(fnc){
        if(typeof fnc === "function"){
            this.#afterRender = fnc;
        }
        else{
            throw new Error("");
        }
    }

    static renderComponents(window){
        while(window.document.querySelector("div[data-c]")){
            for(const component of window.document.querySelectorAll("div[data-c]")){
                if(component.dataset.c.endsWith(".*")){
                    let innerHTML = component.innerHTML;
                    component.innerHTML = "";
                    for(const key in Root.components){
                        if(key.startsWith(component.dataset.c.replace(".*", ""))){
                            let div = window.document.createElement("div");
                            div.dataset.c = key;
                            div.innerHTML = innerHTML;
                            component.append(div);
                        }
                    }
                    component.outerHTML = component.innerHTML;
                }
                else{
                    if(!Root.components[component.dataset.c])throw new Error("");
                    const div = window.document.createElement("div")
                    div.innerHTML = Root.components[component.dataset.c].render(component.innerHTML === ""? false : component.innerHTML);
                    div.children[0].dataset.component = component.dataset.c;
                    for(let index = 0; index < component.attributes.length; index++){
                        if(component.attributes.item(index).name == "data-c") continue;
                        div.children[0].attributes.setNamedItem(component.cloneNode(true).attributes.removeNamedItem(component.attributes.item(index).name));
                    }
                    component.outerHTML = div.innerHTML;
                }
            }
        }
    }

    static renderGson(html){
        html.match(/\{\#.*?\}/g)?.map((x) => {
            html = html.replace(x, ((obj) => {
                try{
                    for(const item of x.replace(/[{#} ]/g, "").split(".")){
                        obj = obj[item];
                    }
                    if(typeof obj !== "string") new Error("");
                }
                catch{
                    throw new Error("");
                }
                return obj;
            })(Root.gson));
        });
        return html;
    }

    static renderScss(window){
        try{
            for(const style of window.document.querySelectorAll("style[type='scss']")){
                style.textContent = sass.compileString(style.innerHTML, {style: "expanded"}).css.toString();
                style.type = "text/css";
            }
        }
        catch(e){
            console.log(e);
            throw new Error("");
        }
    }

    static renderScript(window){
        for(const script of window.document.querySelectorAll("script")){
            const style = window.document.createElement("style");
            style.type = "script";
            style.innerHTML = script.outerHTML;
            script.replaceWith(style);
        }
    }

    static destroy(){
        for(const key in this.#pages){
            delete this.#pages[key].html;
            delete this.#pages[key].result;
            this.#pages[key].pson = {};
            delete this.#pages[key];
        }
    }

    static #pages = {};
}