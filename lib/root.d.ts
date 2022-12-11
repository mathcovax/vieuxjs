import express from "express";
import http from "http";
import fs from "fs";
import { Server as Io } from "socket.io";
import Component from "./component.js"
import Page from "./page.js";
import Short from "./short.js";
import Socket from "./socket.js";

declare namespace Root {
    function init(port: number, callback: () => void): void;

    function makeIndex(): void;

    function makeImportBody(): void;

    function loadAccesses(type: "page" | "method" | undefined): void;

    var port: number;

    function callback(fnc: () => void): void;

    const app: express.Express;

    const server: http.Server;

    const session: string;

    const isReady: boolean;

    const isInit: boolean;

    const isIndexMake: boolean;

    const isImportBodyMake: boolean;

    var json: object;

    var assetsDir: fs.PathLike;

    var assetsUrl: Urlpath;

    var webStore: boolean;

    const io: Io;

    const addScriptSrcToVieuxjsIndex: Array<Urlpath>;

    var defaultIndex: string | fs.PathLike;
    
    const index: string;

    const importBody: string;

    function notFoundAction(type: "sendPage" | "redirect", arg: string): void;

    var loadingOverlay: string | fs.PathLike;

    function pathCorrector(path: Urlpath): Urlpath;

    const components: { [key: string]: Component };

    function addComponent(component: Component): Component;

    function getComponent(componentName: string): Component;
    
    function removeComponent(componentName: string): void;

    const pages: { 
        [key: Urlpath]: {
            page: Page,
            access: fncAccesses,
            e: (req: express.Request, res: express.Response) => void,
        } 
    };

    function addPage(path: Urlpath, page: Page): Page;

    function getPage(path: Urlpath): Page;

    function removePage(path: Urlpath): void;

    type fncAccesses = (req: express.Request, res: express.Response) => boolean | undefined;

    const accesses: {
        page: {
            [key: string]: {
                fnc: fncAccesses,
                use: Array<Urlpath>,
            },
        },
        method: {
            [key: string]: {
                fnc: fncAccesses,
                use: Array<Urlpath>,
            },
        }
    }

    function addAccess(path: string, type: "page" | "method" | "all", fnc: Short.accesObj): void;

    function getAccess(path: string, type: "page" | "method"): { fnc: fncAccesses, use: Array<Urlpath> };

    function removeAccess(path: string, type: "page" | "method"): void;

    const methods: { 
        [key: Urlpath]: {
            handlers: Array<fncAccesses>,
            access: fncAccesses,
            fnc: (req:express.Request, res:express.Response, short:Short.methodObj) => void,
            e: (req: express.Request, res: express.Response) => void,
        } 
    };

    function addMethod(path: Urlpath, fnc: (req:express.Request, res:express.Response, short:Short.methodObj) => void): void;

    function getMethod(path: Urlpath): {
        handlers: Array<fncAccesses>,
        access: fncAccesses,
        fnc: (req: express.Request, res: express.Response, short:Short.methodObj) => void,
        e: (req: express.Request, res: express.Response) => void,
    };

    function removeMethod(path: Urlpath): void;

    function addHandlerMethod(path: Urlpath, fnc: (req: express.Request, res: express.Response, short: Short.handlerObj) => boolean | undefined): void;

    function removeHandlerMethod(path: Urlpath, number: number): void;

    const sockets: {
        [key: string]: Socket,
    }

    function addSocket(socket: Socket): Socket;

    function getSocket(socketName: String): Socket;

    function removeSocket(socketName: String): void;

    function destroy(): void;
}

export default Root;