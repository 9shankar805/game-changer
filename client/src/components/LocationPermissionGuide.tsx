import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Settings, Chrome, Firefox, Safari } from 'lucide-react';

interface LocationPermissionGuideProps {
  onClose: () => void;
  onManualAddress: () => void;
}

export function LocationPermissionGuide({ onClose, onManualAddress }: LocationPermissionGuideProps) {
  const [selectedBrowser, setSelectedBrowser] = useState<string>('chrome');

  const browserInstructions = {
    chrome: [
      'Click the location icon in the address bar (left of the URL)',
      'Select "Always allow" for location access',
      'Refresh the page and try again'
    ],
    firefox: [
      'Click the shield icon in the address bar',
      'Click "Allow Location Access"',
      'Refresh the page and try again'
    ],
    safari: [
      'Go to Safari > Preferences > Websites',
      'Click "Location" in the left sidebar',
      'Set this website to "Allow"',
      'Refresh the page and try again'
    ]
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Enable Location Access
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            To calculate accurate delivery fees and show nearby stores, we need access to your location.
          </p>

          <div className="space-y-3">
            <p className="font-medium text-sm">Choose your browser:</p>
            <div className="flex gap-2">
              <Button
                variant={selectedBrowser === 'chrome' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedBrowser('chrome')}
                className="flex items-center gap-1"
              >
                <Chrome className="h-4 w-4" />
                Chrome
              </Button>
              <Button
                variant={selectedBrowser === 'firefox' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedBrowser('firefox')}
                className="flex items-center gap-1"
              >
                <Firefox className="h-4 w-4" />
                Firefox
              </Button>
              <Button
                variant={selectedBrowser === 'safari' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedBrowser('safari')}
                className="flex items-center gap-1"
              >
                <Safari className="h-4 w-4" />
                Safari
              </Button>
            </div>
          </div>

          <div className="bg-muted p-3 rounded-lg">
            <p className="font-medium text-sm mb-2 flex items-center gap-1">
              <Settings className="h-4 w-4" />
              Instructions:
            </p>
            <ol className="text-sm space-y-1">
              {browserInstructions[selectedBrowser as keyof typeof browserInstructions].map((step, index) => (
                <li key={index} className="flex gap-2">
                  <span className="font-medium">{index + 1}.</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="flex gap-2">
            <Button onClick={onManualAddress} variant="outline" className="flex-1">
              Enter Address Manually
            </Button>
            <Button onClick={onClose} className="flex-1">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}