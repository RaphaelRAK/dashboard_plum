export interface ApiCall {
  endpoint: string;
  method: string;
  timestamp: number;
  duration: number;
  success: boolean;
  error?: any;
  cacheHit?: boolean;
  source?: string;
}

class ApiAudit {
  private static calls: ApiCall[] = [];
  private static readonly MAX_CALLS = 1000;

  static logCall(call: ApiCall) {
    this.calls.unshift(call);
    if (this.calls.length > this.MAX_CALLS) {
      this.calls.pop();
    }
    
    console.group(`📡 API Call: ${call.method} ${call.endpoint}`);
    console.log(`⏱️ Durée: ${call.duration}ms`);
    console.log(`🎯 Cache: ${call.cacheHit ? 'Oui' : 'Non'}`);
    console.log(`📍 Source: ${call.source}`);
    console.log(`✅ Succès: ${call.success}`);
    if (call.error) console.error('❌ Erreur:', call.error);
    console.groupEnd();
  }

  static getCalls(): ApiCall[] {
    return this.calls;
  }

  static getCallsByEndpoint(endpoint: string): ApiCall[] {
    return this.calls.filter(call => call.endpoint === endpoint);
  }

  static clearCalls(): void {
    this.calls = [];
  }
}

export default ApiAudit; 