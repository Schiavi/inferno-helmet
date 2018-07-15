import {
    Component as InfernoComponent,
    createComponentVNode, // eslint-disable-line
    normalizeProps // eslint-disable-line
} from "inferno";
import {isArray} from "inferno-shared";
import withSideEffect from "inferno-side-effect";
import deepEqual from "deep-equal";
import {
    convertVNodeToHtmlAttributes,
    handleClientStateChange,
    mapStateOnServer,
    reducePropsToState,
    warn
} from "./HelmetUtils.js";
import {TAG_NAMES, VALID_TAG_NAMES} from "./HelmetConstants.js";

const ARR = [];

const Helmet = Component =>
    class HelmetWrapper extends InfernoComponent {
        static defaultProps = {
            defer: true,
            encodeSpecialCharacters: true
        };

        // Component.peek comes from inferno-side-effect:
        // For testing, you may use a static peek() method available on the returned component.
        // It lets you get the current state without resetting the mounted instance stack.
        // Don’t use it for anything other than testing.
        static peek = Component.peek;

        static rewind = () => {
            let mappedState = Component.rewind();
            if (!mappedState) {
                // provide fallback if mappedState is undefined
                mappedState = mapStateOnServer({
                    baseTag: [],
                    bodyAttributes: {},
                    encodeSpecialCharacters: true,
                    htmlAttributes: {},
                    linkTags: [],
                    metaTags: [],
                    noscriptTags: [],
                    scriptTags: [],
                    styleTags: [],
                    title: "",
                    titleAttributes: {}
                });
            }

            return mappedState;
        };

        static set canUseDOM(canUseDOM) {
            Component.canUseDOM = canUseDOM;
        }

        shouldComponentUpdate(nextProps) {
            return !deepEqual(this.props, nextProps);
        }

        mapNestedChildrenToProps(child, nestedChildren) {
            if (!nestedChildren) {
                return null;
            }

            switch (child.type) {
                case TAG_NAMES.SCRIPT:
                case TAG_NAMES.NOSCRIPT:
                    return {
                        innerHTML: nestedChildren
                    };

                case TAG_NAMES.STYLE:
                    return {
                        cssText: nestedChildren
                    };
            }

            throw new Error(
                `<${
                    child.type
                } /> elements are self-closing and can not contain children. Refer to our API for more information.`
            );
        }

        flattenArrayTypeChildren({
            child,
            arrayTypeChildren,
            newChildProps,
            nestedChildren
        }) {
            return {
                ...arrayTypeChildren,
                [child.type]: [
                    ...(arrayTypeChildren[child.type] || []),
                    {
                        ...newChildProps,
                        ...this.mapNestedChildrenToProps(child, nestedChildren)
                    }
                ]
            };
        }

        mapObjectTypeChildren({
            child,
            newProps,
            newChildProps,
            nestedChildren
        }) {
            switch (child.type) {
                case TAG_NAMES.TITLE:
                    return {
                        ...newProps,
                        [child.type]: nestedChildren,
                        titleAttributes: {...newChildProps}
                    };

                case TAG_NAMES.BODY:
                    return {
                        ...newProps,
                        bodyAttributes: {...newChildProps}
                    };

                case TAG_NAMES.HTML:
                    return {
                        ...newProps,
                        htmlAttributes: {...newChildProps}
                    };
            }

            return {
                ...newProps,
                [child.type]: {...newChildProps}
            };
        }

        mapArrayTypeChildrenToProps(arrayTypeChildren, newProps) {
            let newFlattenedProps = {...newProps};

            Object.keys(arrayTypeChildren).forEach(arrayChildName => {
                newFlattenedProps = {
                    ...newFlattenedProps,
                    [arrayChildName]: arrayTypeChildren[arrayChildName]
                };
            });

            return newFlattenedProps;
        }

        warnOnInvalidChildren(child, nestedChildren) {
            if (process.env.NODE_ENV !== "production") {
                if (!VALID_TAG_NAMES.some(name => child.type === name)) {
                    if (typeof child.type === "function") {
                        return warn(
                            `You may be attempting to nest <Helmet> components within each other, which is not allowed. Refer to our API for more information.`
                        );
                    }

                    return warn(
                        `Only elements types ${VALID_TAG_NAMES.join(
                            ", "
                        )} are allowed. Helmet does not support rendering <${
                            child.type
                        }> elements. Refer to our API for more information.`
                    );
                }

                if (
                    nestedChildren &&
                    typeof nestedChildren !== "string" &&
                    (!Array.isArray(nestedChildren) ||
                        nestedChildren.some(
                            nestedChild => typeof nestedChild !== "string"
                        ))
                ) {
                    throw new Error(
                        `Helmet expects a string as a child of <${
                            child.type
                        }>. Did you forget to wrap your children in braces? ( <${
                            child.type
                        }>{\`\`}</${
                            child.type
                        }> ) Refer to our API for more information.`
                    );
                }
            }

            return true;
        }

        mapChildrenToProps(children, newProps) {
            let arrayTypeChildren = {};

            flatten(ARR.concat(children || ARR), []).forEach(child => {
                if (!child) {
                    return;
                }

                const nestedChildrenArr = child.children ? [] : null;

                // Text is a VNode in Inferno. Extract strings that Helmet expects.
                ARR.concat(child.children).forEach(nestedChild => {
                    if (nestedChild) {
                        nestedChildrenArr.push(nestedChild.children);
                    }
                });

                const nestedChildren =
                    nestedChildrenArr && nestedChildrenArr.length === 1
                        ? nestedChildrenArr[0]
                        : nestedChildrenArr;

                const newChildProps = convertVNodeToHtmlAttributes(child);

                this.warnOnInvalidChildren(child, nestedChildren);

                switch (child.type) {
                    case TAG_NAMES.LINK:
                    case TAG_NAMES.META:
                    case TAG_NAMES.NOSCRIPT:
                    case TAG_NAMES.SCRIPT:
                    case TAG_NAMES.STYLE:
                        arrayTypeChildren = this.flattenArrayTypeChildren({
                            child,
                            arrayTypeChildren,
                            newChildProps,
                            nestedChildren
                        });
                        break;

                    default:
                        newProps = this.mapObjectTypeChildren({
                            child,
                            newProps,
                            newChildProps,
                            nestedChildren
                        });
                        break;
                }
            });

            newProps = this.mapArrayTypeChildrenToProps(
                arrayTypeChildren,
                newProps
            );
            return newProps;
        }

        render() {
            const {children, ...props} = this.props;
            let newProps = {...props};

            if (children) {
                newProps = this.mapChildrenToProps(children, newProps);
            }

            return <Component {...newProps} />;
        }
    };

function flatten(arr, result) {
    for (let i = 0, len = arr.length; i < len; i++) {
        const value = arr[i];

        if (isArray(value)) {
            flatten(value, result);
        } else {
            result.push(value);
        }
    }

    return result;
}

const NullComponent = () => null;

const HelmetSideEffects = withSideEffect(
    reducePropsToState,
    handleClientStateChange,
    mapStateOnServer
)(NullComponent);

const HelmetExport = Helmet(HelmetSideEffects);
HelmetExport.renderStatic = HelmetExport.rewind;

export {HelmetExport as Helmet};
export default HelmetExport;
