const message = {
    badJson: "",
    badPort: "",
    badCallback: "",
    badAssetDir: "",
    isNotBool: "",
    wrongTypeNotFound: "",
    componentAlreadyExist: "",
    componentNotExist: "",
    pageAlreadyExist: "",
    pageNotExist: "",
    badTypeAccess: "",
    accessAlreadyExist: "",
    accessNotExist: "",
    methodAlreadyExist: "",
    methodNotExist: "",
    socketAlreadyExist: "",
    socketNotExist: "",
};

export default function Err(name, info=""){
    return new Error(message[name] + info);
};