const commandExists = require("../../vendor/command-exists");
const { run } = require("../utils/action");

const PARSE_REGEX = /^(.*):([0-9]+):[0-9]+: \w+: \((\w+)\) (.*)\.$/gm;

/**
 * https://github.com/nicklockwood/SwiftFormat
 */
class SwiftFormat {
	static get name() {
		return "SwiftFormat";
	}

	/**
	 * Verifies that all required programs are installed. Exits the GitHub action if one of the
	 * programs is missing
	 *
	 * @param {string} dir: Directory to run the linting program in
	 */
	static async verifySetup(dir) {
		// Verify that SwiftFormat is installed
		if (!(await commandExists("swiftformat"))) {
			throw new Error(`${this.name} is not installed`);
		}
	}

	/**
	 * Runs the linting program and returns the command output
	 *
	 * @param {string} dir: Directory to run the linting program in
	 * @param {string[]} extensions: Array of file extensions which should be linted
	 * @param {boolean} fix: Whether the linter should attempt to fix code style issues automatically
	 * @returns {string}: Results of the linting process
	 */
	static lint(dir, extensions, fix = false) {
		if (extensions.length !== 1 || extensions[0] !== "swift") {
			throw new Error(`${this.name} error: File extensions are not configurable`);
		}

		return run(`swiftformat ${fix ? "" : "--lint"} "."`, {
			dir,
			ignoreErrors: true,
		}).stderr;
	}

	/**
	 * Parses the results of the linting process and returns it as a processable array
	 *
	 * @param {string} dir: Directory in which the linting program has been run
	 * @param {string} results: Results of the linting process
	 * @returns {object[]}: Parsed results
	 */
	static parseResults(dir, results) {
		const matches = results.matchAll(PARSE_REGEX);

		// Parsed results: [notices, warnings, failures]
		const resultsParsed = [[], [], []];

		for (const match of matches) {
			const [_, pathFull, line, rule, message] = match;
			const path = pathFull.substring(dir.length + 1);
			const lineNr = parseInt(line, 10);
			// SwiftFormat only seems to use the "warning" level, which this action will therefore
			// categorize as errors
			resultsParsed[2].push({
				path,
				firstLine: lineNr,
				lastLine: lineNr,
				message: `${message} (${rule})`,
			});
		}

		return resultsParsed;
	}
}

module.exports = SwiftFormat;
