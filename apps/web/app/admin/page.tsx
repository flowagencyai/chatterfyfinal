'use client';

import { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useToastContext } from '../contexts/ToastContext';
import EmptyState from './EmptyState';
import styles from './admin-dashboard.module.css';
import '../globals.css';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8787';

interface DashboardData {
  overview: {
    totalUsers: number;
    totalOrgs: number;
    activeSubscriptions: number;
    newUsersThisMonth: number;
    newOrgsThisMonth: number;
    userGrowthRate: number;
    churnRate: number;
  };
  revenue: {
    activeSubscriptions: number;
    cancelledSubscriptions: number;
    estimatedMRR: number;
  };
  usage: {
    totalTokensThisMonth: number;
    totalCostThisMonth: number;
    apiCallsThisMonth: number;
    apiCallsLastMonth: number;
    callsGrowth: number;
  };
  distribution: {
    planDistribution: Array<{ planId: string; count: number }>;
    topOrgsByUsage: Array<{ orgId: string; totalTokens: number; apiCalls: number }>;
  };
  recent: {
    users: Array<{
      id: string;
      name: string;
      email: string;
      createdAt: string;
      organization: string;
      plan: string;
    }>;
    usage: Array<{
      id: string;
      orgId: string;
      orgName: string;
      totalTokens: number;
      costUsd: number;
      createdAt: string;
    }>;
  };
}

interface StripeMetrics {
  mrr: {
    current: number;
    projected_arr: number;
  };
  revenue: {
    thisMonth: number;
    lastMonth: number;
    growthRate: number;
  };
  subscriptions: {
    active: number;
    newThisMonth: number;
    cancelledThisMonth: number;
    churnRate: number;
  };
  customers: {
    total: number;
    newThisMonth: number;
  };
  health: {
    failedPayments: number;
    disputes: number;
    failureRate: number;
  };
  topCustomers: Array<{
    customerId: string;
    revenue: number;
    email: string;
    name: string;
  }>;
}

interface Organization {
  id: string;
  name: string;
  createdAt: string;
  users: Array<{
    id: string;
    name: string;
    email: string;
    createdAt: string;
  }>;
  subscriptions: Array<{
    id: string;
    active: boolean;
    plan: {
      id: string;
      code: string;
      name: string;
    };
  }>;
  _count: {
    users: number;
  };
  usage: {
    totalTokens: number;
    totalCost: number;
    apiCalls: number;
  };
}

// Plans Management Interfaces
interface Plan {
  id: string;
  code: string;
  name: string;
  monthlyCreditsTokens: number;
  dailyTokenLimit: number;
  storageLimitMB: number;
  maxFileSizeMB: number;
  features: Record<string, any>;
  createdAt: string;
  stripePriceId?: string;
  stripeProductId?: string;
  activeSubscriptions: number;
  stripeData?: {
    priceId: string;
    productId: any;
    unitAmount: number;
    currency: string;
    interval: string;
    active: boolean;
  };
}

interface PlanFormData {
  code: string;
  name: string;
  monthlyCreditsTokens: number;
  dailyTokenLimit: number;
  storageLimitMB: number;
  maxFileSizeMB: number;
  features: Record<string, boolean>;
  price: number;
  currency: string;
  interval: string;
  createInStripe: boolean;
}

export default function UnifiedAdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [stripeMetrics, setStripeMetrics] = useState<StripeMetrics | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState<'executive' | 'revenue' | 'organizations' | 'plans' | 'analytics' | 'usage' | 'alerts'>('executive');
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [showOrgModal, setShowOrgModal] = useState(false);
  
  // Usage report states
  const [usageOrg, setUsageOrg] = useState('');
  const [usageRows, setUsageRows] = useState<any[]>([]);
  const [usageFrom, setUsageFrom] = useState('');
  const [usageTo, setUsageTo] = useState('');

  // Plans management states
  const [plans, setPlans] = useState<Plan[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [syncing, setSyncing] = useState(false);

  // Custom limits management states
  const [showCustomLimitsModal, setShowCustomLimitsModal] = useState(false);
  const [editingLimitsOrg, setEditingLimitsOrg] = useState<Organization | null>(null);
  const [customLimitsData, setCustomLimitsData] = useState<any>(null);
  const [customLimitsForm, setCustomLimitsForm] = useState({
    monthlyTokens: '',
    dailyTokens: '',
    storageMB: '',
    maxFileSizeMB: '',
    reason: ''
  });

  // Alerts management states
  const [alertRules, setAlertRules] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [alertStats, setAlertStats] = useState<any>(null);
  const [showCreateAlertModal, setShowCreateAlertModal] = useState(false);
  const [showEditAlertModal, setShowEditAlertModal] = useState(false);
  const [editingAlert, setEditingAlert] = useState<any>(null);
  const [selectedAlert, setSelectedAlert] = useState<any>(null);
  const [showAlertDetailsModal, setShowAlertDetailsModal] = useState(false);
  const [alertFormData, setAlertFormData] = useState({
    name: '',
    description: '',
    alertType: 'USAGE',
    metric: 'daily_tokens',
    operator: 'gt',
    threshold: 50000,
    timeWindow: 60,
    notificationChannels: ['dashboard'],
    recipients: '',
    orgId: '',
    cooldownMinutes: 60,
    enabled: true
  });
  const [formData, setFormData] = useState<PlanFormData>({
    code: '',
    name: '',
    monthlyCreditsTokens: 1000000,
    dailyTokenLimit: 50000,
    storageLimitMB: 100,
    maxFileSizeMB: 10,
    features: {
      rag: false,
      s3: false,
      api: true,
      support: true
    },
    price: 0,
    currency: 'brl',
    interval: 'month',
    createInStripe: true
  });
  
  const { success, error } = useToastContext();

  // Check admin status and redirect if not authorized
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth');
      return;
    }
    if (status === 'authenticated') {
      checkAdminStatus();
    }
  }, [status, router]);

  // Load plans when plans tab is active
  useEffect(() => {
    if (isAdmin && activeTab === 'plans') {
      loadPlans();
    }
  }, [isAdmin, activeTab]);

  // Load alerts when alerts tab is active
  useEffect(() => {
    if (isAdmin && activeTab === 'alerts') {
      loadAlertRules();
      loadAlerts();
      loadAlertStats();
    }
  }, [isAdmin, activeTab]);

  const checkAdminStatus = async () => {
    try {
      const response = await fetch('/api/user/profile');
      if (response.ok) {
        const userData = await response.json();
        if (userData.user.role === 'ADMIN') {
          setIsAdmin(true);
          loadAllData();
          // Setup refresh interval
          setInterval(loadAllData, 5 * 60 * 1000);
        } else {
          error('Acesso negado: Apenas administradores podem acessar esta página');
          router.push('/');
        }
      } else {
        error('Erro ao verificar permissões');
        router.push('/auth');
      }
    } catch (err) {
      error('Erro ao verificar permissões de administrador');
      router.push('/auth');
    }
  };

  const loadAllData = async () => {
    try {
      setLoading(true);
      
      // Adicionar headers de autenticação admin
      const headers = {
        'x-user-email': session?.user?.email || '',
        'x-user-id': session?.user?.id || ''
      };
      
      const [dashboardResponse, stripeResponse, orgsResponse] = await Promise.all([
        fetch(`${API_BASE}/admin/dashboard`, { headers }),
        fetch(`${API_BASE}/admin/stripe-metrics`, { headers }),
        fetch(`${API_BASE}/admin/organizations?limit=50`, { headers })
      ]);

      if (dashboardResponse.ok) {
        const result = await dashboardResponse.json();
        setDashboardData(result.data);
      }

      if (stripeResponse.ok) {
        const result = await stripeResponse.json();
        setStripeMetrics(result.data);
      }

      if (orgsResponse.ok) {
        const result = await orgsResponse.json();
        setOrganizations(result.data.organizations || []);
      }

    } catch (err) {
      error('Erro ao carregar dados do dashboard');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadUsageReport = async () => {
    try {
      const params = new URLSearchParams({ 
        ...(usageOrg && { org: usageOrg }),
        ...(usageFrom && { from: usageFrom }),
        ...(usageTo && { to: usageTo })
      });
      
      const response = await fetch(`${API_BASE}/admin/usage?${params}`);
      const data = await response.json();
      setUsageRows(data.data || []);
    } catch (err) {
      error('Erro ao carregar relatório de uso');
    }
  };

  const handleDeleteOrganization = async (orgId: string) => {
    if (!confirm('Tem certeza que deseja deletar esta organização?')) return;

    try {
      const response = await fetch(`${API_BASE}/admin/organizations/${orgId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        success('Organização deletada com sucesso');
        loadAllData();
        setShowOrgModal(false);
      } else {
        error('Erro ao deletar organização');
      }
    } catch (err) {
      error('Erro ao deletar organização');
    }
  };

  // Plans Management Functions
  const loadPlans = async () => {
    try {
      const headers = {
        'x-user-email': session?.user?.email || '',
        'x-user-id': session?.user?.id || ''
      };
      
      const response = await fetch(`${API_BASE}/admin/plans`, { headers });
      
      if (response.ok) {
        const result = await response.json();
        setPlans(result.data.plans);
      } else {
        error('Erro ao carregar planos');
      }
    } catch (err) {
      error('Erro ao carregar planos');
      console.error('Plans loading error:', err);
    }
  };

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const headers = {
        'Content-Type': 'application/json',
        'x-user-email': session?.user?.email || '',
        'x-user-id': session?.user?.id || ''
      };
      
      const response = await fetch(`${API_BASE}/admin/plans`, {
        method: 'POST',
        headers,
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        success('Plano criado com sucesso!');
        setShowCreateModal(false);
        resetForm();
        loadPlans();
      } else {
        const result = await response.json();
        error(result.message || 'Erro ao criar plano');
      }
    } catch (err) {
      error('Erro ao criar plano');
      console.error('Create plan error:', err);
    }
  };

  const handleEditPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingPlan) return;
    
    try {
      const headers = {
        'Content-Type': 'application/json',
        'x-user-email': session?.user?.email || '',
        'x-user-id': session?.user?.id || ''
      };
      
      const response = await fetch(`${API_BASE}/admin/plans/${editingPlan.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          name: formData.name,
          monthlyCreditsTokens: formData.monthlyCreditsTokens,
          dailyTokenLimit: formData.dailyTokenLimit,
          storageLimitMB: formData.storageLimitMB,
          maxFileSizeMB: formData.maxFileSizeMB,
          features: formData.features,
          syncWithStripe: true
        })
      });
      
      if (response.ok) {
        success('Plano atualizado com sucesso!');
        setShowEditModal(false);
        setEditingPlan(null);
        resetForm();
        loadPlans();
      } else {
        const result = await response.json();
        error(result.message || 'Erro ao atualizar plano');
      }
    } catch (err) {
      error('Erro ao atualizar plano');
      console.error('Update plan error:', err);
    }
  };

  const handleDeletePlan = async (planId: string) => {
    if (!confirm('Tem certeza que deseja deletar este plano?')) return;
    
    try {
      const headers = {
        'x-user-email': session?.user?.email || '',
        'x-user-id': session?.user?.id || ''
      };
      
      const response = await fetch(`${API_BASE}/admin/plans/${planId}`, {
        method: 'DELETE',
        headers
      });
      
      if (response.ok) {
        success('Plano removido com sucesso!');
        loadPlans();
      } else {
        const result = await response.json();
        error(result.message || 'Erro ao deletar plano');
      }
    } catch (err) {
      error('Erro ao deletar plano');
      console.error('Delete plan error:', err);
    }
  };

  const syncWithStripe = async () => {
    setSyncing(true);
    try {
      const headers = {
        'x-user-email': session?.user?.email || '',
        'x-user-id': session?.user?.id || ''
      };
      
      const response = await fetch(`${API_BASE}/admin/plans/sync-stripe`, { headers });
      
      if (response.ok) {
        const result = await response.json();
        success(`Sincronização concluída: ${result.data.syncedPlans} planos sincronizados`);
        loadPlans();
      } else {
        error('Erro na sincronização');
      }
    } catch (err) {
      error('Erro na sincronização com Stripe');
    } finally {
      setSyncing(false);
    }
  };

  const openCreateModal = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const openEditModal = (plan: Plan) => {
    setEditingPlan(plan);
    setFormData({
      code: plan.code,
      name: plan.name,
      monthlyCreditsTokens: plan.monthlyCreditsTokens,
      dailyTokenLimit: plan.dailyTokenLimit,
      storageLimitMB: plan.storageLimitMB,
      maxFileSizeMB: plan.maxFileSizeMB,
      features: plan.features,
      price: plan.stripeData?.unitAmount || 0,
      currency: plan.stripeData?.currency || 'brl',
      interval: plan.stripeData?.interval || 'month',
      createInStripe: false
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      monthlyCreditsTokens: 1000000,
      dailyTokenLimit: 50000,
      storageLimitMB: 100,
      maxFileSizeMB: 10,
      features: {
        rag: false,
        s3: false,
        api: true,
        support: true
      },
      price: 0,
      currency: 'brl',
      interval: 'month',
      createInStripe: true
    });
  };

  // Custom Limits Management Functions
  const openCustomLimitsModal = async (org: Organization) => {
    setEditingLimitsOrg(org);
    
    try {
      const headers = {
        'x-user-email': session?.user?.email || '',
        'x-user-id': session?.user?.id || ''
      };
      
      const response = await fetch(`${API_BASE}/admin/organizations/${org.id}/custom-limits`, { headers });
      
      if (response.ok) {
        const result = await response.json();
        setCustomLimitsData(result.data);
        
        // Pre-fill form with existing custom limits
        const custom = result.data.customLimits;
        setCustomLimitsForm({
          monthlyTokens: custom.monthlyTokens?.toString() || '',
          dailyTokens: custom.dailyTokens?.toString() || '',
          storageMB: custom.storageMB?.toString() || '',
          maxFileSizeMB: custom.maxFileSizeMB?.toString() || '',
          reason: custom.reason || ''
        });
      } else {
        error('Erro ao carregar limites personalizados');
      }
    } catch (err) {
      error('Erro ao carregar limites personalizados');
      console.error('Custom limits loading error:', err);
    }
    
    setShowCustomLimitsModal(true);
  };

  const handleSaveCustomLimits = async () => {
    if (!editingLimitsOrg) return;
    
    try {
      const headers = {
        'Content-Type': 'application/json',
        'x-user-email': session?.user?.email || '',
        'x-user-id': session?.user?.id || ''
      };
      
      // Convert empty strings to null for optional limits
      const payload = {
        monthlyTokens: customLimitsForm.monthlyTokens ? parseInt(customLimitsForm.monthlyTokens) : null,
        dailyTokens: customLimitsForm.dailyTokens ? parseInt(customLimitsForm.dailyTokens) : null,
        storageMB: customLimitsForm.storageMB ? parseInt(customLimitsForm.storageMB) : null,
        maxFileSizeMB: customLimitsForm.maxFileSizeMB ? parseInt(customLimitsForm.maxFileSizeMB) : null,
        reason: customLimitsForm.reason || null
      };
      
      const response = await fetch(`${API_BASE}/admin/organizations/${editingLimitsOrg.id}/custom-limits`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(payload)
      });
      
      if (response.ok) {
        success('Limites personalizados atualizados com sucesso!');
        setShowCustomLimitsModal(false);
        setEditingLimitsOrg(null);
        loadAllData(); // Reload organization data
      } else {
        const result = await response.json();
        error(result.message || 'Erro ao atualizar limites personalizados');
      }
    } catch (err) {
      error('Erro ao atualizar limites personalizados');
      console.error('Save custom limits error:', err);
    }
  };

  const handleRemoveCustomLimits = async () => {
    if (!editingLimitsOrg || !confirm('Tem certeza que deseja remover todos os limites personalizados? A organização voltará a usar os limites do plano.')) return;
    
    try {
      const headers = {
        'x-user-email': session?.user?.email || '',
        'x-user-id': session?.user?.id || ''
      };
      
      const response = await fetch(`${API_BASE}/admin/organizations/${editingLimitsOrg.id}/custom-limits`, {
        method: 'DELETE',
        headers
      });
      
      if (response.ok) {
        success('Limites personalizados removidos! Organização voltou aos limites do plano.');
        setShowCustomLimitsModal(false);
        setEditingLimitsOrg(null);
        loadAllData(); // Reload organization data
      } else {
        const result = await response.json();
        error(result.message || 'Erro ao remover limites personalizados');
      }
    } catch (err) {
      error('Erro ao remover limites personalizados');
      console.error('Remove custom limits error:', err);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value / 100);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-BR').format(value);
  };

  // Alert Management Functions
  const loadAlertRules = async () => {
    try {
      const headers = {
        'x-user-email': session?.user?.email || '',
        'x-user-id': session?.user?.id || ''
      };
      
      const response = await fetch(`${API_BASE}/admin/alert-rules`, { headers });
      
      if (response.ok) {
        const result = await response.json();
        setAlertRules(result.data || []);
      } else {
        console.log('Alert rules response not ok:', response.status, response.statusText);
        setAlertRules([]);
      }
    } catch (err) {
      console.log('Alert rules loading error:', err);
      setAlertRules([]);
    }
  };

  const loadAlerts = async () => {
    try {
      const headers = {
        'x-user-email': session?.user?.email || '',
        'x-user-id': session?.user?.id || ''
      };
      
      const response = await fetch(`${API_BASE}/admin/alerts?limit=20`, { headers });
      
      if (response.ok) {
        const result = await response.json();
        setAlerts(result.data || []);
      } else {
        console.log('Alerts response not ok:', response.status, response.statusText);
        setAlerts([]);
      }
    } catch (err) {
      console.log('Alerts loading error:', err);
      setAlerts([]);
    }
  };

  const loadAlertStats = async () => {
    try {
      const headers = {
        'x-user-email': session?.user?.email || '',
        'x-user-id': session?.user?.id || ''
      };
      
      const response = await fetch(`${API_BASE}/admin/alerts/stats`, { headers });
      
      if (response.ok) {
        const result = await response.json();
        setAlertStats(result.data);
      } else {
        console.log('Alert stats response not ok:', response.status, response.statusText);
        // Initialize with empty stats instead of showing error
        setAlertStats({
          summary: { active: 0, total: 0, resolved: 0, acknowledged: 0 }
        });
      }
    } catch (err) {
      console.log('Alert stats loading error:', err);
      // Initialize with empty stats instead of showing error
      setAlertStats({
        summary: { active: 0, total: 0, resolved: 0, acknowledged: 0 }
      });
    }
  };

  const acknowledgeAlert = async (alertId: string) => {
    try {
      const headers = {
        'Content-Type': 'application/json',
        'x-user-email': session?.user?.email || '',
        'x-user-id': session?.user?.id || ''
      };
      
      const response = await fetch(`${API_BASE}/admin/alerts/${alertId}/acknowledge`, {
        method: 'PUT',
        headers
      });
      
      if (response.ok) {
        success('Alerta reconhecido com sucesso!');
        loadAlerts();
        loadAlertStats();
      } else {
        const result = await response.json();
        error(result.message || 'Erro ao reconhecer alerta');
      }
    } catch (err) {
      error('Erro ao reconhecer alerta');
      console.error('Acknowledge alert error:', err);
    }
  };

  const testAlertRule = async (ruleId: string) => {
    try {
      const headers = {
        'Content-Type': 'application/json',
        'x-user-email': session?.user?.email || '',
        'x-user-id': session?.user?.id || ''
      };
      
      const response = await fetch(`${API_BASE}/admin/alert-rules/${ruleId}/test`, {
        method: 'POST',
        headers
      });
      
      if (response.ok) {
        const result = await response.json();
        success('Alerta de teste criado com sucesso! Verifique a lista de alertas.');
        loadAlerts();
      } else {
        const result = await response.json();
        error(result.message || 'Erro ao testar regra de alerta');
      }
    } catch (err) {
      error('Erro ao testar regra de alerta');
      console.error('Test alert rule error:', err);
    }
  };

  const handleCreateAlertRule = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const headers = {
        'Content-Type': 'application/json',
        'x-user-email': session?.user?.email || '',
        'x-user-id': session?.user?.id || ''
      };
      
      const response = await fetch(`${API_BASE}/admin/alert-rules`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          ...alertFormData,
          notificationChannels: JSON.stringify(alertFormData.notificationChannels),
          recipients: alertFormData.recipients ? JSON.stringify(alertFormData.recipients.split(',').map(s => s.trim())) : null,
          orgId: alertFormData.orgId || null
        })
      });
      
      if (response.ok) {
        success('Regra de alerta criada com sucesso!');
        setShowCreateAlertModal(false);
        resetAlertForm();
        loadAlertRules();
      } else {
        const result = await response.json();
        error(result.message || 'Erro ao criar regra de alerta');
      }
    } catch (err) {
      error('Erro ao criar regra de alerta');
      console.error('Create alert rule error:', err);
    }
  };

  const handleEditAlertRule = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingAlert) return;
    
    try {
      const headers = {
        'Content-Type': 'application/json',
        'x-user-email': session?.user?.email || '',
        'x-user-id': session?.user?.id || ''
      };
      
      const response = await fetch(`${API_BASE}/admin/alert-rules/${editingAlert.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          ...alertFormData,
          notificationChannels: JSON.stringify(alertFormData.notificationChannels),
          recipients: alertFormData.recipients ? JSON.stringify(alertFormData.recipients.split(',').map(s => s.trim())) : null,
          orgId: alertFormData.orgId || null
        })
      });
      
      if (response.ok) {
        success('Regra de alerta atualizada com sucesso!');
        setShowEditAlertModal(false);
        setEditingAlert(null);
        resetAlertForm();
        loadAlertRules();
      } else {
        const result = await response.json();
        error(result.message || 'Erro ao atualizar regra de alerta');
      }
    } catch (err) {
      error('Erro ao atualizar regra de alerta');
      console.error('Update alert rule error:', err);
    }
  };

  const resetAlertForm = () => {
    setAlertFormData({
      name: '',
      description: '',
      alertType: 'USAGE',
      metric: 'daily_tokens',
      operator: 'gt',
      threshold: 50000,
      timeWindow: 60,
      notificationChannels: ['dashboard'],
      recipients: '',
      orgId: '',
      cooldownMinutes: 60,
      enabled: true
    });
  };

  const handleDeleteAlertRule = async (ruleId: string, ruleName: string) => {
    // Use a more elegant confirmation dialog
    const confirmDelete = window.confirm(
      `⚠️ ATENÇÃO!\n\nDeseja realmente deletar a regra de alerta "${ruleName}"?\n\n🔴 Esta ação não pode ser desfeita!\n🔴 Todos os alertas relacionados também serão removidos.\n\nTem certeza que deseja continuar?`
    );
    
    if (!confirmDelete) return;

    try {
      const headers = {
        'x-user-email': session?.user?.email || '',
        'x-user-id': session?.user?.id || ''
      };
      
      const response = await fetch(`${API_BASE}/admin/alert-rules/${ruleId}`, {
        method: 'DELETE',
        headers
      });
      
      if (response.ok) {
        success('✅ Regra de alerta deletada com sucesso!');
        loadAlertRules();
        loadAlerts(); // Reload alerts in case some were affected
      } else {
        const result = await response.json();
        error(result.message || 'Erro ao deletar regra de alerta');
      }
    } catch (err) {
      error('Erro ao deletar regra de alerta');
      console.error('Delete alert rule error:', err);
    }
  };

  const getGrowthIcon = (rate: number) => {
    if (rate > 0) return '📈';
    if (rate < 0) return '📉';
    return '➡️';
  };

  const getGrowthColor = (rate: number) => {
    if (rate > 0) return '#22c55e';
    if (rate < 0) return '#ef4444';
    return '#6b7280';
  };

  // Show loading while checking authentication
  if (status === 'loading') {
    return (
      <div className={styles.adminApp}>
        <div className={styles.loadingContainer}>
          <div className="loading-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
          <p>Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  // Redirect if not authenticated  
  if (status === 'unauthenticated') {
    return null;
  }

  // Show admin loading
  if (loading) {
    return (
      <div className={styles.adminApp}>
        <div className={styles.loadingContainer}>
          <div className="loading-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
          <p>Carregando dashboard administrativo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.adminApp}>
        {/* Header Executivo */}
        <div className={styles.header}>
          <div>
            <h1>🏢 Chatterfy - Dashboard Proprietário</h1>
            <p>Comando central executivo completo</p>
          </div>
          <div className={styles.headerActions}>
            <button onClick={loadAllData} className={styles.refreshButton}>
              🔄 Atualizar Dados
            </button>
            <div className={styles.lastUpdate}>
              Última atualização: {dashboardData ? new Date().toLocaleString('pt-BR') : 'N/A'}
            </div>
            
            {/* User Profile */}
            {session?.user && (
              <div className={styles.headerProfile}>
                <div className={styles.profileAvatar}>
                  {session.user.name?.[0] || session.user.email?.[0] || 'A'}
                </div>
                <div className={styles.profileInfo}>
                  <div className={styles.profileName}>
                    {session.user.name || session.user.email?.split('@')[0]}
                  </div>
                  <div className={styles.profileRole}>Administrador</div>
                </div>
              </div>
            )}
            
            <button 
              onClick={() => signOut({ callbackUrl: '/' })} 
              className={styles.logoutButton}
            >
              🚪 Sair
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className={styles.tabs}>
          {[
            { id: 'executive', label: '📊 Executivo', icon: '📊' },
            { id: 'revenue', label: '💰 Receita & Stripe', icon: '💰' },
            { id: 'organizations', label: '🏢 Organizações', icon: '🏢' },
            { id: 'plans', label: '🏗️ Planos', icon: '🏗️' },
            { id: 'alerts', label: '🚨 Alertas', icon: '🚨' },
            { id: 'analytics', label: '📈 Analytics', icon: '📈' },
            { id: 'usage', label: '📋 Relatórios', icon: '📋' }
          ].map(tab => (
            <button
              key={tab.id}
              className={`${styles.tab} ${activeTab === tab.id ? styles.active : ''}`}
              onClick={() => setActiveTab(tab.id as any)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className={styles.content}>
          {/* Executive Overview */}
          {activeTab === 'executive' && (
            <div className={styles.executive}>
              {/* Check if we have any data */}
              {(!dashboardData || 
                (dashboardData.overview.totalUsers === 0 && 
                 dashboardData.overview.totalOrgs === 0 && 
                 dashboardData.usage.totalTokensThisMonth === 0)) ? (
                <EmptyState 
                  icon="🚀"
                  title="Bem-vindo ao Chatterfy!"
                  description="Seu dashboard está pronto e aguardando os primeiros dados. Assim que usuários começarem a usar a plataforma, você verá métricas detalhadas aqui."
                  suggestion="Convide usuários para testar a plataforma e veja as métricas ganharem vida!"
                />
              ) : (
                <>
              {/* KPI Cards Row */}
              <div className={styles.kpiGrid}>
                <div className={styles.kpiCard}>
                  <div className={styles.kpiHeader}>
                    <h3>👥 Usuários Totais</h3>
                    <span className={styles.kpiValue}>{formatNumber(dashboardData?.overview.totalUsers || 0)}</span>
                  </div>
                  <div className={styles.kpiFooter}>
                    <span style={{ color: getGrowthColor(dashboardData?.overview.userGrowthRate || 0) }}>
                      {getGrowthIcon(dashboardData?.overview.userGrowthRate || 0)} 
                      {Math.abs(dashboardData?.overview.userGrowthRate || 0).toFixed(1)}% este mês
                    </span>
                  </div>
                </div>

                <div className={styles.kpiCard}>
                  <div className={styles.kpiHeader}>
                    <h3>💰 MRR Real</h3>
                    <span className={styles.kpiValue}>{formatCurrency(stripeMetrics?.mrr.current || 0)}</span>
                  </div>
                  <div className={styles.kpiFooter}>
                    <span>ARR: {formatCurrency((stripeMetrics?.mrr.projected_arr || 0))}</span>
                  </div>
                </div>

                <div className={styles.kpiCard}>
                  <div className={styles.kpiHeader}>
                    <h3>🏢 Organizações</h3>
                    <span className={styles.kpiValue}>{formatNumber(dashboardData?.overview.totalOrgs || 0)}</span>
                  </div>
                  <div className={styles.kpiFooter}>
                    <span>+{dashboardData?.overview.newOrgsThisMonth || 0} este mês</span>
                  </div>
                </div>

                <div className={styles.kpiCard}>
                  <div className={styles.kpiHeader}>
                    <h3>📉 Churn Rate</h3>
                    <span className={styles.kpiValue} style={{ color: '#ef4444' }}>
                      {(stripeMetrics?.subscriptions.churnRate || dashboardData?.overview.churnRate || 0).toFixed(1)}%
                    </span>
                  </div>
                  <div className={styles.kpiFooter}>
                    <span>{stripeMetrics?.subscriptions.cancelledThisMonth || 0} cancelamentos</span>
                  </div>
                </div>
              </div>

              {/* Quick Stats Grid */}
              <div className={styles.quickStats}>
                <div className={styles.statSection}>
                  <h3>🔥 Uso da API (30 dias)</h3>
                  <div className={styles.statGrid}>
                    <div className={styles.statCard}>
                      <div className={styles.statValue}>{formatNumber(dashboardData?.usage.totalTokensThisMonth || 0)}</div>
                      <div className={styles.statLabel}>Tokens Consumidos</div>
                    </div>
                    <div className={styles.statCard}>
                      <div className={styles.statValue}>{formatNumber(dashboardData?.usage.apiCallsThisMonth || 0)}</div>
                      <div className={styles.statLabel}>Chamadas API</div>
                    </div>
                    <div className={styles.statCard}>
                      <div className={styles.statValue}>${(dashboardData?.usage.totalCostThisMonth || 0).toFixed(2)}</div>
                      <div className={styles.statLabel}>Custo Total</div>
                    </div>
                  </div>
                </div>

                <div className={styles.statSection}>
                  <h3>💳 Saúde Financeira</h3>
                  <div className={styles.healthIndicators}>
                    <div className={styles.healthItem}>
                      <span className={styles.healthLabel}>Taxa de Falha de Pagamentos:</span>
                      <span className={`${styles.healthValue} ${(stripeMetrics?.health.failureRate || 0) > 5 ? styles.bad : styles.good}`}>
                        {(stripeMetrics?.health.failureRate || 0).toFixed(1)}%
                      </span>
                    </div>
                    <div className={styles.healthItem}>
                      <span className={styles.healthLabel}>Disputas/Chargebacks:</span>
                      <span className={styles.healthValue}>{stripeMetrics?.health.disputes || 0}</span>
                    </div>
                    <div className={styles.healthItem}>
                      <span className={styles.healthLabel}>Crescimento Receita:</span>
                      <span style={{ color: getGrowthColor(stripeMetrics?.revenue.growthRate || 0) }}>
                        {getGrowthIcon(stripeMetrics?.revenue.growthRate || 0)} 
                        {Math.abs(stripeMetrics?.revenue.growthRate || 0).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
                </>
              )}
            </div>
          )}

          {/* Revenue & Stripe */}
          {activeTab === 'revenue' && (
            <div className={styles.revenue}>
              {!stripeMetrics || (stripeMetrics.mrr.current === 0 && stripeMetrics.topCustomers.length === 0) ? (
                <EmptyState 
                  icon="💰"
                  title="Receita em Desenvolvimento"
                  description="As métricas de receita aparecerão aqui quando as primeiras assinaturas forem ativadas no Stripe. O sistema já está integrado e pronto!"
                  suggestion="Configure seus produtos no Stripe e faça as primeiras vendas para ver os dados financeiros."
                />
              ) : (
                <>
              <div className={styles.section}>
                <h2>💰 Métricas de Receita Stripe</h2>
                <div className={styles.kpiGrid}>
                  <div className={styles.kpiCard}>
                    <div className={styles.kpiHeader}>
                      <h3>💰 MRR Atual</h3>
                      <span className={styles.kpiValue}>{formatCurrency(stripeMetrics.mrr.current)}</span>
                    </div>
                    <div className={styles.kpiFooter}>
                      <span>ARR Projetado: {formatCurrency(stripeMetrics.mrr.projected_arr)}</span>
                    </div>
                  </div>

                  <div className={styles.kpiCard}>
                    <div className={styles.kpiHeader}>
                      <h3>📊 Receita Este Mês</h3>
                      <span className={styles.kpiValue}>{formatCurrency(stripeMetrics.revenue.thisMonth)}</span>
                    </div>
                    <div className={styles.kpiFooter}>
                      <span style={{ color: getGrowthColor(stripeMetrics.revenue.growthRate) }}>
                        {getGrowthIcon(stripeMetrics.revenue.growthRate)} 
                        {Math.abs(stripeMetrics.revenue.growthRate).toFixed(1)}% vs mês anterior
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.section}>
                <h2>🏆 Top Clientes por Receita</h2>
                <div className={styles.table}>
                  <table>
                    <thead>
                      <tr>
                        <th>Ranking</th>
                        <th>Cliente</th>
                        <th>Email</th>
                        <th>Receita (30 dias)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stripeMetrics.topCustomers.map((customer, index) => (
                        <tr key={customer.customerId}>
                          <td><span className={styles.rank}>#{index + 1}</span></td>
                          <td>{customer.name || 'N/A'}</td>
                          <td>{customer.email}</td>
                          <td className={styles.revenue}>{formatCurrency(customer.revenue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
                </>
              )}
            </div>
          )}

          {/* Organizations Management */}
          {activeTab === 'organizations' && (
            <div className={styles.organizations}>
              <div className={styles.section}>
                <h2>🏢 Todas as Organizações</h2>
                <div className={styles.table}>
                  <table>
                    <thead>
                      <tr>
                        <th>Organização</th>
                        <th>Plano</th>
                        <th>Usuários</th>
                        <th>Uso (30 dias)</th>
                        <th>Custo</th>
                        <th>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {organizations.map((org) => (
                        <tr key={org.id}>
                          <td>
                            <div className={styles.orgInfo}>
                              <strong>{org.name}</strong>
                              <small>{org.id}</small>
                            </div>
                          </td>
                          <td>
                            {org.subscriptions && org.subscriptions[0] ? (
                              <span className={`${styles.planBadge} ${styles[org.subscriptions[0].plan.code.toLowerCase()]}`}>
                                {org.subscriptions[0].plan.name}
                              </span>
                            ) : (
                              <span className={`${styles.planBadge} ${styles.free}`}>FREE</span>
                            )}
                          </td>
                          <td>
                            <span className={styles.userCount}>{org._count.users}</span>
                          </td>
                          <td>
                            <div className={styles.usageInfo}>
                              <div>{formatNumber(org.usage.totalTokens)} tokens</div>
                              <small>{formatNumber(org.usage.apiCalls)} chamadas</small>
                            </div>
                          </td>
                          <td>
                            <span className={styles.cost}>{formatCurrency(org.usage.totalCost)}</span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button
                                onClick={() => {
                                  setSelectedOrg(org);
                                  setShowOrgModal(true);
                                }}
                                className={styles.viewButton}
                              >
                                👁️ Ver
                              </button>
                              <button
                                onClick={() => openCustomLimitsModal(org)}
                                className={styles.editButton}
                                style={{ fontSize: '12px', padding: '6px 10px' }}
                                title="Gerenciar limites personalizados"
                              >
                                ⚙️ Limites
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Plans Management */}
          {activeTab === 'plans' && (
            <div className={styles.plans}>
              <div className={styles.section}>
                <div className={styles.header} style={{ position: 'relative', top: 'auto', padding: '0 0 24px 0', border: 'none', boxShadow: 'none' }}>
                  <div className={styles.headerContent}>
                    <div>
                      <h2>🏗️ Gestão de Planos</h2>
                      <p>Gerencie os planos de assinatura, preços e recursos disponíveis</p>
                    </div>
                    <div className={styles.headerActions}>
                      <button 
                        onClick={syncWithStripe} 
                        disabled={syncing}
                        className={`${styles.syncButton} ${syncing ? styles.syncing : ''}`}
                      >
                        {syncing ? '🔄 Sincronizando...' : '🔄 Sync Stripe'}
                      </button>
                      <button 
                        onClick={openCreateModal}
                        className={styles.primaryButton}
                      >
                        ➕ Novo Plano
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className={styles.plansGrid}>
                  {plans.map((plan) => (
                    <div key={plan.id} className={styles.planCard}>
                      <div className={styles.planHeader}>
                        <h3>{plan.name}</h3>
                        <span className={`${styles.planCode} ${styles[plan.code.toLowerCase()]}`}>
                          {plan.code}
                        </span>
                      </div>
                      
                      <div className={styles.planMetrics}>
                        <div className={styles.metric}>
                          <span className={styles.metricLabel}>Tokens/mês</span>
                          <span className={styles.metricValue}>
                            {formatNumber(plan.monthlyCreditsTokens)}
                          </span>
                        </div>
                        <div className={styles.metric}>
                          <span className={styles.metricLabel}>Limite diário</span>
                          <span className={styles.metricValue}>
                            {formatNumber(plan.dailyTokenLimit)}
                          </span>
                        </div>
                        <div className={styles.metric}>
                          <span className={styles.metricLabel}>Storage</span>
                          <span className={styles.metricValue}>
                            {plan.storageLimitMB} MB
                          </span>
                        </div>
                        <div className={styles.metric}>
                          <span className={styles.metricLabel}>Max arquivo</span>
                          <span className={styles.metricValue}>
                            {plan.maxFileSizeMB} MB
                          </span>
                        </div>
                      </div>

                      <div className={styles.planFeatures}>
                        {Object.entries(plan.features).map(([feature, enabled]) => (
                          <span key={feature} className={`${styles.feature} ${enabled ? styles.enabled : styles.disabled}`}>
                            {enabled ? '✅' : '❌'} {feature.toUpperCase()}
                          </span>
                        ))}
                      </div>

                      <div className={styles.planStripe}>
                        {plan.stripeData ? (
                          <div className={styles.stripeInfo}>
                            <span className={styles.price}>
                              {formatCurrency(plan.stripeData.unitAmount)}
                            </span>
                            <span className={styles.interval}>
                              /{plan.stripeData.interval}
                            </span>
                            <span className={`${styles.stripeStatus} ${plan.stripeData.active ? styles.active : styles.inactive}`}>
                              {plan.stripeData.active ? '🟢 Ativo' : '🔴 Inativo'}
                            </span>
                          </div>
                        ) : (
                          <span className={styles.noStripe}>⚪ Sem Stripe</span>
                        )}
                      </div>

                      <div className={styles.planStats}>
                        <span className={styles.subscriptions}>
                          👥 {plan.activeSubscriptions} assinaturas ativas
                        </span>
                      </div>

                      <div className={styles.planActions}>
                        <button 
                          onClick={() => openEditModal(plan)}
                          className={styles.editButton}
                        >
                          ✏️ Editar
                        </button>
                        <button 
                          onClick={() => handleDeletePlan(plan.id)}
                          className={styles.deleteButton}
                          disabled={plan.activeSubscriptions > 0}
                        >
                          🗑️ Remover
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Analytics */}
          {activeTab === 'analytics' && (
            <div className={styles.analytics}>
              <div className={styles.section}>
                <h2>🔥 Top Organizações por Uso</h2>
                <div className={styles.table}>
                  <table>
                    <thead>
                      <tr>
                        <th>Ranking</th>
                        <th>Organização</th>
                        <th>Tokens Consumidos</th>
                        <th>Chamadas API</th>
                        <th>Média por Chamada</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboardData?.distribution.topOrgsByUsage.map((org, index) => (
                        <tr key={org.orgId}>
                          <td><span className={styles.rank}>#{index + 1}</span></td>
                          <td><code>{org.orgId}</code></td>
                          <td className={styles.tokens}>{formatNumber(org.totalTokens)}</td>
                          <td>{formatNumber(org.apiCalls)}</td>
                          <td>{org.apiCalls > 0 ? Math.round(org.totalTokens / org.apiCalls) : 0} tokens</td>
                        </tr>
                      )) || []}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className={styles.section}>
                <h2>👥 Usuários Recentes</h2>
                <div className={styles.table}>
                  <table>
                    <thead>
                      <tr>
                        <th>Nome</th>
                        <th>Email</th>
                        <th>Organização</th>
                        <th>Plano</th>
                        <th>Cadastrado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboardData?.recent.users.map(user => (
                        <tr key={user.id}>
                          <td>{user.name}</td>
                          <td>{user.email}</td>
                          <td>{user.organization || 'N/A'}</td>
                          <td>
                            <span className={`${styles.planBadge} ${styles[user.plan.toLowerCase()]}`}>
                              {user.plan}
                            </span>
                          </td>
                          <td>{new Date(user.createdAt).toLocaleDateString('pt-BR')}</td>
                        </tr>
                      )) || []}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Usage Reports */}
          {activeTab === 'usage' && (
            <div className={styles.usage}>
              <div className={styles.section}>
                <h2>📋 Relatório Detalhado de Uso</h2>
                <div className={styles.usageFilters}>
                  <input 
                    placeholder="Org ID" 
                    value={usageOrg} 
                    onChange={e => setUsageOrg(e.target.value)}
                    className={styles.filterInput}
                  />
                  <input 
                    placeholder="from YYYY-MM-DD" 
                    value={usageFrom} 
                    onChange={e => setUsageFrom(e.target.value)}
                    className={styles.filterInput}
                  />
                  <input 
                    placeholder="to YYYY-MM-DD" 
                    value={usageTo} 
                    onChange={e => setUsageTo(e.target.value)}
                    className={styles.filterInput}
                  />
                  <button onClick={loadUsageReport} className={styles.filterButton}>
                    🔍 Buscar
                  </button>
                </div>
                
                <div className={styles.table}>
                  <table>
                    <thead>
                      <tr>
                        <th>Dia</th>
                        <th>Organização</th>
                        <th>Prompt Tokens</th>
                        <th>Completion Tokens</th>
                        <th>Total Tokens</th>
                        <th>Custo (USD)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usageRows.map((row, i) => (
                        <tr key={i}>
                          <td>{new Date(row.day).toLocaleDateString('pt-BR')}</td>
                          <td><code>{row.orgId}</code></td>
                          <td>{formatNumber(row.prompt_tokens)}</td>
                          <td>{formatNumber(row.completion_tokens)}</td>
                          <td>{formatNumber(row.total_tokens)}</td>
                          <td>${Number(row.cost_usd).toFixed(6)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Alerts Management */}
          {activeTab === 'alerts' && (
            <div className={styles.alerts}>
              <div className={styles.section}>
                <div className={styles.sectionHeader} style={{
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: '24px',
                  padding: '20px 24px',
                  backgroundColor: '#fff',
                  borderRadius: '12px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}>
                  <div>
                    <h2 style={{ 
                      margin: '0 0 8px 0', 
                      fontSize: '28px', 
                      fontWeight: '700', 
                      color: '#333',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px'
                    }}>🚨 Sistema de Alertas Automáticos</h2>
                    <p style={{
                      margin: '0',
                      color: '#666',
                      fontSize: '16px'
                    }}>Configure alertas automáticos para monitoramento do sistema</p>
                  </div>
                  <button 
                    onClick={() => setShowCreateAlertModal(true)}
                    className={styles.primaryButton}
                    style={{
                      padding: '12px 20px',
                      backgroundColor: '#007bff',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '16px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      boxShadow: '0 4px 8px rgba(0,123,255,0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                    onMouseOver={(e) => {
                      e.target.style.backgroundColor = '#0056b3';
                      e.target.style.transform = 'translateY(-2px)';
                    }}
                    onMouseOut={(e) => {
                      e.target.style.backgroundColor = '#007bff';
                      e.target.style.transform = 'translateY(0)';
                    }}
                  >
                    ➕ Nova Regra de Alerta
                  </button>
                </div>

                {/* Alert Statistics */}
                <div className={styles.alertsStats}>
                  <div className={styles.statCard}>
                    <div className={styles.statValue}>{alertStats?.summary?.active || 0}</div>
                    <div className={styles.statLabel}>Alertas Ativos</div>
                  </div>
                  <div className={styles.statCard}>
                    <div className={styles.statValue}>{alertRules.length}</div>
                    <div className={styles.statLabel}>Regras Ativas</div>
                  </div>
                  <div className={styles.statCard}>
                    <div className={styles.statValue}>{alertStats?.summary?.resolved || 0}</div>
                    <div className={styles.statLabel}>Resolvidos (7d)</div>
                  </div>
                  <div className={styles.statCard}>
                    <div className={styles.statValue}>
                      {alertStats?.summary?.total ? 
                        Math.round((alertStats.summary.resolved / alertStats.summary.total) * 100) : 0}%
                    </div>
                    <div className={styles.statLabel}>Taxa Resolução</div>
                  </div>
                </div>

                {/* Active Alerts */}
                <div className={styles.subsection}>
                  <h3>🔔 Alertas Ativos</h3>
                  {alerts.filter(alert => alert.status === 'ACTIVE').length === 0 ? (
                    <div className={styles.emptyState}>
                      <p>✅ Nenhum alerta ativo no momento</p>
                    </div>
                  ) : (
                    <div className={styles.alertsList}>
                      {alerts.filter(alert => alert.status === 'ACTIVE').map(alert => (
                        <div key={alert.id} className={`${styles.alertCard} ${styles.alertActive}`}>
                          <div className={styles.alertHeader}>
                            <span className={`${styles.alertSeverity} ${styles[alert.severity.toLowerCase()]}`}>
                              {alert.severity === 'CRITICAL' && '🚨'}
                              {alert.severity === 'HIGH' && '⚠️'}
                              {alert.severity === 'MEDIUM' && '⚡'}
                              {alert.severity === 'LOW' && '📢'}
                              {alert.severity}
                            </span>
                            <span className={styles.alertTime}>
                              {new Date(alert.createdAt).toLocaleString('pt-BR')}
                            </span>
                          </div>
                          <h4>{alert.title}</h4>
                          <p>{alert.message}</p>
                          <div className={styles.alertActions}>
                            <button 
                              onClick={() => {
                                setSelectedAlert(alert);
                                setShowAlertDetailsModal(true);
                              }}
                              className={styles.secondaryButton}
                            >
                              👁️ Detalhes
                            </button>
                            <button 
                              onClick={() => acknowledgeAlert(alert.id)}
                              className={styles.primaryButton}
                            >
                              ✅ Reconhecer
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Alert Rules Management */}
                <div className={styles.subsection}>
                  <h3 style={{ 
                    fontSize: '20px', 
                    fontWeight: '600', 
                    color: '#333',
                    marginBottom: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>⚙️ Regras de Alerta</h3>
                  <div className={styles.table} style={{
                    backgroundColor: '#fff',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f8f9fa' }}>
                          <th style={{ 
                            padding: '16px 12px',
                            textAlign: 'left',
                            fontWeight: '600',
                            color: '#495057',
                            borderBottom: '2px solid #dee2e6',
                            fontSize: '14px'
                          }}>Nome</th>
                          <th style={{ 
                            padding: '16px 12px',
                            textAlign: 'left',
                            fontWeight: '600',
                            color: '#495057',
                            borderBottom: '2px solid #dee2e6',
                            fontSize: '14px'
                          }}>Tipo</th>
                          <th style={{ 
                            padding: '16px 12px',
                            textAlign: 'left',
                            fontWeight: '600',
                            color: '#495057',
                            borderBottom: '2px solid #dee2e6',
                            fontSize: '14px'
                          }}>Métrica</th>
                          <th style={{ 
                            padding: '16px 12px',
                            textAlign: 'left',
                            fontWeight: '600',
                            color: '#495057',
                            borderBottom: '2px solid #dee2e6',
                            fontSize: '14px'
                          }}>Condição</th>
                          <th style={{ 
                            padding: '16px 12px',
                            textAlign: 'center',
                            fontWeight: '600',
                            color: '#495057',
                            borderBottom: '2px solid #dee2e6',
                            fontSize: '14px'
                          }}>Status</th>
                          <th style={{ 
                            padding: '16px 12px',
                            textAlign: 'left',
                            fontWeight: '600',
                            color: '#495057',
                            borderBottom: '2px solid #dee2e6',
                            fontSize: '14px'
                          }}>Última Execução</th>
                          <th style={{ 
                            padding: '16px 12px',
                            textAlign: 'center',
                            fontWeight: '600',
                            color: '#495057',
                            borderBottom: '2px solid #dee2e6',
                            fontSize: '14px'
                          }}>Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {alertRules.map((rule, index) => (
                          <tr key={rule.id} style={{
                            backgroundColor: index % 2 === 0 ? '#fff' : '#f8f9fa',
                            transition: 'background-color 0.2s'
                          }}
                          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#e3f2fd'}
                          onMouseOut={(e) => e.currentTarget.style.backgroundColor = index % 2 === 0 ? '#fff' : '#f8f9fa'}
                          >
                            <td style={{ 
                              padding: '14px 12px', 
                              borderBottom: '1px solid #dee2e6',
                              fontSize: '14px',
                              fontWeight: '500'
                            }}>{rule.name}</td>
                            <td style={{ 
                              padding: '14px 12px', 
                              borderBottom: '1px solid #dee2e6',
                              fontSize: '14px'
                            }}>
                              <span className={styles.alertType} style={{
                                padding: '4px 8px',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: '500',
                                backgroundColor: '#e3f2fd',
                                color: '#1976d2',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}>
                                {rule.alertType === 'USAGE' && '📊'}
                                {rule.alertType === 'ERROR_RATE' && '🔴'}
                                {rule.alertType === 'FINANCIAL' && '💰'}
                                {rule.alertType === 'SECURITY' && '🔒'}
                                {rule.alertType === 'SYSTEM_HEALTH' && '⚕️'}
                                {rule.alertType}
                              </span>
                            </td>
                            <td style={{ 
                              padding: '14px 12px', 
                              borderBottom: '1px solid #dee2e6',
                              fontSize: '14px'
                            }}><code style={{
                              backgroundColor: '#f8f9fa',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontSize: '12px',
                              color: '#e83e8c'
                            }}>{rule.metric}</code></td>
                            <td style={{ 
                              padding: '14px 12px', 
                              borderBottom: '1px solid #dee2e6',
                              fontSize: '14px',
                              fontWeight: '500'
                            }}>{rule.operator} {rule.threshold}</td>
                            <td>
                              <span className={`${styles.status} ${rule.enabled ? styles.enabled : styles.disabled}`}>
                                {rule.enabled ? '✅ Ativo' : '⏸️ Pausado'}
                              </span>
                            </td>
                            <td>
                              {rule.lastTriggered ? 
                                new Date(rule.lastTriggered).toLocaleString('pt-BR') : 
                                'Nunca'
                              }
                            </td>
                            <td>
                              <div className={styles.actionButtons} style={{ 
                                display: 'flex', 
                                gap: '6px', 
                                justifyContent: 'center',
                                padding: '4px'
                              }}>
                                <button 
                                  onClick={() => testAlertRule(rule.id)}
                                  className={styles.secondaryButton}
                                  title="Testar regra"
                                  style={{ 
                                    padding: '8px 10px', 
                                    minWidth: '40px',
                                    backgroundColor: '#17a2b8',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    transition: 'all 0.2s',
                                    boxShadow: '0 2px 4px rgba(23,162,184,0.2)'
                                  }}
                                  onMouseOver={(e) => e.target.style.backgroundColor = '#138496'}
                                  onMouseOut={(e) => e.target.style.backgroundColor = '#17a2b8'}
                                >
                                  🧪
                                </button>
                                <button 
                                  onClick={() => {
                                    setEditingAlert(rule);
                                    // Populate form with existing data
                                    setAlertFormData({
                                      name: rule.name,
                                      description: rule.description || '',
                                      alertType: rule.alertType,
                                      metric: rule.metric,
                                      operator: rule.operator,
                                      threshold: rule.threshold,
                                      timeWindow: rule.timeWindow,
                                      notificationChannels: JSON.parse(rule.notificationChannels || '["dashboard"]'),
                                      recipients: rule.recipients ? JSON.parse(rule.recipients).join(', ') : '',
                                      orgId: rule.orgId || '',
                                      cooldownMinutes: rule.cooldownMinutes,
                                      enabled: rule.enabled
                                    });
                                    setShowEditAlertModal(true);
                                  }}
                                  className={styles.primaryButton}
                                  title="Editar regra"
                                  style={{ 
                                    padding: '8px 10px', 
                                    minWidth: '40px',
                                    backgroundColor: '#28a745',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    transition: 'all 0.2s',
                                    boxShadow: '0 2px 4px rgba(40,167,69,0.2)'
                                  }}
                                  onMouseOver={(e) => e.target.style.backgroundColor = '#218838'}
                                  onMouseOut={(e) => e.target.style.backgroundColor = '#28a745'}
                                >
                                  ✏️
                                </button>
                                <button 
                                  onClick={() => handleDeleteAlertRule(rule.id, rule.name)}
                                  className={styles.deleteButton}
                                  title="Deletar regra"
                                  style={{ 
                                    padding: '8px 10px', 
                                    minWidth: '40px', 
                                    backgroundColor: '#dc3545',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    transition: 'all 0.2s',
                                    boxShadow: '0 2px 4px rgba(220,53,69,0.2)'
                                  }}
                                  onMouseOver={(e) => e.target.style.backgroundColor = '#c82333'}
                                  onMouseOut={(e) => e.target.style.backgroundColor = '#dc3545'}
                                >
                                  🗑️
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Organization Detail Modal */}
        {showOrgModal && selectedOrg && (
          <div className={styles.modalOverlay} onClick={() => setShowOrgModal(false)}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h2>📋 {selectedOrg.name}</h2>
                <button onClick={() => setShowOrgModal(false)} className={styles.closeButton}>✕</button>
              </div>
              <div className={styles.modalContent}>
                <div className={styles.orgDetails}>
                  <p><strong>ID:</strong> <code>{selectedOrg.id}</code></p>
                  <p><strong>Usuários:</strong> {selectedOrg._count.users}</p>
                  <p><strong>Criado:</strong> {new Date(selectedOrg.createdAt).toLocaleDateString('pt-BR')}</p>
                </div>
                
                <div className={styles.usageStats}>
                  <h3>📊 Estatísticas (30 dias)</h3>
                  <div className={styles.statsGrid}>
                    <div className={styles.statCard}>
                      <div className={styles.statValue}>{formatNumber(selectedOrg.usage.totalTokens)}</div>
                      <div className={styles.statLabel}>Tokens</div>
                    </div>
                    <div className={styles.statCard}>
                      <div className={styles.statValue}>{formatNumber(selectedOrg.usage.apiCalls)}</div>
                      <div className={styles.statLabel}>API Calls</div>
                    </div>
                    <div className={styles.statCard}>
                      <div className={styles.statValue}>{formatCurrency(selectedOrg.usage.totalCost)}</div>
                      <div className={styles.statLabel}>Custo</div>
                    </div>
                  </div>
                </div>

                <div className={styles.dangerZone}>
                  <h3>⚠️ Zona de Perigo</h3>
                  <button
                    onClick={() => handleDeleteOrganization(selectedOrg.id)}
                    className={styles.dangerButton}
                  >
                    🗑️ Deletar Organização
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Custom Limits Modal */}
        {showCustomLimitsModal && editingLimitsOrg && customLimitsData && (
          <div className={styles.modalOverlay} onClick={() => setShowCustomLimitsModal(false)}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h2>⚙️ Limites Personalizados: {editingLimitsOrg.name}</h2>
                <button onClick={() => setShowCustomLimitsModal(false)} className={styles.closeButton}>✕</button>
              </div>
              <div className={styles.modalContent}>
                {customLimitsData.hasCustomLimits && (
                  <div style={{ marginBottom: '20px', padding: '12px', background: '#fff3cd', border: '1px solid #ffeaa7', borderRadius: '8px' }}>
                    <strong>⚠️ Esta organização possui limites personalizados ativos</strong>
                    <br />
                    <small>Última atualização: {new Date(customLimitsData.customLimits.updatedAt).toLocaleString('pt-BR')}</small>
                    {customLimitsData.customLimits.updatedBy && (
                      <><br /><small>Por: {customLimitsData.customLimits.updatedBy}</small></>
                    )}
                  </div>
                )}

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Tokens Mensais</label>
                    <input
                      type="number"
                      value={customLimitsForm.monthlyTokens}
                      onChange={(e) => setCustomLimitsForm({ ...customLimitsForm, monthlyTokens: e.target.value })}
                      placeholder={`Padrão do plano: ${formatNumber(customLimitsData.defaultLimits?.monthlyTokens || 0)}`}
                      min="0"
                    />
                    <small>Deixe vazio para usar limite do plano</small>
                  </div>
                  <div className={styles.formGroup}>
                    <label>Tokens Diários</label>
                    <input
                      type="number"
                      value={customLimitsForm.dailyTokens}
                      onChange={(e) => setCustomLimitsForm({ ...customLimitsForm, dailyTokens: e.target.value })}
                      placeholder={`Padrão do plano: ${formatNumber(customLimitsData.defaultLimits?.dailyTokens || 0)}`}
                      min="0"
                    />
                    <small>Deixe vazio para usar limite do plano</small>
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Storage (MB)</label>
                    <input
                      type="number"
                      value={customLimitsForm.storageMB}
                      onChange={(e) => setCustomLimitsForm({ ...customLimitsForm, storageMB: e.target.value })}
                      placeholder={`Padrão do plano: ${customLimitsData.defaultLimits?.storageMB || 0} MB`}
                      min="0"
                    />
                    <small>Deixe vazio para usar limite do plano</small>
                  </div>
                  <div className={styles.formGroup}>
                    <label>Max Arquivo (MB)</label>
                    <input
                      type="number"
                      value={customLimitsForm.maxFileSizeMB}
                      onChange={(e) => setCustomLimitsForm({ ...customLimitsForm, maxFileSizeMB: e.target.value })}
                      placeholder={`Padrão do plano: ${customLimitsData.defaultLimits?.maxFileSizeMB || 0} MB`}
                      min="0"
                    />
                    <small>Deixe vazio para usar limite do plano</small>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>Motivo/Observações</label>
                  <textarea
                    value={customLimitsForm.reason}
                    onChange={(e) => setCustomLimitsForm({ ...customLimitsForm, reason: e.target.value })}
                    placeholder="Ex: Cliente premium, necessidades especiais, teste, etc."
                    rows={3}
                    style={{ 
                      width: '100%', 
                      padding: '12px', 
                      border: '1px solid var(--border-primary)', 
                      borderRadius: '8px',
                      resize: 'vertical'
                    }}
                  />
                </div>

                {/* Current Effective Limits Display */}
                <div style={{ marginTop: '20px', padding: '16px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                  <h4>📊 Limites Atuais Efetivos:</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '14px' }}>
                    <div>
                      <strong>Tokens Mensais:</strong> {formatNumber(customLimitsData.effectiveLimits.monthlyTokens)}
                      {customLimitsData.customLimits.monthlyTokens && <span style={{ color: '#f39c12' }}> (personalizado)</span>}
                    </div>
                    <div>
                      <strong>Tokens Diários:</strong> {formatNumber(customLimitsData.effectiveLimits.dailyTokens)}
                      {customLimitsData.customLimits.dailyTokens && <span style={{ color: '#f39c12' }}> (personalizado)</span>}
                    </div>
                    <div>
                      <strong>Storage:</strong> {customLimitsData.effectiveLimits.storageMB} MB
                      {customLimitsData.customLimits.storageMB && <span style={{ color: '#f39c12' }}> (personalizado)</span>}
                    </div>
                    <div>
                      <strong>Max Arquivo:</strong> {customLimitsData.effectiveLimits.maxFileSizeMB} MB
                      {customLimitsData.customLimits.maxFileSizeMB && <span style={{ color: '#f39c12' }}> (personalizado)</span>}
                    </div>
                  </div>
                </div>

                <div className={styles.modalActions}>
                  {customLimitsData.hasCustomLimits && (
                    <button 
                      type="button" 
                      onClick={handleRemoveCustomLimits}
                      className={styles.deleteButton}
                      style={{ marginRight: 'auto' }}
                    >
                      🗑️ Remover Limites Personalizados
                    </button>
                  )}
                  <button 
                    type="button" 
                    onClick={() => { setShowCustomLimitsModal(false); setEditingLimitsOrg(null); }}
                    className={styles.cancelButton}
                  >
                    Cancelar
                  </button>
                  <button 
                    type="button" 
                    onClick={handleSaveCustomLimits}
                    className={styles.submitButton}
                  >
                    💾 Salvar Limites
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Create Plan Modal */}
        {showCreateModal && (
          <div className={styles.modalOverlay} onClick={() => setShowCreateModal(false)}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h2>➕ Criar Novo Plano</h2>
                <button onClick={() => setShowCreateModal(false)} className={styles.closeButton}>✕</button>
              </div>
              <div className={styles.modalContent}>
                <form onSubmit={handleCreatePlan}>
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label>Código do Plano</label>
                      <input
                        type="text"
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                        placeholder="ex: PREMIUM"
                        required
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Nome do Plano</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="ex: Premium Plan"
                        required
                      />
                    </div>
                  </div>

                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label>Tokens por Mês</label>
                      <input
                        type="number"
                        value={formData.monthlyCreditsTokens}
                        onChange={(e) => setFormData({ ...formData, monthlyCreditsTokens: parseInt(e.target.value) })}
                        min="0"
                        required
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Limite Diário</label>
                      <input
                        type="number"
                        value={formData.dailyTokenLimit}
                        onChange={(e) => setFormData({ ...formData, dailyTokenLimit: parseInt(e.target.value) })}
                        min="0"
                        required
                      />
                    </div>
                  </div>

                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label>Storage (MB)</label>
                      <input
                        type="number"
                        value={formData.storageLimitMB}
                        onChange={(e) => setFormData({ ...formData, storageLimitMB: parseInt(e.target.value) })}
                        min="0"
                        required
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Max Arquivo (MB)</label>
                      <input
                        type="number"
                        value={formData.maxFileSizeMB}
                        onChange={(e) => setFormData({ ...formData, maxFileSizeMB: parseInt(e.target.value) })}
                        min="0"
                        required
                      />
                    </div>
                  </div>

                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label>Preço (centavos)</label>
                      <input
                        type="number"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) })}
                        placeholder="4990 = R$ 49,90"
                        min="0"
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Interval</label>
                      <select
                        value={formData.interval}
                        onChange={(e) => setFormData({ ...formData, interval: e.target.value })}
                      >
                        <option value="month">Mensal</option>
                        <option value="year">Anual</option>
                      </select>
                    </div>
                  </div>

                  <div className={styles.featuresSection}>
                    <label>Features</label>
                    <div className={styles.featuresGrid}>
                      {Object.entries(formData.features).map(([feature, enabled]) => (
                        <label key={feature} className={styles.checkbox}>
                          <input
                            type="checkbox"
                            checked={enabled}
                            onChange={(e) => setFormData({
                              ...formData,
                              features: {
                                ...formData.features,
                                [feature]: e.target.checked
                              }
                            })}
                          />
                          <span>{feature.toUpperCase()}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className={styles.checkbox}>
                    <label>
                      <input
                        type="checkbox"
                        checked={formData.createInStripe}
                        onChange={(e) => setFormData({ ...formData, createInStripe: e.target.checked })}
                      />
                      <span>Criar no Stripe automaticamente</span>
                    </label>
                  </div>

                  <div className={styles.modalActions}>
                    <button 
                      type="button" 
                      onClick={() => setShowCreateModal(false)}
                      className={styles.cancelButton}
                    >
                      Cancelar
                    </button>
                    <button type="submit" className={styles.submitButton}>
                      Criar Plano
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Edit Plan Modal */}
        {showEditModal && editingPlan && (
          <div className={styles.modalOverlay} onClick={() => setShowEditModal(false)}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h2>✏️ Editar Plano: {editingPlan.name}</h2>
                <button onClick={() => setShowEditModal(false)} className={styles.closeButton}>✕</button>
              </div>
              <div className={styles.modalContent}>
                <form onSubmit={handleEditPlan}>
                  <div className={styles.formGroup}>
                    <label>Nome do Plano</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label>Tokens por Mês</label>
                      <input
                        type="number"
                        value={formData.monthlyCreditsTokens}
                        onChange={(e) => setFormData({ ...formData, monthlyCreditsTokens: parseInt(e.target.value) })}
                        min="0"
                        required
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Limite Diário</label>
                      <input
                        type="number"
                        value={formData.dailyTokenLimit}
                        onChange={(e) => setFormData({ ...formData, dailyTokenLimit: parseInt(e.target.value) })}
                        min="0"
                        required
                      />
                    </div>
                  </div>

                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label>Storage (MB)</label>
                      <input
                        type="number"
                        value={formData.storageLimitMB}
                        onChange={(e) => setFormData({ ...formData, storageLimitMB: parseInt(e.target.value) })}
                        min="0"
                        required
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Max Arquivo (MB)</label>
                      <input
                        type="number"
                        value={formData.maxFileSizeMB}
                        onChange={(e) => setFormData({ ...formData, maxFileSizeMB: parseInt(e.target.value) })}
                        min="0"
                        required
                      />
                    </div>
                  </div>

                  <div className={styles.featuresSection}>
                    <label>Features</label>
                    <div className={styles.featuresGrid}>
                      {Object.entries(formData.features).map(([feature, enabled]) => (
                        <label key={feature} className={styles.checkbox}>
                          <input
                            type="checkbox"
                            checked={enabled}
                            onChange={(e) => setFormData({
                              ...formData,
                              features: {
                                ...formData.features,
                                [feature]: e.target.checked
                              }
                            })}
                          />
                          <span>{feature.toUpperCase()}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className={styles.modalActions}>
                    <button 
                      type="button" 
                      onClick={() => { setShowEditModal(false); setEditingPlan(null); }}
                      className={styles.cancelButton}
                    >
                      Cancelar
                    </button>
                    <button type="submit" className={styles.submitButton}>
                      Salvar Alterações
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Create Alert Rule Modal */}
        {showCreateAlertModal && (
          <div className={styles.modalOverlay} onClick={() => setShowCreateAlertModal(false)}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()} 
                 style={{ 
                   maxWidth: '900px', 
                   width: '95vw', 
                   maxHeight: '90vh', 
                   overflow: 'auto',
                   backgroundColor: '#fff',
                   borderRadius: '12px',
                   boxShadow: '0 10px 30px rgba(0,0,0,0.15)'
                 }}>
              <div className={styles.modalHeader}>
                <h2>🚨 Nova Regra de Alerta</h2>
                <button onClick={() => setShowCreateAlertModal(false)} className={styles.closeButton}>✕</button>
              </div>
              <div className={styles.modalContent} style={{ padding: '24px' }}>
                <form onSubmit={handleCreateAlertRule} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label>Nome da Regra *</label>
                      <input
                        type="text"
                        value={alertFormData.name}
                        onChange={(e) => setAlertFormData({ ...alertFormData, name: e.target.value })}
                        placeholder="Ex: Alto uso de tokens"
                        required
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Tipo de Alerta</label>
                      <select
                        value={alertFormData.alertType}
                        onChange={(e) => setAlertFormData({ ...alertFormData, alertType: e.target.value })}
                      >
                        <option value="USAGE">📊 Uso/Performance</option>
                        <option value="ERROR_RATE">🔴 Taxa de Erros</option>
                        <option value="FINANCIAL">💰 Financeiro</option>
                        <option value="SECURITY">🔒 Segurança</option>
                        <option value="SYSTEM_HEALTH">⚕️ Saúde do Sistema</option>
                      </select>
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label>Descrição</label>
                    <textarea
                      value={alertFormData.description}
                      onChange={(e) => setAlertFormData({ ...alertFormData, description: e.target.value })}
                      placeholder="Descreva quando este alerta deve ser disparado..."
                      rows={3}
                      style={{ 
                        width: '100%', 
                        padding: '8px', 
                        border: '1px solid #ddd', 
                        borderRadius: '4px',
                        resize: 'vertical',
                        fontFamily: 'inherit'
                      }}
                    />
                  </div>

                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label>Métrica *</label>
                      <select
                        value={alertFormData.metric}
                        onChange={(e) => setAlertFormData({ ...alertFormData, metric: e.target.value })}
                      >
                        <option value="daily_tokens">Tokens Diários</option>
                        <option value="monthly_tokens">Tokens Mensais</option>
                        <option value="storage_usage_mb">Uso de Storage (MB)</option>
                        <option value="error_rate_5min">Taxa de Erros (5min)</option>
                        <option value="error_rate_1hour">Taxa de Erros (1h)</option>
                        <option value="failed_payments">Pagamentos Falhados</option>
                        <option value="active_users_1hour">Usuários Ativos (1h)</option>
                      </select>
                    </div>
                    <div className={styles.formGroup}>
                      <label>Condição *</label>
                      <select
                        value={alertFormData.operator}
                        onChange={(e) => setAlertFormData({ ...alertFormData, operator: e.target.value })}
                      >
                        <option value="gt">Maior que (&gt;)</option>
                        <option value="gte">Maior ou igual (&gt;=)</option>
                        <option value="lt">Menor que (&lt;)</option>
                        <option value="lte">Menor ou igual (&lt;=)</option>
                        <option value="eq">Igual (=)</option>
                      </select>
                    </div>
                  </div>

                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label>Limite (Threshold) *</label>
                      <input
                        type="number"
                        value={alertFormData.threshold}
                        onChange={(e) => setAlertFormData({ ...alertFormData, threshold: parseFloat(e.target.value) })}
                        placeholder="Ex: 50000"
                        required
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Janela de Tempo (min) *</label>
                      <input
                        type="number"
                        value={alertFormData.timeWindow}
                        onChange={(e) => setAlertFormData({ ...alertFormData, timeWindow: parseInt(e.target.value) })}
                        placeholder="Ex: 60"
                        min="5"
                        required
                      />
                    </div>
                  </div>

                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label>Cooldown (min)</label>
                      <input
                        type="number"
                        value={alertFormData.cooldownMinutes}
                        onChange={(e) => setAlertFormData({ ...alertFormData, cooldownMinutes: parseInt(e.target.value) })}
                        placeholder="Ex: 60"
                        min="1"
                      />
                      <small>Tempo mínimo entre alertas da mesma regra</small>
                    </div>
                    <div className={styles.formGroup}>
                      <label>Organização Específica</label>
                      <input
                        type="text"
                        value={alertFormData.orgId}
                        onChange={(e) => setAlertFormData({ ...alertFormData, orgId: e.target.value })}
                        placeholder="Deixe vazio para global"
                      />
                      <small>ID da organização ou vazio para todas</small>
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label>Email Recipients (separados por vírgula)</label>
                    <input
                      type="text"
                      value={alertFormData.recipients}
                      onChange={(e) => setAlertFormData({ ...alertFormData, recipients: e.target.value })}
                      placeholder="admin@empresa.com, dev@empresa.com"
                    />
                    <small>Emails que receberão as notificações</small>
                  </div>

                  <div className={styles.formGroup}>
                    <label>
                      <input
                        type="checkbox"
                        checked={alertFormData.enabled}
                        onChange={(e) => setAlertFormData({ ...alertFormData, enabled: e.target.checked })}
                      />
                      Ativar regra imediatamente
                    </label>
                  </div>

                  <div className={styles.modalActions} style={{
                    display: 'flex', 
                    gap: '12px', 
                    justifyContent: 'flex-end',
                    paddingTop: '20px',
                    borderTop: '2px solid #f0f0f0',
                    marginTop: '20px'
                  }}>
                    <button 
                      type="button" 
                      onClick={() => { setShowCreateAlertModal(false); resetAlertForm(); }}
                      className={styles.cancelButton}
                      style={{
                        padding: '12px 24px',
                        border: '2px solid #dc3545',
                        backgroundColor: 'transparent',
                        color: '#dc3545',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500',
                        transition: 'all 0.2s'
                      }}
                      onMouseOver={(e) => {
                        e.target.style.backgroundColor = '#dc3545';
                        e.target.style.color = '#fff';
                      }}
                      onMouseOut={(e) => {
                        e.target.style.backgroundColor = 'transparent';
                        e.target.style.color = '#dc3545';
                      }}
                    >
                      ❌ Cancelar
                    </button>
                    <button 
                      type="submit"
                      className={styles.submitButton}
                      style={{
                        padding: '12px 24px',
                        border: 'none',
                        backgroundColor: '#28a745',
                        color: '#fff',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500',
                        transition: 'all 0.2s',
                        boxShadow: '0 2px 4px rgba(40,167,69,0.2)'
                      }}
                      onMouseOver={(e) => e.target.style.backgroundColor = '#218838'}
                      onMouseOut={(e) => e.target.style.backgroundColor = '#28a745'}
                    >
                      🚨 Criar Regra de Alerta
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Edit Alert Rule Modal */}
        {showEditAlertModal && editingAlert && (
          <div className={styles.modalOverlay} onClick={() => setShowEditAlertModal(false)}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()} 
                 style={{ 
                   maxWidth: '900px', 
                   width: '95vw', 
                   maxHeight: '90vh', 
                   overflow: 'auto',
                   backgroundColor: '#fff',
                   borderRadius: '12px',
                   boxShadow: '0 10px 30px rgba(0,0,0,0.15)'
                 }}>
              <div className={styles.modalHeader}>
                <h2>✏️ Editar Regra: {editingAlert.name}</h2>
                <button onClick={() => setShowEditAlertModal(false)} className={styles.closeButton}>✕</button>
              </div>
              <div className={styles.modalContent}>
                <form onSubmit={handleEditAlertRule}>
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label>Nome da Regra *</label>
                      <input
                        type="text"
                        value={alertFormData.name}
                        onChange={(e) => setAlertFormData({ ...alertFormData, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Tipo de Alerta</label>
                      <select
                        value={alertFormData.alertType}
                        onChange={(e) => setAlertFormData({ ...alertFormData, alertType: e.target.value })}
                      >
                        <option value="USAGE">📊 Uso/Performance</option>
                        <option value="ERROR_RATE">🔴 Taxa de Erros</option>
                        <option value="FINANCIAL">💰 Financeiro</option>
                        <option value="SECURITY">🔒 Segurança</option>
                        <option value="SYSTEM_HEALTH">⚕️ Saúde do Sistema</option>
                      </select>
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label>Descrição</label>
                    <textarea
                      value={alertFormData.description}
                      onChange={(e) => setAlertFormData({ ...alertFormData, description: e.target.value })}
                      rows={3}
                    />
                  </div>

                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label>Métrica *</label>
                      <select
                        value={alertFormData.metric}
                        onChange={(e) => setAlertFormData({ ...alertFormData, metric: e.target.value })}
                      >
                        <option value="daily_tokens">Tokens Diários</option>
                        <option value="monthly_tokens">Tokens Mensais</option>
                        <option value="storage_usage_mb">Uso de Storage (MB)</option>
                        <option value="error_rate_5min">Taxa de Erros (5min)</option>
                        <option value="error_rate_1hour">Taxa de Erros (1h)</option>
                        <option value="failed_payments">Pagamentos Falhados</option>
                        <option value="active_users_1hour">Usuários Ativos (1h)</option>
                      </select>
                    </div>
                    <div className={styles.formGroup}>
                      <label>Condição *</label>
                      <select
                        value={alertFormData.operator}
                        onChange={(e) => setAlertFormData({ ...alertFormData, operator: e.target.value })}
                      >
                        <option value="gt">Maior que (&gt;)</option>
                        <option value="gte">Maior ou igual (&gt;=)</option>
                        <option value="lt">Menor que (&lt;)</option>
                        <option value="lte">Menor ou igual (&lt;=)</option>
                        <option value="eq">Igual (=)</option>
                      </select>
                    </div>
                  </div>

                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label>Limite (Threshold) *</label>
                      <input
                        type="number"
                        value={alertFormData.threshold}
                        onChange={(e) => setAlertFormData({ ...alertFormData, threshold: parseFloat(e.target.value) })}
                        required
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Janela de Tempo (min) *</label>
                      <input
                        type="number"
                        value={alertFormData.timeWindow}
                        onChange={(e) => setAlertFormData({ ...alertFormData, timeWindow: parseInt(e.target.value) })}
                        min="5"
                        required
                      />
                    </div>
                  </div>

                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label>Cooldown (min)</label>
                      <input
                        type="number"
                        value={alertFormData.cooldownMinutes}
                        onChange={(e) => setAlertFormData({ ...alertFormData, cooldownMinutes: parseInt(e.target.value) })}
                        min="1"
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Organização Específica</label>
                      <input
                        type="text"
                        value={alertFormData.orgId}
                        onChange={(e) => setAlertFormData({ ...alertFormData, orgId: e.target.value })}
                        placeholder="Deixe vazio para global"
                      />
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label>Email Recipients (separados por vírgula)</label>
                    <input
                      type="text"
                      value={alertFormData.recipients}
                      onChange={(e) => setAlertFormData({ ...alertFormData, recipients: e.target.value })}
                      placeholder="admin@empresa.com, dev@empresa.com"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>
                      <input
                        type="checkbox"
                        checked={alertFormData.enabled}
                        onChange={(e) => setAlertFormData({ ...alertFormData, enabled: e.target.checked })}
                      />
                      Regra ativa
                    </label>
                  </div>

                  <div className={styles.modalActions}>
                    <button 
                      type="button" 
                      onClick={() => { setShowEditAlertModal(false); setEditingAlert(null); resetAlertForm(); }}
                      className={styles.cancelButton}
                    >
                      Cancelar
                    </button>
                    <button 
                      type="submit"
                      className={styles.submitButton}
                    >
                      💾 Salvar Alterações
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}