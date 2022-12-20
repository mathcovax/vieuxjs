import jwt from "jsonwebtoken";

/// <reference path='token.d.ts'/>

export default class Token {
    static generate(nameKey, info){
        let obj = Keys.get(nameKey);
        info = {info: info};
        return jwt.sign(info, obj.key, obj.options.generate);
    };

    static verify(token, nameKey){
        let obj = Keys.get(nameKey);
        try{
            return jwt.verify(token, obj.key, obj.options.verify).info;
        } 
        catch{
            return false;
        };
    };

    static read(token){
        try{
            return jwt.decode(token).info;
        }
        catch{
            return {};
        };
    };

    static refresh(token, nameKey){
        let info = jwt.decode(token).info;
        return this.generate(info, nameKey);
    };

    static get keys(){
        return Keys;
    };

    
};

class Keys {
    static create(name, key, options={}){
        if(typeof key !== "string")throw new Error("");
        this.#list[name] = {
            key: key,
            options: {
                generate: options.generate || {},
                verify: options.verify || {},
                cookie: options.cookie || {},
            },
        };
    };

    static get(name){
        if(!this.#list[name])throw new Error("");
        return this.#list[name];
    }

    static #list = {};
};