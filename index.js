import Root from "./lib/root.js";
import Page from "./lib/page.js";
import Component from "./lib/component.js";
import Socket from "./lib/socket.js";

export {
    Root,
    Page,
    Component,
    Socket
}

export default class Vieuxjs{
    static get Root(){
        return Root;
    }
    static get Page(){
        return Page;
    }
    static get Component(){
        return Component;
    }
    static get Socket(){
        return Socket;
    }
}