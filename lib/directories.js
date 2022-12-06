import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

export class VieuxjsDirectories{
    static #main = resolve(dirname(fileURLToPath(import.meta.url)) + "/../");
    static get main(){
        return this.#main;
    }

    static get lib(){
        return this.#main + "/lib";
    }

    static get bin(){
        return this.#main + "/bin";
    }

    static get src(){
        return this.#main + "/src";
    }

    static get html(){
        return this.src + "/html";
    }

    static get script(){
        return this.src + "/script";
    }

}

export class VieuxjsDirectoriesFile{
    static get vieuxjsIndex(){
        return VieuxjsDirectories.html + "/vieuxjsIndex.html";
    }

    static get loadingOverlay(){
        return VieuxjsDirectories.html + "/loadingOverlay.html";
    }

    static get mainIndex(){
        return VieuxjsDirectories.html + "/mainIndex.html";
    }

    static get notFoundPage(){
        return VieuxjsDirectories.html + "/notFound.html";
    }
}
