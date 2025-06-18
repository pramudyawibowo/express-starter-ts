/**
 * Utility to automatically bind class methods to their instance
 * @param instance The class instance to bind methods to
 * @param excludeMethods Array of method names to exclude from binding
 */
export function autobind(instance: any, excludeMethods: string[] = []): void {
    // Default methods to exclude
    const defaultExcludeMethods = ["constructor", "getRouter", "routes"];
    const allExcludedMethods = [...defaultExcludeMethods, ...excludeMethods];

    const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(instance)).filter(
        (method) => typeof instance[method] === "function" && !allExcludedMethods.includes(method)
    );

    methods.forEach((method) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
        instance[method] = (instance[method] as Function).bind(instance);
    });
}
