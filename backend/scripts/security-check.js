#!/usr/bin/env node
/**
 * Security Check Script
 * Run this to verify no sensitive data is committed to git
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';

function log(message, color = RESET) {
  console.log(`${color}${message}${RESET}`);
}

function runCommand(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf-8', shell: true });
  } catch (e) {
    return '';
  }
}

function checkGitStatus() {
  log('\n=== Checking Git Status ===', YELLOW);
  const status = runCommand('git status --porcelain');
  if (status.trim()) {
    log('Files staged or modified:', YELLOW);
    console.log(status);
  } else {
    log('No staged files - Clean working directory', GREEN);
  }
}

function checkEnvFiles() {
  log('\n=== Checking for .env files ===', YELLOW);
  const files = runCommand('git ls-files');
  const envFiles = files.split('\n').filter(f => f.match(/\.env/) && !f.includes('.env.example'));
  if (envFiles.length > 0) {
    log('WARNING: .env files are tracked by git!', RED);
    envFiles.forEach(f => console.log(`  ${f}`));
    log('Remove them immediately:', RED);
    console.log('  git rm --cached .env');
    return false;
  } else {
    log('.env files are NOT tracked (except .env.example) - Good!', GREEN);
    return true;
  }
}

function checkForSecrets() {
  log('\n=== Scanning for Hardcoded Secrets ===', YELLOW);
  
  const patterns = [
    { name: 'Razorpay Live Keys', regex: /rzp_live_[a-zA-Z0-9]+/g },
    { name: 'Private Keys', regex: /-----BEGIN (RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/g },
    { name: 'AWS Keys', regex: /AKIA[0-9A-Z]{16}/g },
    { name: 'Generic API Keys', regex: /api[_-]?key["\s]*[=:]["\s]*[a-zA-Z0-9]{20,}/gi },
    { name: 'Passwords in code', regex: /password\s*=\s*["'][^"']{6,}["']/gi },
  ];

  const extensions = ['.js', '.jsx', '.ts', '.tsx', '.json'];
  let foundIssues = false;

  try {
    const stagedFiles = runCommand('git diff --cached --name-only')
      .split('\n')
      .filter(f => extensions.some(ext => f.endsWith(ext)));

    for (const file of stagedFiles) {
      if (!file || !fs.existsSync(file)) continue;
      
      const content = fs.readFileSync(file, 'utf-8');
      
      for (const pattern of patterns) {
        const matches = content.match(pattern.regex);
        if (matches) {
          log(`Found ${pattern.name} in ${file}:`, RED);
          matches.forEach(m => console.log(`  ${m.substring(0, 50)}...`));
          foundIssues = true;
        }
      }
    }
  } catch (e) {
    // Ignore
  }

  if (!foundIssues) {
    log('No hardcoded secrets detected in staged files - Good!', GREEN);
  }
  
  return !foundIssues;
}

function checkDebugScripts() {
  log('\n=== Checking for Debug Scripts ===', YELLOW);
  
  const debugPatterns = ['debug_', 'check_', 'test_', 'fix_', 'reset_'];
  const backendRoot = path.join(__dirname, '..');
  let foundIssues = false;

  try {
    const files = fs.readdirSync(backendRoot)
      .filter(f => debugPatterns.some(p => f.startsWith(p)) && f.endsWith('.js'));

    if (files.length > 0) {
      log('Debug/test scripts found in root (move to scripts/ folder):', YELLOW);
      files.forEach(f => console.log(`  ${f}`));
      foundIssues = true;
    }
  } catch (e) {
    // Ignore
  }

  if (!foundIssues) {
    log('No debug scripts in root - Good!', GREEN);
  }
  
  return !foundIssues;
}

function main() {
  log('========================================', YELLOW);
  log('  Grocy-Mart Security Check Script', YELLOW);
  log('========================================', YELLOW);

  const results = [
    checkEnvFiles(),
    checkForSecrets(),
    checkDebugScripts()
  ];

  log('\n========================================', YELLOW);
  if (results.every(r => r)) {
    log('  ALL SECURITY CHECKS PASSED!', GREEN);
    log('========================================', GREEN);
    process.exit(0);
  } else {
    log('  SECURITY ISSUES FOUND!', RED);
    log('  Please fix the issues above before committing.', RED);
    log('========================================', RED);
    process.exit(1);
  }
}

main();
