import React from 'react';
import { Button } from "@/components/ui/button";
import { Wand2 } from "lucide-react";

interface UpgradePaywallProps {
  onUpgradeClick: () => void;
}

export const UpgradePaywall: React.FC<UpgradePaywallProps> = ({ onUpgradeClick }) => {
  return (
    <div className="flex items-center justify-center p-6 bg-muted/50 rounded-lg border">
      <div className="text-center max-w-xs">
        <div className="mb-1">
          <div className="w-6 h-6 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-1">
            <Wand2 className="h-3 w-3 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-sm font-semibold mb-1">Unlock Improvements</h3>
          <p className="text-muted-foreground text-xs mb-1">
            Get AI upgrade suggestions.
          </p>
        </div>

        <div className="space-y-1">
          <div className="text-xs font-medium">Choose Plan:</div>
          <div className="grid grid-cols-2 gap-1">
            <Button
              variant="outline"
              className="flex flex-col items-center p-1 h-auto text-xs"
              onClick={onUpgradeClick}
            >
              <div className="font-semibold">$19.99</div>
              <div className="text-xs text-muted-foreground">per contract</div>
            </Button>
            <Button
              className="flex flex-col items-center p-1 h-auto text-xs bg-green-600 hover:bg-green-700"
              onClick={onUpgradeClick}
            >
              <div className="font-semibold">$39.99</div>
              <div className="text-xs text-muted-foreground">unlimited</div>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

