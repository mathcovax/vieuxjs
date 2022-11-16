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
        const page = ToWindow(this.constructor.#beforeRender(this.html), "html").window
        while(page.document.querySelector("div[data-c]")){
            for(const component of page.document.querySelectorAll("div[data-c]")){
                if(component.dataset.c.endsWith(".*")){
                    let innerHTML = component.innerHTML;
                    component.innerHTML = "";
                    for(const key in Root.components){
                        if(key.startsWith(component.dataset.c.replace(".*", ""))){
                            let div = page.document.createElement("div");
                            div.dataset.c = key;
                            div.innerHTML = innerHTML;
                            component.append(div);
                        }
                    }
                    component.outerHTML = component.innerHTML;
                }
                else{
                    if(!Root.components[component.dataset.c])throw new Error("");
                    const div = page.document.createElement("div")
                    div.innerHTML = Root.components[component.dataset.c].render(component.innerHTML === ""? false : component.innerHTML);
                    div.children[0].dataset.component = component.dataset.c;
                    div.children[0].dataset.vieuxjsPage = this.#id;
                    for(let index = 0; index < component.attributes.length; index++){
                        if(component.attributes.item(index).name == "data-c") continue;
                        div.children[0].attributes.setNamedItem(component.cloneNode(true).attributes.removeNamedItem(component.attributes.item(index).name));
                    }
                    component.outerHTML = div.innerHTML;
                }
            }
        }

        for(const tag of page.document.querySelectorAll("*:not([data-vieuxjs-component])")){
            tag.dataset.vieuxjsPage = this.#id;
        }

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

        for(const script of page.document.querySelectorAll("script:not([data-vieuxjs-default]):not([data-vieuxjs]):not([data-vieuxjs-component])")){
            const style = page.document.createElement("style");
            style.type = "script";
            style.innerHTML = script.outerHTML;
            style.dataset.vieuxjsPage = this.#id;
            script.replaceWith(style);
        }

        try{
            for(const style of page.document.querySelectorAll("style[type='scss']")){
                style.textContent = sass.compileString(style.innerHTML, {style: "expanded"}).css.toString();
                style.type = "text/css";
            }
        }
        catch(e){
            console.log(e);
            throw new Error("");
        }

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
        
        page.close();
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

    static #pages = {};
}