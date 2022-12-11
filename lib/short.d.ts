import Token from "./token.js";

declare namespace Short {

    type requestType = 'page' | 'method';

    interface accesObj {
        otherAccess(path: string, type: requestType): Promise<Boolean | undefined>;
        e(data:Object):void;
        r(data:URL):void;
        json: object;
        info: string;
        t: tokenObj;
    }
    function access(req: Object, res: Object, accessesType: requestType): accesObj;

    interface methodObj {
        s(data:Object):void;
        e(data:Object):void;
        r(data:URL):void;
        json: object;
        info: string;
        t: tokenObj;
    }

    function method(req: Object, res: Object): methodObj;

    interface handlerObj {
        e(data:Object):void;
        r(data:URL):void;
        json: object;
        info: string;
        t: tokenObj;
    }
    function handler(req: Object, res: Object): handlerObj;

    interface tokenObj {
        generate(nameKey: Token.nameKey, info: object): void;
        verify(nameKey: Token.nameKey): object | false;
        read(nameKey: Token.nameKey): object;
        refresh(nameKey: Token.nameKey): void;
    }
    function token(req: Object, res: Object): tokenObj;
}

export default Short;