import crypto from 'crypto';
import { ApiKey } from '../../shared/types';

export interface KeyValidationResult {
  isValid: boolean;
  service: string;
  error?: string;
  metadata?: Record<string, any>;
}

export class KeyManager {
  private encryptionKey: string;

  constructor() {
    // In production, this should come from environment variable
    this.encryptionKey = process.env.ENCRYPTION_KEY || 'default-encryption-key-change-in-production';
  }

  /**
   * Encrypt API key for storage
   */
  encryptKey(plainKey: string): string {
    const cipher = crypto.createCipher('aes-256-cbc', this.encryptionKey);
    let encrypted = cipher.update(plainKey, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }

  /**
   * Decrypt API key for use
   */
  decryptKey(encryptedKey: string): string {
    try {
      const decipher = crypto.createDecipher('aes-256-cbc', this.encryptionKey);
      let decrypted = decipher.update(encryptedKey, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (error) {
      throw new Error('Failed to decrypt API key');
    }
  }

  /**
   * Validate API key by making a test request
   */
  async validateApiKey(service: string, apiKey: string): Promise<KeyValidationResult> {
    try {
      switch (service.toLowerCase()) {
        case 'shodan':
          return await this.validateShodanKey(apiKey);
        case 'securitytrails':
          return await this.validateSecurityTrailsKey(apiKey);
        case 'censys':
          return await this.validateCensysKey(apiKey);
        case 'virustotal':
          return await this.validateVirusTotalKey(apiKey);
        case 'builtwith':
          return await this.validateBuiltWithKey(apiKey);
        default:
          return {
            isValid: false,
            service,
            error: `Validation not implemented for service: ${service}`
          };
      }
    } catch (error) {
      return {
        isValid: false,
        service,
        error: error.message
      };
    }
  }

  private async validateShodanKey(apiKey: string): Promise<KeyValidationResult> {
    try {
      const response = await fetch(`https://api.shodan.io/api-info?key=${apiKey}`);
      const data = await response.json();
      
      if (response.ok && data.plan) {
        return {
          isValid: true,
          service: 'shodan',
          metadata: {
            plan: data.plan,
            query_credits: data.query_credits,
            scan_credits: data.scan_credits
          }
        };
      } else {
        return {
          isValid: false,
          service: 'shodan',
          error: data.error || 'Invalid Shodan API key'
        };
      }
    } catch (error) {
      return {
        isValid: false,
        service: 'shodan',
        error: 'Failed to validate Shodan key: ' + error.message
      };
    }
  }

  private async validateSecurityTrailsKey(apiKey: string): Promise<KeyValidationResult> {
    try {
      const response = await fetch('https://api.securitytrails.com/v1/account/usage', {
        headers: {
          'APIKEY': apiKey
        }
      });
      
      const data = await response.json();
      
      if (response.ok && data.current_monthly_usage !== undefined) {
        return {
          isValid: true,
          service: 'securitytrails',
          metadata: {
            current_monthly_usage: data.current_monthly_usage,
            allowed_usage: data.allowed_usage
          }
        };
      } else {
        return {
          isValid: false,
          service: 'securitytrails',
          error: data.message || 'Invalid SecurityTrails API key'
        };
      }
    } catch (error) {
      return {
        isValid: false,
        service: 'securitytrails',
        error: 'Failed to validate SecurityTrails key: ' + error.message
      };
    }
  }

  private async validateCensysKey(apiKey: string): Promise<KeyValidationResult> {
    // Censys uses API ID + Secret, so we expect format "id:secret"
    const [apiId, apiSecret] = apiKey.split(':');
    
    if (!apiId || !apiSecret) {
      return {
        isValid: false,
        service: 'censys',
        error: 'Censys key must be in format "API_ID:API_SECRET"'
      };
    }

    try {
      const credentials = Buffer.from(`${apiId}:${apiSecret}`).toString('base64');
      const response = await fetch('https://search.censys.io/api/v2/account', {
        headers: {
          'Authorization': `Basic ${credentials}`
        }
      });
      
      const data = await response.json();
      
      if (response.ok && data.email) {
        return {
          isValid: true,
          service: 'censys',
          metadata: {
            email: data.email,
            quota: data.quota
          }
        };
      } else {
        return {
          isValid: false,
          service: 'censys',
          error: data.error || 'Invalid Censys API credentials'
        };
      }
    } catch (error) {
      return {
        isValid: false,
        service: 'censys',
        error: 'Failed to validate Censys key: ' + error.message
      };
    }
  }

  private async validateVirusTotalKey(apiKey: string): Promise<KeyValidationResult> {
    try {
      const response = await fetch(`https://www.virustotal.com/vtapi/v2/domain/report?apikey=${apiKey}&domain=google.com`);
      const data = await response.json();
      
      if (response.ok && data.response_code !== undefined) {
        return {
          isValid: true,
          service: 'virustotal',
          metadata: {
            response_code: data.response_code
          }
        };
      } else {
        return {
          isValid: false,
          service: 'virustotal',
          error: 'Invalid VirusTotal API key'
        };
      }
    } catch (error) {
      return {
        isValid: false,
        service: 'virustotal',
        error: 'Failed to validate VirusTotal key: ' + error.message
      };
    }
  }

  private async validateBuiltWithKey(apiKey: string): Promise<KeyValidationResult> {
    try {
      const response = await fetch(`https://api.builtwith.com/v20/api.json?KEY=${apiKey}&LOOKUP=google.com`);
      const data = await response.json();
      
      if (response.ok && !data.error) {
        return {
          isValid: true,
          service: 'builtwith',
          metadata: {
            domain: data.domain || 'google.com'
          }
        };
      } else {
        return {
          isValid: false,
          service: 'builtwith',
          error: data.error || 'Invalid BuiltWith API key'
        };
      }
    } catch (error) {
      return {
        isValid: false,
        service: 'builtwith',
        error: 'Failed to validate BuiltWith key: ' + error.message
      };
    }
  }

  /**
   * Store encrypted API key
   */
  async storeApiKey(userId: number, service: string, apiKey: string): Promise<ApiKey> {
    // Validate the key first
    const validation = await this.validateApiKey(service, apiKey);
    
    const encryptedKey = this.encryptKey(apiKey);
    
    // TODO: Store in database
    const apiKeyRecord: ApiKey = {
      id: `key_${Date.now()}`,
      user_id: userId,
      service,
      encrypted_key: encryptedKey,
      is_valid: validation.isValid,
      last_validated: new Date().toISOString(),
      created_at: new Date().toISOString()
    };

    console.log('Storing API key:', { service, isValid: validation.isValid });
    return apiKeyRecord;
  }

  /**
   * Get decrypted API key for use
   */
  async getApiKey(userId: number, service: string): Promise<string | null> {
    // TODO: Fetch from database
    // For now, return null (will fallback to developer keys)
    return null;
  }

  /**
   * Get all user's API keys (encrypted)
   */
  async getUserApiKeys(userId: number): Promise<ApiKey[]> {
    // TODO: Fetch from database
    return [];
  }

  /**
   * Delete API key
   */
  async deleteApiKey(userId: number, service: string): Promise<void> {
    // TODO: Delete from database
    console.log('Deleting API key:', { userId, service });
  }

  /**
   * Get fallback developer API key
   */
  getDeveloperApiKey(service: string): string | null {
    // These would be set as environment variables in production
    const devKeys: Record<string, string | null> = {
      shodan: process.env.SHODAN_API_KEY || null,
      securitytrails: process.env.SECURITYTRAILS_API_KEY || null,
      censys: process.env.CENSYS_API_KEY || null,
      virustotal: process.env.VIRUSTOTAL_API_KEY || null,
      builtwith: process.env.BUILTWITH_API_KEY || null
    };

    return devKeys[service.toLowerCase()] || null;
  }

  /**
   * Get effective API key (user key with fallback to developer key)
   */
  async getEffectiveApiKey(userId: number, service: string): Promise<{
    key: string | null;
    source: 'user' | 'developer' | 'none';
  }> {
    // Try user key first
    const userKey = await this.getApiKey(userId, service);
    if (userKey) {
      return { key: this.decryptKey(userKey), source: 'user' };
    }

    // Fallback to developer key
    const devKey = this.getDeveloperApiKey(service);
    if (devKey) {
      return { key: devKey, source: 'developer' };
    }

    return { key: null, source: 'none' };
  }

  /**
   * Check if service requires API key
   */
  requiresApiKey(service: string): boolean {
    const keyRequiredServices = [
      'shodan', 'securitytrails', 'censys', 'virustotal', 
      'builtwith', 'chaos', 'grayhatwarfare'
    ];
    
    return keyRequiredServices.includes(service.toLowerCase());
  }

  /**
   * Get supported API services
   */
  getSupportedServices(): string[] {
    return [
      'shodan',
      'securitytrails', 
      'censys',
      'virustotal',
      'builtwith',
      'chaos',
      'grayhatwarfare'
    ];
  }
}