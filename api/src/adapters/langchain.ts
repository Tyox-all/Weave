/**
 * Weave LangChain Adapter
 * 
 * Usage with LangChain:
 * 
 * import { WeaveMundTool, WeaveHordTool, WeaveDomereTool } from '@weave_protocol/langchain';
 * 
 * const tools = [
 *   new WeaveMundTool(),
 *   new WeaveHordTool(),
 *   new WeaveDomereTool()
 * ];
 * 
 * const agent = await initializeAgentExecutorWithOptions(tools, llm, { agentType: "openai-functions" });
 */

import { MundService } from '../services/mund.js';
import { HordService } from '../services/hord.js';
import { DomereService } from '../services/domere.js';

// =============================================================================
// LangChain Tool Interface
// =============================================================================

interface LangChainTool {
  name: string;
  description: string;
  call(input: string): Promise<string>;
}

// =============================================================================
// Mund Tool
// =============================================================================

export class WeaveMundTool implements LangChainTool {
  name = 'weave_mund_scan';
  description = `Scan content for security threats including secrets, PII, injection attempts, and exfiltration patterns.
Input should be the content to scan.
Returns JSON with detected issues and risk level.`;
  
  private service = new MundService();
  
  async call(input: string): Promise<string> {
    const result = await this.service.scan(input);
    return JSON.stringify(result);
  }
}

export class WeaveMundSecretsTool implements LangChainTool {
  name = 'weave_mund_secrets';
  description = `Scan content specifically for secrets and credentials (API keys, passwords, tokens).
Input should be the content to scan.
Returns JSON with any detected secrets.`;
  
  private service = new MundService();
  
  async call(input: string): Promise<string> {
    const result = await this.service.scanSecrets(input);
    return JSON.stringify(result);
  }
}

export class WeaveMundInjectionTool implements LangChainTool {
  name = 'weave_mund_injection';
  description = `Detect prompt injection and jailbreak attempts in content.
Input should be the content to check.
Returns JSON with injection detection results.`;
  
  private service = new MundService();
  
  async call(input: string): Promise<string> {
    const result = await this.service.scanInjection(input);
    return JSON.stringify(result);
  }
}

// =============================================================================
// Hord Tool
// =============================================================================

export class WeaveHordRedactTool implements LangChainTool {
  name = 'weave_hord_redact';
  description = `Redact sensitive information (PII, secrets) from content.
Input should be the content to redact.
Returns JSON with redacted content and redaction details.`;
  
  private service = new HordService();
  
  async call(input: string): Promise<string> {
    const result = await this.service.redact(input);
    return JSON.stringify(result);
  }
}

export class WeaveHordSandboxTool implements LangChainTool {
  name = 'weave_hord_sandbox';
  description = `Execute code in a secure sandbox environment.
Input should be JSON: {"code": "...", "language": "javascript|python"}
Returns JSON with execution results.`;
  
  private service = new HordService();
  
  async call(input: string): Promise<string> {
    try {
      const { code, language } = JSON.parse(input);
      const result = await this.service.sandboxExecute(code, language || 'javascript');
      return JSON.stringify(result);
    } catch (e) {
      return JSON.stringify({ error: 'Invalid input. Expected JSON with code and language.' });
    }
  }
}

// =============================================================================
// Dōmere Tool
// =============================================================================

export class WeaveDomereDriftTool implements LangChainTool {
  name = 'weave_domere_drift';
  description = `Check if an agent's interpretation has drifted from the original intent.
Input should be JSON: {"original_intent": "...", "current_intent": "..."}
Returns JSON with drift analysis.`;
  
  private service = new DomereService();
  
  async call(input: string): Promise<string> {
    try {
      const { original_intent, current_intent, constraints } = JSON.parse(input);
      const result = await this.service.checkDrift(original_intent, current_intent, constraints);
      return JSON.stringify(result);
    } catch (e) {
      return JSON.stringify({ error: 'Invalid input. Expected JSON with original_intent and current_intent.' });
    }
  }
}

export class WeaveDomereInjectionTool implements LangChainTool {
  name = 'weave_domere_injection';
  description = `Check content for prompt injection attempts.
Input should be the content to check.
Returns JSON with injection detection results and risk score.`;
  
  private service = new DomereService();
  
  async call(input: string): Promise<string> {
    const result = await this.service.checkInjection(input);
    return JSON.stringify(result);
  }
}

// =============================================================================
// Combined Toolkit
// =============================================================================

export function getWeaveTools(): LangChainTool[] {
  return [
    new WeaveMundTool(),
    new WeaveMundSecretsTool(),
    new WeaveMundInjectionTool(),
    new WeaveHordRedactTool(),
    new WeaveHordSandboxTool(),
    new WeaveDomereDriftTool(),
    new WeaveDomereInjectionTool(),
  ];
}

// =============================================================================
// LangChain Integration Example
// =============================================================================

/*
Example usage with LangChain:

import { ChatOpenAI } from "@langchain/openai";
import { initializeAgentExecutorWithOptions } from "langchain/agents";
import { getWeaveTools } from "@weave_protocol/api/adapters/langchain";

const llm = new ChatOpenAI({ temperature: 0 });
const tools = getWeaveTools();

const agent = await initializeAgentExecutorWithOptions(tools, llm, {
  agentType: "openai-functions",
  verbose: true,
});

const result = await agent.invoke({
  input: "Check if this text contains any secrets: My API key is sk-1234567890abcdef"
});

console.log(result.output);
*/
