/**
 * Weave OpenAI/Gemini Function Calling Adapter
 * 
 * Works with:
 * - OpenAI GPT-4, GPT-3.5 (function calling)
 * - Google Gemini (function declarations)
 * - Any OpenAI-compatible API (Grok, local models, etc.)
 * 
 * Usage:
 * 
 * import { getWeaveFunctions, handleWeaveFunction } from '@weave_protocol/api/adapters/openai';
 * 
 * // Add to your OpenAI call
 * const response = await openai.chat.completions.create({
 *   model: "gpt-4",
 *   messages: [...],
 *   functions: getWeaveFunctions()
 * });
 * 
 * // Handle function call
 * if (response.choices[0].message.function_call) {
 *   const result = await handleWeaveFunction(
 *     response.choices[0].message.function_call.name,
 *     JSON.parse(response.choices[0].message.function_call.arguments)
 *   );
 * }
 */

import { MundService } from '../services/mund.js';
import { HordService } from '../services/hord.js';
import { DomereService } from '../services/domere.js';

// =============================================================================
// OpenAI Function Definitions
// =============================================================================

export function getWeaveFunctions() {
  return [
    // Mund Functions
    {
      name: 'weave_scan_content',
      description: 'Scan content for security threats including secrets, PII, injection attempts, and exfiltration patterns',
      parameters: {
        type: 'object',
        properties: {
          content: { type: 'string', description: 'Content to scan' },
          scan_types: {
            type: 'array',
            items: { type: 'string', enum: ['secrets', 'pii', 'injection', 'exfiltration', 'code'] },
            description: 'Types of scans to run (default: all)'
          }
        },
        required: ['content']
      }
    },
    {
      name: 'weave_scan_secrets',
      description: 'Scan content specifically for secrets and credentials',
      parameters: {
        type: 'object',
        properties: {
          content: { type: 'string', description: 'Content to scan for secrets' }
        },
        required: ['content']
      }
    },
    {
      name: 'weave_check_injection',
      description: 'Check content for prompt injection and jailbreak attempts',
      parameters: {
        type: 'object',
        properties: {
          content: { type: 'string', description: 'Content to check' }
        },
        required: ['content']
      }
    },
    
    // Hord Functions
    {
      name: 'weave_redact',
      description: 'Redact sensitive information (PII, secrets) from content',
      parameters: {
        type: 'object',
        properties: {
          content: { type: 'string', description: 'Content to redact' },
          types: {
            type: 'array',
            items: { type: 'string', enum: ['pii', 'secrets'] },
            description: 'Types of data to redact'
          }
        },
        required: ['content']
      }
    },
    {
      name: 'weave_sandbox_execute',
      description: 'Execute code in a secure sandbox',
      parameters: {
        type: 'object',
        properties: {
          code: { type: 'string', description: 'Code to execute' },
          language: { type: 'string', enum: ['javascript', 'python'], description: 'Programming language' },
          timeout: { type: 'number', description: 'Timeout in milliseconds (default: 5000)' }
        },
        required: ['code', 'language']
      }
    },
    
    // Dōmere Functions
    {
      name: 'weave_check_drift',
      description: 'Check if an interpretation has drifted from the original intent',
      parameters: {
        type: 'object',
        properties: {
          original_intent: { type: 'string', description: 'The original intent/request' },
          current_intent: { type: 'string', description: 'The current interpretation' },
          constraints: {
            type: 'array',
            items: { type: 'string' },
            description: 'Constraints that should not be violated'
          }
        },
        required: ['original_intent', 'current_intent']
      }
    },
    {
      name: 'weave_create_thread',
      description: 'Create a new thread to track agent actions',
      parameters: {
        type: 'object',
        properties: {
          origin_type: { type: 'string', enum: ['human', 'system', 'scheduled', 'delegated'] },
          origin_identity: { type: 'string', description: 'Identity of the origin' },
          intent: { type: 'string', description: 'The intent to track' },
          constraints: { type: 'array', items: { type: 'string' }, description: 'Constraints' }
        },
        required: ['origin_type', 'origin_identity', 'intent']
      }
    }
  ];
}

// =============================================================================
// Gemini Function Declarations (same format, different wrapper)
// =============================================================================

export function getGeminiFunctionDeclarations() {
  return {
    functionDeclarations: getWeaveFunctions().map(fn => ({
      name: fn.name,
      description: fn.description,
      parameters: fn.parameters
    }))
  };
}

// =============================================================================
// Function Handler
// =============================================================================

const mund = new MundService();
const hord = new HordService();
const domere = new DomereService();

export async function handleWeaveFunction(name: string, args: any): Promise<any> {
  switch (name) {
    // Mund
    case 'weave_scan_content':
      return mund.scan(args.content, args.scan_types);
    case 'weave_scan_secrets':
      return mund.scanSecrets(args.content);
    case 'weave_check_injection':
      return domere.checkInjection(args.content);
    
    // Hord
    case 'weave_redact':
      return hord.redact(args.content, undefined, args.types);
    case 'weave_sandbox_execute':
      return hord.sandboxExecute(args.code, args.language, { timeout: args.timeout });
    
    // Dōmere
    case 'weave_check_drift':
      return domere.checkDrift(args.original_intent, args.current_intent, args.constraints);
    case 'weave_create_thread':
      return domere.createThread(args);
    
    default:
      throw new Error(`Unknown function: ${name}`);
  }
}

// =============================================================================
// OpenAI Integration Example
// =============================================================================

/*
Example with OpenAI:

import OpenAI from 'openai';
import { getWeaveFunctions, handleWeaveFunction } from '@weave_protocol/api/adapters/openai';

const openai = new OpenAI();

async function secureChat(userMessage: string) {
  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{ role: "user", content: userMessage }],
    functions: getWeaveFunctions(),
    function_call: "auto"
  });

  const message = response.choices[0].message;
  
  if (message.function_call) {
    const result = await handleWeaveFunction(
      message.function_call.name,
      JSON.parse(message.function_call.arguments)
    );
    
    // Continue conversation with function result
    const followUp = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "user", content: userMessage },
        message,
        { role: "function", name: message.function_call.name, content: JSON.stringify(result) }
      ]
    });
    
    return followUp.choices[0].message.content;
  }
  
  return message.content;
}
*/

// =============================================================================
// Gemini Integration Example
// =============================================================================

/*
Example with Gemini:

import { GoogleGenerativeAI } from '@google/generative-ai';
import { getGeminiFunctionDeclarations, handleWeaveFunction } from '@weave_protocol/api/adapters/openai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function secureGeminiChat(userMessage: string) {
  const model = genAI.getGenerativeModel({
    model: "gemini-pro",
    tools: [getGeminiFunctionDeclarations()]
  });

  const chat = model.startChat();
  const result = await chat.sendMessage(userMessage);
  
  const response = result.response;
  const functionCall = response.functionCalls()?.[0];
  
  if (functionCall) {
    const weaveResult = await handleWeaveFunction(functionCall.name, functionCall.args);
    
    // Send function result back
    const followUp = await chat.sendMessage([{
      functionResponse: {
        name: functionCall.name,
        response: weaveResult
      }
    }]);
    
    return followUp.response.text();
  }
  
  return response.text();
}
*/
