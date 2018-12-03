import * as prettier from 'prettier/standalone';
import parserPlugin from 'prettier/parser-html';
export const generator = (htmlObject) => {
    const unformatedString = htmlObject.html();
    const formatted = prettier.format(unformatedString, {
        printWidth: 80,
        tabWidth: 2,
        useTabs: false,
        semi: false,
        singleQuote: false,
        trailingComma: 'none',
        bracketSpacing: true,
        jsxBracketSameLine: false,
        plugins: [parserPlugin],
        parser: 'html',
    });
    return formatted;
};
//# sourceMappingURL=html-to-string.js.map