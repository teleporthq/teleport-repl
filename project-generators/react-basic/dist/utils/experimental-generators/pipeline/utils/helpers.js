export const cammelCaseToDashCase = (name) => {
    let ret = '';
    let prevLowercase = false;
    for (const s of name) {
        const isUppercase = s.toUpperCase() === s;
        if (isUppercase && prevLowercase) {
            ret += '-';
        }
        ret += s;
        prevLowercase = !isUppercase;
    }
    return ret.replace(/-+/g, '-').toLowerCase();
};
//# sourceMappingURL=helpers.js.map