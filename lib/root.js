import express from "express";
import http from "http";
import cookieParser from "cookie-parser";
import { Server as Io } from "socket.io";
import ToWindow from "./toWindow.js";
import Socket from "./socket.js";
import Page from "./page.js";
import { VieuxjsDirectories, VieuxjsDirectoriesFile } from "./directories.js";
import fs from "fs";
import Component from "./component.js";
import sass from "sass";

export default class Root{
    /**
     * @param {Number} port 
     * @param {()void} callback 
     */
    static init(port=this.#port, callback=()=>{}){
        this.#isInit = true;
        if(!this.#isIndexMake)this.makeIndex();
        this.loadAccesses();

        if(this.#webSocket === true){
            this.#io = new Io(this.#server);
            this.#io.use(async (socket, next) => {
                let value = await this.#socket[socket.handshake.auth?.name]?.socketRequest(socket, this.io);
                if(value === true){
                    next();
                }
                else if(typeof value === "string"){
                    next(new Error(value));
                }
                else if(value === false){
                    next(new Error("Connection denied."));
                }
                return;
            })
        }

        this.#server.listen(port, () => {
            callback();
            this.#callback();
            this.#isReady = true;

            this.#app.use((function notfound(req, res){
                res.status(404).send("404 not found.");
            }).bind(this));
        });
    }

    static makeIndex(){
        this.#isIndexMake = true;

        const vieuxjsIndex = ToWindow(VieuxjsDirectoriesFile.vieuxjsIndex).window;
        const importBody = ToWindow((new Page(this.defaultIndex)).render(), "html").window;
        const mainIndex = ToWindow(this.defaultIndex).window;

        this.#importBody = "<!DOCTYPE html>\n" + importBody.document.body.outerHTML;

        if(this.#webSocket === true){
            this.#addScriptSrcToVieuxjsIndex.splice(0, 0, "/vieuxjs/js/socket.js");
            this.#addScriptSrcToVieuxjsIndex.splice(0, 0, "/socket.io/socket.io.js");
        }
        if(this.#webStore === true){
            this.#addScriptSrcToVieuxjsIndex.splice(0, 0, "/vieuxjs/js/store.js");
        }

        for(let src of this.#addScriptSrcToVieuxjsIndex){
            let script = vieuxjsIndex.document.createElement("script");
            script.src = src;
            vieuxjsIndex.document.head.append(script);
        }

        mainIndex.document.body.innerHTML = "";

        for(const tag of mainIndex.document.head.querySelectorAll("*")){
            tag.dataset.vieuxjsDefault = "";
        }
        
        for (let index = vieuxjsIndex.document.head.children.length-1; index >= 0; index--) {
            vieuxjsIndex.document.head.children[index].dataset.vieuxjs = "";
            mainIndex.document.head.prepend(vieuxjsIndex.document.head.children[index].cloneNode(true));
        }

        for(const tag of vieuxjsIndex.document.body.querySelectorAll("*")){
            tag.dataset.vieuxjs = "";
        }
        mainIndex.document.body.append(vieuxjsIndex.document.body.children[0].cloneNode(true));

        mainIndex.document.body.children[0].querySelector("#loading-overlay").innerHTML = fs.existsSync(this.loadingOverlay)?fs.readFileSync(this.loadingOverlay):this.loadingOverlay;
        for(const tag of mainIndex.document.body.children[0].querySelector("#loading-overlay").querySelectorAll("*")){
            tag.dataset.vieuxjsDefault = "";
        }

        try{
            for(const style of mainIndex.document.querySelectorAll("style[type='scss']")){
                style.textContent = sass.compileString(style.innerHTML, {style: "expanded"}).css.toString();
                style.type = "text/css";
            }
        }
        catch(e){
            console.log(e);
            throw new Error("");
        }

        this.#index = mainIndex.serialize().replace(/\{session\}/g, this.#session);

        this.#index.match(/\{\#.*?\}/g)?.map((x) => {
            this.#index = this.#index.replace(x, ((obj) => {
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
            })(this.#gson));
        });

        vieuxjsIndex.close();
        mainIndex.close();
        importBody.close();
    }

    static loadAccesses(){
        for(const index in this.#pages){
            if(this.#accesses.page[index]){
                this.#pages[index].access = async (req, res) => {return await this.#accesses.page[index].fnc(req, res);};
                this.#accesses.page[index].use.push(index);
            }
            else if(this.#accesses.page[index + "*"]){
                this.#pages[index].access = async (req, res) => {return await this.#accesses.page[index + "*"].fnc(req, res);};
                this.#accesses.page[index + "*"].use.push(index);
            }
            else{
                let access = (function getAccess(path){
                    if(this.#accesses.page[path + "/*"])return path + "/*";
                    else if(this.#accesses.page[path + "*"])return path + "*";
                    else return getAccess.bind(this, path.split("/").slice(0, -1).join("/"))();
                }).bind(this, index.split("/").slice(0, -1).join("/"))();
                this.#pages[index].access = async (req, res) => {return await this.#accesses.page[access].fnc(req, res);};
                this.#accesses.page[access].use.push(index);
            }
        }
        for(const index in this.#methods){
            if(this.#accesses.method[index]){
                this.#methods[index].access = async (req, res) => {return await this.#accesses.method[index].fnc(req, res);};
                this.#accesses.method[index].use.push(index);
            }
            else if(this.#accesses.method[index + "*"]){
                this.#methods[index].access = async (req, res) => {return await this.#accesses.method[index + "*"].fnc(req, res);};
                this.#accesses.method[index + "*"].use.push(index);
            }
            else{
                let access = (function getAccess(path){
                    if(this.#accesses.method[path + "/*"])return path + "/*";
                    else if(this.#accesses.method[path + "*"])return path + "*";
                    else return getAccess.bind(this, path.split("/").slice(0, -1).join("/"))();
                }).bind(this, index.split("/").slice(0, -1).join("/"))();
                this.#methods[index].access = async (req, res) => {return await this.#accesses.method[access].fnc(req, res);};
                this.#accesses.method[access].use.push(index);
            }
        }


    }

    /**
     * @type {Number}
     */
    static #port = 80;
    /**
     * @type {Number}
     */
    static get port(){
        return this.port;
    }
    /**
     * @type {Number}
     */
    static set port(arg){
        if(Number.isInteger(arg) && arg > 0){
            this.#port = arg;
        }
        else{
            throw new Error("");
        }
    }

    /**
     * @type {()void}
     */
    static #callback = ()=>{console.log("ready");};
    /**
     * @param {()void} fnc
     */
    static callback(fnc){
        if(typeof fnc === "function"){
            this.#callback = fnc;
        }
        else{
            throw new Error("");
        }
    }

    /**
     * @type {express.Express}
     */
    static #app = express();
    /**
     * @type {express.Express}
     */
    static get app(){
        return this.#app;
    }

    /**
     * @type {http.Server}
     */
    static #server = {};
    /**
     * @type {http.Server}
     */
    static get server(){
        return this.#server;
    }

    /**
     * @type {String}
     */
    static #session = String(Date.now());
    /**
     * @type {String}
     */
    static get session(){
        return this.#session;
    }

    /**
     * @type {Boolean}
     */
    static #isReady = false;
    /**
     * @type {Boolean}
     */
    static get isReady(){
        return this.#isReady;
    }

    /**
     * @type {Boolean}
     */
    static #isInit = false;
    /**
     * @type {Boolean}
     */
    static get isInit(){
        return this.#isInit;
    }

    /**
     * @type {Boolean}
     */
    static #isIndexMake = false;
    /**
     * @type {Boolean}
     */
    static get isIndexMake(){
        return this.#isIndexMake;
    }

    /**
     * @type {Json}
     */
    static #gson = {};
    /**
     * @type {Json}
     */
    static get gson(){
        return this.#gson;
    }
    /**
     * @type {Json}
     */
    static set gson(arg){
        try{
            this.#gson = JSON.parse(JSON.stringify(arg));
        }
        catch{
            throw new Error("");
        }
    }

    /**
     * @type {Path}
     */
    static #assetDir = false;
    /**
     * @type {Path}
     */
    static get assetDir(){
        return this.#assetDir;
    }
    /**
     * @type {Path}
     */
    static set assetDir(arg){
        if(fs.existsSync(arg)){
            this.#assetDir = arg;
        }
        else{
            throw new Error("");
        }
    }

    /**
     * @type {Boolean}
     */
    static #webSocket = false;
    /**
     * @type {Boolean}
     */
    static get webSocket(){
        return this.#webSocket;
    }
    /**
     * @type {Boolean}
     */
    static set webSocket(arg){
        if(typeof arg === "boolean" && this.isInit === false){
            this.#webSocket = arg;
        }
        else{
            throw new Error("");
        }
    }

    /**
     * @type {Boolean}
     */
    static #webStore = false;
    /**
     * @type {Boolean}
     */
    static get webStore(){
        return this.#webStore;
    }
    /**
     * @type {Boolean}
     */
     static set webStore(arg){
        if(typeof arg === "boolean" && this.isInit === false){
            this.#webStore = arg;
        }
        else{
            throw new Error("");
        }
    }

    /**
     * @type {Io}
     */
    static #io = null;
    /**
     * @type {Io}
     */
    static get io(){
        return this.#io;
    }

    /**
     * @type {[]}
     */
    static #addScriptSrcToVieuxjsIndex = [];
    /**
     * @type {Array}
     */
    static get addScriptSrcToVieuxjsIndex(){
        return this.#addScriptSrcToVieuxjsIndex;
    }

    /**
     * @type {Html}
     */
    static defaultIndex = VieuxjsDirectoriesFile.mainIndex;

    /**
     * @type {Html}
     */
    static #index = "";
    /**
     * @type {Html}
     */
    static get index(){
        return  this.#index;
    }

    /**
     * @type {Html}
     */
     static #importBody = "";
     /**
      * @type {Html}
      */
     static get importBody(){
         return  this.#importBody;
     }

    /**
     * @type {Html}
     */
    static loadingOverlay = VieuxjsDirectoriesFile.loadingOverlay;


    //  COMPONENT
    /**
     * @type {{}}
     */
    static #components = {};
    /**
     * @type {{}}
     */
    static get components(){
        return this.#components;
    }
    /**
     * @param {Component} component 
     * @return {Component} 
     */
    static addComponent(component){
        if(this.#components[component.name])throw new Error("");
        this.#components[component.name] = component;
        return component;
    }
    /**
     * @param {Component.name} componentName 
     * @return {Component} 
     */
    static getComponent(componentName){
        if(!this.#components[componentName])throw new Error("");
        return this.#components[componentName];
    }
    /**
     * @param {String} componentName 
     * @return {Component} 
     */
    static removeComponent(componentName){
        if(!this.#components[componentName])throw new Error("");
        let component = this.#components[componentName];
        delete this.#components[componentName];
        return component;
    }

    static pathCorrector(path){
        path = (path.startsWith("/")? path : "/" + page);
        path = (path.endsWith("/") && path.length > 1? path.substring(0, path.length-1) : path);
        return path;
    }

    //  PAGE
    /**
     * @type {{}}
     */
    static #pages = {};
    /**
     * @type {{}}
     */
    static get pages(){
        return this.#pages;
    }
    /**
     * @param {Urlpath} path
     * @param {Page} page 
     * @return {Page} 
     */
    static addPage(path, page){
        path = this.pathCorrector(path);
        if(this.#pages[path])throw new Error("");
        this.#pages[path] = {
            access: ()=>{return true},
            page: page,
            e: async (req, res) => {
                switch (await this.#pages[path].access(req, res)) {
                    case true:
                        res.send(page.result);
                        break;
                
                    case false:
                        res.status(503).send("forbidden");
                        break;
                    
                    case undefined:
                        break;
                }
            },
        };
        this.#app.get(path, this.#pages[path].e);
        return page;
    }
    /**
     * @param {Urlpath} path 
     * @return {Page} 
     */
    static getPage(path){
        path = this.pathCorrector(path);
        if(!this.#pages[path])throw new Error("");
        return this.#pages[path].page;
    }
    /**
     * @param {Urlpath} path 
     * @return {Page} 
     */
    static removePage(path){
        path = this.pathCorrector(path);
        if(!this.#pages[path])throw new Error("");
        let page = this.#pages[path].page;
        delete this.#pages[path];
        for(let index = 0; index < this.#app._router.stack.length; index++){
            if(this.#app._router.stack[index].route?.methods.get === true && this.#app._router.stack[index].route?.path === path){
                this.#app._router.stack.splice(index, 1);
                break;
            }
        }
        return page;
    }

    //  ACCESS
    /**
     * @type {{}}
     */
    static #accesses = {
        page: {
            "*": {
                fnc: ()=>{return true;},
                use: []
            }
        },
        method: {
            "*": {
                fnc: ()=>{return true;},
                use: []
            }
        },
    };
    /**
     * @type {{}}
     */
    static get accesses(){
        return this.#accesses;
    }
    /**
     * @param {Urlpath} path
     * @param {("page"|"method"|"all")} type
     * @param {(req:express.Request, res:express.Response, otherAccess:(path: Urlpath)Promise.Boolean)Promise.Boolean} fnc
     */
    static addAccess(path, type="all", fnc){
        path = this.pathCorrector(path);
        if(type !== "method" && type !== "page" && type !== "all")throw new Error("");
        if(this.#accesses[path])throw new Error("");
        if(type === "page" || type === "all"){
            this.#accesses.page[path] = {
                fnc: async (req, res) => {return await fnc(req, res, async (path) => {return await this.#accesses.page[this.pathCorrector(path)].fnc(req, res)})},
                use: [],
            };
        }
        if(type === "method" || type === "all"){
            this.#accesses.method[path] = {
                fnc: async (req, res) => {return await fnc(req, res, async (path) => {return await this.#accesses.method[this.pathCorrector(path)].fnc(req, res)})},
                use: [],
            };
        }
    }
    /**
     * @param {Urlpath} path
     * @param {("page"|"method")} type
     * @returns
     */
    static getAccess(path, type){
        if(type !== "method" && type !== "page")throw new Error("");
        if(!this.#accesses[type][path])throw new Error("");
        return this.#accesses[type][path];
    }
    /**
     * @param {Urlpath} path
     * @param {("page"|"method")} type
     */
    static removeAccess(path, type){
        if(type !== "method" && type !== "page")throw new Error("");
        if(!this.#accesses[type][path])throw new Error("");
        for(const path of this.#accesses[type][path].use){
                this.#pages[type][path].access = ()=>{return true};
        }
        delete this.#accesses[type][path];
    }

    //  METHOD
    /**
     * @type {{}}
     */
    static #methods = {};
    /**
     * @type {{}}
     */
    static get methods(){
        return this.#methods;
    }
    /**
     * @typedef {Object} methodShort
     * @property {JSON} gson
     * @property {(data: any)void} s
     * @property {(data: any)void} e
     * @property {(data: urlPath)} r
     * @property {(info: String) {s:(data: any)void, e:(data: any)void}} msg
     */
    /**
     * @param {Urlpath} path
     * @param {(req:express.Request, res:express.Response, short:methodShort)} fnc
     */
    static addMethod(path, fnc){
        path = this.pathCorrector(path);
        if(this.#methods[path])throw new Error("");
        this.#methods[path] = {
            access: ()=>{return true},
            fnc: fnc,
            e: async (req, res) => {
                switch (await this.#methods[path].access(req, res)) {
                    case true:
                        this.#methods[path].fnc(req, res, {
                            gson: this.#gson, 
                            s: (s)=>{res.send({status:"s", data:s})}, 
                            e: (e)=>{res.send({status:"e", data:e})}, 
                            r: (r)=>{res.send({status:"r", url:r})},
                            msg: (msg) => {
                                return {
                                    s: (s)=>{res.send({status:"s", info: msg, data:s})},
                                    e: (e)=>{res.send({status:"e", info: msg, data:e})},
                                }
                            }
                        });
                        break;
                    
                    case false:
                        res.status(503).send("forbidden");
                        break;

                    case undefined:
                        break;
                }
            },
        };
        this.#app.post(path, this.#methods[path].e);
    }
    /**
     * @param {Urlpath} path
     * @returns
     */
    static getMethod(path){
        path = this.pathCorrector(path);
        if(!this.#methods[path])throw new Error("");
        return this.#methods[path];
    }
    /**
     * @param {Urlpath} path
     */
    static removeMethod(path){
        path = this.pathCorrector(path);
        if(!this.#methods[path])throw new Error("");
        delete this.#methods[path];
        for(let index = 0; index < this.#app._router.stack.length; index++){
            if(this.#app._router.stack[index].route?.methods.post === true && this.#app._router.stack[index].route?.path === path){
                this.#app._router.stack.splice(index, 1);
                break;
            }
        }
    }

    //  SOCKET
    /**
     * @type {{}}
     */
    static #socket = {}
    /**
     * @type {{}}
     */
    static get socket(){
        return this.#socket;
    }
    /**
     * @param {Socket} socket
     * @return {Socket}
     */
    static addSocket(socket){
        if(this.#socket[socket.name]) throw new Error("");
        this.#socket[socket.name] = socket;
        return socket;
    }
    /**
     * @param {String} name
     * @return {Socket}
     */
    static getSocket(name){
        if(!this.#socket[name]) throw new Error("");
        return this.#socket[name];
    }
    /**
     * @param {String} name
     */
    static removeSocket(name){
        if(!this.#socket[name]) throw new Error("");
        delete this.#socket[name];
    }

    static #src = {
        script: (() => {
            let obj = {}
                for(const script of fs.readdirSync(VieuxjsDirectories.script)){
                    if(fs.lstatSync(VieuxjsDirectories.script + "/" + script).isDirectory())continue;
                    obj[script] = fs.readFileSync(VieuxjsDirectories.script + "/" + script, "utf-8");
                }
                obj["defaultScript.js"] = (() => {
                    let result = "";
                    for(const script of fs.readdirSync(VieuxjsDirectories.script + "/default")){
                        result += fs.readFileSync(VieuxjsDirectories.script + "/default/" + script, "utf-8") + "\n\n";
                    }
                    return result;
                })();
                return obj;
        })(),
    }

    static {
        this.#server = http.createServer(this.#app);
        this.#app.use(cookieParser());
        this.#app.use(express.json());
        if(this.#assetDir !== false)this.#app.use("/assets", express.static(this.#assetDir));
        this.#app.get("/vieuxjs/defaultScript", (req, res) => {
            res.status(200).send(this.#src.script["defaultScript.js"]);
        });
        this.#app.get("/vieuxjs/js/:script", (req, res) => {
            if(this.#src.script[req.params.script])res.status(200).send(this.#src.script[req.params.script]);
            else res.status(404).send();
        });
        this.#app.get("/vieuxjs/import-body", (req, res) => {
            res.send(this.#importBody)
        });
    }

}