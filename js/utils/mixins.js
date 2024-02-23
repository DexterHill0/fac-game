// state mixin since you cant inherit multiple classes
export const State = (Base, states) =>
    class extends Base {
        #state = {};

        constructor() {
            super();

            for (const key of Object.keys(states)) {
                Object.defineProperty(this, key, {
                    get: () => this.getState(key) ?? states[key],
                    set: (newVal) => this.setState(key, newVal),
                });
            }
        }

        setState(state, value) {
            const oldVal = this.#state[state];
            this.#state[state] = value;

            this.stateChangedCallback &&
                this.stateChangedCallback(state, oldVal, value);
        }

        getState(state) {
            return this.#state[state];
        }
    };

// export const Props = (Base, props) =>
//     class _Inner extends Base {
//         #props = {};

//         constructor() {
//             super();

//             const observed = [];

//             for (const [prop, propData] of Object.entries(props)) {
//                 if (typeof propData == "string") {
//                     Object.defineProperty(this, prop, {
//                         get: () => this.getAttribute(propData),
//                     });
//                 } else {
//                     const propName = propData.name;
//                     const parser = propData.parse ? propData.parse : (v) => v;

//                     if (propData.dynamic) observed.push(propData.name);

//                     const value = this.getAttribute(propName);

//                     this.#props[propName] = {
//                         value: (value && parser(value)) ?? propData.default,
//                         parser,
//                     };

//                     Object.defineProperty(this, prop, {
//                         get: () => this.#props[propName].value,
//                     });
//                 }
//             }

//             _Inner.observedAttributes = function () {
//                 return [...observed];
//             };
//         }

//         attributeChangedCallback(name, _oldValue, newValue) {
//             if (this.#props[name]) {
//                 this.#props[name].value = this.#props[name].parse(newValue);
//             }

//             super.attributeChangedCallback(name, _oldValue, newValue);
//         }
//     };
