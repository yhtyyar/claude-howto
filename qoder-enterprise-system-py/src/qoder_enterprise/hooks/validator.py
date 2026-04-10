"""
Security Validator
Input validation and sanitization for workflow security
"""

import os
import re
from pathlib import Path
from typing import List, Set
from pydantic import BaseModel


class ValidationResult(BaseModel):
    """Validation result"""
    valid: bool
    errors: List[str] = []


class SecurityValidator:
    """Validate workflow inputs for security"""

    # Whitelist of allowed commands
    ALLOWED_COMMANDS: Set[str] = {
        "npm", "node", "npx", "yarn", "pnpm",
        "python", "python3", "pip", "pytest", "poetry",
        "git", "docker", "docker-compose",
        "make", "cmake", "gcc", "g++", "clang",
        "go", "cargo", "rustc",
        "java", "javac",
        "kubectl", "helm", "terraform",
        "aws", "gcloud", "az",
        "echo", "cat", "ls", "pwd", "mkdir", "cp", "mv", "rm",
        "curl", "wget",
    }

    # Dangerous patterns
    DANGEROUS_PATTERNS = [
        (r";\s*rm\s+-rf", "Dangerous rm command"),
        (r"\|\s*sh", "Pipe to shell"),
        (r"\|\s*bash", "Pipe to bash"),
        (r"eval\s*\(", "Eval usage"),
        (r"exec\s*\(", "Exec usage"),
        (r">\s*/etc/", "System file overwrite"),
        (r"curl.*\|", "Curl pipe"),
        (r"wget.*\|", "Wget pipe"),
    ]

    def validate_command(self, command: str, args: List[str]) -> ValidationResult:
        """Validate command for security"""
        errors: List[str] = []

        if not command or not command.strip():
            return ValidationResult(valid=False, errors=["Command cannot be empty"])

        base_command = command.strip().split()[0]

        if base_command not in self.ALLOWED_COMMANDS:
            errors.append(
                f"Command '{base_command}' not in whitelist. "
                f"Allowed: {', '.join(sorted(self.ALLOWED_COMMANDS))}"
            )

        full_cmd = f"{command} {' '.join(args)}"
        for pattern, description in self.DANGEROUS_PATTERNS:
            if re.search(pattern, full_cmd, re.IGNORECASE):
                errors.append(f"Dangerous pattern detected: {description}")

        return ValidationResult(valid=len(errors) == 0, errors=errors)

    def validate_path(self, file_path: str, allowed_base: str) -> ValidationResult:
        """Validate file path for path traversal"""
        errors: List[str] = []

        normalized = Path(file_path).resolve()
        allowed = Path(allowed_base).resolve()

        if not str(normalized).startswith(str(allowed)):
            errors.append(f"Path traversal attempt: {file_path}")

        if ".." in file_path:
            errors.append(f"Path contains parent directory reference: {file_path}")

        return ValidationResult(valid=len(errors) == 0, errors=errors)

    def sanitize_args(self, args: List[str]) -> List[str]:
        """Sanitize command arguments"""
        dangerous = [';', '|', '&', '$', '`', '(', ')', '{', '}', '[', ']']
        return [
            ''.join(c for c in arg if c not in dangerous)
            for arg in args
        ]
