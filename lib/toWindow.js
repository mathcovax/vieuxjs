import { JSDOM } from "jsdom";
import fs from "fs";

/**
 * @param {Html} html 
 * @param {("html"|"path"|false)} type 
 * @return {JSDOM}
 */
export default function ToWindow(html, type=false){
    if(type === false)html = fs.existsSync(html)?fs.readFileSync(html, "utf-8"):html;
    else if(type === "html")html = html;
    else if(type === "path")html = fs.readFileSync(html, "utf-8");
    html = html.replace(/<([^ ][^> ]*)[ \n]*\s*[^>]*\/>/gm, (match, tagName) => {
        return match.replace("/>", "></" + tagName + ">");
    });
    const jsdom = new JSDOM(html, { contentType: "text/html;charset=UTF-8" });
    jsdom.window.serialize = () => {return jsdom.serialize()};
    return jsdom;
}