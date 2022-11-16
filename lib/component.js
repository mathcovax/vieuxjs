import fs from "fs";
import ToWindow from "./toWindow.js";
import sass from "sass";

export default class Component{
    /**
     * 
     * @param {String} name
     * @param  {Html} html
     */
    constructor(name, html){
        if(!name) new Error("");
        this.name = name;
        this.html = fs.existsSync(html)? fs.readFileSync(html, "utf-8") : html;
        this.#generateId();
        this.preRender();
    }

    preRender(){
        let window = ToWindow(this.html).window
        for(const tag of window.document.body.querySelectorAll("*")){
            tag.dataset.vieuxjsComponent = this.#id;
        }
        for(const style of window.document.body.querySelectorAll("style[scoped]")){
            style.textContent = style.textContent.replace(/\{/g, (value) => {
                if(value == "{"){
                    return "[data-vieuxjs-component='" + this.#id + "']{";
                }
            });
        }
        for(const script of window.document.body.querySelectorAll("script")){
            const style = window.document.createElement("style");
            style.type = "script";
            style.innerHTML = script.outerHTML;
            style.dataset.vieuxjsComponent = this.#id;
            script.replaceWith(style);
        }
        try{
            for(const style of window.document.body.querySelectorAll("style[type='scss']")){
                style.textContent = sass.compileString(style.innerHTML, {style: "expanded"}).css.toString();
                style.type = "text/css";
            }
        }
        catch(e){
            console.log(e);
            throw new Error("");
        }

        this.html = window.document.body.innerHTML.replace(/\{\*\*NAME\}/g, this.name).replace(/\{\*\*ID\}/g, this.#id);
        window.close();
    }

    render(obj=false){
        obj = obj || "{}"
        try{
            obj = typeof obj === "string"? eval("(" + obj + ")") : obj
        }
        catch(e){
            throw "Component : input object is wrong." + obj
        }

        let html = this.html
        html.match(/\{\*.*?\}/g)?.map((x) => {
            html = html.replace(x, ((o) => {
                x = x.replace(/[{*}]/g, "").split(":")
                
                try{
                    for(const item of x[0].split(".")){
                        o = o[item]
                    }
                    if(typeof o !== "string") throw ""
                }
                catch{
                    if(x[1] !== undefined){
                        x.shift()
                        return x.join(":")
                    }
                    else{
                        throw "Component : Value: '" + x.join(":") + "' not found in input object." + obj
                    }
                }
                return o
            })(obj))
        })

        return html
    }

    /**
     * @type {HTML}
     */
    html = "";

    /**
     * @type {String}
     */
    name = "";

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
        }while(this.constructor.#components[id]);
        this.#id = id;
    }

    static #components = {};

}