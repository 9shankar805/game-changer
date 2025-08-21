import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, Bell, Send, Smartphone, Globe, Settings } from 'lucide-react';

export default function CompletePushTest() {
  const [status, setStatus] = useState({
    serviceWorker: false,
    pushManager: false,
    notifications: false,
    permission: 'default',
    subscription: null,
    isInitialized: false
  });
  
  const [testForm, setTestForm] = useState({
    title: 'Siraha Bazaar Test',
    body: 'This is a test notification from your e-commerce app!'
  });
  
  const [logs, setLogs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 19)]);
    console.log(message);
  };

  const checkStatus = async () => {
    addLog('🔍 Checking push notification status...');
    
    const hasServiceWorker = 'serviceWorker' in navigator;
    const hasPushManager = 'PushManager' in window;
    const hasNotifications = 'Notification' in window;
    const permission = Notification.permission;
    
    let subscription = null;
    let isInitialized = false;
    
    if (hasServiceWorker && hasPushManager) {
      try {
        const registration = await navigator.serviceWorker.ready;
        subscription = await registration.pushManager.getSubscription();
        isInitialized = !!subscription;
      } catch (error) {
        addLog(`❌ Error checking subscription: ${error.message}`);
      }
    }
    
    setStatus({
      serviceWorker: hasServiceWorker,
      pushManager: hasPushManager,
      notifications: hasNotifications,
      permission,
      subscription,
      isInitialized
    });
    
    addLog(`📊 Status updated - SW: ${hasServiceWorker}, PM: ${hasPushManager}, N: ${hasNotifications}, P: ${permission}`);
  };

  const initializePushNotifications = async () => {
    setIsLoading(true);
    addLog('🚀 Starting push notification initialization...');
    
    try {
      if (window.pushManager) {
        const success = await window.pushManager.initialize();
        if (success) {
          addLog('✅ Push notifications initialized successfully!');
          await checkStatus();
        } else {
          addLog('❌ Push notification initialization failed');
        }
      } else {
        addLog('❌ Push manager not available');
      }
    } catch (error) {
      addLog(`❌ Initialization error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const sendTestNotification = async () => {
    setIsLoading(true);
    addLog('📤 Sending test notification...');
    
    try {
      const response = await fetch('/api/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testForm)
      });
      
      if (response.ok) {
        const result = await response.json();
        addLog(`✅ Test notification sent successfully: ${result.message}`);
      } else {
        const error = await response.json();
        addLog(`❌ Failed to send notification: ${error.error}`);
      }
    } catch (error) {
      addLog(`❌ Network error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const sendLocalNotification = async () => {
    addLog('📱 Sending local notification...');
    
    if (window.pushManager) {
      const success = await window.pushManager.showLocalNotification(
        testForm.title,
        testForm.body
      );
      
      if (success) {
        addLog('✅ Local notification sent successfully!');
      } else {
        addLog('❌ Failed to send local notification');
      }
    } else {
      addLog('❌ Push manager not available');
    }
  };

  const testOrderNotification = async () => {
    setIsLoading(true);
    addLog('🛒 Testing order confirmation notification...');
    
    try {
      const orderData = {
        title: 'Order Confirmed! 🎉',
        body: 'Your order #SB001234 has been confirmed. Total: ₹850. Estimated delivery: 30 minutes.'
      };
      
      const response = await fetch('/api/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });
      
      if (response.ok) {
        addLog('✅ Order notification sent successfully!');
      } else {
        addLog('❌ Failed to send order notification');
      }
    } catch (error) {
      addLog(`❌ Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const getSubscriptionInfo = async () => {
    addLog('📋 Getting subscription information...');
    
    if (window.pushManager) {
      const info = await window.pushManager.getSubscriptionStatus();
      addLog(`📊 Subscription Info: ${JSON.stringify(info, null, 2)}`);
    } else {
      addLog('❌ Push manager not available');
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  const getPermissionBadge = (permission: string) => {
    switch (permission) {
      case 'granted':
        return <Badge className="bg-green-500">Granted</Badge>;
      case 'denied':
        return <Badge variant="destructive">Denied</Badge>;
      default:
        return <Badge variant="secondary">Default</Badge>;
    }
  };

  const getStatusIcon = (status: boolean) => {
    return status ? (
      <CheckCircle className="h-5 w-5 text-green-500" />
    ) : (
      <XCircle className="h-5 w-5 text-red-500" />
    );
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Complete Push Notification Test</h1>
        <p className="text-muted-foreground">
          Test all aspects of the Siraha Bazaar push notification system
        </p>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Browser Support
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Service Worker</span>
              {getStatusIcon(status.serviceWorker)}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Push Manager</span>
              {getStatusIcon(status.pushManager)}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Notifications</span>
              {getStatusIcon(status.notifications)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Permission Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-sm">Permission</span>
              {getPermissionBadge(status.permission)}
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-sm">Initialized</span>
              {getStatusIcon(status.isInitialized)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              Subscription
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              {status.subscription ? (
                <div>
                  <Badge className="bg-green-500 mb-2">Active</Badge>
                  <p className="text-xs text-muted-foreground">
                    Endpoint: {status.subscription.endpoint?.substring(0, 30)}...
                  </p>
                </div>
              ) : (
                <Badge variant="secondary">Not Subscribed</Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Initialization & Setup</CardTitle>
            <CardDescription>
              Initialize and configure push notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              onClick={initializePushNotifications} 
              disabled={isLoading}
              className="w-full"
            >
              <Bell className="h-4 w-4 mr-2" />
              Initialize Push Notifications
            </Button>
            <Button 
              onClick={checkStatus} 
              variant="outline"
              className="w-full"
            >
              <Settings className="h-4 w-4 mr-2" />
              Refresh Status
            </Button>
            <Button 
              onClick={getSubscriptionInfo} 
              variant="outline"
              className="w-full"
            >
              <Globe className="h-4 w-4 mr-2" />
              Get Subscription Info
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Test Notifications</CardTitle>
            <CardDescription>
              Send different types of test notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Input
                placeholder="Notification title"
                value={testForm.title}
                onChange={(e) => setTestForm(prev => ({ ...prev, title: e.target.value }))}
              />
              <Textarea
                placeholder="Notification body"
                value={testForm.body}
                onChange={(e) => setTestForm(prev => ({ ...prev, body: e.target.value }))}
                rows={2}
              />
            </div>
            <Button 
              onClick={sendTestNotification} 
              disabled={isLoading || !status.isInitialized}
              className="w-full"
            >
              <Send className="h-4 w-4 mr-2" />
              Send Push Notification
            </Button>
            <Button 
              onClick={sendLocalNotification} 
              variant="outline"
              disabled={status.permission !== 'granted'}
              className="w-full"
            >
              <Smartphone className="h-4 w-4 mr-2" />
              Send Local Notification
            </Button>
            <Button 
              onClick={testOrderNotification} 
              variant="outline"
              disabled={isLoading || !status.isInitialized}
              className="w-full"
            >
              🛒 Test Order Notification
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Status Alert */}
      {!status.isInitialized && status.permission === 'granted' && (
        <Alert className="mb-6">
          <Bell className="h-4 w-4" />
          <AlertDescription>
            Notifications are permitted but not initialized. Click "Initialize Push Notifications" to set up the system.
          </AlertDescription>
        </Alert>
      )}

      {status.permission === 'denied' && (
        <Alert variant="destructive" className="mb-6">
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            Notification permission is denied. Please enable notifications in your browser settings and refresh the page.
          </AlertDescription>
        </Alert>
      )}

      {/* Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Logs</CardTitle>
          <CardDescription>
            Real-time logs of push notification activities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-black text-green-400 p-4 rounded-md font-mono text-sm max-h-64 overflow-y-auto">
            {logs.length === 0 ? (
              <div className="text-gray-500">No logs yet...</div>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="mb-1">
                  {log}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}