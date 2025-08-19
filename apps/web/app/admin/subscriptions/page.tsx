'use client';

import { useEffect, useState } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8787';

interface Organization {
  id: string;
  name: string;
  stripeCustomerId?: string;
  createdAt: string;
}

interface Plan {
  id: string;
  code: string;
  name: string;
  monthlyCreditsTokens: number;
  dailyTokenLimit: number;
  storageLimitMB: number;
  features: any;
}

interface Subscription {
  id: string;
  orgId: string;
  plan: Plan;
  active: boolean;
  stripeSubscriptionId?: string;
  stripeStatus?: string;
  cancelAtPeriodEnd: boolean;
  cancelledAt?: string;
  cancellationReason?: string;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  retentionOffersCount: number;
  createdAt: string;
}

export default function AdminSubscriptions() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [testOrgId, setTestOrgId] = useState('test-org');
  const [testUserId, setTestUserId] = useState('test-user');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      
      // In a real app, you'd have admin endpoints to list subscriptions
      // For now, we'll use the existing data and create a mock view
      const plans = await fetch(`${API_BASE}/v1/plans`);
      const plansData = await plans.json();
      
      // Mock subscription data (in production this would come from /admin/subscriptions)
      const mockSubs: Subscription[] = [
        {
          id: 'sub_1',
          orgId: 'test-org',
          plan: plansData.plans.find((p: Plan) => p.code === 'pro'),
          active: true,
          stripeSubscriptionId: 'sub_stripe_123',
          stripeStatus: 'active',
          cancelAtPeriodEnd: false,
          currentPeriodStart: new Date().toISOString(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          retentionOffersCount: 0,
          createdAt: new Date().toISOString()
        }
      ];

      const mockOrgs: Organization[] = [
        {
          id: 'test-org',
          name: 'Test Organization',
          stripeCustomerId: 'cus_test123',
          createdAt: new Date().toISOString()
        }
      ];

      setSubscriptions(mockSubs);
      setOrganizations(mockOrgs);
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function testEndpoint(endpoint: string, method: 'GET' | 'POST', body?: any) {
    try {
      const options: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
          'X-Org-Id': testOrgId,
          'X-User-Id': testUserId
        }
      };

      if (body && method === 'POST') {
        options.body = JSON.stringify(body);
      }

      const response = await fetch(`${API_BASE}${endpoint}`, options);
      const data = await response.json();
      
      alert(`${method} ${endpoint}\n\nStatus: ${response.status}\n\nResponse:\n${JSON.stringify(data, null, 2)}`);
    } catch (error) {
      alert(`Error: ${error}`);
    }
  }

  if (loading) {
    return <div style={{ padding: '20px' }}>Loading...</div>;
  }

  return (
    <main style={{ padding: '20px', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ marginBottom: '30px', color: '#333' }}>Admin - Gerenciamento de Assinaturas</h1>
      
      {/* Test Section */}
      <section style={{ marginBottom: '40px', padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
        <h2 style={{ marginBottom: '20px', color: '#666' }}>🧪 Testes de Endpoints</h2>
        
        <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'center' }}>
          <label>Org ID:</label>
          <input 
            value={testOrgId} 
            onChange={e => setTestOrgId(e.target.value)}
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
          <label>User ID:</label>
          <input 
            value={testUserId} 
            onChange={e => setTestUserId(e.target.value)}
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          <button 
            onClick={() => testEndpoint('/v1/user/subscription-detailed', 'GET')}
            style={{ padding: '10px 15px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            📋 Ver Detalhes
          </button>
          
          <button 
            onClick={() => testEndpoint('/v1/user/cancel-subscription', 'POST', { reason: 'Test cancellation', when: 'end_of_cycle' })}
            style={{ padding: '10px 15px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            🚫 Cancelar (fim do ciclo)
          </button>
          
          <button 
            onClick={() => testEndpoint('/v1/user/cancel-subscription', 'POST', { reason: 'Immediate test', when: 'now' })}
            style={{ padding: '10px 15px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            ⛔ Cancelar (agora)
          </button>
          
          <button 
            onClick={() => testEndpoint('/v1/user/reactivate-subscription', 'POST')}
            style={{ padding: '10px 15px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            ✅ Reativar
          </button>

          <button 
            onClick={() => testEndpoint('/v1/user/plan', 'GET')}
            style={{ padding: '10px 15px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            📊 Plano Atual
          </button>
        </div>
      </section>

      {/* Organizations Section */}
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ marginBottom: '20px', color: '#333' }}>🏢 Organizações</h2>
        <div style={{ overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <thead style={{ backgroundColor: '#f8f9fa' }}>
              <tr>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>ID</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Nome</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Stripe Customer</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Criado</th>
              </tr>
            </thead>
            <tbody>
              {organizations.map((org) => (
                <tr key={org.id}>
                  <td style={{ padding: '12px', borderBottom: '1px solid #dee2e6' }}>{org.id}</td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #dee2e6' }}>{org.name}</td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #dee2e6' }}>{org.stripeCustomerId || 'N/A'}</td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #dee2e6' }}>
                    {new Date(org.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Subscriptions Section */}
      <section>
        <h2 style={{ marginBottom: '20px', color: '#333' }}>💳 Assinaturas</h2>
        <div style={{ overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <thead style={{ backgroundColor: '#f8f9fa' }}>
              <tr>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Org ID</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Plano</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Status</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Stripe</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Cancelamento</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Período</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Retenção</th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.map((sub) => (
                <tr key={sub.id}>
                  <td style={{ padding: '12px', borderBottom: '1px solid #dee2e6' }}>{sub.orgId}</td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #dee2e6' }}>
                    <span style={{ fontWeight: 'bold', color: sub.plan.code === 'pro' ? '#28a745' : '#6c757d' }}>
                      {sub.plan.name}
                    </span>
                  </td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #dee2e6' }}>
                    <span style={{ 
                      padding: '4px 8px', 
                      borderRadius: '12px', 
                      fontSize: '12px', 
                      fontWeight: 'bold',
                      backgroundColor: sub.active ? '#d4edda' : '#f8d7da',
                      color: sub.active ? '#155724' : '#721c24'
                    }}>
                      {sub.active ? 'ATIVA' : 'INATIVA'}
                    </span>
                  </td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #dee2e6' }}>
                    <div style={{ fontSize: '12px' }}>
                      <div>{sub.stripeSubscriptionId || 'N/A'}</div>
                      <div style={{ color: '#666' }}>{sub.stripeStatus || 'N/A'}</div>
                    </div>
                  </td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #dee2e6' }}>
                    {sub.cancelAtPeriodEnd ? (
                      <div style={{ color: '#dc3545' }}>
                        <div>🚫 Cancelada</div>
                        <div style={{ fontSize: '11px' }}>{sub.cancellationReason}</div>
                      </div>
                    ) : (
                      <span style={{ color: '#28a745' }}>✅ Ativa</span>
                    )}
                  </td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #dee2e6' }}>
                    <div style={{ fontSize: '11px' }}>
                      <div>Início: {sub.currentPeriodStart ? new Date(sub.currentPeriodStart).toLocaleDateString() : 'N/A'}</div>
                      <div>Fim: {sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd).toLocaleDateString() : 'N/A'}</div>
                    </div>
                  </td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #dee2e6' }}>
                    <span style={{ fontSize: '12px' }}>
                      {sub.retentionOffersCount}/3 ofertas
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div style={{ marginTop: '40px', padding: '20px', backgroundColor: '#e9ecef', borderRadius: '8px' }}>
        <h3 style={{ marginBottom: '10px' }}>ℹ️ Informações</h3>
        <ul style={{ margin: 0, paddingLeft: '20px' }}>
          <li>Use os botões de teste para verificar os endpoints de assinatura</li>
          <li>Os dados exibidos são mockados para demonstração</li>
          <li>Em produção, haveria endpoints /admin/subscriptions e /admin/organizations</li>
          <li>Verifique o console da API para logs detalhados das chamadas Stripe</li>
        </ul>
      </div>
    </main>
  );
}