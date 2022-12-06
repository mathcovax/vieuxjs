import jwt from "jsonwebtoken";
import express from "express";

declare namespace Token {
    type nameKey = string;
    
    function generate(nameKey: nameKey, info: object): string;

    function verify(token: string, nameKey: nameKey): object | false;

    function read(token: string): object;

    function refresh(token: string, nameKey: nameKey): string;

    namespace keys {
        interface optionsCreateKeys{
            generate: jwt.SignOptions;
            verify: jwt.VerifyOptions;
            cookie: express.CookieOptions;
        }

        function create(name: nameKey, key: number, options: optionsCreateKeys): void;

        function get(name: nameKey): object;
    }
}

export default Token;