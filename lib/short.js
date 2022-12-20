import Root from "./root.js";
import Token from "./token.js";
import express from "express";

/// <reference path='short.d.ts'/>

export default class Short{
    static access(req, res, accessesType){
        return {
            async otherAccess(path, type=accessesType){
                return await Root.accesses[type][Root.pathCorrector(path)].fnc(req, res);
            },
            e(e){
                if(accessesType === "page");
                else if(accessesType === "method")res.send({status:"e", info: this.info, data:e});
            }, 
            r(r){
                if(accessesType === "page")res.redirect(r);
                else if(accessesType === "method")res.send({status:"r", url:r});
            },
            get json(){
                return Root.json;
            },
            info: "",
            t: Short.token(req, res),
        };
    };

    static method(req, res){
        return {
            s(s){
                res.send({status:"s", info: this.info, data:s});
            }, 
            e(e){
                res.send({status:"e", info: this.info, data:e});
            }, 
            r(r){
                res.send({status:"r", url:r});
            },
            get json(){
                return Root.json;
            },
            info: "",
            t: Short.token(req, res),
        };
    };

    static handler(req, res){
        return {
            e(e){
                res.send({status:"e", info: this.info, data:e});
            }, 
            r(r){
                res.send({status:"r", url:r});
            },
            get json(){
                return Root.json;
            },
            info: "",
            t: Short.token(req, res),
        };
    }
    /**
     * 
     * @param {express.Request} req 
     * @param {express.Response} res 
     * @returns 
     */
    static token(req, res){
        return {
            generate(nameKey, info){
                let token = Token.generate(nameKey, info);
                res.cookie(nameKey, token, Token.keys.get(nameKey).options.cookie);
                req.cookies[nameKey] = token;
            },
            verify(nameKey){
                if(!req.cookies[nameKey])return false;
                return Token.verify(req.cookies[nameKey], nameKey);
            },
            read(nameKey){
                if(!req.cookies[nameKey])return {};
                return Token.read(req.cookies[nameKey], nameKey);
            },
            refresh(nameKey){
                if(!req.cookies[nameKey])throw new Error("");
                let token = Token.refresh(req.cookies[nameKey], nameKey);
                res.cookie(nameKey, token, Token.keys.get(nameKey).options.cookie);
                req.cookies[nameKey] = token;
            },
            delete(nameKey){
                if(!req.cookies[nameKey])throw new Error("");
                res.clearCookie(nameKey);
                delete req.cookies[nameKey];
            }
        }
    }
}