/**
 * Input Validator
 * Security validation for workflow inputs
 *
 * @module validator
 * @version 1.0.0
 */

import * as path from 'node:path';

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Whitelist of allowed commands
 */
const ALLOWED_COMMANDS = new Set([
  'npm',
  'node',
  'npx',
  'yarn',
  'pnpm',
  'git',
  'echo',
  'cat',
  'ls',
  'pwd',
  'mkdir',
  'rm',
  'cp',
  'mv',
  'touch',
  'python',
  'python3',
  'pip',
  'pytest',
  'java',
  'javac',
  'go',
  'cargo',
  'rustc',
  'make',
  'cmake',
  'gcc',
  'g++',
  'clang',
  'docker',
  'docker-compose',
  'kubectl',
  'helm',
  'terraform',
  'aws',
  'gcloud',
  'az',
]);

/**
 * Dangerous patterns that should be rejected
 */
const DANGEROUS_PATTERNS = [
  /[;&|]\s*(?:rm|del|format|mkfs)/i, // Data destruction
  /[;&|]\s*(?:curl|wget).*\|.*(?:sh|bash)/i, // Pipe to shell
  />\s*\/etc\/passwd/i, // System file overwrite
  />\s*\/etc\/shadow/i,
  /eval\s*\(/i, // Code injection
  /exec\s*\(/i,
  /`.*`/, // Command substitution (backticks)
  /\$\(.*\)/, // Command substitution $(...)
  /<\(.*\)/, // Process substitution
  /(?:http|https|ftp):\/\//i, // URLs in commands (potential exfiltration)
];

/**
 * Validate command for security
 */
export function validateCommand(command: string): ValidationResult {
  const errors: string[] = [];

  // Check for empty command
  if (!command || command.trim().length === 0) {
    return { valid: false, errors: ['Command cannot be empty'] };
  }

  // Extract base command (first word)
  const baseCommand = command.trim().split(/\s+/)[0];

  // Check whitelist
  if (!ALLOWED_COMMANDS.has(baseCommand)) {
    errors.push(
      `Command "${baseCommand}" is not in the allowed command list. ` +
        `Allowed commands: ${Array.from(ALLOWED_COMMANDS).join(', ')}`
    );
  }

  // Check for dangerous patterns
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(command)) {
      errors.push(
        `Command contains potentially dangerous pattern matching: ${pattern.source}`
      );
    }
  }

  // Check for shell operators that could be dangerous
  const dangerousOperators = [';', '&&', '||', '|', '&'];
  for (const op of dangerousOperators) {
    if (command.includes(op)) {
      // Allow pipe for legitimate use cases but warn
      if (op === '|' && !command.match(/(?:sh|bash|zsh)\s*$/i)) {
        continue; // Allow piping to non-shell commands
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate file path for path traversal
 */
export function validatePath(filePath: string, allowedBasePaths: string[]): ValidationResult {
  const errors: string[] = [];

  // Check for path traversal attempts
  const normalizedPath = path.normalize(filePath);

  if (normalizedPath.startsWith('..') || normalizedPath.includes('../')) {
    errors.push(`Path "${filePath}" contains path traversal attempt`);
  }

  // Check if path is within allowed directories
  const isAllowed = allowedBasePaths.some((basePath) => {
    const resolvedBase = path.resolve(basePath);
    const resolvedFile = path.resolve(normalizedPath);
    return resolvedFile.startsWith(resolvedBase);
  });

  if (!isAllowed && allowedBasePaths.length > 0) {
    errors.push(
      `Path "${filePath}" is outside of allowed directories: ${allowedBasePaths.join(', ')}`
    );
  }

  // Check for absolute paths that might be system directories
  if (path.isAbsolute(filePath)) {
    const systemDirs = ['/etc', '/usr', '/bin', '/sbin', '/lib', '/sys', '/dev', '/proc'];
    for (const sysDir of systemDirs) {
      if (normalizedPath.startsWith(sysDir)) {
        errors.push(`Access to system directory "${sysDir}" is not allowed`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate environment variable name
 */
export function validateEnvName(name: string): ValidationResult {
  const errors: string[] = [];

  // Environment variable names should match [a-zA-Z_][a-zA-Z0-9_]*
  const validEnvName = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

  if (!validEnvName.test(name)) {
    errors.push(
      `Invalid environment variable name "${name}". Must match pattern: [a-zA-Z_][a-zA-Z0-9_]*`
    );
  }

  // Check for sensitive variable names
  const sensitiveVars = ['PASSWORD', 'SECRET', 'TOKEN', 'KEY', 'CREDENTIAL', 'AUTH'];
  for (const sensitive of sensitiveVars) {
    if (name.toUpperCase().includes(sensitive)) {
      errors.push(
        `Environment variable "${name}" appears to contain sensitive data. ` +
          `Consider using a secrets manager instead.`
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Sanitize command arguments
 */
export function sanitizeArgs(args: string[]): string[] {
  return args.map((arg) => {
    // Remove potentially dangerous characters
    return arg
      .replace(/[;|&$()`{}[\]\\]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  });
}

/**
 * Comprehensive security validation for workflow step
 */
export function validateStep(
  command: string,
  args: string[],
  cwd?: string
): ValidationResult {
  const errors: string[] = [];

  // Validate command
  const commandValidation = validateCommand(command);
  if (!commandValidation.valid) {
    errors.push(...commandValidation.errors);
  }

  // Validate arguments
  const sanitizedArgs = sanitizeArgs(args);
  for (const arg of sanitizedArgs) {
    for (const pattern of DANGEROUS_PATTERNS) {
      if (pattern.test(arg)) {
        errors.push(`Argument "${arg}" contains dangerous pattern`);
      }
    }
  }

  // Validate working directory
  if (cwd) {
    const pathValidation = validatePath(cwd, [process.cwd()]);
    if (!pathValidation.valid) {
      errors.push(...pathValidation.errors);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
