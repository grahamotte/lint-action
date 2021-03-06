const { execSync } = require("child_process");

const RUN_OPTIONS_DEFAULTS = { dir: null, ignoreErrors: false };

/**
 * Logs to the console
 *
 * @param msg {string}: Text to log to the console
 * @param level {"info" | "warning" | "error"}: Log level
 */
function log(msg, level = "info") {
	switch (level) {
		case "error":
			console.error(msg);
			break;
		case "warning":
			console.warn(msg); // eslint-disable-line no-console
			break;
		default:
			console.log(msg); // eslint-disable-line no-console
	}
}

/**
 * Returns the value for an environment variable (or `null` if it's not defined)
 *
 * @param name {string}: Name of the environment variable
 * @returns {string}: Value of the environment variable
 */
function getEnv(name) {
	return process.env[name.toUpperCase()] || null;
}

/**
 * Returns the value for an input variable (or `null` if it's not defined). If the variable is
 * required and doesn't have a value, abort the action
 *
 * @param name {string}: Name of the input variable
 * @param required {boolean}: If set to true, the action will exit if the variable is not defined
 * @returns {string}: Value of the input variable
 */
function getInput(name, required = false) {
	const value = getEnv(`INPUT_${name}`);
	if (required && !value) {
		throw new Error(`"${name}" input variable is not defined`);
	}
	return value;
}

/**
 * Executes the provided shell command
 *
 * @param cmd {string}: Shell command to execute
 * @param options {object}: {@see RUN_OPTIONS_DEFAULTS}
 * @returns {object}: Output of the shell command
 */
function run(cmd, options = null) {
	const optionsWithDefaults = {
		...RUN_OPTIONS_DEFAULTS,
		...options,
	};

	try {
		const output = execSync(cmd, { encoding: "utf8", cwd: optionsWithDefaults.dir });
		return {
			status: 0,
			stdout: output.trim(),
			stderr: "",
		};
	} catch (err) {
		if (optionsWithDefaults.ignoreErrors) {
			return {
				status: err.status,
				stdout: err.stdout.trim(),
				stderr: err.stderr.trim(),
			};
		}
		throw err;
	}
}

module.exports = {
	log,
	getEnv,
	getInput,
	run,
};
