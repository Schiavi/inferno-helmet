export const ATTRIBUTE_NAMES = {
    BODY: "bodyAttributes",
    HTML: "htmlAttributes",
    TITLE: "titleAttributes"
};

export const TAG_NAMES = {
    BASE: "base",
    BODY: "body",
    HEAD: "head",
    HTML: "html",
    LINK: "link",
    META: "meta",
    NOSCRIPT: "noscript",
    SCRIPT: "script",
    STYLE: "style",
    TITLE: "title"
};

export const VALID_TAG_NAMES = Object.keys(TAG_NAMES).map(
    name => TAG_NAMES[name]
);

export const TAG_PROPERTIES = {
    CHARSET: "charset",
    CSS_TEXT: "cssText",
    HREF: "href",
    HTTPEQUIV: "http-equiv",
    INNER_HTML: "innerHTML",
    ITEM_PROP: "itemprop",
    NAME: "name",
    PROPERTY: "property",
    REL: "rel",
    SRC: "src"
};

// No `charset` and `itemprop` in DOM, so Inferno hasn't them either.
// What about httpEquiv though?
export const INFERNO_TAG_MAP = {
    accesskey: "accessKey",
    class: "className",
    contenteditable: "contentEditable",
    contextmenu: "contextMenu",
    tabindex: "tabIndex"
};

export const HELMET_PROPS = {
    DEFAULT_TITLE: "defaultTitle",
    DEFER: "defer",
    ENCODE_SPECIAL_CHARACTERS: "encodeSpecialCharacters",
    ON_CHANGE_CLIENT_STATE: "onChangeClientState",
    TITLE_TEMPLATE: "titleTemplate"
};

export const HTML_TAG_MAP = Object.keys(INFERNO_TAG_MAP).reduce((obj, key) => {
    obj[INFERNO_TAG_MAP[key]] = key;
    return obj;
}, {});

export const VOID_TAGS = [TAG_NAMES.BASE, TAG_NAMES.LINK, TAG_NAMES.META];

export const HELMET_ATTRIBUTE = "data-inferno-helmet";
