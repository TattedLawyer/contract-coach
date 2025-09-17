import React from 'react';
import { Button } from "@/components/ui/button";
import { Brain } from "lucide-react";

interface AnalysisPaywallProps {
  onUpgradeClick: () => void;
}

export const AnalysisPaywall: React.FC<AnalysisPaywallProps> = ({ onUpgradeClick }) => {
  return (
    <div className="flex items-center justify-center p-8 bg-muted/50 rounded-lg border">
      <div className="text-center max-w-xs">
        <div className="mb-1">
          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-1">
            <Brain className="h-4 w-4 text-primary" />
          </div>
          <h3 className="text-base font-semibold mb-1">Unlock Full Analysis</h3>
          <p className="text-muted-foreground text-xs mb-1">
            Get detailed analysis with premium plan.
          </p>
        </div>

        <div className="space-y-1">
          <div className="text-xs font-medium">Choose Plan:</div>
          <div className="grid grid-cols-2 gap-1">
            <Button
              variant="outline"
              className="flex flex-col items-center p-1.5 h-auto text-xs"
              onClick={onUpgradeClick}
            >
              <div className="font-semibold">$19.99</div>
              <div className="text-xs text-muted-foreground">per contract</div>
            </Button>
            <Button
              className="flex flex-col items-center p-1.5 h-auto text-xs"
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

