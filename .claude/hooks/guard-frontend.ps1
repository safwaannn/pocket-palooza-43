# PreToolUse guard for Write|Edit — enforces two project rules:
#   1. Never touch the backend (edit only files under doob-frontend/).
#   2. Never use the `any` type in TypeScript.
# Reads the hook payload JSON on stdin and emits a deny decision when violated.
$ErrorActionPreference = 'SilentlyContinue'
$raw = [Console]::In.ReadToEnd()
try { $j = $raw | ConvertFrom-Json } catch { exit 0 }

$p = $j.tool_input.file_path
if (-not $p) { exit 0 }
$n = $p -replace '\\', '/'

function Deny($reason) {
  $out = @{
    hookSpecificOutput = @{
      hookEventName            = 'PreToolUse'
      permissionDecision       = 'deny'
      permissionDecisionReason = $reason
    }
  } | ConvertTo-Json -Compress -Depth 5
  Write-Output $out
  exit 0
}

# Rule 1 — never touch the backend. Anything under doob-frontend/ is always allowed;
# outside it, block Java/Maven/Spring/backend/server files.
if ($n -notmatch 'doob-frontend' -and
    $n -match '(?i)(/backend/|doob-backend|/server/|/src/main/|\.java$|/pom\.xml$|/mvnw)') {
  Deny 'Project rule: never touch the backend. Edit only files under doob-frontend/.'
}

# Rule 2 — never use the `any` type in TypeScript.
if ($n -match '(?i)\.tsx?$') {
  $c = [string]$j.tool_input.content + "`n" + [string]$j.tool_input.new_string
  if ($c -match '(:\s*any\b|<any>|\bas\s+any\b|\bany\[\]|Array<any>|Promise<any>|Record<[^>]*\bany\b)') {
    Deny 'Project rule: never use the `any` type in TypeScript. Use precise types, generics, or `unknown` with narrowing.'
  }
}

exit 0
