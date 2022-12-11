import express from "express";
import http from "http";
import cookieParser from "cookie-parser";
import { Server as Io } from "socket.io";
import ToWindow from "./toWindow.js";
import Page from "./page.js";
import { VieuxjsDirectories, VieuxjsDirectoriesFile } from "./directories.js";
import fs from "fs";
import Component from "./component.js";
import Short from "./short.js";
import Err from "./err.js";

/// <reference path='root.d.ts'/>

export default class Root{
    static init(port=this.#port, callback=()=>{}){
        this.#isInit = true;
        if(this.#importBody === "")this.makeImportBody();
        this.loadAccesses();

        if(Object.keys(this.#sockets).length !== 0){
            this.#io = new Io(this.#server);
            this.#io.use(async (socket, next) => {
                let value = await this.#sockets[socket.handshake.auth?.name]?.socketRequest(socket, this.io);
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

        if(this.#assetsDir !== false){
            let [temp] = this.#app._router.stack.splice(-1);
            this.#app.use(this.#assetsUrl, express.static(this.#assetsDir));
            this.#app._router.stack.push(temp);
        }

        this.#server.listen(port, () => {
            callback();
            this.#callback();
            this.#isReady = true;
        });
    }

    static #port = 80;

    static get port(){
        return this.port;
    }

    static set port(arg){
        if(Number.isInteger(arg) && arg > 0){
            this.#port = arg;
        }
        else{
            throw Err("badPort");
        }
    }

    static #callback = ()=>{console.log("ready");};

    static callback(fnc){
        if(typeof fnc === "function"){
            this.#callback = fnc;
        }
        else{
            throw Err("badCallback");
        }
    }

    static #app = express();

    static get app(){
        return this.#app;
    }

    static #server = {};

    static get server(){
        return this.#server;
    }

    static #session = String(Date.now());

    static get session(){
        return this.#session;
    }

    static #isReady = false;

    static get isReady(){
        return this.#isReady;
    }

    static #isInit = false;

    static get isInit(){
        return this.#isInit;
    }

    static #isIndexMake = false;

    static get isIndexMake(){
        return this.#isIndexMake;
    }

    static #json = {};

    static get json(){
        return this.#json;
    }

    static set json(arg){
        try{
            this.#json = JSON.parse(JSON.stringify(arg));
        }
        catch{
            throw Err("badJson");
        }
    }

    static #assetsDir = false;
 
    static get assetsDir(){
        return this.#assetsDir;
    }
 
    static set assetsDir(arg){
        if(fs.existsSync(arg)){
            this.#assetsDir = arg;
        }
        else{
            throw Err("badAssetDir");
        }
    }

    static #assetsUrl = "/assets";

    static get assetsUrl(){
        return this.#assetsUrl;
    }

    static set assetsUrl(arg){
        this.#assetsUrl = this.pathCorrector(arg);
    }

    static #webStore = false;

    static get webStore(){
        return this.#webStore;
    }

    static set webStore(arg){
        if(typeof arg === "boolean" && this.isInit === false){
            this.#webStore = arg;
        }
        else{
            throw Err("isNotBool");
        }
    }

    static #io = null;

    static get io(){
        return this.#io;
    }

    static #addScriptSrcToVieuxjsIndex = [];

    static get addScriptSrcToVieuxjsIndex(){
        return this.#addScriptSrcToVieuxjsIndex;
    }

    static pathCorrector(path){
        path = (path.startsWith("/")? path : "/" + path);
        path = (path.endsWith("/") && path.length > 1? path.substring(0, path.length-1) : path);
        return path;
    }

    // INDEX
    static defaultIndex = VieuxjsDirectoriesFile.mainIndex;
    static loadingOverlay = VieuxjsDirectoriesFile.loadingOverlay;
    static #index = "";
    static get index(){
        return  this.#index;
    }
    static makeIndex(){
        this.#isIndexMake = true;

        const vieuxjsIndex = ToWindow(VieuxjsDirectoriesFile.vieuxjsIndex).window;
        const mainIndex = ToWindow(this.defaultIndex).window;

        mainIndex.document.body.innerHTML = "";

        if(Object.keys(this.#sockets).length !== 0 && this.#addScriptSrcToVieuxjsIndex.indexOf("/vieuxjs/js/socket.js") === -1){
            this.#addScriptSrcToVieuxjsIndex.splice(0, 0, "/vieuxjs/js/socket.js");
            this.#addScriptSrcToVieuxjsIndex.splice(0, 0, "/socket.io/socket.io.js");
        }
        if(this.#webStore === true && this.#addScriptSrcToVieuxjsIndex.indexOf("/vieuxjs/js/store.js") === -1){
            this.#addScriptSrcToVieuxjsIndex.splice(0, 0, "/vieuxjs/js/store.js");
        }

        for(let src of this.#addScriptSrcToVieuxjsIndex){
            let script = vieuxjsIndex.document.createElement("script");
            script.src = src;
            vieuxjsIndex.document.head.append(script);
        }

        for(const tag of mainIndex.document.head.querySelectorAll("*")){
            tag.dataset.vieuxjsDefault = "";
        }
        
        for(let index = vieuxjsIndex.document.head.children.length-1; index >= 0; index--){
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

        Page.renderScss(mainIndex);
        this.#index = mainIndex.serialize().replace(/\{##session\}/g, this.#session);
        this.#index = Page.renderGson(this.#index);

        vieuxjsIndex.close();
        mainIndex.close();
    }

    // IMPORTBODY
    static #importBody = "";
    static get importBody(){
        return  this.#importBody;
    }
    static makeImportBody(){
        const importBody = ToWindow(this.defaultIndex).window;
        importBody.document.head.innerHTML = "";

        Page.renderComponents(importBody);
        for(const tag of importBody.document.querySelectorAll("[data-component]")){
            this.#components[tag.dataset.component].use["*"] = () => {this.makeImportBody()};
        }
        for(const tag of importBody.document.querySelectorAll("body *")){
            tag.dataset.vieuxjsDefault = "";
        }
        Page.renderScript(importBody);
        Page.renderScss(importBody);
        Page.renderElement(importBody);

        this.#importBody = "<!DOCTYPE html>\n" + importBody.document.body.outerHTML;
        this.#importBody = Page.renderGson(this.#importBody);
        importBody.close();
    }

    // NOTFOUND
    static #notFound = (req, res) => {res.status(404).send("<div>404 not found</div>");};
    static notFoundAction(type, arg){
        if(type === "sendPage")this.#notFound = (req, res) => {res.status(404).send(arg);};
        else if(type === "redirect")this.#notFound = (req, res) => {res.redirect(arg);};
        else throw Err("wrongTypeNotFound");
    };

    // COMPONENT
    static #components = {};
    static get components(){
        return this.#components;
    }
    static addComponent(component){
        if(this.#components[component.name])throw Err("componentAlreadyExist", component.name);
        this.#components[component.name] = component;
        return component;
    }
    static getComponent(componentName){
        if(!this.#components[componentName])throw Err("componentNotExist", componentName);
        return this.#components[componentName];
    }
    static removeComponent(componentName){
        if(!this.#components[componentName])throw Err("componentNotExist", componentName);
        let component = this.#components[componentName];
        delete this.#components[componentName];
        component.$destroy();
    }

    // PAGE
    static #pages = {};
    static get pages(){
        return this.#pages;
    }
    static addPage(path, page){
        path = this.pathCorrector(path);
        if(this.#pages[path])throw Err("pageAlreadyExist");
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
        let [temp] = this.#app._router.stack.splice(-1);
        this.#app.get(path, this.#pages[path].e);
        this.#app._router.stack.push(temp);
        return page;
    }
    static getPage(path){
        path = this.pathCorrector(path);
        if(!this.#pages[path])throw Err("pageNotExist");
        return this.#pages[path].page;
    }
    static removePage(path){
        path = this.pathCorrector(path);
        if(!this.#pages[path])throw Err("pageNotExist");
        let page = this.#pages[path].page;
        delete this.#pages[path];
        page.$destroy();
        for(let index = 0; index < this.#app._router.stack.length; index++){
            if(this.#app._router.stack[index].route?.methods.get === true && this.#app._router.stack[index].route?.path === path){
                this.#app._router.stack.splice(index, 1);
                break;
            }
        }
    }

    // ACCESS
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
    static get accesses(){
        return this.#accesses;
    }
    static addAccess(path, type="all", fnc){
        path = this.pathCorrector(path);
        if(type !== "method" && type !== "page" && type !== "all")throw Err("badTypeAccess");
        if(this.#accesses[path])throw Err("accessAlreadyExist");
        if(type === "page" || type === "all"){
            this.#accesses.page[path] = {
                fnc: async (req, res) => {return await fnc(req, res, Short.access(req, res, "page"))},
                use: [],
            };
        }
        if(type === "method" || type === "all"){
            this.#accesses.method[path] = {
                fnc: async (req, res) => {return await fnc(req, res, Short.access(req, res, "method"))},
                use: [],
            };
        }
    }
    static getAccess(path, type){
        if(type !== "method" && type !== "page")throw Err("badTypeAccess");
        if(!this.#accesses[type][path])throw Err("accessNotExist");
        return this.#accesses[type][path];
    }
    static removeAccess(path, type){
        if(type !== "method" && type !== "page")throw Err("badTypeAccess");
        if(!this.#accesses[type][path])throw Err("accessNotExist");
        if(type === "page"){
            for(const p of this.#accesses.page[path].use){
                this.#pages[p].access = ()=>{return true};
            }
        }
        else if(type === "method"){
            for(const p of this.#accesses.method[path].use){
                this.#methods[p].access = ()=>{return true};
            }
        }
        delete this.#accesses[type][path];
    }
    static loadAccesses(type){
        if(type === "page" || type === undefined)for(const index in this.#pages){
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
        if(type === "method" || type === undefined)for(const index in this.#methods){
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

    // METHOD
    static #methods = {};
    static get methods(){
        return this.#methods;
    }
    static addMethod(path, fnc){
        path = this.pathCorrector(path);
        if(this.#methods[path])throw Err("methodAlreadyExist");
        this.#methods[path] = {
            handlers: [],
            access: ()=>{return true},
            fnc: fnc,
            e: async (req, res) => {
                switch(
                    await (async () => {
                        let resultAccess = await this.#methods[path].access(req, res);
                        if(resultAccess !== true)return resultAccess;

                        for await(const fnc of this.#methods[path].handlers){
                            let resultHandler = await fnc(req, res);
                            if(resultHandler !== true)return resultHandler;
                        }

                        return true;
                    })()
                ){
                    case true:
                        this.#methods[path].fnc(req, res, Short.method(req, res));
                        break;
                    
                    case false:
                        res.status(503).send("forbidden");
                        break;

                    case undefined:
                        break;
                }
            },
        };
        let [temp] = this.#app._router.stack.splice(-1);
        this.#app.post(path, this.#methods[path].e);
        this.#app._router.stack.push(temp);
    }
    static getMethod(path){
        path = this.pathCorrector(path);
        if(!this.#methods[path])throw Err("methodNotExist");
        return this.#methods[path];
    }
    static removeMethod(path){
        path = this.pathCorrector(path);
        if(!this.#methods[path])throw Err("methodNotExist");
        delete this.#methods[path];
        for(let index = 0; index < this.#app._router.stack.length; index++){
            if(this.#app._router.stack[index].route?.methods.post === true && this.#app._router.stack[index].route?.path === path){
                this.#app._router.stack.splice(index, 1);
                break;
            }
        }
    }
    static addHandlerMethod(path, fnc){
        path = this.pathCorrector(path);
        if(!this.#methods[path])throw Err("methodNotExist");
        this.#methods[path].handlers.push(async (req, res) => {return await fnc(req, res, Short.handler(req, res))});
    }
    static removeHandlerMethod(path, number){
        path = this.pathCorrector(path);
        if(!this.#methods[path])throw Err("methodNotExist");
        if(number === undefined){
            this.#methods[path].handlers = [];
        }
        else{
            this.#methods[path].handlers.splice(number, 1);
        }
    }

    // SOCKET
    static #sockets = {}
    static get sockets(){
        return this.#sockets;
    }
    static addSocket(socket){
        if(this.#sockets[socket.name])throw Err("socketAlreadyExist");
        this.#sockets[socket.name] = socket;
        return socket;
    }
    static getSocket(name){
        if(!this.#sockets[name])throw Err("socketNotExist");
        return this.#sockets[name];
    }
    static removeSocket(name){
        if(!this.#sockets[name])throw Err("socketNotExist");
        delete this.#sockets[name];
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

    static destroy(){
        this.#server.close();
        for(const key in this.#pages){
            this.removePage(key);
        }
        for(const key in this.#methods){
            this.removeMethod(key);
        }
        for(const key in this.#accesses){
            delete this.#accesses[key];
        }
        for(const key in this.#sockets){
            delete this.#sockets[key];
        }
        for(const key in this.#components){
            delete this.#components[key];
        }
        while(this.#app._router.stack.length !== 0){
            this.#app._router.stack.splice(0, 1);
        }
        Page.destroy();
        Component.destroy();
    }

    static {
        this.#server = http.createServer(this.#app);
        this.#app.use(cookieParser());
        this.#app.use(express.json());
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
        this.#app.use((req, res) => {this.#notFound(req, res);});
    }
}