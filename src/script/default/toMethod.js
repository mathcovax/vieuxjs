class ToMethod{
    static async begin(path, body={}, option={}){
        option.el = document.querySelector(option.el) || false;
        option.tempText = option.tempText || "";
        option.scrollTo = option.scrollTo || true;
        option.header = option.header || {};
        option.loadingOverlay = option.loadingOverlay === true? 
            LoadingOverlay.timespan :  
            Number.isInteger(option.loadingOverlay)?
                option.loadingOverlay :
                false;
        
        if(option.loadingOverlay !== false){
            option.loadingOverlay = new LoadingOverlay(option.loadingOverlay);
        }
        if(option.el){
            option.el.style.color = "black";
            option.el.innerText = option.tempText;
        }

        const response = await this.#postMethod(path, body, option.header);
        if(option.loadingOverlay !== false){
            option.loadingOverlay.finish(response.status==="r");
        }

        switch(response.status){
            case "e":
                if(option.el && response.info){
                    option.el.style.color = "red";
                    option.el.innerText = response.info;
                    if(option.scrollTo === true)option.el.scrollIntoView({behavior: "smooth"});
                }
                else if(option.el){
                    option.el.innerText = "";
                }
                throw response.data;

            case "s":
                if(option.el && response.info){
                    option.el.style.color = "green";
                    option.el.innerText = response.info;
                    if(option.scrollTo === true)option.el.scrollIntoView({behavior: "smooth"});
                }
                else if(option.el){
                    option.el.innerText = "";
                }
                return response.data;

            case "r":
                tp(response.url);
                throw "redirect to " + response.url;
            
            default:
                return response;
        }
    }

    static async #postMethod(path, body={}, customHeader={}){
        try{
            const response = await fetch(
                window.location.origin + Loc.parse(path).url, 
                {
                    method: "POST",
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                        ...this.#header,
                        ...customHeader,
                    },
                    body: JSON.stringify(body),
                }
            );
            
            if(!response.ok) return {status: "e", data: response};
            else return await response.json();
        }
        catch(err){
            return {status: "e", data: err};
        }
    }

    static #header = {};
    static get header(){
        return this.#header;
    }
    static set header(arg){
        try{
            this.#header = JSON.parse(JSON.stringify(arg));
        }
        catch{
            throw new Error("");
        }
    }
}

async function tm(path, body={}, option={}){
    return await ToMethod.begin(path, body, option);
}