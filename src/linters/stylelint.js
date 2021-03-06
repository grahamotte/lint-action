const commandExists = require("../../vendor/command-exists");
const { run } = require("../utils/action");

const SEVERITY_LEVELS = ["", "warning", "error"];

/**
 * https://stylelint.io
 */
class Stylelint {
	static get name() {
		return "stylelint";
	}

	/**
	 * Verifies that all required programs are installed. Exits the GitHub action if one of the
	 * programs is missing
	 *
	 * @param {string} dir: Directory to run the linting program in
	 */
	static async verifySetup(dir) {
		// Verify that NPM is installed (required to execute stylelint)
		if (!(await commandExists("npm"))) {
			throw new Error("NPM is not installed");
		}

		// Verify that stylelint is installed
		try {
			run("npx --no-install stylelint -v", { dir });
		} catch (err) {
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
		const files =
			extensions.length === 1 ? `**/*.${extensions[0]}` : `**/*.{${extensions.join(",")}}`;
		return run(
			`npx --no-install stylelint --no-color --formatter json ${fix ? "--fix" : ""} "${files}"`,
			{
				dir,
				ignoreErrors: true,
			},
		).stdout;
	}

	/**
	 * Parses the results of the linting process and returns it as a processable array
	 *
	 * @param {string} dir: Directory in which the linting program has been run
	 * @param {string} results: Results of the linting process
	 * @returns {object[]}: Parsed results
	 */
	static parseResults(dir, results) {
		const resultsJson = JSON.parse(results);

		// Parsed results: [notices, warnings, failures]
		const resultsParsed = [[], [], []];

		for (const result of resultsJson) {
			const { source, warnings } = result;
			const path = source.substring(dir.length + 1);
			for (const warning of warnings) {
				const { line, severity, text } = warning;
				const severityIdx = SEVERITY_LEVELS.indexOf(severity);
				resultsParsed[severityIdx].push({
					path,
					firstLine: line,
					lastLine: line,
					message: text,
				});
			}
		}

		return resultsParsed;
	}
}

module.exports = Stylelint;
