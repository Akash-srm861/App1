/**
 * Normalizes output strings for comparison according to competition rules:
 * - Convert CRLF (\r\n) to LF (\n)
 * - Trim trailing whitespace on each line
 * - Ignore trailing blank lines at the end of the output
 * - DO NOT ignore internal spaces within lines
 */
function normalizeOutput(str) {
  if (typeof str !== 'string') return '';

  // Convert CRLF to LF
  let normalized = str.replace(/\r\n/g, '\n');

  // Split into lines
  let lines = normalized.split('\n');

  // Trim trailing whitespace on each line
  lines = lines.map(line => line.replace(/\s+$/, ''));

  // Remove trailing blank lines
  while (lines.length > 0 && lines[lines.length - 1] === '') {
    lines.pop();
  }

  return lines.join('\n');
}

/**
 * Compares actual output with expected output using normalized rules.
 * Returns true if equal.
 */
function compareOutput(actual, expected) {
  const normActual = normalizeOutput(actual);
  const normExpected = normalizeOutput(expected);
  return normActual === normExpected;
}

module.exports = {
  normalizeOutput,
  compareOutput
};
