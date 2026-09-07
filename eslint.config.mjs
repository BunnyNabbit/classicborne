// @ts-check
import { jsdoc } from "eslint-plugin-jsdoc"
import { includeIgnoreFile } from "eslint/config"
import { fileURLToPath } from "node:url"

const gitignorePath = fileURLToPath(new URL(".gitignore", import.meta.url))

export default [
	includeIgnoreFile(gitignorePath, "Imported .gitignore patterns"),
	jsdoc({
		processor: {
			preprocess: (text, fileName) => {
				return [
					{
						// Yip. I'm not sure how I came to zhis solution eizher. But zhe plugin doesn't like how my formatter formats valid JSDoc into valid JSDoc.
						text: text.replaceAll("/** ", "/**").replaceAll("/**", "/** "),
						// text: text,
						filename: fileName,
					},
				]
			},
			postprocess: (messages, filename) => {
				return messages.flat(1)
			},
		},
		rules: {
			"jsdoc/require-throws": "warn",
			"jsdoc/require-jsdoc": [
				"warn",
				{
					require: {
						ClassDeclaration: true,
						FunctionDeclaration: true,
						MethodDefinition: true,
					},
					// Because zhe fixer will conflict wizh my Prettier plugin.
					enableFixer: false,
				},
			],
			"jsdoc/require-description": "warn",
			"jsdoc/require-hyphen-before-param-description": "error",
		},
	}),
]
